using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace FortisSports.Infrastructure.Services;

/// <summary>
/// Quita resaltado, conserva la fuente del documento y aplica negrita en nombres, "EL JUGADOR" y etiquetas de contacto.
/// </summary>
public static class DocxContratoFormatter
{
    private const string MarcaElJugador = "EL JUGADOR";

    private static readonly string[] EtiquetasContacto =
    [
        "Domicilio:",
        "Correo Electrónico:",
        "Correo electrónico:",
        "Teléfono o celular:",
    ];

    public static void Normalizar(string docxPath, string nombreJugador)
    {
        if (string.IsNullOrWhiteSpace(nombreJugador))
            return;

        using var doc = WordprocessingDocument.Open(docxPath, true);
        var main = doc.MainDocumentPart;
        if (main?.Document?.Body is null)
            return;

        NormalizarElemento(main.Document.Body, nombreJugador.Trim());

        foreach (var header in main.HeaderParts)
        {
            NormalizarElemento(header.Header, nombreJugador.Trim());
            header.Header.Save();
        }

        foreach (var footer in main.FooterParts)
        {
            NormalizarElemento(footer.Footer, nombreJugador.Trim());
            footer.Footer.Save();
        }

        main.Document.Save();
    }

    private static void NormalizarElemento(OpenXmlElement raiz, string nombreJugador)
    {
        QuitarResaltados(raiz);

        foreach (var parrafo in raiz.Descendants<Paragraph>().ToList())
        {
            var texto = ObtenerTexto(parrafo);
            if (string.IsNullOrWhiteSpace(texto))
                continue;

            if (texto.Contains("denominado EL JUGADOR", StringComparison.OrdinalIgnoreCase)
                && texto.Contains(nombreJugador, StringComparison.OrdinalIgnoreCase))
            {
                FormatearClausulaJugador(parrafo, texto, nombreJugador);
                continue;
            }

            if (EsLineaNombreFirma(texto, nombreJugador))
            {
                FormatearLineaSoloNombre(parrafo, nombreJugador);
                continue;
            }

            if (EsLineaEtiquetaContacto(texto))
            {
                FormatearLineaEtiquetaValor(parrafo, texto);
                continue;
            }

            if (texto.TrimStart().StartsWith("C.I.", StringComparison.OrdinalIgnoreCase))
            {
                FormatearLineaTexto(parrafo, texto.Trim(), negrita: false);
                continue;
            }

            if (string.Equals(texto.Trim(), MarcaElJugador, StringComparison.OrdinalIgnoreCase))
                FormatearLineaTexto(parrafo, MarcaElJugador, negrita: true);
        }
    }

    private static bool EsLineaEtiquetaContacto(string texto)
    {
        var t = texto.TrimStart();
        return EtiquetasContacto.Any(e => t.StartsWith(e, StringComparison.OrdinalIgnoreCase));
    }

    private static void FormatearLineaEtiquetaValor(Paragraph parrafo, string texto)
    {
        var estilo = ObtenerEstiloCuerpo(parrafo);
        var indiceDosPuntos = texto.IndexOf(':');
        if (indiceDosPuntos < 0)
            return;

        var etiqueta = texto[..(indiceDosPuntos + 1)];
        var valor = texto[(indiceDosPuntos + 1)..];
        ReemplazarRuns(parrafo,
            CrearRun(etiqueta, estilo, negrita: true),
            CrearRun(valor, estilo, negrita: false));
    }

    private static void QuitarResaltados(OpenXmlElement raiz)
    {
        foreach (var resaltado in raiz.Descendants<Highlight>().ToList())
            resaltado.Remove();

        foreach (var sombreado in raiz.Descendants<Shading>().ToList())
        {
            var fill = sombreado.Fill?.Value?.TrimStart('#');
            if (fill is "FFFF00" or "ffff00" or "yellow" or "FFFFFF00")
                sombreado.Remove();
        }
    }

    private static bool EsLineaNombreFirma(string texto, string nombreJugador) =>
        string.Equals(texto.Trim(), nombreJugador, StringComparison.OrdinalIgnoreCase)
        || (texto.Trim().StartsWith(nombreJugador, StringComparison.OrdinalIgnoreCase)
            && !texto.Contains(',')
            && !texto.Contains("denominado", StringComparison.OrdinalIgnoreCase)
            && texto.Length <= nombreJugador.Length + 3);

    private static void FormatearClausulaJugador(Paragraph parrafo, string texto, string nombreJugador)
    {
        var estilo = ObtenerEstiloCuerpo(parrafo);
        var runs = new List<Run>();

        var indice = texto.IndexOf(nombreJugador, StringComparison.OrdinalIgnoreCase);
        if (indice < 0)
        {
            var finNombre = texto.IndexOf(", mayor", StringComparison.OrdinalIgnoreCase);
            if (finNombre <= 0)
            {
                FormatearLineaTexto(parrafo, texto, negrita: false);
                return;
            }

            var nombre = texto[..finNombre].TrimEnd();
            runs.Add(CrearRun(nombre, estilo, negrita: true));
            AgregarSegmentosConElJugador(runs, string.Empty, texto[finNombre..], estilo);
        }
        else
        {
            if (indice > 0)
                runs.Add(CrearRun(texto[..indice], estilo, negrita: false));

            runs.Add(CrearRun(texto.Substring(indice, nombreJugador.Length), estilo, negrita: true));
            AgregarSegmentosConElJugador(runs, string.Empty, texto[(indice + nombreJugador.Length)..], estilo);
        }

        ReemplazarRuns(parrafo, runs);
    }

    private static void AgregarSegmentosConElJugador(List<Run> runs, string prefijo, string sufijo, RunProperties estilo)
    {
        if (!string.IsNullOrEmpty(prefijo))
            runs.Add(CrearRun(prefijo, estilo, negrita: false));

        var indiceMarca = sufijo.IndexOf(MarcaElJugador, StringComparison.OrdinalIgnoreCase);
        if (indiceMarca < 0)
        {
            if (!string.IsNullOrEmpty(sufijo))
                runs.Add(CrearRun(sufijo, estilo, negrita: false));
            return;
        }

        if (indiceMarca > 0)
            runs.Add(CrearRun(sufijo[..indiceMarca], estilo, negrita: false));

        runs.Add(CrearRun(MarcaElJugador, estilo, negrita: true));

        var despues = sufijo[(indiceMarca + MarcaElJugador.Length)..];
        if (!string.IsNullOrEmpty(despues))
            runs.Add(CrearRun(despues, estilo, negrita: false));
    }

    private static void FormatearLineaSoloNombre(Paragraph parrafo, string nombreJugador) =>
        FormatearLineaTexto(parrafo, nombreJugador.Trim(), negrita: true);

    private static void FormatearLineaTexto(Paragraph parrafo, string texto, bool negrita)
    {
        var estilo = ObtenerEstiloCuerpo(parrafo);
        ReemplazarRuns(parrafo, CrearRun(texto, estilo, negrita));
    }

    private static RunProperties ObtenerEstiloCuerpo(Paragraph parrafo)
    {
        foreach (var run in parrafo.Descendants<Run>())
        {
            var t = run.InnerText;
            if (string.IsNullOrWhiteSpace(t))
                continue;

            if (t.Contains("mayor", StringComparison.OrdinalIgnoreCase)
                || t.Contains("nacionalidad", StringComparison.OrdinalIgnoreCase)
                || t.Contains("hábil", StringComparison.OrdinalIgnoreCase)
                || t.Contains("habil", StringComparison.OrdinalIgnoreCase)
                || t.Contains("FORTIS", StringComparison.OrdinalIgnoreCase))
            {
                if (run.RunProperties is not null)
                    return LimpiarEstilo(run.RunProperties);
            }
        }

        var conFuente = parrafo.Descendants<Run>()
            .Select(r => r.RunProperties)
            .FirstOrDefault(rp => rp?.RunFonts is not null);

        if (conFuente is not null)
            return LimpiarEstilo(conFuente);

        return new RunProperties(
            new RunFonts { Ascii = "Arial", HighAnsi = "Arial", ComplexScript = "Arial", EastAsia = "Arial" },
            new FontSize { Val = "22" },
            new FontSizeComplexScript { Val = "22" });
    }

    private static RunProperties LimpiarEstilo(RunProperties origen)
    {
        var clon = (RunProperties)origen.CloneNode(true);
        clon.RemoveAllChildren<Highlight>();
        clon.RemoveAllChildren<Bold>();
        clon.RemoveAllChildren<BoldComplexScript>();
        foreach (var sombreado in clon.Elements<Shading>().ToList())
        {
            var fill = sombreado.Fill?.Value?.TrimStart('#');
            if (fill is "FFFF00" or "ffff00" or "yellow" or "FFFFFF00")
                sombreado.Remove();
        }

        return clon;
    }

    private static void ReemplazarRuns(Paragraph parrafo, params Run[] runs) =>
        ReemplazarRuns(parrafo, runs.AsEnumerable());

    private static void ReemplazarRuns(Paragraph parrafo, IEnumerable<Run> runs)
    {
        foreach (var hijo in parrafo.ChildElements.Where(e => e is not ParagraphProperties).ToList())
            hijo.Remove();

        foreach (var run in runs)
            parrafo.AppendChild(run);
    }

    private static Run CrearRun(string texto, RunProperties estiloBase, bool negrita)
    {
        var run = new Run();
        var props = (RunProperties)estiloBase.CloneNode(true);
        if (negrita)
            props.AppendChild(new Bold());
        else
        {
            props.GetFirstChild<Bold>()?.Remove();
            props.GetFirstChild<BoldComplexScript>()?.Remove();
        }

        run.RunProperties = props;

        var necesitaPreserve = texto.StartsWith(' ') || texto.EndsWith(' ') || texto.Contains("  ");
        run.AppendChild(new Text(texto)
        {
            Space = necesitaPreserve ? SpaceProcessingModeValues.Preserve : null,
        });
        return run;
    }

    private static string ObtenerTexto(Paragraph parrafo) =>
        string.Concat(parrafo.Descendants<Text>().Select(t => t.Text));
}
