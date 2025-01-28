using System.Text.Json;
using backend.Dto;

namespace backend.Services
{
    public class JsonService
    {
        private readonly string _configPath = "rectangle-config.json";
        private readonly string _limitsPath = "size-limits.json";

        public JsonService()
        {
            InitializeFiles();
        }

        private void InitializeFiles()
        {
            if (!File.Exists(_configPath))
            {
                var defaultSize = new SizeLocation
                {
                    Width = 100,
                    Height = 100,
                    X = 0,
                    Y = 0
                };
                File.WriteAllText(_configPath, JsonSerializer.Serialize(defaultSize));
            }

            if (!File.Exists(_limitsPath))
            {
                var defaultLimits = new Size
                {
                    Width = 400,
                    Height = 400
                };
                File.WriteAllText(_limitsPath, JsonSerializer.Serialize(defaultLimits));
            }
        }

        public SizeLocation GetSizeLocation()
        {
            var json = File.ReadAllText(_configPath);
            return JsonSerializer.Deserialize<SizeLocation>(json)!;
        }

        public Result<bool> SetSizeLocation(SizeLocation sizeLocation)
        {
            var limitsJson = File.ReadAllText(_limitsPath);
            var limits = JsonSerializer.Deserialize<Size>(limitsJson);

            if (sizeLocation.Width > limits!.Width || sizeLocation.Height > limits.Height)
            {
                return new Result<bool>
                {
                    Success = false,
                    Error = "Size exceeds limits"
                };
            }

            File.WriteAllText(_configPath, JsonSerializer.Serialize(sizeLocation));
            return new Result<bool> { Success = true, Data = true };
        }

        public void SetLimits(Size limits)
        {
            File.WriteAllText(_limitsPath, JsonSerializer.Serialize(limits));
        }
    }
}