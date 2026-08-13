using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace FortisSports.Infrastructure.Services;

/// <summary>
/// Reemplaza marcadores de texto en un .docx (incluye encabezados y pies de página).
/// Une los fragmentos de cada párrafo para cubrir placeholders partidos entre runs.
/// </summary>
public static class DocxPlaceholderReplacer
{
    public static void Aplicar(string docxPath, IReadOnlyDictionary<string, string> reemplazos)
    {
        using var doc = WordprocessingDocument.Open(docxPath, true);
        var main = doc.MainDocumentPart;
        if (main is null)
            return;

        if (main.Document?.Body is not null)
        {
            foreach (var parrafo in main.Document.Body.Descendants<Paragraph>())
                ReemplazarEnParrafo(parrafo, reemplazos);
            main.Document.Save();
        }

        foreach (var header in main.HeaderParts)
        {
            foreach (var parrafo in header.Header.Descendants<Paragraph>())
                ReemplazarEnParrafo(parrafo, reemplazos);
            header.Header.Save();
        }

        foreach (var footer in main.FooterParts)
        {
            foreach (var parrafo in footer.Footer.Descendants<Paragraph>())
                ReemplazarEnParrafo(parrafo, reemplazos);
            footer.Footer.Save();
        }
    }

    private static void ReemplazarEnParrafo(Paragraph parrafo, IReadOnlyDictionary<string, string> reemplazos)
    {
        var textos = parrafo.Descendants<Text>().ToList();
        if (textos.Count == 0)
            return;

        var combinado = string.Concat(textos.Select(t => t.Text));
        var actualizado = combinado;
        foreach (var par in reemplazos)
            actualizado = actualizado.Replace(par.Key, par.Value ?? string.Empty, StringComparison.Ordinal);

        if (actualizado == combinado)
            return;

        textos[0].Text = actualizado;
        textos[0].Space = SpaceProcessingModeValues.Preserve;
        for (var i = 1; i < textos.Count; i++)
            textos[i].Text = string.Empty;

        if (textos[0].Parent is Run runPrincipal)
            AplicarEstiloCuerpo(runPrincipal, parrafo);
    }

    private static void AplicarEstiloCuerpo(Run runDestino, Paragraph parrafo)
    {
        var referencia = parrafo.Descendants<Run>()
            .Select(r => r.RunProperties)
            .FirstOrDefault(rp => rp?.RunFonts is not null && rp.GetFirstChild<Bold>() is null);

        referencia ??= parrafo.Descendants<Run>()
            .Where(r => r.InnerText.Contains("mayor", StringComparison.OrdinalIgnoreCase)
                || r.InnerText.Contains("FORTIS", StringComparison.OrdinalIgnoreCase))
            .Select(r => r.RunProperties)
            .FirstOrDefault();

        if (referencia is null)
            return;

        var clon = (RunProperties)referencia.CloneNode(true);
        clon.RemoveAllChildren<Highlight>();
        clon.RemoveAllChildren<Bold>();
        clon.RemoveAllChildren<BoldComplexScript>();
        runDestino.RunProperties = clon;
    }
}
