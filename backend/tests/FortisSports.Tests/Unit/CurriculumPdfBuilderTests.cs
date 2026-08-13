using FortisSports.Domain.Entities;
using FortisSports.Infrastructure.Pdf;

namespace FortisSports.Tests.Unit;

public class CurriculumPdfBuilderTests
{
    [Fact]
    public void Build_generates_non_empty_pdf()
    {
        var player = new Player
        {
            FirstName = "mirkp",
            LastName = "pardo",
            BirthDate = new DateOnly(2000, 7, 20),
            Nationality = "Colombiano",
            MainPosition = "Volante",
            PreferredFoot = "Derecha",
            HeightCm = 180,
            WeightKg = 75,
            AgencyStatus = "Activo",
            ContractStatus = "SinContrato",
        };

        var transfers = new List<Transfer>
        {
            new()
            {
                OriginClub = "Oriente petrolero",
                DestinationClub = "san jose",
                TransferDate = new DateOnly(2026, 3, 11),
                TransferType = "Préstamo",
                Status = "Completada",
            },
        };

        var bytes = CurriculumPdfDocumentBuilder.Build(
            player,
            photoPath: null,
            age: 25,
            stats: [],
            transfers,
            clubHistory: [],
            achievements: [],
            activeContract: null);

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 1000, $"PDF demasiado pequeño: {bytes.Length} bytes");
        Assert.Equal('%', (char)bytes[0]);
        Assert.Equal('P', (char)bytes[1]);
    }
}
