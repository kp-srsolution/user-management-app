using Microsoft.AspNetCore.Mvc;
using MyFirst;
using MySql.Data.MySqlClient;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BCrypt.Net;
using MimeKit;
using MailKit.Net.Smtp;
using System.Reflection.Metadata;
using Google.Protobuf.WellKnownTypes;
using System.Threading;
using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualBasic;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using System.Numerics;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController(Database database) : ControllerBase
    {
        private readonly Database _database = database;
        private readonly string jwtSecret = "this_is_a_super_secret_key_12345";

        private readonly string _connectionString = "mongodb+srv://admin:admin@studentapplication.8rgfuwn.mongodb.net";
        private readonly string _dbName = "stationBackup";


        // public UsersController(IConfiguration config)
        // {
        //     var connectionString = config["MongoDB:ConnectionString"];
        //     var databaseName = config["MongoDB:DatabaseName"];

        //     var client = new MongoClient(connectionString);
        //     var database = client.GetDatabase(databaseName);

        //     _imagesCollection = database.GetCollection<BsonDocument>("images");
        //     _usersCollection = database.GetCollection<BsonDocument>("users");
        //     _logsCollection = database.GetCollection<BsonDocument>("logs");
        // }

        [HttpGet("test")]
        public IActionResult Test()
        {
            return Ok(new { message = "This is test api" });
        }

        [HttpGet("getallusers")]
        public IActionResult GetAllUsers()
        {
            try
            {
                using var conn = _database.GetConnection();
                conn.Open();

                var cmd = new MySqlCommand("SELECT * FROM users", conn);
                var reader = cmd.ExecuteReader();

                var users = new List<object>();

                while (reader.Read())
                {
                    users.Add(new
                    {
                        Id = reader["id"],
                        FirstName = reader["firstname"],
                        LastName = reader["lastname"],
                        Email = reader["email"],
                        Type = reader["type"]
                    });
                }

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.FirstName) ||
                string.IsNullOrEmpty(request.LastName) ||
                string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Password) ||
                request.Type <= 0)
            {
                return BadRequest(new { message = "All fields are required" });
            }

            try
            {
                var client = new MongoClient(_connectionString);
                var database = client.GetDatabase(_dbName);

                var userCollection = database.GetCollection<BsonDocument>("users");
                // Hash password
                string hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);
                var document = new BsonDocument {
                    { "firstName", request.FirstName },
                    { "lastName", request.LastName },
                    { "email", request.Email },
                    { "password", hashedPassword }
                };

                await userCollection.InsertOneAsync(document);

                using (var conn = _database.GetConnection())
                {
                    await conn.OpenAsync();
                    string sql = @"INSERT INTO users (firstname, lastname, email, password, type) 
                               VALUES (@FirstName, @LastName, @Email, @Password, @Type)";
                    using (var cmd = new MySqlCommand(sql, conn))
                    {
                        cmd.Parameters.AddWithValue("@FirstName", request.FirstName);
                        cmd.Parameters.AddWithValue("@LastName", request.LastName);
                        cmd.Parameters.AddWithValue("@Email", request.Email);
                        cmd.Parameters.AddWithValue("@Password", hashedPassword);
                        cmd.Parameters.AddWithValue("@Type", request.Type);


                        int rows = await cmd.ExecuteNonQueryAsync();
                        long insertedId = cmd.LastInsertedId;

                        if (rows > 0)
                        {
                            return Ok(new { message = "User registered successfully", userId = insertedId });
                        }
                        else
                        {
                            return StatusCode(500, new { message = "Error registering user" });
                        }
                    }
                }
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }

        // LOGIN API
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.Type))
                return BadRequest(new { message = "Email, password and type are required" });

            using var conn = _database.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand("SELECT * FROM users WHERE email = @Email", conn);
            cmd.Parameters.AddWithValue("@Email", request.Email);

            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return Unauthorized(new { message = "Invalid email or password" });

            var hashedPassword = reader["password"].ToString();
            var userType = reader["type"].ToString();
            if (!BCrypt.Net.BCrypt.Verify(request.Password, hashedPassword) || request.Type != userType)
                return Unauthorized(new { message = "Invalid email or password" });

#pragma warning disable CS8604 // Possible null reference argument.
            var token = GenerateJwtToken(reader["id"].ToString(), request.Email, userType);
#pragma warning restore CS8604 // Possible null reference argument.

            return Ok(new
            {
                message = "Login successful",
                token,
                user = new
                {
                    id = reader["id"],
                    firstname = reader["firstname"],
                    lastname = reader["lastname"],
                    email = reader["email"],
                    type = reader["type"]
                }
            });
        }

        // VERIFY TOKEN API
        [HttpGet("verify")]
        public IActionResult VerifyToken()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader)) return Unauthorized(new { message = "No token provided" });

            var token = authHeader.Split(" ")[1];

            if (string.IsNullOrEmpty(token))
                return Unauthorized(new { message = "No token provided" });

            if (token.StartsWith("Bearer "))
                token = token.Substring(7);

            var tokenHandler = new JwtSecurityTokenHandler();

            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.FromMinutes(1) //  small buffer
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                return Ok(new { message = "Token is valid", user = jwtToken.Payload });
            }
            catch (SecurityTokenExpiredException)
            {
                return Unauthorized(new { message = "Token expired" });
            }
            catch
            {
                return StatusCode(402, new { message = "Invalid or expired token" });
            }
        }

        // GET ALL USERS (with optional type filter)
        [HttpGet("all")]
        public IActionResult GetAllUsers([FromQuery] string type = "all")
        {
            var users = new List<object>();

            using var conn = _database.GetConnection();
            conn.Open();

            var sql = "SELECT id, firstname, lastname, email, type FROM users";
            if (type != "all")
                sql += " WHERE type = @Type";

            var cmd = new MySqlCommand(sql, conn);
            if (type != "all")
                cmd.Parameters.AddWithValue("@Type", type);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                users.Add(new
                {
                    id = reader["id"],
                    firstname = reader["firstname"],
                    lastname = reader["lastname"],
                    email = reader["email"],
                    type = reader["type"]
                });
            }
            return Ok(users);
        }

        // GET USERS WITH PAGINATION & ROLE FILTER
        [HttpGet]
        public IActionResult GetUsers([FromQuery] string type = "all", [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            var users = new List<object>();
            var offset = (page - 1) * limit;

            using var conn = _database.GetConnection();
            conn.Open();

            var sql = "SELECT * FROM users";
            if (type != "all")
                sql += " WHERE type = @Type";
            sql += " LIMIT @Limit OFFSET @Offset";

            var cmd = new MySqlCommand(sql, conn);
            if (type != "all")
                cmd.Parameters.AddWithValue("@Type", type);
            cmd.Parameters.AddWithValue("@Limit", limit);
            cmd.Parameters.AddWithValue("@Offset", offset);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                users.Add(new
                {
                    id = reader["id"],
                    firstname = reader["firstname"],
                    lastname = reader["lastname"],
                    email = reader["email"],
                    type = reader["type"]
                });
            }

            reader.Close();

            // Total count
            var countSql = "SELECT COUNT(*) AS total FROM users";
            if (type != "all")
                countSql += " WHERE type = @Type";

            var countCmd = new MySqlCommand(countSql, conn);
            if (type != "all")
                countCmd.Parameters.AddWithValue("@Type", type);

            var total = Convert.ToInt32(countCmd.ExecuteScalar());
            var totalPages = (int)Math.Ceiling((double)total / limit);

            return Ok(new { page, limit, total, totalPages, data = users });
        }

        [HttpPost("delete")]
        public IActionResult DeleteUsers([FromBody] DeleteRequest request)
        {
            if (request.Ids == null || request.Ids.Count == 0)
            {
                return BadRequest(new { message = "No IDs provided" });
            }

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    // Create placeholders like @p0, @p1, @p2...
                    var placeholders = request.Ids.Select((id, index) => $"@p{index}");
                    var sql = $"DELETE FROM users WHERE id IN ({string.Join(",", placeholders)})";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        for (int i = 0; i < request.Ids.Count; i++)
                        {
                            cmd.Parameters.AddWithValue($"@p{i}", request.Ids[i]);
                        }

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { message = "Users deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        [HttpPost("module")]
        public async Task<IActionResult> CreateModule([FromBody] ModuleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || request.UserId <= 0)
            {
                return BadRequest(new { message = "No IDs provided" });
            }

            try
            {
                var client = new MongoClient(_connectionString);
                var database = client.GetDatabase(_dbName);
                var moduleCollection = database.GetCollection<BsonDocument>("modules");
                var document = new BsonDocument
                {
                    { "name", request.Name },
                    { "userId", request.UserId },
                };
                await moduleCollection.InsertOneAsync(document);
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "";
                    if (request.SuperModuleId != null && request.SuperModuleId > 0)
                    {
                        sql = "INSERT INTO modules (name, userId, superModuleId) VALUES (@name, @userId, @superModuleId)";
                    }
                    else if (request.IsThisSuper == true)
                    {
                        sql = "INSERT INTO modules (name, userId, isThisSuper) VALUES (@name, @userId, @isThisSuper)";
                    }
                    else
                    {
                        sql = "INSERT INTO modules (name, userId) VALUES (@name, @userId)";
                    }

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@name", request.Name);
                        cmd.Parameters.AddWithValue("@userId", request.UserId);
                        if (request.SuperModuleId != null && request.SuperModuleId > 0)
                            cmd.Parameters.AddWithValue("@superModuleId", request.SuperModuleId);
                        if (request.IsThisSuper == true)
                            cmd.Parameters.AddWithValue("@isThisSuper", request.IsThisSuper);
                        cmd.ExecuteNonQuery();
                    }
                }
                return Ok(new { message = "Module created successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // POST /api/parameter
        [HttpPost("parameter")]
        public async Task<IActionResult> CreateParameter([FromBody] ParameterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.Value) ||
                request.ModuleId <= 0 || request.Min <= 0 || request.Max <= 0)
            {
                return BadRequest(new { message = "No IDs provided" });
            }

            try
            {

                var client = new MongoClient(_connectionString);
                var database = client.GetDatabase(_dbName);
                var collection = database.GetCollection<BsonDocument>("parameters");
                var document = new BsonDocument
                {
                    { "name", request.Name },
                    { "value", request.Value },
                    { "moduleId", request.ModuleId },
                    { "min", request.Min },
                    { "max", request.Max },
                };
                await collection.InsertOneAsync(document);

                long insertedId;
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    var sql = "INSERT INTO parameters (name, value, moduleId,min, max) " +
                              "VALUES (@name, @value, @moduleId, @min, @max)";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@name", request.Name);
                        cmd.Parameters.AddWithValue("@value", request.Value);
                        cmd.Parameters.AddWithValue("@moduleId", request.ModuleId);
                        cmd.Parameters.AddWithValue("@min", request.Min);
                        cmd.Parameters.AddWithValue("@max", request.Max);
                        cmd.ExecuteNonQuery(); // ✅ use sync version
                        insertedId = cmd.LastInsertedId; // ✅ will now have correct value
                    }
                }
                return Ok(new { message = "Parameter created successfully", parameterId = insertedId });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error" });
            }
        }

        // GET /api/module/{userId}
        [HttpGet("module/{userId}")]
        public IActionResult GetModules(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new { message = "No ID provided" });
            }

            var modules = new List<ModuleResponse>();

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "SELECT * FROM modules WHERE userId = @userId";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@userId", userId);
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
#pragma warning disable CS8601 // Possible null reference assignment.
                                modules.Add(new ModuleResponse
                                {
                                    Id = Convert.ToInt32(reader["id"]),
                                    Name = reader["name"].ToString(),
                                    UserId = Convert.ToInt32(reader["userId"])
                                });
#pragma warning restore CS8601 // Possible null reference assignment.
                            }
                        }
                    }
                }
                return Ok(modules);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("getallmodules")]
        public IActionResult GetAllModulesA()
        {

            var modules = new List<ModuleResponse>();

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "SELECT * FROM modules";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
#pragma warning disable CS8601 // Possible null reference assignment.
                                modules.Add(new ModuleResponse
                                {
                                    Id = Convert.ToInt32(reader["id"]),
                                    Name = reader["name"].ToString(),
                                    UserId = Convert.ToInt32(reader["userId"]),
                                    IsThisSuper = Convert.ToBoolean(reader["isThisSuper"])
                                });
#pragma warning restore CS8601 // Possible null reference assignment.
                            }
                        }
                    }
                }
                return Ok(modules);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET /api/parameter/{moduleId}
        [HttpGet("parameter/{moduleId}")]
        public IActionResult GetParameters(int moduleId)
        {
            if (moduleId <= 0)
            {
                return BadRequest(new { message = "No ID provided" });
            }

            var parameters = new List<ParameterResponse>();

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "SELECT * FROM parameters WHERE moduleId = @moduleId";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@moduleId", moduleId);
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
#pragma warning disable CS8601 // Possible null reference assignment.
                                parameters.Add(new ParameterResponse
                                {
                                    Id = Convert.ToInt32(reader["id"]),
                                    Name = reader["name"].ToString(),
                                    Min = Convert.ToInt32(reader["min"]),
                                    Max = Convert.ToInt32(reader["max"]),
                                    Value = reader["value"].ToString(),
                                    ModuleId = Convert.ToInt32(reader["moduleId"])
                                });
#pragma warning restore CS8601 // Possible null reference assignment.
                            }
                        }
                    }
                }
                return Ok(parameters);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("reading/{productId}/{moduleId}")]
        public IActionResult GetReadingByModuleAndProduct(string productId, int moduleId)
        {
            if (string.IsNullOrWhiteSpace(productId) || moduleId <= 0)
            {
                return BadRequest(new { message = "No ID provided" });
            }

            try
            {
                var readings = new List<ReadingsPerProductAndModule>();
                using var connection = _database.GetConnection();
                connection.Open();
                var sql = "SELECT * FROM readings WHERE productId = @ProductId AND moduleId = @ModuleId";
                using var cmd = new MySqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@ModuleId", moduleId);
                cmd.Parameters.AddWithValue("@ProductId", productId);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
#pragma warning disable CS8601 // Possible null reference assignment.
                        readings.Add(new ReadingsPerProductAndModule
                        {
                            ParameterId = Convert.ToInt32(reader["parameterId"]),
                            ModuleId = Convert.ToInt32(reader["moduleId"]),
                            ModuleName = reader["moduleName"].ToString(),
                            ParameterName = reader["parameterName"].ToString(),
                            Value = reader["value"].ToString(),
                            ProductId = reader["productId"].ToString(),
                            Time = reader.GetDateTime("time")
                        });
#pragma warning restore CS8601 // Possible null reference assignment.
                    }
                }
                return Ok(readings);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { error = err.Message });
            }
        }

        [HttpGet("option/{parameterId}")]
        public IActionResult GetOptions(int parameterId)
        {
            if (parameterId <= 0)
            {
                return BadRequest(new { message = "No ID provided" });
            }

            var options = new List<OptionResponse>();

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "SELECT * FROM options WHERE parameterId = @parameterId";
                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@parameterId", parameterId);
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
#pragma warning disable CS8601 // Possible null reference assignment.
                                options.Add(new OptionResponse
                                {
                                    Id = Convert.ToInt32(reader["id"]),
                                    Name = reader["name"].ToString(),
                                    Value = reader["value"].ToString(),
                                    ParameterId = Convert.ToInt32(reader["parameterId"])
                                });
#pragma warning restore CS8601 // Possible null reference assignment.
                            }
                        }
                    }
                }
                return Ok(options);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("option")]
        public IActionResult AddOption([FromBody] OptionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Value) || request.ParameterId <= 0)
            {
                return BadRequest(new { message = "Invalid input" });
            }

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "INSERT INTO options (name, value, parameterId) VALUES (@name, @value, @parameterId)";
                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@name", request.Name);
                        cmd.Parameters.AddWithValue("@value", request.Value);
                        cmd.Parameters.AddWithValue("@parameterId", request.ParameterId);

                        var rowsAffected = cmd.ExecuteNonQuery();
                        if (rowsAffected > 0)
                        {
                            return Ok(new { message = "Option added successfully" });
                        }
                        else
                        {
                            return StatusCode(500, new { message = "Failed to insert option" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("parameter/{id}")]
        public IActionResult UpdateParameter(int id, [FromBody] ParameterUpdateRequest request)
        {
            if (request == null) return BadRequest("Invalid request");

            using (var conn = _database.GetConnection())
            {
                conn.Open();
                // Update parameter name
                var paramSql = "UPDATE parameters SET name=@name, value=@value, min=@min, max=@max WHERE id=@id";
                using (var cmd = new MySqlCommand(paramSql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@name", request.Name);
                    cmd.Parameters.AddWithValue("@value", request.Value);
                    cmd.Parameters.AddWithValue("@min", request.Min);
                    cmd.Parameters.AddWithValue("@max", request.Max);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(new { message = "Parameter updated successfully" });
        }

        [HttpPut("module/{id}")]
        public IActionResult UpdateModule(int id, [FromBody] ModuleUpdateRequest request)
        {
            if (request == null) return BadRequest("Invalid request");

            using (var conn = _database.GetConnection())
            {
                conn.Open();
                // Update parameter name
                var paramSql = "UPDATE modules SET name=@name WHERE id=@id";
                using (var cmd = new MySqlCommand(paramSql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.Parameters.AddWithValue("@name", request.Name);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(new { message = "Module updated successfully" });
        }

        [HttpPut("parameter/{parameterId}/selectedOption")]
        public IActionResult UpdateSelectedOption(int parameterId, [FromBody] UpdateSelectedOptionRequest request)
        {
            if (parameterId <= 0 || request == null || request.SelectedOption <= 0)
            {
                return BadRequest(new { message = "Invalid input" });
            }

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();
                    var sql = "UPDATE parameters SET selectedOption = @selectedOption WHERE id = @parameterId";
                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@selectedOption", request.SelectedOption);
                        cmd.Parameters.AddWithValue("@parameterId", parameterId);

                        var rowsAffected = cmd.ExecuteNonQuery();
                        if (rowsAffected > 0)
                        {
                            return Ok(new { message = "Selected option updated successfully" });
                        }
                        else
                        {
                            return NotFound(new { message = "Parameter not found" });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // delete option
        [HttpDelete("option/{id}")]
        public IActionResult DeleteOption(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid option ID" });
            }

            try
            {
                int rowsAffected;
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    var sql = "DELETE FROM options WHERE id = @id";

                    using (var cmd = new MySqlCommand(sql, connection))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        rowsAffected = cmd.ExecuteNonQuery();
                    }
                }

                if (rowsAffected > 0)
                {
                    return Ok(new { message = "Option deleted successfully", optionId = id });
                }
                else
                {
                    return NotFound(new { message = "Option not found" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }


        // Delete Parameter (and related options)
        [HttpDelete("parameter/{id}")]
        public IActionResult DeleteParameter(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid parameter ID" });
            }

            try
            {
                int rowsAffected;
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // First delete all related options
                            var deleteOptionsSql = "DELETE FROM options WHERE parameterId = @parameterId";
                            using (var cmd = new MySqlCommand(deleteOptionsSql, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@parameterId", id);
                                cmd.ExecuteNonQuery();
                            }

                            // Then delete the parameter itself
                            var deleteParameterSql = "DELETE FROM parameters WHERE id = @id";
                            using (var cmd = new MySqlCommand(deleteParameterSql, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@id", id);
                                rowsAffected = cmd.ExecuteNonQuery();
                            }

                            transaction.Commit();
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine(ex);
                            return StatusCode(500, new { message = "Server error", error = ex.Message });
                        }
                    }
                }

                if (rowsAffected > 0)
                {
                    return Ok(new { message = "Parameter and related options deleted successfully", parameterId = id });
                }
                else
                {
                    return NotFound(new { message = "Parameter not found" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }

        // Delete Module (and related parameters + options)
        [HttpDelete("module/{id}")]
        public IActionResult DeleteModule(int id)
        {
            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid module ID" });
            }

            try
            {
                int rowsAffected;
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Delete options related to parameters of this module
                            var deleteOptionsSql = @"
                        DELETE o 
                        FROM options o
                        INNER JOIN parameters p ON o.parameterId = p.id
                        WHERE p.moduleId = @moduleId";

                            using (var cmd = new MySqlCommand(deleteOptionsSql, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@moduleId", id);
                                cmd.ExecuteNonQuery();
                            }

                            // 2. Delete parameters of this module
                            var deleteParametersSql = "DELETE FROM parameters WHERE moduleId = @moduleId";
                            using (var cmd = new MySqlCommand(deleteParametersSql, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@moduleId", id);
                                cmd.ExecuteNonQuery();
                            }

                            // 3. Delete the module itself
                            var deleteModuleSql = "DELETE FROM modules WHERE id = @id";
                            using (var cmd = new MySqlCommand(deleteModuleSql, connection, transaction))
                            {
                                cmd.Parameters.AddWithValue("@id", id);
                                rowsAffected = cmd.ExecuteNonQuery();
                            }

                            transaction.Commit();
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            Console.WriteLine(ex);
                            return StatusCode(500, new { message = "Server error", error = ex.Message });
                        }
                    }
                }

                if (rowsAffected > 0)
                {
                    return Ok(new { message = "Module and all related data deleted successfully", moduleId = id });
                }
                else
                {
                    return NotFound(new { message = "Module not found" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }

        [HttpGet("send-test")]
        public async Task<IActionResult> SendTestEmail()
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Test App", "karanhpadhiyar12345@gmail.com")); // your Gmail
                message.To.Add(new MailboxAddress("Recipient", "karanhpadhiyar12345@gmail.com")); // test recipient
                message.Subject = "SMTP Test Email";

                message.Body = new TextPart("plain")
                {
                    Text = "Hello! This is a test email to verify SMTP configuration."
                };

                using (var client = new SmtpClient())
                {
                    client.CheckCertificateRevocation = false;

                    // Connect to Gmail SMTP
                    await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync("karanhpadhiyar12345@gmail.com", "ptek rmfd dvey zrkp");
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }

                return Ok(new { message = "Test email sent successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending test email: {ex}");
                return StatusCode(500, new { message = "Error sending test email.", error = ex.ToString() });
            }
        }

        [HttpPost("send-report")]
        public async Task<IActionResult> SendReportBase64([FromBody] EmailRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Base64Pdf))
                return BadRequest(new { message = "PDF data is missing." });

            if (string.IsNullOrWhiteSpace(request.RecipientEmail))
                return BadRequest(new { message = "Recipient email is required." });

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Report Service", "karanhpadhiyar12345@gmail.com"));
                message.To.Add(new MailboxAddress("", request.RecipientEmail));
                message.Subject = "Your Requested PDF Report";

                var builder = new BodyBuilder
                {
                    TextBody = "Hello,\n\nPlease find attached the PDF report you requested."
                };

                // Convert Base64 to byte[] and attach
                var pdfBytes = Convert.FromBase64String(request.Base64Pdf);
                builder.Attachments.Add(request.FileName ?? "Report.pdf", pdfBytes, new ContentType("application", "pdf"));

                message.Body = builder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync("karanhpadhiyar12345@gmail.com", "ptek rmfd dvey zrkp");
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Ok(new { message = $"Report sent successfully to {request.RecipientEmail}!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending report email.", error = ex.Message });
            }
        }

        [HttpPost("product")]
        public async Task<IActionResult> AddProduct([FromBody] ProductData request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ProductId) || request.UserId <= 0)
            {
                return BadRequest(new { message = "Invalid input" });
            }

            try
            {
                var client = new MongoClient(_connectionString);
                var database = client.GetDatabase(_dbName);
                var collection = database.GetCollection<BsonDocument>("products");
                var document = new BsonDocument
                {
                    { "productId", request.ProductId },
                    { "userId", request.UserId },
                };
                await collection.InsertOneAsync(document);
                using var connection = _database.GetConnection();
                connection.Open();
                var sql = "INSERT INTO products (productId, userId) VALUES (@ProductId, @UserId)";
                using var cmd = new MySqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@ProductId", request.ProductId);
                cmd.Parameters.AddWithValue("@UserId", request.UserId);
                var rowsAffected = cmd.ExecuteNonQuery();
                if (rowsAffected > 0)
                {
                    return Ok(new { message = "Product added successfully" });
                }
                else
                {
                    return StatusCode(500, new { message = "Failed to insert product" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("reading")]
        public async Task<IActionResult> AddReading([FromBody] ReadingsRequest request, CancellationToken ct)
        {
            // Basic validation
            if (request is null ||
                string.IsNullOrWhiteSpace(request.ProductId) ||
                request.ParameterId < 0 ||
                request.ModuleId < 0 ||
                string.IsNullOrWhiteSpace(request.Value))
            {
                return BadRequest(new { message = "Invalid input" });
            }

            const int maxRetries = 3;
            int attempt = 0;

            var client = new MongoClient(_connectionString);
            var database = client.GetDatabase(_dbName);
            var collection = database.GetCollection<BsonDocument>("readings");
            var document = new BsonDocument
            {
                { "productId", request.ProductId },
                { "parameterId", request.ParameterId },
                { "parameterName", request.ParameterName },
                { "moduleId", request.ModuleId },
                { "moduleName", request.ModuleName },
                { "time", request.Time },
            };
            await collection.InsertOneAsync(document);

            await using var connection = _database.GetConnection();
            await connection.OpenAsync(ct);

            while (true)
            {
                attempt++;

                MySqlTransaction? tx = null;
                try
                {
                    // Use a reasonable isolation level for inserts.
                    // ReadCommitted is usually enough; bump to RepeatableRead if you add read-before-write logic.
                    tx = await connection.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct);

                    // If you want to persist ModuleName/ParameterName too, include them below and in your schema.
                    // Time: use client-provided value OR let MySQL set it to UTC_TIMESTAMP() atomically
                    var sql = @"
INSERT INTO readings (ProductId, ParameterId, ModuleId, Value, Time, ModuleName, ParameterName)
VALUES (@ProductId, @ParameterId, @ModuleId, @Value,
        COALESCE(@Time, UTC_TIMESTAMP()), @ModuleName, @ParameterName);
SELECT LAST_INSERT_ID();";

                    await using var cmd = new MySqlCommand(sql, connection, tx);
                    cmd.Parameters.AddWithValue("@ProductId", request.ProductId);
                    cmd.Parameters.AddWithValue("@ParameterId", request.ParameterId);
                    cmd.Parameters.AddWithValue("@ModuleId", request.ModuleId);
                    cmd.Parameters.AddWithValue("@Value", request.Value);
                    cmd.Parameters.AddWithValue("@Time", (object?)request.Time ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ModuleName", (object?)request.ModuleName ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ParameterName", (object?)request.ParameterName ?? DBNull.Value);

                    // Execute insert + fetch new id atomically
                    var scalar = await cmd.ExecuteScalarAsync(ct);
                    var newId = Convert.ToInt64(scalar);

                    // (Optional) fetch saved row's final server timestamp to return a consistent object
                    var echoSql = @"SELECT Id, ProductId, ParameterId, ModuleId, Value, Time
                                    FROM readings
                                    WHERE Id = @Id;";
                    await using var echoCmd = new MySqlCommand(echoSql, connection, tx);
                    echoCmd.Parameters.AddWithValue("@Id", newId);

                    ReadingsResponse? saved = null;
                    await using (var reader = await echoCmd.ExecuteReaderAsync(ct))
                    {
                        if (await reader.ReadAsync(ct))
                        {
                            saved = new ReadingsResponse
                            {
                                Id = reader.GetInt64("Id"),
                                ProductId = reader["ProductId"] as string,
                                ParameterId = reader.GetInt32("ParameterId"),
                                ModuleId = reader.GetInt32("ModuleId"),
                                Value = reader["Value"] as string,
                                Time = reader.GetDateTime("Time")
                            };
                        }
                    }

                    await tx.CommitAsync(ct);

                    return Ok(new
                    {
                        message = "Reading added successfully",
                        data = saved
                    });
                }
                catch (MySqlException ex) when (ex.Number == 1213 || ex.Number == 1205) // deadlock or lock wait timeout
                {
                    // Rollback and retry with backoff
                    try { if (tx != null) await tx.RollbackAsync(ct); } catch { /* ignore */ }

                    if (attempt >= maxRetries)
                    {
                        return StatusCode(409, new
                        {
                            message = "Could not complete insert due to concurrency (deadlock/timeout).",
                            error = ex.Message
                        });
                    }

                    // simple exponential backoff
                    var delayMs = 100 * attempt;
                    await Task.Delay(delayMs, ct);
                    continue;
                }
                catch (Exception ex)
                {
                    try { if (tx != null) await tx.RollbackAsync(ct); } catch { /* ignore */ }
                    return StatusCode(500, new { message = "Failed to insert reading", error = ex.Message });
                }
            }
        }


        [HttpGet("product/{userId}")]
        public IActionResult GetProductData(int userId)
        {
            if (userId <= 0)
            {
                return BadRequest(new { message = "Invalid input" });
            }

            try
            {
                var products = new List<ProductData>();
                using var connection = _database.GetConnection();
                connection.Open();
                var sql = "SELECT * FROM products WHERE userId=@Id";
                using var cmd = new MySqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@Id", userId);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
#pragma warning disable CS8601 // Possible null reference assignment.
                    products.Add(new ProductData
                    {
                        ProductId = reader["productId"].ToString(),
                        UserId = Convert.ToInt32(reader["userId"])
                    });
#pragma warning restore CS8601 // Possible null reference assignment.
                }
                return Ok(products);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { error = err.Message });
            }
        }


        [HttpGet("readings/paged")]
        public IActionResult GetPagedReadings(
    int page = 1,
    int pageSize = 10,
    string? sortBy = null,
    string? sortOrder = "asc",
    string? search = null,
    string? productIdFilter = null,
    int? parameterIdFilter = null,
    string? parameterNameFilter = null,
    string? moduleNameFilter = null,
    int? moduleIdFilter = null,
    string? dateFilter = null
)
        {
            var result = new List<Readings>();
            int totalRecords = 0;

            using (var conn = _database.GetConnection())
            {
                conn.Open();

                // ✅ WHERE conditions
                var whereClauses = new List<string>();

                if (!string.IsNullOrEmpty(search))
                    whereClauses.Add("(ProductId LIKE @Search OR Value LIKE @Search)");

                if (!string.IsNullOrEmpty(productIdFilter))
                    whereClauses.Add("ProductId LIKE @ProductIdFilter");

                if (parameterIdFilter.HasValue)
                    whereClauses.Add("ParameterId LIKE @ParameterIdFilter");

                if (!string.IsNullOrEmpty(parameterNameFilter))
                    whereClauses.Add("ParameterName LIKE @ParameterNameFilter");

                if (!string.IsNullOrEmpty(moduleNameFilter))
                    whereClauses.Add("ModuleName LIKE @ModuleNameFilter");

                if (moduleIdFilter.HasValue)
                    whereClauses.Add("ModuleId LIKE @ModuleIdFilter");

                if (!string.IsNullOrEmpty(dateFilter))
                    whereClauses.Add("DATE_FORMAT(Time, '%d-%m-%Y') LIKE @DateFilter");

                string whereClause = whereClauses.Count > 0
                    ? "WHERE " + string.Join(" AND ", whereClauses)
                    : "";

                // ✅ Sorting with whitelisting
                var allowedSortColumns = new HashSet<string>
        {
            "Id", "ProductId", "ParameterId", "ParameterName", "ModuleId", "ModuleName", "Value", "Time"
        };
                string orderBy = allowedSortColumns.Contains(sortBy ?? "")
                    ? sortBy!
                    : "Id";

                string orderDirection = sortOrder?.ToLower() == "desc" ? "DESC" : "ASC";

                // ✅ Count query
                using (var countCmd = new MySqlCommand($"SELECT COUNT(*) FROM readings {whereClause}", conn))
                {
                    if (!string.IsNullOrEmpty(search))
                        countCmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (!string.IsNullOrEmpty(productIdFilter))
                        countCmd.Parameters.AddWithValue("@ProductIdFilter", $"%{productIdFilter}%");
                    if (!string.IsNullOrEmpty(parameterNameFilter))
                        countCmd.Parameters.AddWithValue("@ParameterNameFilter", $"%{parameterNameFilter}%");
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        countCmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (parameterIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ParameterIdFilter", parameterIdFilter.Value);
                    if (moduleIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (!string.IsNullOrEmpty(dateFilter))
                        countCmd.Parameters.AddWithValue("@DateFilter", $"%{dateFilter}%");

                    totalRecords = Convert.ToInt32(countCmd.ExecuteScalar());
                }

                // ✅ Data query with pagination
                int offset = (page - 1) * pageSize;
                using (var cmd = new MySqlCommand($@"
            SELECT Id, ProductId, ParameterId, ParameterName, ModuleId, ModuleName, Value, Time
            FROM readings
            {whereClause}
            ORDER BY {orderBy} {orderDirection}
            LIMIT @PageSize OFFSET @Offset", conn))
                {
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);
                    cmd.Parameters.AddWithValue("@Offset", offset);

                    if (!string.IsNullOrEmpty(search))
                        cmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (!string.IsNullOrEmpty(productIdFilter))
                        cmd.Parameters.AddWithValue("@ProductIdFilter", $"%{productIdFilter}%");
                    if (!string.IsNullOrEmpty(parameterNameFilter))
                        cmd.Parameters.AddWithValue("@ParameterNameFilter", $"%{parameterNameFilter}%");
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        cmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (parameterIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ParameterIdFilter", parameterIdFilter.Value);
                    if (moduleIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (!string.IsNullOrEmpty(dateFilter))
                        cmd.Parameters.AddWithValue("@DateFilter", $"%{dateFilter}%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            result.Add(new Readings
                            {
                                Id = reader.GetInt32("Id"),
                                ProductId = reader["ProductId"].ToString(),
                                ParameterId = reader.GetInt32("ParameterId"),
                                ParameterName = reader["ParameterName"].ToString(),
                                ModuleId = reader.GetInt32("ModuleId"),
                                ModuleName = reader["ModuleName"].ToString(),
                                Value = reader["Value"].ToString(),
                                Time = reader["Time"] != DBNull.Value
                                    ? reader.GetDateTime("Time")
                                    : (DateTime?)null
                            });
                        }
                    }
                }
            }

            // ✅ Response
            var response = new
            {
                data = result.Select(r => new
                {
                    r.Id,
                    r.ProductId,
                    r.ParameterId,
                    r.ParameterName,
                    r.ModuleId,
                    r.ModuleName,
                    r.Value,
                    TimeString = r.Time?.ToString("dd-MM-yyyy HH:mm:ss")
                }),
                totalRecords
            };

            return Ok(response);
        }

        [HttpGet("readingsall/paged")]
        public IActionResult GetPagedReadingsAll(
    string? sortBy = null,
    string? sortOrder = "asc",
    string? search = null,
    string? productIdFilter = null,
    int? parameterIdFilter = null,
    string? parameterNameFilter = null,
    string? moduleNameFilter = null,
    int? moduleIdFilter = null,
    string? dateFilter = null
)
        {
            var result = new List<Readings>();
            int totalRecords = 0;

            using (var conn = _database.GetConnection())
            {
                conn.Open();

                // ✅ WHERE conditions
                var whereClauses = new List<string>();

                if (!string.IsNullOrEmpty(search))
                    whereClauses.Add("(ProductId LIKE @Search OR Value LIKE @Search)");

                if (!string.IsNullOrEmpty(productIdFilter))
                    whereClauses.Add("ProductId LIKE @ProductIdFilter");

                if (parameterIdFilter.HasValue)
                    whereClauses.Add("ParameterId LIKE @ParameterIdFilter");

                if (!string.IsNullOrEmpty(parameterNameFilter))
                    whereClauses.Add("ParameterName LIKE @ParameterNameFilter");

                if (!string.IsNullOrEmpty(moduleNameFilter))
                    whereClauses.Add("ModuleName LIKE @ModuleNameFilter");

                if (moduleIdFilter.HasValue)
                    whereClauses.Add("ModuleId LIKE @ModuleIdFilter");

                if (!string.IsNullOrEmpty(dateFilter))
                    whereClauses.Add("DATE_FORMAT(Time, '%d-%m-%Y') LIKE @DateFilter");

                string whereClause = whereClauses.Count > 0
                    ? "WHERE " + string.Join(" AND ", whereClauses)
                    : "";

                // ✅ Sorting with whitelisting
                var allowedSortColumns = new HashSet<string>
        {
            "Id", "ProductId", "ParameterId", "ParameterName", "ModuleId", "ModuleName", "Value", "Time"
        };
                string orderBy = allowedSortColumns.Contains(sortBy ?? "")
                    ? sortBy!
                    : "Id";

                string orderDirection = sortOrder?.ToLower() == "desc" ? "DESC" : "ASC";

                // ✅ Count query
                using (var countCmd = new MySqlCommand($"SELECT COUNT(*) FROM readings {whereClause}", conn))
                {
                    if (!string.IsNullOrEmpty(search))
                        countCmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (!string.IsNullOrEmpty(productIdFilter))
                        countCmd.Parameters.AddWithValue("@ProductIdFilter", $"%{productIdFilter}%");
                    if (!string.IsNullOrEmpty(parameterNameFilter))
                        countCmd.Parameters.AddWithValue("@ParameterNameFilter", $"%{parameterNameFilter}%");
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        countCmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (parameterIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ParameterIdFilter", parameterIdFilter.Value);
                    if (moduleIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (!string.IsNullOrEmpty(dateFilter))
                        countCmd.Parameters.AddWithValue("@DateFilter", $"%{dateFilter}%");

                    totalRecords = Convert.ToInt32(countCmd.ExecuteScalar());
                }

                using (var cmd = new MySqlCommand($@"
            SELECT Id, ProductId, ParameterId, ParameterName, ModuleId, ModuleName, Value, Time
            FROM readings
            {whereClause}
            ORDER BY {orderBy} {orderDirection}", conn))
                {
                    if (!string.IsNullOrEmpty(search))
                        cmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (!string.IsNullOrEmpty(productIdFilter))
                        cmd.Parameters.AddWithValue("@ProductIdFilter", $"%{productIdFilter}%");
                    if (!string.IsNullOrEmpty(parameterNameFilter))
                        cmd.Parameters.AddWithValue("@ParameterNameFilter", $"%{parameterNameFilter}%");
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        cmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (parameterIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ParameterIdFilter", parameterIdFilter.Value);
                    if (moduleIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (!string.IsNullOrEmpty(dateFilter))
                        cmd.Parameters.AddWithValue("@DateFilter", $"%{dateFilter}%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            result.Add(new Readings
                            {
                                Id = reader.GetInt32("Id"),
                                ProductId = reader["ProductId"].ToString(),
                                ParameterId = reader.GetInt32("ParameterId"),
                                ParameterName = reader["ParameterName"].ToString(),
                                ModuleId = reader.GetInt32("ModuleId"),
                                ModuleName = reader["ModuleName"].ToString(),
                                Value = reader["Value"].ToString(),
                                Time = reader["Time"] != DBNull.Value
                                    ? reader.GetDateTime("Time")
                                    : (DateTime?)null
                            });
                        }
                    }
                }
            }

            // ✅ Response
            var response = new
            {
                data = result.Select(r => new
                {
                    r.Id,
                    r.ProductId,
                    r.ParameterId,
                    r.ParameterName,
                    r.ModuleId,
                    r.ModuleName,
                    r.Value,
                    TimeString = r.Time?.ToString("dd-MM-yyyy HH:mm:ss")
                }),
                totalRecords
            };

            return Ok(response);
        }


        [HttpPost("upload")]
        public async Task<IActionResult> UploadBase64Image([FromBody] ImageUploadRequest request)
        {
            if (string.IsNullOrEmpty(request.Base64Data) || request.ModuleId <= 0)
                return BadRequest(new { message = "Invalid request data" });

            try
            {
                byte[] imageBytes = Convert.FromBase64String(request.Base64Data);

                using var connection = _database.GetConnection();
                connection.Open();

                using var transaction = connection.BeginTransaction();

                var client = new MongoClient(_connectionString);
                var database = client.GetDatabase(_dbName);
                var collection = database.GetCollection<BsonDocument>("images");
                var document = new BsonDocument
                {
                    { "fileName", request.FileName },
                    { "imageData", imageBytes },
                    { "moduleId", request.ModuleId },
                };
                await collection.InsertOneAsync(document);

                string query = "INSERT INTO images (fileName, imageData, moduleId) VALUES (@FileName, @ImageData, @ModuleId)";
                using var cmd = new MySqlCommand(query, connection, (MySqlTransaction)transaction);
                cmd.Parameters.AddWithValue("@FileName", request.FileName);
                cmd.Parameters.AddWithValue("@ImageData", imageBytes);
                cmd.Parameters.AddWithValue("@ModuleId", request.ModuleId);

                cmd.ExecuteNonQuery();
                transaction.Commit();

                return Ok(new { message = "Image uploaded successfully (Base64)" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("images/{moduleId}")]
        public IActionResult GetImagesByModule(int moduleId)
        {
            if (moduleId <= 0)
                return BadRequest(new { message = "No module id provided" });

            var images = new List<ImageDataResponseModel>();
            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using var transaction = connection.BeginTransaction();

                    string sql = "SELECT * FROM images WHERE moduleId = @ModuleId";
                    using var cmd = new MySqlCommand(sql, connection, (MySqlTransaction)transaction);
                    cmd.Parameters.AddWithValue("@ModuleId", moduleId);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var imageBytes = (byte[])reader["imageData"];
                            var base64Image = Convert.ToBase64String(imageBytes);

                            images.Add(new ImageDataResponseModel
                            {
                                Id = reader.GetInt32("id"),
                                ImageData = $"data:image/png;base64,{base64Image}", // Return as Base64 URI
                                FileName = reader["fileName"].ToString(),
                                ModuleId = reader.GetInt32("ModuleId"),
                            });
                        }
                    }

                    transaction.Commit();
                }
                return Ok(images);
            }
            catch (Exception err)
            {
                return StatusCode(500, new { error = err.Message });
            }
        }

        [HttpDelete("image/{id}")]
        public IActionResult DeleteImage(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "No image id provided" });

            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    // using var transaction = connection.BeginTransaction();
                    var deleteOptionsSql = "DELETE FROM images WHERE id = @imageId";
                    using (var cmd = new MySqlCommand(deleteOptionsSql, connection))
                    {
                        cmd.Parameters.AddWithValue("@imageId", id);
                        cmd.ExecuteNonQuery();
                    }
                }
                // transaction.Commit();
                return Ok(new { message = "Parameter and related options deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("modules")]
        public async Task<IActionResult> GetAllModules()
        {
            var modules = new List<CompleteModuleResponse>();
            try
            {
                using (var conn = _database.GetConnection())
                {
                    conn.Open();
                    string query = @"
                SELECT m.id as ModuleId, m.name as ModuleName, m.userId as UserId,
                       p.id as ParameterId, p.name as ParameterName, p.moduleId as ParamModuleId, p.value as Value, p.min as Min, p.max as Max
                FROM modules m
                LEFT JOIN parameters p ON m.id = p.moduleId
                ORDER BY m.id;";

                    using (var cmd = new MySqlCommand(query, conn))
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        var moduleDict = new Dictionary<int, CompleteModuleResponse>();

                        while (await reader.ReadAsync())
                        {
                            int moduleId = reader.GetInt32("ModuleId");

                            if (!moduleDict.ContainsKey(moduleId))
                            {
                                moduleDict[moduleId] = new CompleteModuleResponse
                                {
                                    Id = moduleId,
                                    Name = reader.GetString("ModuleName"),
                                    Parameters = new List<ParameterResponse>()  // ✅ ensure initialized
                                };
                            }

                            if (!reader.IsDBNull(reader.GetOrdinal("ParameterId")))
                            {
                                moduleDict[moduleId].Parameters.Add(new ParameterResponse
                                {
                                    Id = reader.GetInt32("ParameterId"),
                                    Name = reader.GetString("ParameterName"),
                                    ModuleId = reader.GetInt32("ParamModuleId"),
                                    Min = reader.GetInt32("Min"),
                                    Max = reader.GetInt32("Max"),
                                    Value = reader.GetString("Value"),
                                });
                            }
                        }

                        modules = moduleDict.Values.ToList();
                    }
                }

                return Ok(modules);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message
                });
            }
        }

        [HttpGet("modules/paged")]
        public IActionResult GetModulesPaged(
    int page = 1,
    int pageSize = 10,
    string? sortBy = null,
    string? sortOrder = "asc",
    string? moduleNameFilter = null,
    int? moduleIdFilter = null,
    int? userIdFilter = null
)
        {
            var modules = new List<CompleteModuleResponse>();
            int totalRecords = 0;

            using (var conn = _database.GetConnection())
            {
                conn.Open();

                // ✅ WHERE clauses
                var whereClauses = new List<string>();
                whereClauses.Add("m.superModuleId = 0"); // always apply this filter

                if (!string.IsNullOrEmpty(moduleNameFilter))
                    whereClauses.Add("m.name LIKE @ModuleNameFilter");

                if (moduleIdFilter.HasValue)
                    whereClauses.Add("m.id = @ModuleIdFilter");

                if (userIdFilter.HasValue)
                    whereClauses.Add("m.userId = @UserIdFilter");

                string whereClause = "WHERE " + string.Join(" AND ", whereClauses);

                // ✅ Sorting (whitelist)
                var allowedSortColumns = new HashSet<string> { "Id", "ModuleName", "UserId" };
                string orderBy = allowedSortColumns.Contains(sortBy ?? "")
                    ? (sortBy == "Id" ? "m.id" :
                       sortBy == "ModuleName" ? "m.name" :
                       "m.userId")
                    : "m.id";

                string orderDirection = sortOrder?.ToLower() == "desc" ? "DESC" : "ASC";

                // ✅ Count query
                using (var countCmd = new MySqlCommand($@"
    SELECT COUNT(*) FROM modules m {whereClause}", conn))
                {
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        countCmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (moduleIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (userIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@UserIdFilter", userIdFilter.Value);

                    totalRecords = Convert.ToInt32(countCmd.ExecuteScalar());
                }

                // ✅ Fetch parent modules (both super + normal)
                int offset = (page - 1) * pageSize;
                using (var cmd = new MySqlCommand($@"
            SELECT m.id AS ModuleId, m.name AS ModuleName, m.userId AS UserId, m.isThisSuper
            FROM modules m
            {whereClause} AND m.superModuleId = 0
            ORDER BY {orderBy} {orderDirection}
            LIMIT @PageSize OFFSET @Offset", conn))
                {
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);
                    cmd.Parameters.AddWithValue("@Offset", offset);

                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        cmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (moduleIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (userIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@UserIdFilter", userIdFilter.Value);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            modules.Add(new CompleteModuleResponse
                            {
                                Id = reader.GetInt32("ModuleId"),
                                Name = reader.GetString("ModuleName"),
                                UserId = reader.GetInt32("UserId"),
                                IsThisSuper = reader.GetBoolean("isThisSuper"),
                                Parameters = new List<ParameterResponse>(),
                                SubModules = new List<CompleteModuleResponse>()
                            });
                        }
                    }
                }

                // ✅ For each module, load either Parameters (if normal) OR SubModules (if super)
                foreach (var module in modules)
                {
                    if (module.IsThisSuper)
                    {
                        // Load SubModules
                        using (var subCmd = new MySqlCommand(@"
                    SELECT sm.id AS SubModuleId, sm.name AS SubModuleName, sm.userId AS UserId,
                           p.id AS ParameterId, p.name AS ParameterName, 
                           p.value, p.min, p.max, p.moduleId AS ParamModuleId
                    FROM modules sm
                    LEFT JOIN parameters p ON sm.id = p.moduleId
                    WHERE sm.superModuleId = @SuperId", conn))
                        {
                            subCmd.Parameters.AddWithValue("@SuperId", module.Id);

                            var subDict = new Dictionary<int, CompleteModuleResponse>();
                            using (var reader = subCmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    int subId = reader.GetInt32("SubModuleId");
                                    if (!subDict.ContainsKey(subId))
                                    {
                                        subDict[subId] = new CompleteModuleResponse
                                        {
                                            Id = subId,
                                            Name = reader.GetString("SubModuleName"),
                                            UserId = reader.GetInt32("UserId"),
                                            Parameters = new List<ParameterResponse>()
                                        };
                                    }

                                    if (!reader.IsDBNull(reader.GetOrdinal("ParameterId")))
                                    {
                                        subDict[subId].Parameters.Add(new ParameterResponse
                                        {
                                            Id = reader.GetInt32("ParameterId"),
                                            Name = reader.GetString("ParameterName"),
                                            ModuleId = reader.GetInt32("ParamModuleId"),
                                            Min = reader.GetInt32("Min"),
                                            Max = reader.GetInt32("Max"),
                                            Value = reader.GetString("Value")
                                        });
                                    }
                                }
                            }
                            module.SubModules = subDict.Values.ToList();
                        }
                    }
                    else
                    {
                        // Load Parameters
                        using (var paramCmd = new MySqlCommand(@"
                    SELECT p.id, p.name, p.value, p.min, p.max, p.moduleId
                    FROM parameters p
                    WHERE p.moduleId = @ModuleId", conn))
                        {
                            paramCmd.Parameters.AddWithValue("@ModuleId", module.Id);

                            using (var reader = paramCmd.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    module.Parameters.Add(new ParameterResponse
                                    {
                                        Id = reader.GetInt32("id"),
                                        Name = reader.GetString("name"),
                                        ModuleId = reader.GetInt32("moduleId"),
                                        Min = reader.GetInt32("min"),
                                        Max = reader.GetInt32("max"),
                                        Value = reader.GetString("value")
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // ✅ Response
            return Ok(new
            {
                data = modules,
                totalRecords,
                currentPage = page,
                pageSize
            });
        }

        [HttpDelete("deleteSuperModule/{id}")]
        public IActionResult DeleteSuperModule(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid module ID" });

            try
            {
                using (var conn = _database.GetConnection())
                {
                    conn.Open();

                    // 2. Delete submodules first
                    using (var deleteSubs = new MySqlCommand("DELETE FROM modules WHERE superModuleId = @id", conn))
                    {
                        deleteSubs.Parameters.AddWithValue("@id", id);
                        deleteSubs.ExecuteNonQuery();
                    }

                    // 3. Delete the supermodule itself
                    using (var deleteSuper = new MySqlCommand("DELETE FROM modules WHERE id = @id", conn))
                    {
                        deleteSuper.Parameters.AddWithValue("@id", id);
                        deleteSuper.ExecuteNonQuery();
                    }
                }

                return Ok(new { message = "Supermodule and its submodules deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return StatusCode(500, new { message = "Server error", error = ex.Message });
            }
        }


        [HttpGet("getOnlySuperModules")]
        public IActionResult GetOnlySuperModules()
        {
            try
            {
                using (var conn = _database.GetConnection())
                {
                    conn.Open();

                    string query = @"SELECT id, name 
                             FROM modules 
                             WHERE isThisSuper = 1";

                    using (var cmd = new MySqlCommand(query, conn))
                    using (var reader = cmd.ExecuteReader())
                    {
                        var result = new List<object>();
                        while (reader.Read())
                        {
                            result.Add(new
                            {
                                Id = reader.GetInt32("id"),
                                Name = reader.GetString("name")
                            });
                        }

                        return Ok(result);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpGet("getallmodules/paged")]
        public IActionResult GetAllModulesPaged(
   string? sortBy = null,
   string? sortOrder = "asc",
   string? moduleNameFilter = null,
   int? moduleIdFilter = null,
   int? userIdFilter = null
)
        {
            var modules = new List<CompleteModuleResponse>();
            int totalRecords = 0;

            using (var conn = _database.GetConnection())
            {
                conn.Open();

                // ✅ WHERE clauses
                var whereClauses = new List<string>();
                if (!string.IsNullOrEmpty(moduleNameFilter))
                    whereClauses.Add("m.name LIKE @ModuleNameFilter");

                if (moduleIdFilter.HasValue)
                    whereClauses.Add("m.id = @ModuleIdFilter");

                if (userIdFilter.HasValue)
                    whereClauses.Add("m.userId = @UserIdFilter");

                string whereClause = whereClauses.Count > 0
                    ? "WHERE " + string.Join(" AND ", whereClauses)
                    : "";

                // ✅ Sorting (whitelist)
                var allowedSortColumns = new HashSet<string> { "Id", "ModuleName", "UserId" };
                string orderBy = allowedSortColumns.Contains(sortBy ?? "")
                    ? (sortBy == "Id" ? "m.id" :
                       sortBy == "ModuleName" ? "m.name" :
                       "m.userId")
                    : "m.id";

                string orderDirection = sortOrder?.ToLower() == "desc" ? "DESC" : "ASC";

                // ✅ Count query
                using (var countCmd = new MySqlCommand($@"
            SELECT COUNT(DISTINCT m.id)
            FROM modules m
            LEFT JOIN parameters p ON m.id = p.moduleId
            {whereClause}", conn))
                {
                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        countCmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (moduleIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (userIdFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@UserIdFilter", userIdFilter.Value);

                    totalRecords = Convert.ToInt32(countCmd.ExecuteScalar());
                }

                using (var cmd = new MySqlCommand($@"
            SELECT m.id AS ModuleId, m.name AS ModuleName, m.userId AS UserId,
                   p.id AS ParameterId, p.name AS ParameterName, 
                   p.moduleId AS ParamModuleId, p.value AS Value, p.min AS Min, p.max AS Max
            FROM modules m
            LEFT JOIN parameters p ON m.id = p.moduleId
            {whereClause}
            ORDER BY {orderBy} {orderDirection}", conn))
                {

                    if (!string.IsNullOrEmpty(moduleNameFilter))
                        cmd.Parameters.AddWithValue("@ModuleNameFilter", $"%{moduleNameFilter}%");
                    if (moduleIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@ModuleIdFilter", moduleIdFilter.Value);
                    if (userIdFilter.HasValue)
                        cmd.Parameters.AddWithValue("@UserIdFilter", userIdFilter.Value);

                    var moduleDict = new Dictionary<int, CompleteModuleResponse>();
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int moduleId = reader.GetInt32("ModuleId");

                            if (!moduleDict.ContainsKey(moduleId))
                            {
                                moduleDict[moduleId] = new CompleteModuleResponse
                                {
                                    Id = moduleId,
                                    Name = reader.GetString("ModuleName"),
                                    UserId = reader.GetInt32("UserId"),
                                    Parameters = new List<ParameterResponse>()
                                };
                            }

                            if (!reader.IsDBNull(reader.GetOrdinal("ParameterId")))
                            {
#pragma warning disable CS8602 // Dereference of a possibly null reference.
                                moduleDict[moduleId].Parameters.Add(new ParameterResponse
                                {
                                    Id = reader.GetInt32("ParameterId"),
                                    Name = reader.GetString("ParameterName"),
                                    ModuleId = reader.GetInt32("ParamModuleId"),
                                    Min = reader.GetInt32("Min"),
                                    Max = reader.GetInt32("Max"),
                                    Value = reader.GetString("Value")
                                });
#pragma warning restore CS8602 // Dereference of a possibly null reference.
                            }
                        }
                    }

                    modules = moduleDict.Values.ToList();
                }
            }

            // ✅ Response with pagination metadata
            var response = new
            {
                data = modules,
                totalRecords,
            };

            return Ok(response);
        }

        [HttpPost("model")]
        public IActionResult SetModel([FromBody] RequestModel request)
        {
            if (string.IsNullOrEmpty(request.ModelName) || string.IsNullOrEmpty(request.ModelSrNo) || string.IsNullOrEmpty(request.UserName) || request.Min <= 0 || request.Max <= 0 || request.NoOfSrNoAtTime <= 0)
                return BadRequest(new { message = "Invalid request data" });
            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using (var transaction = connection.BeginTransaction())
                    {
                        string query = "INSERT INTO productmodel (modelName, modelSrNo, userName, min, max, lastSrNo, noOfSrNoAtTime) VALUES (@ModelName, @ModelSrNo, @UserName, @Min, @Max, @LastSrNo, @NoOfSrNoAtTime)";
                        using var cmd = new MySqlCommand(query, connection, (MySqlTransaction)transaction);
                        cmd.Parameters.AddWithValue("@ModelName", request.ModelName);
                        cmd.Parameters.AddWithValue("@ModelSrNo", request.ModelSrNo);
                        cmd.Parameters.AddWithValue("@UserName", request.UserName);
                        cmd.Parameters.AddWithValue("@Min", request.Min);
                        cmd.Parameters.AddWithValue("@Max", request.Max);
                        cmd.Parameters.AddWithValue("@LastSrNo", request.Min);
                        cmd.Parameters.AddWithValue("@NoOfSrNoAtTime", request.NoOfSrNoAtTime);

                        cmd.ExecuteNonQuery();
                        transaction.Commit();
                    }
                }

                return Ok(new { message = "Model Added" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("model")]
        public IActionResult GetModels()
        {
            var result = new List<ResponseModel>();
            using (var connection = _database.GetConnection())
            {
                connection.Open();

                using (var transaction = connection.BeginTransaction())
                {
                    string query = "SELECT * FROM productmodel";
                    using var cmd = new MySqlCommand(query, connection);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
#pragma warning disable CS8601 // Possible null reference assignment.
                            result.Add(new ResponseModel
                            {
                                Id = reader.GetInt32("id"),
                                ModelName = reader["modelName"].ToString(),
                                ModelSrNo = reader["modelSrNo"].ToString(),
                                UserName = reader["userName"].ToString(),
                                Min = reader.GetInt32("min"),
                                Max = reader.GetInt32("max"),
                                LastSrNo = reader.GetInt32("lastSrNo"),
                                NoOfSrNoAtTime = reader.GetInt32("noOfSrNoAtTime"),
                            });
#pragma warning restore CS8601 // Possible null reference assignment.
                        }
                    }
                }
            }
            return Ok(result);
        }

        [HttpPut("model/{id}")]
        public IActionResult EditModel([FromBody] RequestModelForEdit request, int id)
        {
            if (string.IsNullOrEmpty(request.ModelName) || string.IsNullOrEmpty(request.UserName) || request.Min <= 0 || request.Max <= 0 || request.NoOfSrNoAtTime <= 0)
                return BadRequest(new { message = "Invalid request data" });
            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using (var transaction = connection.BeginTransaction())
                    {
                        string query = "UPDATE productmodel SET modelName=@Modelname, userName=@UserName, min=@Min, max=@Max, noOfSrNoAtTime=@NoOfSrNoAtTime WHERE id=@Id";
                        using var cmd = new MySqlCommand(query, connection, (MySqlTransaction)transaction);
                        cmd.Parameters.AddWithValue("@ModelName", request.ModelName);
                        cmd.Parameters.AddWithValue("@id", id);
                        cmd.Parameters.AddWithValue("@UserName", request.UserName);
                        cmd.Parameters.AddWithValue("@Min", request.Min);
                        cmd.Parameters.AddWithValue("@Max", request.Max);
                        cmd.Parameters.AddWithValue("@NoOfSrNoAtTime", request.NoOfSrNoAtTime);

                        cmd.ExecuteNonQuery();
                        transaction.Commit();
                    }
                }

                return Ok(new { message = "Model Edited" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("model/{id}")]
        public IActionResult DeleteModel(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid request data" });
            try
            {
                using (var connection = _database.GetConnection())
                {
                    connection.Open();

                    using (var transaction = connection.BeginTransaction())
                    {
                        string query = "DELETE FROM productmodel WHERE id=@Id";
                        using var cmd = new MySqlCommand(query, connection, (MySqlTransaction)transaction);
                        cmd.Parameters.AddWithValue("@id", id);

                        cmd.ExecuteNonQuery();
                        transaction.Commit();
                    }
                }

                return Ok(new { message = "Model DELETED" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpGet("productmodels/paged")]
        public IActionResult GetPagedProductModels(
    int page = 1,
    int pageSize = 10,
    string? sortBy = null,
    string? sortOrder = "asc",
    string? search = null,
    int? idFilter = null,
    string? modelSrNoFilter = null,
    string? modelNameFilter = null
)
        {
            var result = new List<object>();
            int totalRecords = 0;

            using (var conn = _database.GetConnection())
            {
                conn.Open();

                // ✅ WHERE conditions
                var whereClauses = new List<string>();

                if (!string.IsNullOrEmpty(search))
                    whereClauses.Add("(ModelSrNo LIKE @Search OR ModelName LIKE @Search)");

                if (idFilter.HasValue)
                    whereClauses.Add("Id = @IdFilter");

                if (!string.IsNullOrEmpty(modelSrNoFilter))
                    whereClauses.Add("ModelSrNo LIKE @ModelSrNoFilter");

                if (!string.IsNullOrEmpty(modelNameFilter))
                    whereClauses.Add("ModelName LIKE @ModelNameFilter");

                string whereClause = whereClauses.Count > 0
                    ? "WHERE " + string.Join(" AND ", whereClauses)
                    : "";

                // ✅ Sorting with whitelisting
                var allowedSortColumns = new HashSet<string> { "Id", "ModelSrNo", "ModelName" };
                string orderBy = allowedSortColumns.Contains(sortBy ?? "")
                    ? sortBy!
                    : "Id";

                string orderDirection = sortOrder?.ToLower() == "desc" ? "DESC" : "ASC";

                // ✅ Count query
                using (var countCmd = new MySqlCommand($"SELECT COUNT(*) FROM productmodel {whereClause}", conn))
                {
                    if (!string.IsNullOrEmpty(search))
                        countCmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (idFilter.HasValue)
                        countCmd.Parameters.AddWithValue("@IdFilter", idFilter.Value);
                    if (!string.IsNullOrEmpty(modelSrNoFilter))
                        countCmd.Parameters.AddWithValue("@ModelSrNoFilter", $"%{modelSrNoFilter}%");
                    if (!string.IsNullOrEmpty(modelNameFilter))
                        countCmd.Parameters.AddWithValue("@ModelNameFilter", $"%{modelNameFilter}%");

                    totalRecords = Convert.ToInt32(countCmd.ExecuteScalar());
                }

                // ✅ Data query with pagination
                int offset = (page - 1) * pageSize;
                using (var cmd = new MySqlCommand($@"
            SELECT Id, ModelSrNo, ModelName, UserName, Min, Max, LastSrNo, NoOfSrNoAtTime
            FROM productmodel
            {whereClause}
            ORDER BY {orderBy} {orderDirection}
            LIMIT @PageSize OFFSET @Offset", conn))
                {
                    cmd.Parameters.AddWithValue("@PageSize", pageSize);
                    cmd.Parameters.AddWithValue("@Offset", offset);

                    if (!string.IsNullOrEmpty(search))
                        cmd.Parameters.AddWithValue("@Search", $"%{search}%");
                    if (idFilter.HasValue)
                        cmd.Parameters.AddWithValue("@IdFilter", idFilter.Value);
                    if (!string.IsNullOrEmpty(modelSrNoFilter))
                        cmd.Parameters.AddWithValue("@ModelSrNoFilter", $"%{modelSrNoFilter}%");
                    if (!string.IsNullOrEmpty(modelNameFilter))
                        cmd.Parameters.AddWithValue("@ModelNameFilter", $"%{modelNameFilter}%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
#pragma warning disable CS8601 // Possible null reference assignment.
                            result.Add(new ResponseModel
                            {
                                Id = reader.GetInt32("Id"),
                                ModelSrNo = reader["ModelSrNo"].ToString(),
                                ModelName = reader["ModelName"].ToString(),
                                UserName = reader["UserName"].ToString(),
                                Min = reader.GetInt32("Min"),
                                Max = reader.GetInt32("max"),
                                LastSrNo = reader.GetInt32("LastSrNo"),
                                NoOfSrNoAtTime = reader.GetInt32("NoOfSrNoAtTime")
                            });
#pragma warning restore CS8601 // Possible null reference assignment.
                        }
                    }
                }
            }

            // ✅ Response
            var response = new
            {
                data = result,
                totalRecords
            };

            return Ok(response);
        }

        [HttpPost("selectedmodel/{modelId}")]
        public IActionResult SetSelectedModel(int modelId)
        {
            if (modelId == 0) return BadRequest("Invalid request");

            using (var conn = _database.GetConnection())
            {
                conn.Open();
                // Update parameter name
                var paramSql = "UPDATE selectedmodel SET modelId=@ModelId WHERE id=1";
                using (var cmd = new MySqlCommand(paramSql, conn))
                {
                    cmd.Parameters.AddWithValue("@ModelId", modelId);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(new { message = "Model selected successfully" });
        }

        [HttpGet("selectedModel")]
        public IActionResult GetSelectedModel()
        {
            var result = new List<ResponseSelectedModel>();
            using (var connection = _database.GetConnection())
            {
                connection.Open();

                using (var transaction = connection.BeginTransaction())
                {
                    string query = "SELECT modelId FROM selectedmodel WHERE id = 1";
                    using var cmd = new MySqlCommand(query, connection);

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
#pragma warning disable CS8601 // Possible null reference assignment.
                            result.Add(new ResponseSelectedModel
                            {
                                ModelId = reader.GetInt32("modelId"),
                            });
#pragma warning restore CS8601 // Possible null reference assignment.
                        }
                    }
                }
            }
            return Ok(result);
        }




        private string GenerateJwtToken(string id, string email, string type)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(jwtSecret);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim("id", id),
                new Claim("email", email),
                new Claim("type", type)
            }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

    }
}

public class ResponseSelectedModel
{
    public int ModelId { get; set; }
}

public class RequestModel
{
    public required string ModelSrNo { get; set; }
    public string? ModelName { get; set; }
    public string? UserName { get; set; }

    public int Min { get; set; }
    public int Max { get; set; }
    public int? LastSrNo { get; set; }
    public int? NoOfSrNoAtTime { get; set; } = 1;
}


public class RequestModelForEdit
{
    public string? ModelName { get; set; }
    public string? UserName { get; set; }

    public int? Min { get; set; }
    public int? Max { get; set; }
    public int? LastSrNo { get; set; }
    public int? NoOfSrNoAtTime { get; set; } = 1;
}

public class ResponseModel
{
    public int Id { get; set; }
    public required string ModelSrNo { get; set; }
    public string? ModelName { get; set; }
    public string? UserName { get; set; }

    public int Min { get; set; }
    public int Max { get; set; }
    public int LastSrNo { get; set; }
    public int NoOfSrNoAtTime { get; set; }
}

public class ImageUploadRequest
{
    public string? FileName { get; set; }
    public string? Base64Data { get; set; }
    public int ModuleId { get; set; }
}
public class ImageDataModel
{
    public string? FileName { get; set; }
    public string? ImageData { get; set; }
    public int ModuleId { get; set; }
}
public class ImageDataResponseModel
{
    public int Id { get; set; }
    public string? FileName { get; set; }
    public string? ImageData { get; set; }
    public int ModuleId { get; set; }
}

public class EmailRequest
{
    public required string RecipientEmail { get; set; }
    public required string FileName { get; set; }
    public required string Base64Pdf { get; set; }
}

public class UserRegisterRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public int Type { get; set; }
}

public class OptionRequest
{
    public required string Name { get; set; }
    public required string Value { get; set; }
    public int ParameterId { get; set; }
}

// Request Models
public class LoginRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string Type { get; set; }
}

// Request model
public class DeleteRequest
{
    public required List<int> Ids { get; set; }
}

// DTOs
public class ModuleRequest
{
    public required string Name { get; set; }
    public int UserId { get; set; }
    public int? SuperModuleId { get; set; }
    public bool? IsThisSuper { get; set; }
}

public class SuperModuleRequest
{
    public required string Name { get; set; }
    public int UserId { get; set; }
}

public class ParameterRequest
{
    public required string Name { get; set; }
    public int Min { get; set; }
    public int Max { get; set; }
    public required string Value { get; set; }
    public int ModuleId { get; set; }
}

public class ModuleResponse
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int UserId { get; set; }
    public bool? IsThisSuper { get; set; }
}

public class CompleteModuleResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Name { get; set; }
    public bool IsThisSuper { get; set; } = false;
    public List<ParameterResponse>? Parameters { get; set; } = new List<ParameterResponse>();
    public List<CompleteModuleResponse>? SubModules { get; set; } = new List<CompleteModuleResponse>();
}

public class ParameterResponse
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int Min { get; set; }
    public int Max { get; set; }
    public required string Value { get; set; }
    public int ModuleId { get; set; }
}

public class OptionResponse
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Value { get; set; }
    public int ParameterId { get; set; }
}

public class ReadingsPerProductAndModule
{
    public int ParameterId { get; set; }
    public int ModuleId { get; set; }
    public string? ProductId { get; set; }
    public string? ParameterName { get; set; }
    public string? ModuleName { get; set; }
    public string? Value { get; set; }
    public DateTime? Time { get; set; }
}

public class UpdateSelectedOptionRequest
{
    public int SelectedOption { get; set; }
}

public class ParameterUpdateRequest
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public required string Value { get; set; }
    public int Min { get; set; }
    public int Max { get; set; }
}
public class ModuleUpdateRequest
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class OptionUpdateRequest
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Value { get; set; }
}

public class ProductData
{
    public string? ProductId { get; set; }
    public int UserId { get; set; }
}

public class Readings
{
    public int Id { get; set; }
    public string? ProductId { get; set; }
    public int ParameterId { get; set; }
    public string? ParameterName { get; set; }
    public int ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public string? Value { get; set; }
    public DateTime? Time { get; set; }
}

public class ReadingsRequest
{
    public string? ProductId { get; set; }
    public int ParameterId { get; set; }
    public string? ParameterName { get; set; }
    public int ModuleId { get; set; }
    public string? ModuleName { get; set; }
    public string? Value { get; set; }
    public DateTime? Time { get; set; }
}

// DTO for response
public class ReadingsResponse
{
    public long Id { get; set; }
    public string? ProductId { get; set; }
    public int ParameterId { get; set; }
    public int ModuleId { get; set; }
    public string? Value { get; set; }
    public DateTime Time { get; set; }
}