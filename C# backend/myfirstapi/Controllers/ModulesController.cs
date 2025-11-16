using Microsoft.AspNetCore.Mvc;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModulesController : ControllerBase
    {
        [HttpGet("{userId}")]
        public IActionResult GetModules(int userId)
        {
            var modules = new[]
            {
                new { Id = 1, Name = "Module 1" },
                new { Id = 2, Name = "Module 2" }
            };

            // In real DB query, you would filter by userId
            return Ok(modules);
        }
    }
}