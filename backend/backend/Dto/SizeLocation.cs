namespace backend.Dto;

public record SizeLocation : Size
{
    public int X { get; set; }
    public int Y { get; set; }
}