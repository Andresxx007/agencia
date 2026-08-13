using System.Text.Json.Serialization;

namespace FortisSports.Application.Contracts;

public record AuthRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password);
public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc, string FullName, string Email);
public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems);

public record PlayerCreateRequest(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Nationality,
    string MainPosition,
    string? CurrentClub,
    decimal? HeightCm,
    decimal? WeightKg,
    string? PreferredFoot,
    string? Notes,
    string? IdCardNumber,
    string? City,
    string? Address,
    string? Email,
    string? PhoneNumber,
    int? JerseyNumber);
public record PlayerUpdateRequest(
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Nationality,
    string MainPosition,
    string? CurrentClub,
    decimal? HeightCm,
    decimal? WeightKg,
    string? PreferredFoot,
    string AgencyStatus,
    string ContractStatus,
    bool IsVisible,
    string? Notes,
    string? IdCardNumber,
    string? City,
    string? Address,
    string? Email,
    string? PhoneNumber,
    int? JerseyNumber);

public record PlayerResponse(
    Guid Id,
    string FirstName,
    string LastName,
    DateOnly BirthDate,
    string Nationality,
    string MainPosition,
    string? CurrentClub,
    decimal? HeightCm,
    decimal? WeightKg,
    string? PreferredFoot,
    string AgencyStatus,
    string ContractStatus,
    bool IsVisible,
    string? Notes,
    string? PhotoUrl,
    string? IdCardNumber,
    string? City,
    string? Address,
    string? Email,
    string? PhoneNumber,
    int? JerseyNumber);

public record GenerateContractRequest(Guid PlayerId, int? DurationYears);
public record ContractResponse(Guid Id, Guid PlayerId, DateOnly IssuedAt, DateOnly StartDate, DateOnly EndDate, string Status, int Version);
public record ContractGenerateResult(ContractResponse Contract, byte[] PdfBytes, string DownloadFileName);

public record UploadPlayerDocumentRequest(Guid PlayerId, string DocumentType, string Description, DateOnly? IssuedAt, DateOnly? ExpirationDate, string? RelatedClub, string Status, Guid? TransferId = null);
public record PlayerDocumentResponse(Guid Id, Guid PlayerId, string DocumentType, string Description, string OriginalFileName, string Status, DateOnly? ExpirationDate);
public record NegotiationCreateRequest(
    Guid PlayerId,
    string ClubName,
    decimal MonthlyAmount,
    int InstallmentsPerYear,
    int ContractYears,
    string Currency,
    DateOnly OfferDate,
    bool HasHousingBonus,
    string? HousingBonusNotes,
    bool HasObjectiveBonus,
    string? ObjectiveBonusNotes,
    bool HasGoalBonus,
    string? GoalBonusNotes,
    bool HasSigningBonus,
    string? SigningBonusNotes,
    string? ResponsibleName = null,
    string? Conditions = null);
public record NegotiationUpdateRequest(
    string ClubName,
    decimal MonthlyAmount,
    int InstallmentsPerYear,
    int ContractYears,
    string Currency,
    bool HasHousingBonus,
    string? HousingBonusNotes,
    bool HasObjectiveBonus,
    string? ObjectiveBonusNotes,
    bool HasGoalBonus,
    string? GoalBonusNotes,
    bool HasSigningBonus,
    string? SigningBonusNotes);
public record NegotiationResponse(
    Guid Id,
    Guid PlayerId,
    string ClubName,
    decimal OfferedAmount,
    decimal MonthlyAmount,
    int InstallmentsPerYear,
    int ContractYears,
    string Currency,
    string Status,
    string ResponsibleName,
    DateOnly OfferDate,
    bool HasHousingBonus,
    string? HousingBonusNotes,
    bool HasObjectiveBonus,
    string? ObjectiveBonusNotes,
    bool HasGoalBonus,
    string? GoalBonusNotes,
    bool HasSigningBonus,
    string? SigningBonusNotes,
    string? PlayerFullName = null,
    string? Conditions = null,
    int CurrentVersionNumber = 1);
public record NegotiationOfferVersionRegisterRequest(
    string ProposedBy,
    string? Notes,
    string ClubName,
    decimal MonthlyAmount,
    int InstallmentsPerYear,
    int ContractYears,
    bool HasHousingBonus,
    string? HousingBonusNotes,
    bool HasObjectiveBonus,
    string? ObjectiveBonusNotes,
    bool HasGoalBonus,
    string? GoalBonusNotes,
    bool HasSigningBonus,
    string? SigningBonusNotes,
    string Currency,
    DateOnly? OfferDate);
public record NegotiationOfferVersionResponse(
    Guid Id,
    Guid NegotiationId,
    int VersionNumber,
    string ProposedBy,
    string ProposedByLabel,
    string? Notes,
    string ClubName,
    decimal MonthlyAmount,
    int InstallmentsPerYear,
    int ContractYears,
    bool HasHousingBonus,
    string HousingBonusNotes,
    bool HasObjectiveBonus,
    string ObjectiveBonusNotes,
    bool HasGoalBonus,
    string GoalBonusNotes,
    bool HasSigningBonus,
    string SigningBonusNotes,
    string Currency,
    DateOnly OfferDate,
    string ConditionsSummary,
    DateTime RegisteredAtUtc,
    string RegisteredBy);
public record NegotiationStatusUpdateRequest(string Status);
public record NegotiationInteractionCreateRequest(Guid NegotiationId, string InteractionType, string Summary, string NextStep, string UpdatedStatus);
public record NegotiationInteractionResponse(Guid Id, Guid NegotiationId, DateTime InteractionAtUtc, string InteractionType, string Summary, string NextStep, string UpdatedStatus);
public record NegotiationConversationCreateRequest(
    string ClubName,
    string ConversationType,
    string? Subject,
    string Content,
    string? Participants,
    DateTime? OccurredAtUtc);
public record NegotiationConversationResponse(
    Guid Id,
    Guid PlayerId,
    Guid? NegotiationId,
    string ConversationType,
    string ConversationTypeLabel,
    string? Subject,
    string Content,
    string? Participants,
    DateTime OccurredAtUtc,
    string CreatedBy,
    DateTime CreatedAtUtc,
    string? ClubName = null,
    string? PlayerFullName = null,
    string? NegotiationStatus = null);
public record TransferCreateRequest(Guid PlayerId, string OriginClub, string DestinationClub, DateOnly TransferDate, decimal? Amount, string Currency, string TransferType, string Conditions, string ManagedBy);
public record TransferUpdateRequest(string OriginClub, string DestinationClub, DateOnly TransferDate, decimal? Amount, string Currency, string TransferType, string Conditions, string ManagedBy);
public record TransferResponse(Guid Id, Guid PlayerId, string OriginClub, string DestinationClub, DateOnly TransferDate, decimal? Amount, string Currency, string TransferType, string Status, string ManagedBy, Guid? ClubContractDocumentId);
public record NotificationResponse(Guid Id, string Title, string Message, string Priority, bool IsRead, DateTime CreatedAtUtc);
public record AuditLogResponse(Guid Id, string EntityName, string Action, string? EntityId, string ChangesSummary, string? CreatedBy, DateTime ActionAtUtc);
public record CatalogCreateRequest(string Code, string Name, string Description);
public record CatalogItemCreateRequest(
    Guid CatalogId,
    string Code,
    string Name,
    int SortOrder,
    string? Country = null,
    string? City = null,
    string? League = null,
    Guid? ParentItemId = null);
public record CatalogResponse(Guid Id, string Code, string Name, string Description, bool IsActive);
public record CatalogItemResponse(
    Guid Id,
    Guid CatalogId,
    string Code,
    string Name,
    int SortOrder,
    bool IsActive,
    string? Country,
    string? City,
    string? League,
    Guid? ParentItemId = null);
public record DataSourceCreateRequest(string Name, string Type, string? Url, string Reliability = "Media");
public record DataSourceResponse(Guid Id, string Name, string Type, string? Url, string Reliability, bool IsActive);
public record CountryCreateRequest(string Name, string? Nationality, string? FifaCode, string? Iso2Code);
public record CountryResponse(Guid Id, string Name, string? Nationality, string? FifaCode, string? Iso2Code, bool IsActive);
public record CityCreateRequest(Guid CountryId, string Name, string? RegionDepartment);
public record CityResponse(Guid Id, Guid CountryId, string CountryName, string Name, string? RegionDepartment, bool IsActive);
public record CompetitiveCategoryCreateRequest(string Name, int? Level, string? Description);
public record CompetitiveCategoryResponse(Guid Id, string Name, int? Level, string? Description, bool IsActive);
public record CompetitionCreateRequest(Guid CountryId, Guid CompetitiveCategoryId, string Name, string Season, int? DivisionLevel, bool IsProfessional, Guid? DataSourceId);
public record CompetitionResponse(
    Guid Id,
    Guid CountryId,
    string CountryName,
    Guid CompetitiveCategoryId,
    string CompetitiveCategoryName,
    string Name,
    string Season,
    int? DivisionLevel,
    bool IsProfessional,
    Guid? DataSourceId,
    string? DataSourceName,
    bool IsActive);
public record ClubCreateRequest(
    string Name,
    Guid CountryId,
    Guid? CityId,
    string? ShortName,
    string? CrestUrl,
    string? ApiProvider,
    string? ApiTeamId,
    Guid? DataSourceId,
    string? ValidationStatus,
    Guid CompetitionId,
    string Season,
    string? CompetitionStatus);
public record ClubUpdateRequest(
    string Name,
    Guid CountryId,
    Guid? CityId,
    string? ShortName,
    string? CrestUrl,
    string? ApiProvider,
    string? ApiTeamId,
    Guid? DataSourceId,
    string? ValidationStatus,
    bool IsActive);
public record ClubResponse(
    Guid Id,
    string Name,
    Guid CountryId,
    string CountryName,
    Guid? CityId,
    string? CityName,
    string? ShortName,
    string? CrestUrl,
    string? ApiProvider,
    string? ApiTeamId,
    Guid? DataSourceId,
    string? DataSourceName,
    string ValidationStatus,
    bool IsActive);
public record CompetitionClubResponse(
    Guid ClubCompetitionSeasonId,
    Guid ClubId,
    string ClubName,
    string? CityName,
    string Season,
    string Status,
    string ValidationStatus,
    bool IsActive);
public record ClubValidationStatusUpdateRequest(string ValidationStatus);
public record DashboardReportResponse(int TotalPlayers, int ActiveNegotiations, int ActiveTransfers, int ContractsExpiringSoon, int UnreadNotifications);
public record ContractsReportResponse(int Vigentes, int Vencidos, int ProximosAVencer);
public record NegotiationsReportResponse(int EnAnalisis, int EnNegociacion, int PendienteFirma, int Completadas, int Canceladas);
public record TransfersReportResponse(int EnAnalisis, int EnNegociacion, int PendienteFirma, int Completadas, int Canceladas);
public record RankingPlayerResponse(Guid PlayerId, string FullName, string MainPosition, string? CurrentClub, decimal Score);
public record CompatibilityRequest(string TargetPosition, int MinAge, int MaxAge, decimal WeightPosition, decimal WeightAge, decimal WeightContract, decimal WeightActivity);
public record CompatibilityResponse(Guid PlayerId, string FullName, decimal CompatibilityScore, string Explanation);
public record PlayerMatchStatCreateRequest(Guid PlayerId, DateOnly MatchDate, string Opponent, int MinutesPlayed, int Goals, int Assists, int YellowCards, int RedCards, decimal Rating, string PhysicalStatus, string Notes);
public record PlayerMatchStatResponse(Guid Id, Guid PlayerId, DateOnly MatchDate, string Opponent, int MinutesPlayed, int Goals, int Assists, int YellowCards, int RedCards, decimal Rating, string PhysicalStatus, string Notes);

public record PlayerClubHistoryCreateRequest(Guid PlayerId, string ClubName, string Category, int Year, string? Notes);
public record PlayerClubHistoryUpdateRequest(string ClubName, string Category, int Year, string? Notes);
public record PlayerClubHistoryResponse(Guid Id, Guid PlayerId, string ClubName, string Category, int Year, string? Notes);

public record PlayerSportingAchievementCreateRequest(Guid PlayerId, string AchievementType, string TournamentName, string Country, int Year, string? Notes);
public record PlayerSportingAchievementUpdateRequest(string AchievementType, string TournamentName, string Country, int Year, string? Notes);
public record PlayerSportingAchievementResponse(Guid Id, Guid PlayerId, string AchievementType, string TournamentName, string Country, int Year, string? Notes);

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(AuthRequest request, CancellationToken cancellationToken);
    Task SeedAdminAsync(CancellationToken cancellationToken);
}

public record BulkImportResult(int Created, int Skipped, IReadOnlyList<string> Errors);

public interface IPlayerService
{
    Task<PlayerResponse> CreateAsync(PlayerCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<PagedResult<PlayerResponse>> GetAllAsync(string? search, string? status, string? position, string? nationality, int? minAge, int? maxAge, string? preferredFoot, bool onlyVisible, int page, int pageSize, CancellationToken cancellationToken);
    Task<PlayerResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PlayerResponse> UpdateAsync(Guid id, PlayerUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task<PlayerResponse> UploadPhotoAsync(Guid playerId, Stream fileStream, string contentType, string fileExtension, string actor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> GenerateCurriculumPdfAsync(Guid playerId, CancellationToken cancellationToken);
    Task<BulkImportResult> BulkImportAsync(Stream csvStream, string actor, CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> GenerateFullReportPdfAsync(Guid playerId, CancellationToken cancellationToken);
}

public interface IContractService
{
    Task<ContractGenerateResult> GenerateAsync(GenerateContractRequest request, string actor, CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName)> GenerateRepresentationPdfAsync(Guid playerId, int? durationYears, CancellationToken cancellationToken);
    Task<IReadOnlyList<ContractResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName)?> DownloadAsync(Guid contractId, CancellationToken cancellationToken);
}

public interface IDocumentService
{
    Task<PlayerDocumentResponse> UploadAsync(UploadPlayerDocumentRequest request, Stream stream, string originalFileName, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlayerDocumentResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId, CancellationToken cancellationToken);
}

public interface INegotiationService
{
    Task<NegotiationResponse> CreateAsync(NegotiationCreateRequest request, string actorEmail, string? actorDisplayName, CancellationToken cancellationToken);
    Task<IReadOnlyList<NegotiationResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<PagedResult<NegotiationResponse>> GetPagedAsync(string? status, string? club, int page, int pageSize, CancellationToken cancellationToken);
    Task<NegotiationResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<NegotiationResponse> UpdateAsync(Guid id, NegotiationUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task<NegotiationResponse> UpdateStatusAsync(Guid id, string status, string actor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken);
    Task<NegotiationInteractionResponse> AddInteractionAsync(NegotiationInteractionCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<NegotiationInteractionResponse>> GetInteractionsAsync(Guid negotiationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<NegotiationConversationResponse>> GetConversationsAsync(Guid negotiationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<NegotiationConversationResponse>> GetConversationsByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<NegotiationConversationResponse> AddConversationAsync(Guid negotiationId, NegotiationConversationCreateRequest request, string actorEmail, string? actorDisplayName, CancellationToken cancellationToken);
    Task<NegotiationConversationResponse> AddConversationForPlayerAsync(Guid playerId, NegotiationConversationCreateRequest request, string actorEmail, string? actorDisplayName, CancellationToken cancellationToken);
    Task DeleteConversationAsync(Guid conversationId, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<NegotiationOfferVersionResponse>> GetOfferVersionsAsync(Guid negotiationId, CancellationToken cancellationToken);
    Task<NegotiationResponse> RegisterOfferVersionAsync(Guid negotiationId, NegotiationOfferVersionRegisterRequest request, string actorEmail, string? actorDisplayName, CancellationToken cancellationToken);
}

public interface ITransferService
{
    Task<TransferResponse> CreateAsync(TransferCreateRequest request, string actor, CancellationToken cancellationToken, Stream? clubContractStream = null, string? clubContractFileName = null);
    Task<IReadOnlyList<TransferResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<PagedResult<TransferResponse>> GetPagedAsync(Guid? playerId, string? club, string? transferType, int page, int pageSize, CancellationToken cancellationToken);
    Task<TransferResponse> UpdateAsync(Guid id, TransferUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task<TransferResponse> UpdateStatusAsync(Guid transferId, string status, string actor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken);
}

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken);
    Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken);
    Task<int> GetUnreadCountAsync(CancellationToken cancellationToken);
}

public interface IAuditService
{
    Task<PagedResult<AuditLogResponse>> GetFilteredAsync(string? entityName, string? action, string? createdBy, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken cancellationToken);
}

public record UserResponse(string Id, string Email, string FullName, bool IsActive, IReadOnlyList<string> Roles);
public record CreateUserRequest(string Email, string FullName, string Password, string Role);
public record ChangeUserRoleRequest(string Role);

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetAllAsync(CancellationToken cancellationToken);
    Task<UserResponse> CreateAsync(CreateUserRequest request, string actor, CancellationToken cancellationToken);
    Task ChangeRoleAsync(string userId, ChangeUserRoleRequest request, string actor, CancellationToken cancellationToken);
    Task DeactivateAsync(string userId, string actor, CancellationToken cancellationToken);
}

public interface ICatalogService
{
    Task<CatalogResponse> CreateCatalogAsync(CatalogCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CatalogResponse>> GetCatalogsAsync(CancellationToken cancellationToken);
    Task<CatalogItemResponse> CreateItemAsync(CatalogItemCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CatalogItemResponse>> GetItemsAsync(Guid catalogId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CatalogItemResponse>> GetItemsByCodeAsync(string catalogCode, CancellationToken cancellationToken);
    Task<IReadOnlyList<CatalogItemResponse>> GetItemsByCodeAndParentAsync(string catalogCode, Guid? parentItemId, CancellationToken cancellationToken);
    Task DeleteItemAsync(Guid itemId, string actor, CancellationToken cancellationToken);
}

public interface ISportsStructureService
{
    Task<IReadOnlyList<CountryResponse>> GetCountriesAsync(CancellationToken cancellationToken);
    Task<CountryResponse> CreateCountryAsync(CountryCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CityResponse>> GetCitiesByCountryAsync(Guid countryId, CancellationToken cancellationToken);
    Task<CityResponse> CreateCityAsync(CityCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CompetitiveCategoryResponse>> GetCompetitiveCategoriesAsync(CancellationToken cancellationToken);
    Task<CompetitiveCategoryResponse> CreateCompetitiveCategoryAsync(CompetitiveCategoryCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CompetitionResponse>> GetCompetitionsByCountryAsync(Guid countryId, string? season, CancellationToken cancellationToken);
    Task<CompetitionResponse> CreateCompetitionAsync(CompetitionCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<CompetitionClubResponse>> GetClubsByCompetitionAsync(Guid competitionId, string? season, CancellationToken cancellationToken);
    Task<ClubResponse> CreateClubAsync(ClubCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<ClubResponse> UpdateClubAsync(Guid id, ClubUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task<ClubResponse> UpdateClubValidationStatusAsync(Guid id, ClubValidationStatusUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task DeleteClubAsync(Guid id, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<DataSourceResponse>> GetDataSourcesAsync(CancellationToken cancellationToken);
    Task<DataSourceResponse> CreateDataSourceAsync(DataSourceCreateRequest request, string actor, CancellationToken cancellationToken);
}

public interface IReportService
{
    Task<DashboardReportResponse> GetDashboardAsync(CancellationToken cancellationToken);
    Task<ContractsReportResponse> GetContractsAsync(CancellationToken cancellationToken);
    Task<NegotiationsReportResponse> GetNegotiationsAsync(CancellationToken cancellationToken);
    Task<TransfersReportResponse> GetTransfersAsync(CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> ExportContractsCsvAsync(CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> ExportNegotiationsCsvAsync(CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> ExportTransfersCsvAsync(CancellationToken cancellationToken);
    Task<(byte[] Content, string FileName, string ContentType)> ExportDashboardPdfAsync(CancellationToken cancellationToken);
}

public interface IIntelligenceService
{
    Task<IReadOnlyList<RankingPlayerResponse>> GetPlayerRankingAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<CompatibilityResponse>> GetCompatibilityAsync(CompatibilityRequest request, CancellationToken cancellationToken);
}

public interface IPlayerStatsService
{
    Task<PlayerMatchStatResponse> CreateAsync(PlayerMatchStatCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlayerMatchStatResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
}

public interface IPlayerClubHistoryService
{
    Task<PlayerClubHistoryResponse> CreateAsync(PlayerClubHistoryCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlayerClubHistoryResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<PlayerClubHistoryResponse> UpdateAsync(Guid id, PlayerClubHistoryUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken);
}

public interface IPlayerSportingAchievementService
{
    Task<PlayerSportingAchievementResponse> CreateAsync(PlayerSportingAchievementCreateRequest request, string actor, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlayerSportingAchievementResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken);
    Task<PlayerSportingAchievementResponse> UpdateAsync(Guid id, PlayerSportingAchievementUpdateRequest request, string actor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken);
}
