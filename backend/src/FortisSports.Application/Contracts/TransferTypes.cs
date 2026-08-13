namespace FortisSports.Application.Contracts;

public static class TransferTypes
{
    public const string Definitiva = "Definitiva";
    public const string Prestamo = "Prestamo";
    public const string Vendido = "Vendido";
    public const string StatusRegistrada = "Registrada";

    public static readonly HashSet<string> ValidTypes =
        new(StringComparer.OrdinalIgnoreCase) { Definitiva, Prestamo, Vendido };

    public static bool RequiresAmount(string transferType) =>
        string.Equals(transferType, Prestamo, StringComparison.OrdinalIgnoreCase)
        || string.Equals(transferType, Vendido, StringComparison.OrdinalIgnoreCase);

    public static string Normalize(string transferType)
    {
        if (string.Equals(transferType, Definitiva, StringComparison.OrdinalIgnoreCase)) return Definitiva;
        if (string.Equals(transferType, Prestamo, StringComparison.OrdinalIgnoreCase)) return Prestamo;
        if (string.Equals(transferType, Vendido, StringComparison.OrdinalIgnoreCase)) return Vendido;
        throw new InvalidOperationException("Tipo de transferencia no válido. Use: Definitiva, Prestamo o Vendido.");
    }

    public static void ValidateAmount(string transferType, decimal? amount)
    {
        var normalized = Normalize(transferType);
        if (!RequiresAmount(normalized))
        {
            if (amount is not null)
            {
                throw new InvalidOperationException("Las transferencias definitivas no llevan monto.");
            }
            return;
        }

        if (amount is < 0)
        {
            throw new InvalidOperationException("El monto no puede ser negativo.");
        }
    }
}
