using FortisSports.Api.Forms;
using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/transferencias")]
[Authorize(Policy = "CanRead")]
public class TransferenciasController : ControllerBase
{
    private readonly ITransferService _servicioTransferencias;

    public TransferenciasController(ITransferService servicioTransferencias)
    {
        _servicioTransferencias = servicioTransferencias;
    }

    [HttpPost]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(TransferResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Crear([FromBody] TransferCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioTransferencias.CreateAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPost("registrar")]
    [Authorize(Policy = "CanManageOperations")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20_000_000)]
    [ProducesResponseType(typeof(TransferResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Registrar([FromForm] TransferRegisterForm form, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var solicitud = new TransferCreateRequest(
            form.PlayerId,
            form.OriginClub,
            form.DestinationClub,
            form.TransferDate,
            form.Amount,
            string.IsNullOrWhiteSpace(form.Currency) ? "USD" : form.Currency,
            form.TransferType,
            form.Conditions ?? "",
            form.ManagedBy);

        Stream? stream = null;
        string? fileName = null;
        if (form.ClubContract is { Length: > 0 })
        {
            stream = form.ClubContract.OpenReadStream();
            fileName = form.ClubContract.FileName;
        }

        try
        {
            var respuesta = await _servicioTransferencias.CreateAsync(solicitud, usuarioActual, cancellationToken, stream, fileName);
            return Ok(respuesta);
        }
        finally
        {
            if (stream is not null)
                await stream.DisposeAsync();
        }
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<TransferResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioTransferencias.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TransferResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Paginado(
        [FromQuery] Guid? playerId,
        [FromQuery] string? club,
        [FromQuery] string? transferType,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var respuesta = await _servicioTransferencias.GetPagedAsync(playerId, club, transferType, page, pageSize, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPatch("{transferId:guid}/estado")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(TransferResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActualizarEstado([FromRoute] Guid transferId, [FromQuery] string status, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioTransferencias.UpdateStatusAsync(transferId, status, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(TransferResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar([FromRoute] Guid id, [FromBody] TransferUpdateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioTransferencias.UpdateAsync(id, solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await _servicioTransferencias.DeleteAsync(id, usuarioActual, cancellationToken);
        return NoContent();
    }
}
