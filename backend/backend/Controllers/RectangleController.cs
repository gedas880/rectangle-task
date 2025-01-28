using backend.Dto;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RectangleController : ControllerBase
    {
        private readonly JsonService _jsonService;

        public RectangleController(JsonService jsonService)
        {
            _jsonService = jsonService;
        }

        [HttpGet("size-location")]
        public IActionResult GetSizeLocation()
        {
            var size = _jsonService.GetSizeLocation();
            return Ok(size);
        }

        [HttpPost("size-location")]
        public IActionResult SetSizeLocation([FromBody] SizeLocation sizeLocation)
        {
            var result = _jsonService.SetSizeLocation(sizeLocation);
            if (!result.Success)
            {
                return BadRequest(result.Error);
            }
            return Ok();
        }

        [HttpPost("limits")]
        public IActionResult SetLimits([FromBody] Size limits)
        {
            _jsonService.SetLimits(limits);
            return Ok();
        }
    }
}