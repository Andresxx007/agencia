namespace FortisSports.Application.Contracts;

public static class ClubHistoryCategories
{
    public const string PrimeraDivision = "PrimeraDivision";
    public const string SegundaDivision = "SegundaDivision";
    public const string Reserva = "Reserva";
    public const string Sub20 = "Sub20";
    public const string Sub19 = "Sub19";
    public const string Sub17 = "Sub17";
    public const string Sub16 = "Sub16";
    public const string Sub15 = "Sub15";
    public const string Sub14 = "Sub14";
    public const string Sub13 = "Sub13";
    public const string Formativa = "Formativa";

    public static readonly string[] ValidCategories =
    [
        PrimeraDivision, SegundaDivision, Reserva,
        Sub20, Sub19, Sub17, Sub16, Sub15, Sub14, Sub13,
        Formativa
    ];

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return PrimeraDivision;

        var trimmed = value.Trim();
        if (ValidCategories.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
            return ValidCategories.First(c => c.Equals(trimmed, StringComparison.OrdinalIgnoreCase));

        return trimmed.ToLowerInvariant() switch
        {
            "primera" or "primera division" or "primera división" or "1ra" => PrimeraDivision,
            "segunda" or "segunda division" or "segunda división" or "2da" => SegundaDivision,
            "reserva" or "equipo reserva" => Reserva,
            "sub-20" or "sub20" or "u20" => Sub20,
            "sub-19" or "sub19" or "u19" => Sub19,
            "sub-17" or "sub17" or "u17" => Sub17,
            "sub-16" or "sub16" or "u16" => Sub16,
            "sub-15" or "sub15" or "u15" => Sub15,
            "sub-14" or "sub14" or "u14" => Sub14,
            "sub-13" or "sub13" or "u13" => Sub13,
            "formativa" or "juvenil" or "inferiores" => Formativa,
            _ => PrimeraDivision
        };
    }
}
