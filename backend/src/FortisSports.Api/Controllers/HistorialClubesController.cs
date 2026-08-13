using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/historial-clubes")]
[Authorize(Policy = "CanRead")]
public class HistorialClubesController : ControllerBase
{
    private readonly IPlayerClubHistoryService _servicio;

    public HistorialClubesController(IPlayerClubHistoryService servicio)
    {
        _servicio = servicio;
    }

    [HttpPost]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(PlayerClubHistoryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Crear([FromBody] PlayerClubHistoryCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicio.CreateAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<PlayerClubHistoryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicio.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(PlayerClubHistoryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar([FromRoute] Guid id, [FromBody] PlayerClubHistoryUpdateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicio.UpdateAsync(id, solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await _servicio.DeleteAsync(id, usuarioActual, cancellationToken);
        return NoContent();
    }
}
