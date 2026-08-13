using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

/// <summary>
/// Endpoints públicos del portal web de la empresa (sin autenticación).
/// Solo expone jugadores marcados como visibles (IsVisible = true).
/// </summary>
[ApiController]
[Route("api/publico")]
[AllowAnonymous]
public class PortalPublicoController : ControllerBase
{
    private readonly IPlayerService _servicioJugadores;

    public PortalPublicoController(IPlayerService servicioJugadores)
    {
        _servicioJugadores = servicioJugadores;
    }

    /// <summary>
    /// Lista paginada de jugadores visibles para el portal público.
    /// </summary>
    [HttpGet("jugadores")]
    [ProducesResponseType(typeof(PagedResult<JugadorPublicoResumen>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListadoPublico(
        [FromQuery] string? busqueda,
        [FromQuery] string? posicion,
        [FromQuery] string? nacionalidad,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanio = 12,
        CancellationToken cancellationToken = default)
    {
        var todos = await _servicioJugadores.GetAllAsync(
            search: busqueda,
            status: null,
            position: posicion,
            nationality: nacionalidad,
            minAge: null,
            maxAge: null,
            preferredFoot: null,
            onlyVisible: true,
            page: pagina,
            pageSize: tamanio,
            cancellationToken: cancellationToken);

        var items = todos.Items
            .Select(j => new JugadorPublicoResumen(
                j.Id,
                j.FirstName,
                j.LastName,
                j.Nationality,
                j.MainPosition,
                j.CurrentClub,
                j.HeightCm,
                j.WeightKg,
                j.PreferredFoot,
                CalcularEdad(j.BirthDate),
                j.PhotoUrl,
                j.JerseyNumber,
                j.City))
            .ToList();

        return Ok(new
        {
            items,
            totalItems = todos.TotalItems,
            page = todos.Page,
            pageSize = todos.PageSize
        });
    }

    /// <summary>
    /// Perfil público de un jugador específico (solo si está marcado como visible).
    /// </summary>
    [HttpGet("jugadores/{id:guid}")]
    [ProducesResponseType(typeof(JugadorPublicoResumen), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PerfilPublico(
        [FromRoute] Guid id,
        CancellationToken cancellationToken = default)
    {
        var jugador = await _servicioJugadores.GetByIdAsync(id, cancellationToken);

        if (jugador is null || !jugador.IsVisible)
            return NotFound(new { error = "Jugador no encontrado o no disponible en el portal." });

        var respuesta = new JugadorPublicoResumen(
            jugador.Id,
            jugador.FirstName,
            jugador.LastName,
            jugador.Nationality,
            jugador.MainPosition,
            jugador.CurrentClub,
            jugador.HeightCm,
            jugador.WeightKg,
            jugador.PreferredFoot,
            CalcularEdad(jugador.BirthDate),
            jugador.PhotoUrl,
            jugador.JerseyNumber,
            jugador.City);

        return Ok(respuesta);
    }

    private static int CalcularEdad(DateOnly fechaNacimiento)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        if (fechaNacimiento > hoy)
            return 0;
        var edad = hoy.Year - fechaNacimiento.Year;
        if (fechaNacimiento > hoy.AddYears(-edad))
            edad--;
        return Math.Clamp(edad, 0, 99);
    }
}

public record JugadorPublicoResumen(
    Guid Id,
    string Nombre,
    string Apellido,
    string Nacionalidad,
    string Posicion,
    string? ClubActual,
    decimal? AlturaCm,
    decimal? PesoKg,
    string? PieDominante,
    int Edad,
    string? FotoUrl,
    int? NumeroCamiseta,
    string? Ciudad);
