using FortisSports.Domain.Entities;
using Microsoft.Extensions.Hosting;

namespace FortisSports.Infrastructure.Services;

/// <summary>
/// Rellena la plantilla Word de contrato de representación FORTIS y genera PDF tamaño carta
/// (Open XML + LibreOffice, sin límite de páginas).
/// </summary>
public class ContratoRepresentacionGenerator
{
    private readonly string _templatePath;
    private readonly LibreOfficePdfConverter _pdfConverter;

    public ContratoRepresentacionGenerator(IHostEnvironment hostEnvironment, LibreOfficePdfConverter pdfConverter)
    {
        _templatePath = Path.Combine(hostEnvironment.ContentRootPath, "Templates", "ModeloContratoRepresentacionFortis.docx");
        _pdfConverter = pdfConverter;
    }

    public async Task<byte[]> GenerarPdfAsync(Player player, int duracionAnios = 2, CancellationToken cancellationToken = default)
    {
        if (!File.Exists(_templatePath))
            throw new FileNotFoundException(
                "No se encontró la plantilla del contrato. Coloque ModeloContratoRepresentacionFortis.docx en la carpeta Templates de la API.",
                _templatePath);

        var reemplazos = ConstruirReemplazos(player);
        var trabajo = Path.Combine(Path.GetTempPath(), $"fortis_contrato_{player.Id:N}_{Guid.NewGuid():N}");
        Directory.CreateDirectory(trabajo);
        var docxTemporal = Path.Combine(trabajo, "contrato.docx");

        try
        {
            File.Copy(_templatePath, docxTemporal, true);
            DocxPlaceholderReplacer.Aplicar(docxTemporal, reemplazos);
            DocxDuracionAniosReplacer.Aplicar(docxTemporal, duracionAnios);
            var nombreCompleto = $"{player.FirstName} {player.LastName}".Trim();
            DocxContratoFormatter.Normalizar(docxTemporal, nombreCompleto);
            var pdfTemporal = await _pdfConverter.ConvertirDocxAPdfAsync(docxTemporal, trabajo, cancellationToken);
            return await File.ReadAllBytesAsync(pdfTemporal, cancellationToken);
        }
        finally
        {
            try
            {
                if (Directory.Exists(trabajo))
                    Directory.Delete(trabajo, recursive: true);
            }
            catch
            {
                /* ignorar limpieza */
            }
        }
    }

    public static void ValidarDatosMinimos(Player player)
    {
        if (string.IsNullOrWhiteSpace(player.FirstName) || string.IsNullOrWhiteSpace(player.LastName))
            throw new InvalidOperationException("El jugador debe tener nombre y apellido.");
        if (string.IsNullOrWhiteSpace(player.IdCardNumber))
            throw new InvalidOperationException("Registre el número de carnet del jugador antes de generar el contrato.");
        if (player.BirthDate == default)
            throw new InvalidOperationException("Registre la fecha de nacimiento del jugador.");
    }

    private static Dictionary<string, string> ConstruirReemplazos(Player player)
    {
        var ahora = ObtenerFechaBolivia();
        var nombreCompleto = $"{player.FirstName} {player.LastName}".Trim();
        var nacimiento = player.BirthDate;
        var carnet = player.IdCardNumber?.Trim() ?? string.Empty;
        var ciudad = player.City?.Trim() ?? string.Empty;
        var domicilio = player.Address?.Trim() ?? string.Empty;
        var correo = player.Email?.Trim() ?? string.Empty;
        var telefono = player.PhoneNumber?.Trim() ?? string.Empty;

        return new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["(Nombre del jugador)"] = nombreCompleto,
            ["(nombre completo del jugador)"] = nombreCompleto,
            ["(numero de carnet)"] = carnet,
            ["(numero de carnet del jugador)"] = carnet,
            ["(dia de nacimiento)"] = nacimiento.Day.ToString(),
            ["(mes de nacimiento)"] = MesEnEspanol(nacimiento.Month),
            ["(año de nacimiento)"] = nacimiento.Year.ToString(),
            ["(ano de nacimiento)"] = nacimiento.Year.ToString(),
            ["(ciudad de bolivia)"] = ciudad,
            ["(domicilio del jugador)"] = domicilio,
            ["(correo del jugador)"] = correo,
            ["(número del jugador)"] = telefono,
            ["(numero del jugador)"] = telefono,
            ["(dia de la fecha actual)"] = ahora.Day.ToString(),
            ["(mes actual)"] = MesEnEspanol(ahora.Month),
            ["(año actual)"] = ahora.Year.ToString(),
            ["(ano actual)"] = ahora.Year.ToString(),
        };
    }

    private static DateTime ObtenerFechaBolivia()
    {
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("America/La_Paz");
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
        catch
        {
            return DateTime.Now;
        }
    }

    private static string MesEnEspanol(int mes) => mes switch
    {
        1 => "enero",
        2 => "febrero",
        3 => "marzo",
        4 => "abril",
        5 => "mayo",
        6 => "junio",
        7 => "julio",
        8 => "agosto",
        9 => "septiembre",
        10 => "octubre",
        11 => "noviembre",
        12 => "diciembre",
        _ => string.Empty,
    };
}
