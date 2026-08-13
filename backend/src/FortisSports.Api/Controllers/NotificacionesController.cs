using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/notificaciones")]
[Authorize(Policy = "CanRead")]
public class NotificacionesController : ControllerBase
{
    private readonly INotificationService _servicioNotificaciones;

    public NotificacionesController(INotificationService servicioNotificaciones)
    {
        _servicioNotificaciones = servicioNotificaciones;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioNotificaciones.GetAllAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("sin-leer")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> ContadorSinLeer(CancellationToken cancellationToken)
    {
        var cantidad = await _servicioNotificaciones.GetUnreadCountAsync(cancellationToken);
        return Ok(cantidad);
    }

    [HttpPatch("leidas")]
    [HttpPost("marcar-todas-leidas")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarcarTodasLeidas(CancellationToken cancellationToken)
    {
        var marcadas = await _servicioNotificaciones.MarkAllAsReadAsync(cancellationToken);
        return Ok(marcadas);
    }

    [HttpPatch("{notificationId:guid}/leida")]
    [Authorize(Policy = "CanManageOperations")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarcarLeida([FromRoute] Guid notificationId, CancellationToken cancellationToken)
    {
        await _servicioNotificaciones.MarkAsReadAsync(notificationId, cancellationToken);
        return NoContent();
    }
}
