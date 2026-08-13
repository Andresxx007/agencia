using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/autenticacion")]
public class AutenticacionController : ControllerBase
{
    private readonly IAuthService _servicioAutenticacion;

    public AutenticacionController(IAuthService servicioAutenticacion)
    {
        _servicioAutenticacion = servicioAutenticacion;
    }

    [HttpPost("inicio-sesion")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> IniciarSesion([FromBody] AuthRequest solicitud, CancellationToken cancellationToken)
    {
        var respuesta = await _servicioAutenticacion.LoginAsync(solicitud, cancellationToken);
        return Ok(respuesta);
    }
}
