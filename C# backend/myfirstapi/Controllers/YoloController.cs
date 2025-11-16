using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

[ApiController]
[Route("api/[controller]")]
public class YoloController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public YoloController(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    // DTO for receiving Base64 image
    public class ImageRequest
    {
        public string? ImageBase64 { get; set; }
    }

    [HttpPost("detect-base64")]
    public async Task<IActionResult> DetectBase64([FromBody] ImageRequest request)
    {
        // Prepare JSON to send to Python FastAPI
        var jsonContent = new StringContent(
            JsonConvert.SerializeObject(new { file = request.ImageBase64 }),
            Encoding.UTF8,
            "application/json"
        );

        // Call Python YOLO FastAPI
        var response = await _httpClient.PostAsync("http://127.0.0.1:8000/predict-base64/", jsonContent);
        var result = await response.Content.ReadAsStringAsync();

        return Ok(result); // Forward YOLO result to frontend
    }
}
