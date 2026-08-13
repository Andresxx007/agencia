using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/contratos")]
[Authorize(Policy = "CanRead")]
public class ContratosController : ControllerBase
{
    private readonly IContractService _servicioContratos;

    public ContratosController(IContractService servicioContratos)
    {
        _servicioContratos = servicioContratos;
    }

    [HttpPost("generar")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(ContractResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Generar(
        [FromBody] GenerateContractRequest solicitud,
        [FromQuery] bool descargar = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
            var resultado = await _servicioContratos.GenerateAsync(solicitud, usuarioActual, cancellationToken);
            if (descargar)
                return File(resultado.PdfBytes, "application/pdf", resultado.DownloadFileName);
            return Ok(resultado.Contract);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Jugador no encontrado." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("jugador/{playerId:guid}/representacion")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DescargarRepresentacion(
        [FromRoute] Guid playerId,
        [FromQuery] int? durationYears,
        CancellationToken cancellationToken)
    {
        try
        {
            var archivo = await _servicioContratos.GenerateRepresentationPdfAsync(playerId, durationYears, cancellationToken);
            return File(archivo.Content, "application/pdf", archivo.FileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Jugador no encontrado." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ContractResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var contratos = await _servicioContratos.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(contratos);
    }

    [HttpGet("{contractId:guid}/descargar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Descargar([FromRoute] Guid contractId, CancellationToken cancellationToken)
    {
        var archivo = await _servicioContratos.DownloadAsync(contractId, cancellationToken);
        return archivo is null ? NotFound() : File(archivo.Value.Content, "application/pdf", archivo.Value.FileName);
    }
}
