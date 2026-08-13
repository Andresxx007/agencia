using FluentValidation;
using FortisSports.Application.Contracts;

namespace FortisSports.Api.Validation;

/// <summary>
/// Validadores FluentValidation para DTOs de entrada (mensajes coherentes por campo).
/// </summary>
public class PlayerCreateRequestValidator : AbstractValidator<PlayerCreateRequest>
{
    public PlayerCreateRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BirthDate).LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow));
        RuleFor(x => x.BirthDate).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-100)));
        RuleFor(x => x.Nationality).NotEmpty().MaximumLength(100);
        RuleFor(x => x.MainPosition).NotEmpty().MaximumLength(50);
        RuleFor(x => x.HeightCm).InclusiveBetween(120, 230).When(x => x.HeightCm.HasValue);
        RuleFor(x => x.WeightKg).InclusiveBetween(40, 150).When(x => x.WeightKg.HasValue);
        RuleFor(x => x.IdCardNumber).MaximumLength(60);
        RuleFor(x => x.City).MaximumLength(120);
        RuleFor(x => x.Address).MaximumLength(300);
        RuleFor(x => x.Email).MaximumLength(200).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
        RuleFor(x => x.JerseyNumber).InclusiveBetween(0, 99).When(x => x.JerseyNumber.HasValue);
    }
}

public class PlayerUpdateRequestValidator : AbstractValidator<PlayerUpdateRequest>
{
    public PlayerUpdateRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BirthDate).LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow));
        RuleFor(x => x.BirthDate).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-100)));
        RuleFor(x => x.Nationality).NotEmpty().MaximumLength(100);
        RuleFor(x => x.MainPosition).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AgencyStatus).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ContractStatus).NotEmpty().MaximumLength(50);
        RuleFor(x => x.IdCardNumber).MaximumLength(60);
        RuleFor(x => x.City).MaximumLength(120);
        RuleFor(x => x.Address).MaximumLength(300);
        RuleFor(x => x.Email).MaximumLength(200).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
        RuleFor(x => x.JerseyNumber).InclusiveBetween(0, 99).When(x => x.JerseyNumber.HasValue);
    }
}

public class NegotiationCreateRequestValidator : AbstractValidator<NegotiationCreateRequest>
{
    public NegotiationCreateRequestValidator()
    {
        RuleFor(x => x.ClubName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.MonthlyAmount).GreaterThan(0);
        RuleFor(x => x.InstallmentsPerYear).InclusiveBetween(1, 24);
        RuleFor(x => x.ContractYears).InclusiveBetween(1, 15);
        RuleFor(x => x.Currency).NotEmpty().MaximumLength(10);
        RuleFor(x => x.ResponsibleName).MaximumLength(120).When(x => !string.IsNullOrWhiteSpace(x.ResponsibleName));
        RuleFor(x => x.HousingBonusNotes).MaximumLength(500).When(x => x.HasHousingBonus);
        RuleFor(x => x.ObjectiveBonusNotes).MaximumLength(500).When(x => x.HasObjectiveBonus);
        RuleFor(x => x.GoalBonusNotes).MaximumLength(500).When(x => x.HasGoalBonus);
        RuleFor(x => x.SigningBonusNotes).MaximumLength(500).When(x => x.HasSigningBonus);
    }
}

public class NegotiationUpdateRequestValidator : AbstractValidator<NegotiationUpdateRequest>
{
    public NegotiationUpdateRequestValidator()
    {
        RuleFor(x => x.ClubName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.MonthlyAmount).GreaterThan(0);
        RuleFor(x => x.InstallmentsPerYear).InclusiveBetween(1, 24);
        RuleFor(x => x.ContractYears).InclusiveBetween(1, 15);
        RuleFor(x => x.Currency).NotEmpty().MaximumLength(10);
        RuleFor(x => x.HousingBonusNotes).MaximumLength(500).When(x => x.HasHousingBonus);
        RuleFor(x => x.ObjectiveBonusNotes).MaximumLength(500).When(x => x.HasObjectiveBonus);
        RuleFor(x => x.GoalBonusNotes).MaximumLength(500).When(x => x.HasGoalBonus);
        RuleFor(x => x.SigningBonusNotes).MaximumLength(500).When(x => x.HasSigningBonus);
    }
}

public class NegotiationStatusUpdateRequestValidator : AbstractValidator<NegotiationStatusUpdateRequest>
{
  private static readonly string[] EstadosValidos =
  [
      "EnAnalisis",
      "NegociandoOferta",
      "NegociandoContraOferta",
      "NegociacionCompletada",
      "EnNegociacion",
      "PendienteFirma",
      "Completada"
  ];

    public NegotiationStatusUpdateRequestValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .Must(s => EstadosValidos.Contains(s.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("Estado no válido.");
    }
}

public class TransferCreateRequestValidator : AbstractValidator<TransferCreateRequest>
{
    public TransferCreateRequestValidator()
    {
        RuleFor(x => x.OriginClub).NotEmpty().MaximumLength(150);
        RuleFor(x => x.DestinationClub).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Currency).MaximumLength(10);
        RuleFor(x => x.TransferType)
            .NotEmpty()
            .Must(t => TransferTypes.ValidTypes.Contains(t))
            .WithMessage("Tipo inválido. Use: Definitiva, Prestamo o Vendido.");
        RuleFor(x => x.ManagedBy).MaximumLength(120);
    }
}

public class TransferUpdateRequestValidator : AbstractValidator<TransferUpdateRequest>
{
    public TransferUpdateRequestValidator()
    {
        RuleFor(x => x.OriginClub).NotEmpty().MaximumLength(150);
        RuleFor(x => x.DestinationClub).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Currency).MaximumLength(10);
        RuleFor(x => x.TransferType)
            .NotEmpty()
            .Must(t => TransferTypes.ValidTypes.Contains(t))
            .WithMessage("Tipo inválido. Use: Definitiva, Prestamo o Vendido.");
        RuleFor(x => x.ManagedBy).MaximumLength(120);
    }
}

public class CompatibilityRequestValidator : AbstractValidator<CompatibilityRequest>
{
    public CompatibilityRequestValidator()
    {
        RuleFor(x => x.TargetPosition).NotEmpty().MaximumLength(50);
        RuleFor(x => x.MinAge).InclusiveBetween(14, 50);
        RuleFor(x => x.MaxAge).InclusiveBetween(14, 50);
        RuleFor(x => x).Must(x => x.MaxAge >= x.MinAge).WithMessage("La edad máxima debe ser mayor o igual a la mínima.");
        RuleFor(x => x.WeightPosition).GreaterThan(0);
        RuleFor(x => x.WeightAge).GreaterThan(0);
        RuleFor(x => x.WeightContract).GreaterThan(0);
        RuleFor(x => x.WeightActivity).GreaterThan(0);
    }
}

public class PlayerMatchStatCreateRequestValidator : AbstractValidator<PlayerMatchStatCreateRequest>
{
    public PlayerMatchStatCreateRequestValidator()
    {
        RuleFor(x => x.Opponent).NotEmpty().MaximumLength(150);
        RuleFor(x => x.MinutesPlayed).InclusiveBetween(0, 120);
        RuleFor(x => x.Goals).InclusiveBetween(0, 20);
        RuleFor(x => x.Assists).InclusiveBetween(0, 20);
        RuleFor(x => x.Rating).InclusiveBetween(0, 10);
        RuleFor(x => x.PhysicalStatus).NotEmpty().MaximumLength(50);
    }
}

public class PlayerClubHistoryCreateRequestValidator : AbstractValidator<PlayerClubHistoryCreateRequest>
{
    public PlayerClubHistoryCreateRequestValidator()
    {
        RuleFor(x => x.ClubName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Category)
            .NotEmpty()
            .Must(c => ClubHistoryCategories.ValidCategories.Contains(ClubHistoryCategories.Normalize(c)))
            .WithMessage("Categoría inválida.");
        RuleFor(x => x.Year).InclusiveBetween(1950, DateTime.UtcNow.Year + 1);
    }
}

public class PlayerClubHistoryUpdateRequestValidator : AbstractValidator<PlayerClubHistoryUpdateRequest>
{
    public PlayerClubHistoryUpdateRequestValidator()
    {
        RuleFor(x => x.ClubName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Category)
            .NotEmpty()
            .Must(c => ClubHistoryCategories.ValidCategories.Contains(ClubHistoryCategories.Normalize(c)))
            .WithMessage("Categoría inválida.");
        RuleFor(x => x.Year).InclusiveBetween(1950, DateTime.UtcNow.Year + 1);
    }
}

public class PlayerSportingAchievementCreateRequestValidator : AbstractValidator<PlayerSportingAchievementCreateRequest>
{
    public PlayerSportingAchievementCreateRequestValidator()
    {
        RuleFor(x => x.TournamentName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Year).InclusiveBetween(1950, DateTime.UtcNow.Year + 1);
        RuleFor(x => x.AchievementType)
            .Must(t => AchievementTypes.ValidTypes.Contains(AchievementTypes.Normalize(t)))
            .WithMessage("Tipo inválido. Use TituloTorneo o ParticipacionInternacional.");
    }
}

public class PlayerSportingAchievementUpdateRequestValidator : AbstractValidator<PlayerSportingAchievementUpdateRequest>
{
    public PlayerSportingAchievementUpdateRequestValidator()
    {
        RuleFor(x => x.TournamentName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Country).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Year).InclusiveBetween(1950, DateTime.UtcNow.Year + 1);
        RuleFor(x => x.AchievementType)
            .Must(t => AchievementTypes.ValidTypes.Contains(AchievementTypes.Normalize(t)))
            .WithMessage("Tipo inválido. Use TituloTorneo o ParticipacionInternacional.");
    }
}
