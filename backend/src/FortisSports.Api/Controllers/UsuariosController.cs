using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Policy = "CanConfigure")]
public class UsuariosController : ControllerBase
{
    private readonly IUserService _servicioUsuarios;

    public UsuariosController(IUserService servicioUsuarios)
    {
        _servicioUsuarios = servicioUsuarios;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken)
    {
        var usuarios = await _servicioUsuarios.GetAllAsync(cancellationToken);
        return Ok(usuarios);
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear([FromBody] CreateUserRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var usuario = await _servicioUsuarios.CreateAsync(solicitud, usuarioActual, cancellationToken);
            return CreatedAtAction(nameof(Listar), usuario);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{userId}/rol")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarRol([FromRoute] string userId, [FromBody] ChangeUserRoleRequest solicitud, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            await _servicioUsuarios.ChangeRoleAsync(userId, solicitud, usuarioActual, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Desactivar([FromRoute] string userId, CancellationToken cancellationToken)
    {
        var usuarioActual = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            await _servicioUsuarios.DeactivateAsync(userId, usuarioActual, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
