using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/estadisticas-jugador")]
[Authorize(Policy = "CanRead")]
public class EstadisticasJugadorController : ControllerBase
{
    private readonly IPlayerStatsService _servicioEstadisticas;

    public EstadisticasJugadorController(IPlayerStatsService servicioEstadisticas)
    {
        _servicioEstadisticas = servicioEstadisticas;
    }

    [HttpPost]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(PlayerMatchStatResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Crear([FromBody] PlayerMatchStatCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioEstadisticas.CreateAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<PlayerMatchStatResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioEstadisticas.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(respuesta);
    }
}
