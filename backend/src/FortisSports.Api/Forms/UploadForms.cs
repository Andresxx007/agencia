namespace FortisSports.Api.Forms;

public class DocumentUploadForm
{
    public Guid PlayerId { get; set; }
    public string DocumentType { get; set; } = "";
    public string Description { get; set; } = "";
    public string Status { get; set; } = "Vigente";
    public DateOnly? IssuedAt { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public string? RelatedClub { get; set; }
    public Guid? TransferId { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class CsvImportForm
{
    public IFormFile File { get; set; } = null!;
}

public class TransferRegisterForm
{
    public Guid PlayerId { get; set; }
    public string OriginClub { get; set; } = "";
    public string DestinationClub { get; set; } = "";
    public DateOnly TransferDate { get; set; }
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string TransferType { get; set; } = "Definitiva";
    public string? Conditions { get; set; }
    public string ManagedBy { get; set; } = "";
    public IFormFile? ClubContract { get; set; }
}
