using Microsoft.AspNetCore.Identity;

namespace FortisSports.Domain.Entities;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? UpdatedBy { get; set; }
}

public class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class AppRole : IdentityRole<Guid>
{
}

public class Player : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public string Nationality { get; set; } = string.Empty;
    public string MainPosition { get; set; } = string.Empty;
    public string? CurrentClub { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public string? PreferredFoot { get; set; }
    public string AgencyStatus { get; set; } = "Activo";
    public string ContractStatus { get; set; } = "SinContrato";
    public bool IsVisible { get; set; } = true;
    public string? Notes { get; set; }
    /// <summary>Ruta pública relativa (ej. /uploads/players/{id}.jpg) para foto del jugador en portal.</summary>
    public string? PhotoUrl { get; set; }
    /// <summary>Documento de identidad / carnet del jugador.</summary>
    public string? IdCardNumber { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public string? Email { get; set; }
    /// <summary>Celular o teléfono de contacto del jugador.</summary>
    public string? PhoneNumber { get; set; }
    /// <summary>Número de camiseta en cancha.</summary>
    public int? JerseyNumber { get; set; }

    public List<RepresentationContract> Contracts { get; set; } = [];
    public List<PlayerDocument> Documents { get; set; } = [];
    public List<Negotiation> Negotiations { get; set; } = [];
    public List<Transfer> Transfers { get; set; } = [];
    public List<PlayerMatchStat> MatchStats { get; set; } = [];
    public List<PlayerClubHistory> ClubHistory { get; set; } = [];
    public List<PlayerSportingAchievement> SportingAchievements { get; set; } = [];
}

public class RepresentationContract : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public DateOnly IssuedAt { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "Vigente";
    public string PdfPath { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
}

public class PlayerDocument : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly? IssuedAt { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public string? RelatedClub { get; set; }
    public Guid? TransferId { get; set; }
    public Transfer? Transfer { get; set; }
    public string Status { get; set; } = "Vigente";
    public string FilePath { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
}

public class Negotiation : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public decimal OfferedAmount { get; set; }
    public decimal MonthlyAmount { get; set; }
    public int InstallmentsPerYear { get; set; } = 12;
    public int ContractYears { get; set; } = 1;
    public bool HasHousingBonus { get; set; }
    public string HousingBonusNotes { get; set; } = string.Empty;
    public bool HasObjectiveBonus { get; set; }
    public string ObjectiveBonusNotes { get; set; } = string.Empty;
    public bool HasGoalBonus { get; set; }
    public string GoalBonusNotes { get; set; } = string.Empty;
    public bool HasSigningBonus { get; set; }
    public string SigningBonusNotes { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public string Conditions { get; set; } = string.Empty;
    public DateOnly OfferDate { get; set; }
    public string Status { get; set; } = "EnAnalisis";
    public string ResponsibleName { get; set; } = string.Empty;
    public int CurrentVersionNumber { get; set; } = 1;

    public List<NegotiationInteraction> Interactions { get; set; } = [];
    public List<NegotiationOfferVersion> OfferVersions { get; set; } = [];
    public List<NegotiationConversation> Conversations { get; set; } = [];
}

public class NegotiationConversation : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    /// <summary>Club con el que se relaciona esta conversación.</summary>
    public string ClubName { get; set; } = string.Empty;
    public Guid? NegotiationId { get; set; }
    public Negotiation? Negotiation { get; set; }
    /// <summary>Mensaje, Correo, Reunion o ComentarioInterno.</summary>
    public string ConversationType { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Participants { get; set; }
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
}

public class NegotiationOfferVersion : AuditableEntity
{
    public Guid NegotiationId { get; set; }
    public Negotiation? Negotiation { get; set; }
    public int VersionNumber { get; set; }
    /// <summary>Inicial, Club o Agencia.</summary>
    public string ProposedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string ClubName { get; set; } = string.Empty;
    public decimal MonthlyAmount { get; set; }
    public int InstallmentsPerYear { get; set; } = 12;
    public int ContractYears { get; set; } = 1;
    public bool HasHousingBonus { get; set; }
    public string HousingBonusNotes { get; set; } = string.Empty;
    public bool HasObjectiveBonus { get; set; }
    public string ObjectiveBonusNotes { get; set; } = string.Empty;
    public bool HasGoalBonus { get; set; }
    public string GoalBonusNotes { get; set; } = string.Empty;
    public bool HasSigningBonus { get; set; }
    public string SigningBonusNotes { get; set; } = string.Empty;
    public string Currency { get; set; } = "USD";
    public DateOnly OfferDate { get; set; }
    public DateTime RegisteredAtUtc { get; set; } = DateTime.UtcNow;
}

public class NegotiationInteraction : AuditableEntity
{
    public Guid NegotiationId { get; set; }
    public Negotiation? Negotiation { get; set; }
    public DateTime InteractionAtUtc { get; set; } = DateTime.UtcNow;
    public string InteractionType { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string NextStep { get; set; } = string.Empty;
    public string UpdatedStatus { get; set; } = string.Empty;
}

public class Transfer : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public string OriginClub { get; set; } = string.Empty;
    public string DestinationClub { get; set; } = string.Empty;
    public DateOnly TransferDate { get; set; }
    public decimal? Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string TransferType { get; set; } = "Definitiva";
    public string Status { get; set; } = "EnAnalisis";
    public string Conditions { get; set; } = string.Empty;
    public string ManagedBy { get; set; } = string.Empty;
}

public class Notification : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Priority { get; set; } = "Media";
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }
    public Guid? RelatedPlayerId { get; set; }
}

public class AuditLog : AuditableEntity
{
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string ChangesSummary { get; set; } = string.Empty;
    public DateTime ActionAtUtc { get; set; } = DateTime.UtcNow;
}

public class Catalog : AuditableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<CatalogItem> Items { get; set; } = [];
}

public class CatalogItem : AuditableEntity
{
    public Guid CatalogId { get; set; }
    public Catalog? Catalog { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>FK auto-referencial: ciudad → país, nacionalidad → país, etc.</summary>
    public Guid? ParentItemId { get; set; }
    public CatalogItem? ParentItem { get; set; }
    /// <summary>Usado principalmente en catálogo CLUBES: país del club (texto libre legacy).</summary>
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? League { get; set; }
}

public class DataSource : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string Reliability { get; set; } = "Media";
    public bool IsActive { get; set; } = true;
}

public class Country : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Nationality { get; set; }
    public string? FifaCode { get; set; }
    public string? Iso2Code { get; set; }
    public bool IsActive { get; set; } = true;
}

public class City : AuditableEntity
{
    public Guid CountryId { get; set; }
    public Country? Country { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? RegionDepartment { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CompetitiveCategory : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public int? Level { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Competition : AuditableEntity
{
    public Guid CountryId { get; set; }
    public Country? Country { get; set; }
    public Guid CompetitiveCategoryId { get; set; }
    public CompetitiveCategory? CompetitiveCategory { get; set; }
    public Guid? DataSourceId { get; set; }
    public DataSource? DataSource { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public int? DivisionLevel { get; set; }
    public bool IsProfessional { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Club : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CountryId { get; set; }
    public Country? Country { get; set; }
    public Guid? CityId { get; set; }
    public City? City { get; set; }
    public Guid? DataSourceId { get; set; }
    public DataSource? DataSource { get; set; }
    public string? ShortName { get; set; }
    public string? CrestUrl { get; set; }
    public string? ApiProvider { get; set; }
    public string? ApiTeamId { get; set; }
    public string ValidationStatus { get; set; } = "pendiente";
    public bool IsActive { get; set; } = true;
}

public class ClubCompetitionSeason : AuditableEntity
{
    public Guid ClubId { get; set; }
    public Club? Club { get; set; }
    public Guid CompetitionId { get; set; }
    public Competition? Competition { get; set; }
    public Guid? DataSourceId { get; set; }
    public DataSource? DataSource { get; set; }
    public string Season { get; set; } = string.Empty;
    public string Status { get; set; } = "activo";
    public DateTime LastUpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class PlayerMatchStat : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public DateOnly MatchDate { get; set; }
    public string Opponent { get; set; } = string.Empty;
    public int MinutesPlayed { get; set; }
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int YellowCards { get; set; }
    public int RedCards { get; set; }
    public decimal Rating { get; set; }
    public string PhysicalStatus { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

/// <summary>Paso del jugador por un club en un año determinado.</summary>
public class PlayerClubHistory : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    public string ClubName { get; set; } = string.Empty;
    /// <summary>PrimeraDivision, SegundaDivision, Reserva, Sub19, etc.</summary>
    public string Category { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Notes { get; set; }
}

/// <summary>Títulos ganados o participaciones en torneos internacionales.</summary>
public class PlayerSportingAchievement : AuditableEntity
{
    public Guid PlayerId { get; set; }
    public Player? Player { get; set; }
    /// <summary>TituloTorneo | ParticipacionInternacional</summary>
    public string AchievementType { get; set; } = string.Empty;
    public string TournamentName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Notes { get; set; }
}
