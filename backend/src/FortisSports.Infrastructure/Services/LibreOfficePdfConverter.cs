using System.Diagnostics;
using Microsoft.Extensions.Configuration;

namespace FortisSports.Infrastructure.Services;

/// <summary>
/// Convierte DOCX a PDF con LibreOffice (gratuito, sin límite de páginas).
/// </summary>
public class LibreOfficePdfConverter
{
    private static readonly SemaphoreSlim BloqueoConversion = new(1, 1);
    private static readonly string PerfilLibreOffice = Path.Combine(Path.GetTempPath(), "fortis_libreoffice_profile");

    private readonly string? _configuredPath;

    public LibreOfficePdfConverter(IConfiguration configuration)
    {
        _configuredPath = configuration["Contratos:LibreOfficePath"];
        AsegurarPerfilLibreOffice();
    }

    public async Task<string> ConvertirDocxAPdfAsync(string docxPath, string directorioSalida, CancellationToken cancellationToken = default)
    {
        var ejecutable = ResolverEjecutable()
            ?? throw new InvalidOperationException(
                "LibreOffice no está instalado. Instálelo desde https://www.libreoffice.org/download/ " +
                "o configure Contratos:LibreOfficePath en appsettings.json.");

        Directory.CreateDirectory(directorioSalida);

        var docxFull = Path.GetFullPath(docxPath);
        var outDir = Path.GetFullPath(directorioSalida);
        var pdfEsperado = Path.Combine(outDir, Path.GetFileNameWithoutExtension(docxFull) + ".pdf");

        EliminarSiExiste(pdfEsperado);

        var perfilUri = "file:///" + PerfilLibreOffice.Replace('\\', '/');
        var argumentos =
            "-env:UserInstallation=" + perfilUri + " " +
            "--headless --invisible --norestore --nologo --nofirststartwizard " +
            "--convert-to pdf --outdir \"" + outDir + "\" \"" + docxFull + "\"";

        await BloqueoConversion.WaitAsync(cancellationToken);
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = ejecutable,
                Arguments = argumentos,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                WorkingDirectory = outDir,
            };

            psi.Environment["SAL_USE_VCLPLUGIN"] = "svp";
            psi.Environment["SAL_NO_ACQUIRE"] = "true";
            psi.Environment["SAL_DISABLE_OPENCL"] = "1";
            psi.Environment["SAL_NO_SYSTEM_FILE_LOCKING"] = "1";
            psi.Environment["SAL_DISABLE_DEFAULTPRINTER"] = "1";
            psi.Environment["SAL_DISABLE_PRINTERS"] = "1";
            psi.Environment["VCL_HIDE_WINDOWS"] = "1";

            using var proceso = Process.Start(psi)
                ?? throw new InvalidOperationException("No se pudo iniciar LibreOffice.");

            var leerSalida = proceso.StandardOutput.ReadToEndAsync(cancellationToken);
            var leerError = proceso.StandardError.ReadToEndAsync(cancellationToken);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(90));

            try
            {
                await proceso.WaitForExitAsync(cts.Token);
            }
            catch (OperationCanceledException)
            {
                try { proceso.Kill(entireProcessTree: true); } catch { /* ignorar */ }
                throw new InvalidOperationException("La generación del PDF tardó demasiado. Intente de nuevo.");
            }

            var salida = await leerSalida;
            var error = await leerError;

            if (proceso.ExitCode != 0 || !File.Exists(pdfEsperado))
            {
                var detalle = string.IsNullOrWhiteSpace(error) ? salida : error;
                throw new InvalidOperationException(
                    "LibreOffice no pudo convertir el contrato a PDF."
                    + (string.IsNullOrWhiteSpace(detalle) ? "" : " " + detalle.Trim()));
            }

            return pdfEsperado;
        }
        finally
        {
            BloqueoConversion.Release();
        }
    }

    private static void AsegurarPerfilLibreOffice()
    {
        var userDir = Path.Combine(PerfilLibreOffice, "user");
        Directory.CreateDirectory(userDir);

        var xcu = Path.Combine(userDir, "registrymodifications.xcu");
        if (File.Exists(xcu))
            return;

        File.WriteAllText(xcu,
            """
            <?xml version="1.0" encoding="UTF-8"?>
            <oor:component-data xmlns:oor="http://openoffice.org/2001/registry" xmlns:os="http://openoffice.org/2001/registry" oor:name="Common" oor:package="org.openoffice.Office">
              <node oor:name="Misc">
                <prop oor:name="FirstRun" oor:op="fuse"><value>false</value></prop>
              </node>
            </oor:component-data>
            """);
    }

    private string? ResolverEjecutable()
    {
        if (!string.IsNullOrWhiteSpace(_configuredPath) && File.Exists(_configuredPath))
            return _configuredPath;

        var env = Environment.GetEnvironmentVariable("LIBREOFFICE_PATH");
        if (!string.IsNullOrWhiteSpace(env) && File.Exists(env))
            return env;

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        foreach (var candidato in new[]
        {
            Path.Combine(programFiles, "LibreOffice", "program", "soffice.com"),
            Path.Combine(programFilesX86, "LibreOffice", "program", "soffice.com"),
            Path.Combine(programFiles, "LibreOffice", "program", "soffice.bin"),
            Path.Combine(programFilesX86, "LibreOffice", "program", "soffice.bin"),
            Path.Combine(programFiles, "LibreOffice", "program", "soffice.exe"),
            Path.Combine(programFilesX86, "LibreOffice", "program", "soffice.exe"),
            @"C:\Program Files\LibreOffice\program\soffice.com",
            @"C:\Program Files\LibreOffice\program\soffice.exe",
        })
        {
            if (File.Exists(candidato))
                return candidato;
        }

        return BuscarEnPath("soffice.com")
            ?? BuscarEnPath("soffice.bin")
            ?? BuscarEnPath("soffice.exe");
    }

    private static string? BuscarEnPath(string nombre)
    {
        var pathEnv = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(pathEnv))
            return null;

        foreach (var dir in pathEnv.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var full = Path.Combine(dir.Trim(), nombre);
            if (File.Exists(full))
                return full;
        }

        return null;
    }

    private static void EliminarSiExiste(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch
        {
            /* ignorar */
        }
    }
}
