namespace FortisSports.Application.Contracts;

public static class AchievementTypes
{
    public const string TituloTorneo = "TituloTorneo";
    public const string ParticipacionInternacional = "ParticipacionInternacional";

    public static readonly string[] ValidTypes = [TituloTorneo, ParticipacionInternacional];

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return TituloTorneo;

        var trimmed = value.Trim();
        if (ValidTypes.Contains(trimmed, StringComparer.OrdinalIgnoreCase))
            return ValidTypes.First(t => t.Equals(trimmed, StringComparison.OrdinalIgnoreCase));

        return trimmed switch
        {
            "Titulo" or "Título" or "Campeon" or "Campeón" => TituloTorneo,
            "Participacion" or "Participación" or "Internacional" => ParticipacionInternacional,
            _ => TituloTorneo
        };
    }
}
