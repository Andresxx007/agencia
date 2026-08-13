using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/catalogos")]
[Authorize(Policy = "CanConfigure")]
public class CatalogosController : ControllerBase
{
    private readonly ICatalogService _servicioCatalogos;

    public CatalogosController(ICatalogService servicioCatalogos)
    {
        _servicioCatalogos = servicioCatalogos;
    }

    [HttpPost]
    [ProducesResponseType(typeof(CatalogResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Crear([FromBody] CatalogCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioCatalogos.CreateCatalogAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CatalogResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioCatalogos.GetCatalogsAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpPost("elementos")]
    [ProducesResponseType(typeof(CatalogItemResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CrearElemento([FromBody] CatalogItemCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioCatalogos.CreateItemAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("{catalogId:guid}/elementos")]
    [ProducesResponseType(typeof(IReadOnlyList<CatalogItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ElementosPorCatalogo([FromRoute] Guid catalogId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioCatalogos.GetItemsAsync(catalogId, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("por-codigo/{catalogCode}/elementos")]
    [Authorize(Policy = "CanRead")]
    [ProducesResponseType(typeof(IReadOnlyList<CatalogItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ElementosPorCodigo(
        [FromRoute] string catalogCode,
        [FromQuery] Guid? parentItemId,
        CancellationToken cancellationToken)
    {
        if (parentItemId.HasValue)
        {
            var respuesta = await _servicioCatalogos.GetItemsByCodeAndParentAsync(catalogCode, parentItemId.Value, cancellationToken);
            return Ok(respuesta);
        }
        else
        {
            var respuesta = await _servicioCatalogos.GetItemsByCodeAsync(catalogCode, cancellationToken);
            return Ok(respuesta);
        }
    }

    [HttpDelete("elementos/{itemId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarElemento([FromRoute] Guid itemId, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            await _servicioCatalogos.DeleteItemAsync(itemId, usuarioActual, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
