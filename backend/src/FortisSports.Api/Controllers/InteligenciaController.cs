using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/inteligencia")]
[Authorize(Policy = "CanRead")]
public class InteligenciaController : ControllerBase
{
    private readonly IIntelligenceService _servicioInteligencia;

    public InteligenciaController(IIntelligenceService servicioInteligencia)
    {
        _servicioInteligencia = servicioInteligencia;
    }

    [HttpGet("ranking")]
    [ProducesResponseType(typeof(IReadOnlyList<RankingPlayerResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Ranking(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioInteligencia.GetPlayerRankingAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpPost("compatibilidad")]
    [ProducesResponseType(typeof(IReadOnlyList<CompatibilityResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Compatibilidad([FromBody] CompatibilityRequest solicitud, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioInteligencia.GetCompatibilityAsync(solicitud, cancellationToken);
        return Ok(respuesta);
    }
}
