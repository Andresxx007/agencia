using FortisSports.Api.Forms;
using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/documentos")]
[Authorize(Policy = "CanRead")]
public class DocumentosController : ControllerBase
{
    private readonly IDocumentService _servicioDocumentos;

    public DocumentosController(IDocumentService servicioDocumentos)
    {
        _servicioDocumentos = servicioDocumentos;
    }

    [HttpPost("cargar")]
    [Authorize(Policy = "CanManageOperations")]
    [RequestSizeLimit(20_000_000)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(PlayerDocumentResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Cargar([FromForm] DocumentUploadForm form, CancellationToken cancellationToken)
    {
        if (form.File is null || form.File.Length == 0)
            return BadRequest(new { message = "El archivo está vacío." });

        await using var stream = form.File.OpenReadStream();
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioDocumentos.UploadAsync(
            new UploadPlayerDocumentRequest(form.PlayerId, form.DocumentType, form.Description,
                form.IssuedAt, form.ExpirationDate, form.RelatedClub, form.Status, form.TransferId),
            stream,
            form.File.FileName,
            usuarioActual,
            cancellationToken);

        return Ok(respuesta);
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<PlayerDocumentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var documentos = await _servicioDocumentos.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(documentos);
    }

    [HttpGet("{documentId:guid}/descargar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Descargar([FromRoute] Guid documentId, CancellationToken cancellationToken)
    {
        var archivo = await _servicioDocumentos.DownloadAsync(documentId, cancellationToken);
        return archivo is null
            ? NotFound(new { message = "El archivo del documento no está disponible en el servidor." })
            : File(archivo.Value.Content, archivo.Value.ContentType, archivo.Value.FileName);
    }
}
