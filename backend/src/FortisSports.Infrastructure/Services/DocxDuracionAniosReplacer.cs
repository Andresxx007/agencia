using System.Text.RegularExpressions;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Wordprocessing;

namespace FortisSports.Infrastructure.Services;

/// <summary>
/// Actualiza la cláusula QUINTA (duración) con los años indicados, conservando la fuente del párrafo.
/// </summary>
public static class DocxDuracionAniosReplacer
{
    public static void Aplicar(string docxPath, int duracionAnios)
    {
        if (duracionAnios < 1 || duracionAnios > 30)
            duracionAnios = 2;

        using var doc = DocumentFormat.OpenXml.Packaging.WordprocessingDocument.Open(docxPath, true);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body is null)
            return;

        foreach (var parrafo in body.Descendants<Paragraph>())
        {
            var texto = string.Concat(parrafo.Descendants<Text>().Select(t => t.Text));
            if (!texto.Contains("duración del presente contrato", StringComparison.OrdinalIgnoreCase))
                continue;

            ActualizarParrafo(parrafo, duracionAnios);
        }

        doc.MainDocumentPart?.Document?.Save();
    }

    private static void ActualizarParrafo(Paragraph parrafo, int duracionAnios)
    {
        var palabra = AniosEnPalabras(duracionAnios);
        var runs = parrafo.Descendants<Run>().ToList();
        var actualizado = false;

        foreach (var run in runs)
        {
            foreach (var textNode in run.Descendants<Text>().ToList())
            {
                var valor = textNode.Text;
                if (string.IsNullOrEmpty(valor))
                    continue;

                if (EsPalabraCantidadAnios(valor))
                {
                    textNode.Text = palabra;
                    actualizado = true;
                    continue;
                }

                if (Regex.IsMatch(valor, @"^\d+$"))
                {
                    textNode.Text = duracionAnios.ToString();
                    actualizado = true;
                }
            }
        }

        var runAño = runs.SelectMany(r => r.Descendants<Text>())
            .FirstOrDefault(t => t.Text.Contains("año", StringComparison.OrdinalIgnoreCase));
        if (runAño is not null)
        {
            if (duracionAnios == 1)
            {
                runAño.Text = ") año";
                var runS = runs.SelectMany(r => r.Descendants<Text>())
                    .FirstOrDefault(t => t.Text == "s");
                if (runS is not null)
                    runS.Text = string.Empty;
            }
            else if (runAño.Text.Contains(')'))
            {
                runAño.Text = ") año";
            }
        }

        if (!actualizado)
        {
            var texto = string.Concat(parrafo.Descendants<Text>().Select(t => t.Text));
            var nuevo = Regex.Replace(
                texto,
                @"\w+\s*\(\s*\d+\s*\)\s*años?",
                $"{palabra} ({duracionAnios}) {(duracionAnios == 1 ? "año" : "años")}",
                RegexOptions.IgnoreCase);

            if (nuevo != texto)
                ReemplazarTextoParrafo(parrafo, nuevo);
        }
    }

    private static void ReemplazarTextoParrafo(Paragraph parrafo, string textoNuevo)
    {
        var textos = parrafo.Descendants<Text>().ToList();
        if (textos.Count == 0)
            return;

        textos[0].Text = textoNuevo;
        textos[0].Space = SpaceProcessingModeValues.Preserve;
        for (var i = 1; i < textos.Count; i++)
            textos[i].Text = string.Empty;
    }

    private static bool EsPalabraCantidadAnios(string valor) =>
        valor is "uno" or "dos" or "tres" or "cuatro" or "cinco" or "seis" or "siete" or "ocho" or "nueve" or "diez"
        or "once" or "doce" or "trece" or "catorce" or "quince" or "dieciséis" or "dieciseis" or "diecisiete"
        or "dieciocho" or "diecinueve" or "veinte" or "veintiuno" or "veintidós" or "veintidos" or "veintitrés"
        or "veintitres" or "veinticuatro" or "veinticinco" or "veintiséis" or "veintiseis" or "veintisiete"
        or "veintiocho" or "veintinueve" or "treinta";

    public static string AniosEnPalabras(int n) => n switch
    {
        1 => "uno",
        2 => "dos",
        3 => "tres",
        4 => "cuatro",
        5 => "cinco",
        6 => "seis",
        7 => "siete",
        8 => "ocho",
        9 => "nueve",
        10 => "diez",
        11 => "once",
        12 => "doce",
        13 => "trece",
        14 => "catorce",
        15 => "quince",
        16 => "dieciséis",
        17 => "diecisiete",
        18 => "dieciocho",
        19 => "diecinueve",
        20 => "veinte",
        21 => "veintiuno",
        22 => "veintidós",
        23 => "veintitrés",
        24 => "veinticuatro",
        25 => "veinticinco",
        26 => "veintiséis",
        27 => "veintisiete",
        28 => "veintiocho",
        29 => "veintinueve",
        30 => "treinta",
        _ => n.ToString(),
    };
}
