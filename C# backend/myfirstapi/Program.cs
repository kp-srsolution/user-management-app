var builder = WebApplication.CreateBuilder(args);

// 1️⃣ Add CORS service
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // your React app URL
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Add services for controllers
builder.Services.AddControllers();
builder.Services.AddSingleton<MyFirst.Database>();

// ✅ Register IHttpClientFactory for HttpClient injection
builder.Services.AddHttpClient();

// Enable Swagger (API docs)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2️⃣ Use CORS before MapControllers
app.UseCors("AllowReactApp");

// app.UseHttpsRedirection();

app.UseAuthorization();

// Map controllers
app.MapControllers();

app.Run();
