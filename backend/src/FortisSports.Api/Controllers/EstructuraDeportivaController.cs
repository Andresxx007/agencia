using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize(Policy = "CanRead")]
public class EstructuraDeportivaController : ControllerBase
{
    private readonly ISportsStructureService _sportsStructureService;

    public EstructuraDeportivaController(ISportsStructureService sportsStructureService)
    {
        _sportsStructureService = sportsStructureService;
    }

    [HttpGet("paises")]
    [ProducesResponseType(typeof(IReadOnlyList<CountryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarPaises(CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetCountriesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("paises")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(CountryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CrearPais([FromBody] CountryCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateCountryAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("paises/{countryId:guid}/ciudades")]
    [ProducesResponseType(typeof(IReadOnlyList<CityResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarCiudadesPorPais([FromRoute] Guid countryId, CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetCitiesByCountryAsync(countryId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("ciudades")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(CityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CrearCiudad([FromBody] CityCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateCityAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("categorias-competitivas")]
    [ProducesResponseType(typeof(IReadOnlyList<CompetitiveCategoryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarCategoriasCompetitivas(CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetCompetitiveCategoriesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("categorias-competitivas")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(CompetitiveCategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CrearCategoriaCompetitiva([FromBody] CompetitiveCategoryCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateCompetitiveCategoryAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("paises/{countryId:guid}/competiciones")]
    [ProducesResponseType(typeof(IReadOnlyList<CompetitionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarCompeticionesPorPais([FromRoute] Guid countryId, [FromQuery] string? temporada, CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetCompetitionsByCountryAsync(countryId, temporada, cancellationToken);
        return Ok(response);
    }

    [HttpPost("competiciones")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(CompetitionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CrearCompeticion([FromBody] CompetitionCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateCompetitionAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("competiciones/{competitionId:guid}/clubes")]
    [ProducesResponseType(typeof(IReadOnlyList<CompetitionClubResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarClubesPorCompeticion([FromRoute] Guid competitionId, [FromQuery] string? temporada, CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetClubsByCompetitionAsync(competitionId, temporada, cancellationToken);
        return Ok(response);
    }

    [HttpPost("clubes")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(ClubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CrearClub([FromBody] ClubCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateClubAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("clubes/{clubId:guid}")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(ClubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarClub([FromRoute] Guid clubId, [FromBody] ClubUpdateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.UpdateClubAsync(clubId, request, actor, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("clubes/{clubId:guid}/validacion")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(ClubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActualizarValidacionClub([FromRoute] Guid clubId, [FromBody] ClubValidationStatusUpdateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.UpdateClubValidationStatusAsync(clubId, request, actor, cancellationToken);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("clubes/{clubId:guid}")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EliminarClub([FromRoute] Guid clubId, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            await _sportsStructureService.DeleteClubAsync(clubId, actor, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("fuentes-datos")]
    [ProducesResponseType(typeof(IReadOnlyList<DataSourceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListarFuentesDatos(CancellationToken cancellationToken)
    {
        var response = await _sportsStructureService.GetDataSourcesAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("fuentes-datos")]
    [Authorize(Policy = "CanConfigure")]
    [ProducesResponseType(typeof(DataSourceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CrearFuenteDatos([FromBody] DataSourceCreateRequest request, CancellationToken cancellationToken)
    {
        var actor = User.FindFirstValue(ClaimTypes.Email) ?? "sistema";
        try
        {
            var response = await _sportsStructureService.CreateDataSourceAsync(request, actor, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
