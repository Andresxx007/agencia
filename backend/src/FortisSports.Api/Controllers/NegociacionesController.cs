using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/negociaciones")]
[Authorize(Policy = "CanRead")]
public class NegociacionesController : ControllerBase
{
    private readonly INegotiationService _servicioNegociaciones;

    public NegociacionesController(INegotiationService servicioNegociaciones)
    {
        _servicioNegociaciones = servicioNegociaciones;
    }

    [HttpPost]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Crear([FromBody] NegotiationCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var nombreUsuario = User.FindFirstValue(ClaimTypes.Name);
        var respuesta = await _servicioNegociaciones.CreateAsync(solicitud, usuarioActual, nombreUsuario, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("jugador/{playerId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<NegotiationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PorJugador([FromRoute] Guid playerId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioNegociaciones.GetByPlayerAsync(playerId, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<NegotiationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Paginado([FromQuery] string? status, [FromQuery] string? club, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var respuesta = await _servicioNegociaciones.GetPagedAsync(status, club, page, pageSize, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NegotiationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerPorId([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioNegociaciones.GetByIdAsync(id, cancellationToken);
        return respuesta is null ? NotFound() : Ok(respuesta);
    }

    [HttpPost("{id:guid}/cambiar-estado")]
    [HttpPatch("{id:guid}/estado")]
    [HttpPut("{id:guid}/estado")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActualizarEstado([FromRoute] Guid id, [FromBody] NegotiationStatusUpdateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioNegociaciones.UpdateStatusAsync(id, solicitud.Status, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpPost("interacciones")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationInteractionResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> AgregarInteraccion([FromBody] NegotiationInteractionCreateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioNegociaciones.AddInteractionAsync(solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("{negotiationId:guid}/interacciones")]
    [ProducesResponseType(typeof(IReadOnlyList<NegotiationInteractionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Interacciones([FromRoute] Guid negotiationId, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioNegociaciones.GetInteractionsAsync(negotiationId, cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("{negotiationId:guid}/conversaciones")]
    [ProducesResponseType(typeof(IReadOnlyList<NegotiationConversationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Conversaciones([FromRoute] Guid negotiationId, CancellationToken cancellationToken)
    {
        try
        {
            var respuesta = await _servicioNegociaciones.GetConversationsAsync(negotiationId, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{negotiationId:guid}/conversaciones")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationConversationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegistrarConversacion(
        [FromRoute] Guid negotiationId,
        [FromBody] NegotiationConversationCreateRequest solicitud,
        CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var nombreUsuario = User.FindFirstValue(ClaimTypes.Name);
        try
        {
            var respuesta = await _servicioNegociaciones.AddConversationAsync(
                negotiationId, solicitud, usuarioActual, nombreUsuario, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("jugador/{playerId:guid}/conversaciones")]
    [ProducesResponseType(typeof(IReadOnlyList<NegotiationConversationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConversacionesPorJugador(
        [FromRoute] Guid playerId,
        CancellationToken cancellationToken)
    {
        try
        {
            var respuesta = await _servicioNegociaciones.GetConversationsByPlayerAsync(playerId, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("jugador/{playerId:guid}/conversaciones")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationConversationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegistrarConversacionPorJugador(
        [FromRoute] Guid playerId,
        [FromBody] NegotiationConversationCreateRequest solicitud,
        CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var nombreUsuario = User.FindFirstValue(ClaimTypes.Name);
        try
        {
            var respuesta = await _servicioNegociaciones.AddConversationForPlayerAsync(
                playerId, solicitud, usuarioActual, nombreUsuario, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("conversaciones/{conversationId:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarConversacion([FromRoute] Guid conversationId, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            await _servicioNegociaciones.DeleteConversationAsync(conversationId, usuarioActual, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Actualizar([FromRoute] Guid id, [FromBody] NegotiationUpdateRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var respuesta = await _servicioNegociaciones.UpdateAsync(id, solicitud, usuarioActual, cancellationToken);
        return Ok(respuesta);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Eliminar([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        await _servicioNegociaciones.DeleteAsync(id, usuarioActual, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/versiones")]
    [ProducesResponseType(typeof(IReadOnlyList<NegotiationOfferVersionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Versiones([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var respuesta = await _servicioNegociaciones.GetOfferVersionsAsync(id, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/versiones")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(NegotiationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegistrarVersion(
        [FromRoute] Guid id,
        [FromBody] NegotiationOfferVersionRegisterRequest solicitud,
        CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        var nombreUsuario = User.FindFirstValue(ClaimTypes.Name);
        try
        {
            var respuesta = await _servicioNegociaciones.RegisterOfferVersionAsync(
                id, solicitud, usuarioActual, nombreUsuario, cancellationToken);
            return Ok(respuesta);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
