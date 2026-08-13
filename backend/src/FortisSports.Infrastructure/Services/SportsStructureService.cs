using FortisSports.Application.Contracts;
using FortisSports.Domain.Entities;
using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FortisSports.Infrastructure.Services;

public class SportsStructureService : ISportsStructureService
{
    private readonly AppDbContext _dbContext;

    public SportsStructureService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CountryResponse>> GetCountriesAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Countries
            .OrderBy(x => x.Name)
            .Select(x => new CountryResponse(x.Id, x.Name, x.Nationality, x.FifaCode, x.Iso2Code, x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CountryResponse> CreateCountryAsync(CountryCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("El nombre del país es obligatorio.");

        var exists = await _dbContext.Countries.AnyAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe un país con ese nombre.");

        var country = new Country
        {
            Name = name,
            Nationality = request.Nationality?.Trim(),
            FifaCode = request.FifaCode?.Trim().ToUpperInvariant(),
            Iso2Code = request.Iso2Code?.Trim().ToUpperInvariant(),
            CreatedBy = actor,
        };
        _dbContext.Countries.Add(country);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new CountryResponse(country.Id, country.Name, country.Nationality, country.FifaCode, country.Iso2Code, country.IsActive);
    }

    public async Task<IReadOnlyList<CityResponse>> GetCitiesByCountryAsync(Guid countryId, CancellationToken cancellationToken)
    {
        return await _dbContext.Cities
            .Where(x => x.CountryId == countryId)
            .OrderBy(x => x.Name)
            .Select(x => new CityResponse(x.Id, x.CountryId, x.Country!.Name, x.Name, x.RegionDepartment, x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CityResponse> CreateCityAsync(CityCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var country = await _dbContext.Countries.FirstOrDefaultAsync(x => x.Id == request.CountryId, cancellationToken)
            ?? throw new KeyNotFoundException("País no encontrado.");
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("El nombre de la ciudad es obligatorio.");

        var exists = await _dbContext.Cities.AnyAsync(
            x => x.CountryId == request.CountryId && x.Name.ToLower() == name.ToLower(),
            cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe esa ciudad para el país seleccionado.");

        var city = new City
        {
            CountryId = request.CountryId,
            Name = name,
            RegionDepartment = request.RegionDepartment?.Trim(),
            CreatedBy = actor,
        };
        _dbContext.Cities.Add(city);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new CityResponse(city.Id, city.CountryId, country.Name, city.Name, city.RegionDepartment, city.IsActive);
    }

    public async Task<IReadOnlyList<CompetitiveCategoryResponse>> GetCompetitiveCategoriesAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.CompetitiveCategories
            .OrderBy(x => x.Level ?? int.MaxValue)
            .ThenBy(x => x.Name)
            .Select(x => new CompetitiveCategoryResponse(x.Id, x.Name, x.Level, x.Description, x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CompetitiveCategoryResponse> CreateCompetitiveCategoryAsync(CompetitiveCategoryCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("El nombre de la categoría es obligatorio.");
        var exists = await _dbContext.CompetitiveCategories.AnyAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe una categoría con ese nombre.");

        var category = new CompetitiveCategory
        {
            Name = name,
            Level = request.Level,
            Description = request.Description?.Trim(),
            CreatedBy = actor,
        };
        _dbContext.CompetitiveCategories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new CompetitiveCategoryResponse(category.Id, category.Name, category.Level, category.Description, category.IsActive);
    }

    public async Task<IReadOnlyList<CompetitionResponse>> GetCompetitionsByCountryAsync(Guid countryId, string? season, CancellationToken cancellationToken)
    {
        var query = _dbContext.Competitions.Where(x => x.CountryId == countryId);
        if (!string.IsNullOrWhiteSpace(season)) query = query.Where(x => x.Season == season.Trim());
        return await query
            .OrderBy(x => x.Name)
            .Select(x => new CompetitionResponse(
                x.Id,
                x.CountryId,
                x.Country!.Name,
                x.CompetitiveCategoryId,
                x.CompetitiveCategory!.Name,
                x.Name,
                x.Season,
                x.DivisionLevel,
                x.IsProfessional,
                x.DataSourceId,
                x.DataSource != null ? x.DataSource.Name : null,
                x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CompetitionResponse> CreateCompetitionAsync(CompetitionCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var country = await _dbContext.Countries.FirstOrDefaultAsync(x => x.Id == request.CountryId, cancellationToken)
            ?? throw new KeyNotFoundException("País no encontrado.");
        var category = await _dbContext.CompetitiveCategories.FirstOrDefaultAsync(x => x.Id == request.CompetitiveCategoryId, cancellationToken)
            ?? throw new KeyNotFoundException("Categoría competitiva no encontrada.");
        var name = request.Name.Trim();
        var season = request.Season.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(season))
            throw new InvalidOperationException("Nombre y temporada son obligatorios.");

        var exists = await _dbContext.Competitions.AnyAsync(
            x => x.CountryId == request.CountryId && x.Name.ToLower() == name.ToLower() && x.Season == season,
            cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe esa competición para ese país y temporada.");

        var competition = new Competition
        {
            CountryId = request.CountryId,
            CompetitiveCategoryId = request.CompetitiveCategoryId,
            DataSourceId = request.DataSourceId,
            Name = name,
            Season = season,
            DivisionLevel = request.DivisionLevel,
            IsProfessional = request.IsProfessional,
            CreatedBy = actor,
        };
        _dbContext.Competitions.Add(competition);
        await _dbContext.SaveChangesAsync(cancellationToken);

        string? sourceName = null;
        if (competition.DataSourceId.HasValue)
        {
            sourceName = await _dbContext.DataSources
                .Where(x => x.Id == competition.DataSourceId.Value)
                .Select(x => x.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return new CompetitionResponse(
            competition.Id,
            competition.CountryId,
            country.Name,
            competition.CompetitiveCategoryId,
            category.Name,
            competition.Name,
            competition.Season,
            competition.DivisionLevel,
            competition.IsProfessional,
            competition.DataSourceId,
            sourceName,
            competition.IsActive);
    }

    public async Task<IReadOnlyList<CompetitionClubResponse>> GetClubsByCompetitionAsync(Guid competitionId, string? season, CancellationToken cancellationToken)
    {
        var query = _dbContext.ClubCompetitionSeasons.Where(x => x.CompetitionId == competitionId);
        if (!string.IsNullOrWhiteSpace(season)) query = query.Where(x => x.Season == season.Trim());
        return await query
            .OrderBy(x => x.Club!.Name)
            .Select(x => new CompetitionClubResponse(
                x.Id,
                x.ClubId,
                x.Club!.Name,
                x.Club.City != null ? x.Club.City.Name : null,
                x.Season,
                x.Status,
                x.Club.ValidationStatus,
                x.Club.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<ClubResponse> CreateClubAsync(ClubCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var country = await _dbContext.Countries.FirstOrDefaultAsync(x => x.Id == request.CountryId, cancellationToken)
            ?? throw new KeyNotFoundException("País no encontrado.");
        if (request.CityId.HasValue)
        {
            var cityBelongs = await _dbContext.Cities.AnyAsync(
                x => x.Id == request.CityId.Value && x.CountryId == request.CountryId,
                cancellationToken);
            if (!cityBelongs) throw new InvalidOperationException("La ciudad no pertenece al país seleccionado.");
        }

        var competition = await _dbContext.Competitions.FirstOrDefaultAsync(x => x.Id == request.CompetitionId, cancellationToken)
            ?? throw new KeyNotFoundException("Competición no encontrada.");
        if (competition.CountryId != request.CountryId)
            throw new InvalidOperationException("La competición no pertenece al país seleccionado.");

        var clubName = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(clubName))
            throw new InvalidOperationException("El nombre del club es obligatorio.");

        var club = await _dbContext.Clubs.FirstOrDefaultAsync(
            x => x.CountryId == request.CountryId && x.Name.ToLower() == clubName.ToLower(),
            cancellationToken);
        if (club is null)
        {
            club = new Club
            {
                Name = clubName,
                CountryId = request.CountryId,
                CityId = request.CityId,
                ShortName = request.ShortName?.Trim(),
                CrestUrl = request.CrestUrl?.Trim(),
                ApiProvider = request.ApiProvider?.Trim(),
                ApiTeamId = request.ApiTeamId?.Trim(),
                DataSourceId = request.DataSourceId,
                ValidationStatus = string.IsNullOrWhiteSpace(request.ValidationStatus) ? "pendiente" : request.ValidationStatus.Trim(),
                CreatedBy = actor,
            };
            _dbContext.Clubs.Add(club);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var season = request.Season.Trim();
        if (string.IsNullOrWhiteSpace(season))
            throw new InvalidOperationException("La temporada es obligatoria.");

        var mappingExists = await _dbContext.ClubCompetitionSeasons.AnyAsync(
            x => x.ClubId == club.Id && x.CompetitionId == request.CompetitionId && x.Season == season,
            cancellationToken);
        if (!mappingExists)
        {
            _dbContext.ClubCompetitionSeasons.Add(new ClubCompetitionSeason
            {
                ClubId = club.Id,
                CompetitionId = request.CompetitionId,
                Season = season,
                Status = string.IsNullOrWhiteSpace(request.CompetitionStatus) ? "activo" : request.CompetitionStatus.Trim(),
                DataSourceId = request.DataSourceId,
                LastUpdatedAtUtc = DateTime.UtcNow,
                CreatedBy = actor,
            });
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var cityName = await _dbContext.Cities
            .Where(x => x.Id == club.CityId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);
        var sourceName = await _dbContext.DataSources
            .Where(x => x.Id == club.DataSourceId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);

        return new ClubResponse(
            club.Id,
            club.Name,
            club.CountryId,
            country.Name,
            club.CityId,
            cityName,
            club.ShortName,
            club.CrestUrl,
            club.ApiProvider,
            club.ApiTeamId,
            club.DataSourceId,
            sourceName,
            club.ValidationStatus,
            club.IsActive);
    }

    public async Task<ClubResponse> UpdateClubAsync(Guid id, ClubUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var club = await _dbContext.Clubs.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Club no encontrado.");
        var country = await _dbContext.Countries.FirstOrDefaultAsync(x => x.Id == request.CountryId, cancellationToken)
            ?? throw new KeyNotFoundException("País no encontrado.");
        if (request.CityId.HasValue)
        {
            var cityBelongs = await _dbContext.Cities.AnyAsync(
                x => x.Id == request.CityId.Value && x.CountryId == request.CountryId,
                cancellationToken);
            if (!cityBelongs) throw new InvalidOperationException("La ciudad no pertenece al país seleccionado.");
        }

        var clubName = request.Name.Trim();
        var duplicate = await _dbContext.Clubs.AnyAsync(
            x => x.Id != id && x.CountryId == request.CountryId && x.Name.ToLower() == clubName.ToLower(),
            cancellationToken);
        if (duplicate) throw new InvalidOperationException("Ya existe un club con ese nombre en el país seleccionado.");

        club.Name = clubName;
        club.CountryId = request.CountryId;
        club.CityId = request.CityId;
        club.ShortName = request.ShortName?.Trim();
        club.CrestUrl = request.CrestUrl?.Trim();
        club.ApiProvider = request.ApiProvider?.Trim();
        club.ApiTeamId = request.ApiTeamId?.Trim();
        club.DataSourceId = request.DataSourceId;
        club.ValidationStatus = string.IsNullOrWhiteSpace(request.ValidationStatus) ? "pendiente" : request.ValidationStatus.Trim();
        club.IsActive = request.IsActive;
        club.UpdatedBy = actor;
        club.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var cityName = await _dbContext.Cities
            .Where(x => x.Id == club.CityId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);
        var sourceName = await _dbContext.DataSources
            .Where(x => x.Id == club.DataSourceId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);

        return new ClubResponse(
            club.Id,
            club.Name,
            club.CountryId,
            country.Name,
            club.CityId,
            cityName,
            club.ShortName,
            club.CrestUrl,
            club.ApiProvider,
            club.ApiTeamId,
            club.DataSourceId,
            sourceName,
            club.ValidationStatus,
            club.IsActive);
    }

    public async Task<ClubResponse> UpdateClubValidationStatusAsync(Guid id, ClubValidationStatusUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var club = await _dbContext.Clubs.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Club no encontrado.");
        var country = await _dbContext.Countries.FirstOrDefaultAsync(x => x.Id == club.CountryId, cancellationToken)
            ?? throw new KeyNotFoundException("País no encontrado.");

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "pendiente", "validado", "observado", "duplicado", "descartado"
        };
        var status = request.ValidationStatus?.Trim() ?? string.Empty;
        if (!allowed.Contains(status))
            throw new InvalidOperationException("Estado de validación inválido.");

        club.ValidationStatus = status.ToLowerInvariant();
        club.UpdatedBy = actor;
        club.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        var cityName = await _dbContext.Cities
            .Where(x => x.Id == club.CityId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);
        var sourceName = await _dbContext.DataSources
            .Where(x => x.Id == club.DataSourceId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);

        return new ClubResponse(
            club.Id,
            club.Name,
            club.CountryId,
            country.Name,
            club.CityId,
            cityName,
            club.ShortName,
            club.CrestUrl,
            club.ApiProvider,
            club.ApiTeamId,
            club.DataSourceId,
            sourceName,
            club.ValidationStatus,
            club.IsActive);
    }

    public async Task DeleteClubAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var club = await _dbContext.Clubs.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Club no encontrado.");
        _dbContext.Clubs.Remove(club);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DataSourceResponse>> GetDataSourcesAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.DataSources
            .OrderBy(x => x.Name)
            .Select(x => new DataSourceResponse(x.Id, x.Name, x.Type, x.Url, x.Reliability, x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<DataSourceResponse> CreateDataSourceAsync(DataSourceCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new InvalidOperationException("El nombre de la fuente es obligatorio.");
        var exists = await _dbContext.DataSources.AnyAsync(x => x.Name.ToLower() == name.ToLower(), cancellationToken);
        if (exists) throw new InvalidOperationException("Ya existe una fuente con ese nombre.");

        var entity = new DataSource
        {
            Name = name,
            Type = string.IsNullOrWhiteSpace(request.Type) ? "Manual" : request.Type.Trim(),
            Url = request.Url?.Trim(),
            Reliability = string.IsNullOrWhiteSpace(request.Reliability) ? "Media" : request.Reliability.Trim(),
            CreatedBy = actor,
        };
        _dbContext.DataSources.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new DataSourceResponse(entity.Id, entity.Name, entity.Type, entity.Url, entity.Reliability, entity.IsActive);
    }
}
