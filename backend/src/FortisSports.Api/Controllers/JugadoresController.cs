using FortisSports.Api.Forms;
using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/jugadores")]
[Authorize(Policy = "CanRead")]
public class JugadoresController : ControllerBase
{
    private readonly IPlayerService _servicioJugadores;

    public JugadoresController(IPlayerService servicioJugadores)
    {
        _servicioJugadores = servicioJugadores;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<PlayerResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listado(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? position,
        [FromQuery] string? nationality,
        [FromQuery] int? minAge,
        [FromQuery] int? maxAge,
        [FromQuery] string? preferredFoot,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var listadoJugadores = await _servicioJugadores.GetAllAsync(search, status, position, nationality, minAge, maxAge, preferredFoot, onlyVisible: false, page, pageSize, cancellationToken);
        return Ok(listadoJugadores);
    }

    [HttpPost("importar")]
    [Authorize(Policy = "CanManageOperations")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(BulkImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Importar([FromForm] CsvImportForm form, CancellationToken cancellationToken)
    {
        if (form.File is null || form.File.Length == 0)
            return BadRequest(new { error = "Archivo CSV requerido." });
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await using var flujo = form.File.OpenReadStream();
        var resultadoImportacion = await _servicioJugadores.BulkImportAsync(flujo, usuarioActual, cancellationToken);
        return Ok(resultadoImportacion);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PlayerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var jugador = await _servicioJugadores.GetByIdAsync(id, cancellationToken);
        return jugador is null ? NotFound() : Ok(jugador);
    }

    [HttpPost]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(PlayerResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Crear([FromBody] PlayerCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioJugadores.CreateAsync(solicitud, usuarioActual, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = respuesta.Id }, respuesta);
    }

    [HttpGet("{id:guid}/curriculum")]
    [Authorize(Policy = "CanRead")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DescargarCurriculum([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var archivo = await _servicioJugadores.GenerateCurriculumPdfAsync(id, cancellationToken);
        Response.Headers.CacheControl = "no-store, no-cache";
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }

    [HttpGet("{id:guid}/informe-completo")]
    [Authorize(Policy = "CanRead")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DescargarInformeCompleto([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var archivo = await _servicioJugadores.GenerateFullReportPdfAsync(id, cancellationToken);
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }

    [HttpPost("{id:guid}/foto")]
    [Authorize(Policy = "CanManageOperations")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [ProducesResponseType(typeof(PlayerResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubirFoto([FromRoute] Guid id, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Selecciona un archivo de imagen." });
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await using var stream = file.OpenReadStream();
        var respuesta = await _servicioJugadores.UploadPhotoAsync(id, stream, file.ContentType, Path.GetExtension(file.FileName), usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(PlayerResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar([FromRoute] Guid id, [FromBody] PlayerUpdateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioJugadores.UpdateAsync(id, solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await _servicioJugadores.DeleteAsync(id, usuarioActual, cancellationToken);
        return NoContent();
    }
}
