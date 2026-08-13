using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/auditoria")]
[Authorize(Policy = "CanConfigure")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditService _servicioAuditoria;

    public AuditoriaController(IAuditService servicioAuditoria)
    {
        _servicioAuditoria = servicioAuditoria;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<AuditLogResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Filtrado(
        [FromQuery] string? entityName,
        [FromQuery] string? action,
        [FromQuery] string? createdBy,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var respuesta = await _servicioAuditoria.GetFilteredAsync(entityName, action, createdBy, from, to, page, pageSize, cancellationToken);
        return Ok(respuesta);
    }
}
