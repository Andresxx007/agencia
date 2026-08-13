using FortisSports.Application.Contracts;
using FortisSports.Domain.Entities;
using FortisSports.Infrastructure.Pdf;
using FortisSports.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FortisSports.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
    }

    public async Task<AuthResponse> LoginAsync(AuthRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            throw new InvalidOperationException("Credenciales inválidas.");
        }

        var validPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!validPassword)
        {
            throw new InvalidOperationException("Credenciales inválidas.");
        }

        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("No existe configuración JWT.");
        var issuer = _configuration["Jwt:Issuer"] ?? "FortisSports";
        var audience = _configuration["Jwt:Audience"] ?? "FortisSports.Client";
        var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresMinutes"], out var value) ? value : 120;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expires, signingCredentials: credentials);

        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), expires, user.FullName, user.Email ?? string.Empty);
    }

    public async Task SeedAdminAsync(CancellationToken cancellationToken)
    {
        var roles = new[] { "Administrador", "Representante", "Supervisor", "Consulta" };
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new AppRole { Name = role });
            }
        }

        const string email = "admin@fortis.local";
        var existing = await _userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return;
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = "Administrador Inicial",
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, "Fortis123*");
        if (!result.Succeeded)
        {
            throw new InvalidOperationException("No se pudo crear el usuario administrador inicial.");
        }

        await _userManager.AddToRoleAsync(user, "Administrador");
    }
}

public class PlayerService : IPlayerService
{
    private readonly AppDbContext _dbContext;
    private readonly string _photosDirectory;

    public PlayerService(AppDbContext dbContext, IHostEnvironment hostEnvironment)
    {
        _dbContext = dbContext;
        _photosDirectory = Path.Combine(hostEnvironment.ContentRootPath, "wwwroot", "uploads", "players");
    }

    public async Task<PlayerResponse> CreateAsync(PlayerCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        ValidatePlayerCreate(request);
        var entity = new Player
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            BirthDate = request.BirthDate,
            Nationality = request.Nationality.Trim(),
            MainPosition = request.MainPosition.Trim(),
            CurrentClub = request.CurrentClub?.Trim(),
            HeightCm = request.HeightCm,
            WeightKg = request.WeightKg,
            PreferredFoot = request.PreferredFoot?.Trim(),
            Notes = request.Notes?.Trim(),
            IdCardNumber = NormalizeOptional(request.IdCardNumber, 60),
            City = NormalizeOptional(request.City, 120),
            Address = NormalizeOptional(request.Address, 300),
            Email = NormalizeOptional(request.Email, 200)?.ToLowerInvariant(),
            PhoneNumber = NormalizeOptional(request.PhoneNumber, 30),
            JerseyNumber = request.JerseyNumber,
            IsVisible = true,
            CreatedBy = actor
        };

        _dbContext.Players.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Player),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Se registró el jugador {entity.FirstName} {entity.LastName}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<PagedResult<PlayerResponse>> GetAllAsync(string? search, string? status, string? position, string? nationality, int? minAge, int? maxAge, string? preferredFoot, bool onlyVisible, int page, int pageSize, CancellationToken cancellationToken)
    {
        var safePage = page <= 0 ? 1 : page;
        var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

        var query = _dbContext.Players.AsQueryable();
        if (onlyVisible)
            query = query.Where(x => x.IsVisible);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLower();
            query = query.Where(x =>
                (x.FirstName + " " + x.LastName).ToLower().Contains(normalizedSearch) ||
                x.Nationality.ToLower().Contains(normalizedSearch) ||
                x.MainPosition.ToLower().Contains(normalizedSearch) ||
                (x.CurrentClub != null && x.CurrentClub.ToLower().Contains(normalizedSearch)) ||
                (x.IdCardNumber != null && x.IdCardNumber.ToLower().Contains(normalizedSearch)) ||
                (x.City != null && x.City.ToLower().Contains(normalizedSearch)) ||
                (x.Email != null && x.Email.ToLower().Contains(normalizedSearch)) ||
                (x.JerseyNumber != null && x.JerseyNumber.Value.ToString().Contains(normalizedSearch)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToLower();
            query = query.Where(x => x.AgencyStatus.ToLower() == normalizedStatus);
        }

        if (!string.IsNullOrWhiteSpace(position))
        {
            var norm = position.Trim().ToLower();
            query = query.Where(x => x.MainPosition.ToLower().Contains(norm));
        }

        if (!string.IsNullOrWhiteSpace(nationality))
        {
            var nat = nationality.Trim().ToLower();
            query = query.Where(x => x.Nationality.ToLower().Contains(nat));
        }

        if (!string.IsNullOrWhiteSpace(preferredFoot))
        {
            var norm = preferredFoot.Trim().ToLower();
            query = query.Where(x => x.PreferredFoot != null && x.PreferredFoot.ToLower().Contains(norm));
        }

        if (minAge.HasValue)
        {
            var maxBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-minAge.Value));
            query = query.Where(x => x.BirthDate <= maxBirth);
        }

        if (maxAge.HasValue)
        {
            var minBirth = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-maxAge.Value - 1));
            query = query.Where(x => x.BirthDate >= minBirth);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => ToResponse(x))
            .ToListAsync(cancellationToken);

        return new PagedResult<PlayerResponse>(items, safePage, safePageSize, totalItems);
    }

    public async Task<BulkImportResult> BulkImportAsync(Stream csvStream, string actor, CancellationToken cancellationToken)
    {
        using var reader = new System.IO.StreamReader(csvStream);
        var created = 0;
        var skipped = 0;
        var errors = new List<string>();
        var lineNum = 0;

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            lineNum++;
            if (lineNum == 1) continue; // encabezado

            if (string.IsNullOrWhiteSpace(line)) continue;
            var cols = line.Split(',');
            if (cols.Length < 4)
            {
                errors.Add($"Línea {lineNum}: columnas insuficientes ({cols.Length}).");
                skipped++;
                continue;
            }

            try
            {
                var firstName = cols[0].Trim();
                var lastName = cols[1].Trim();
                var nationality = cols[2].Trim();
                var position = cols[3].Trim();
                DateOnly birthDate = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-22));
                if (cols.Length > 4 && DateOnly.TryParse(cols[4].Trim(), out var parsedDate))
                    birthDate = parsedDate;
                var club = cols.Length > 5 ? cols[5].Trim() : null;

                if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                {
                    errors.Add($"Línea {lineNum}: nombre o apellido vacío.");
                    skipped++;
                    continue;
                }

                var entity = new Player
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Nationality = nationality,
                    MainPosition = position,
                    BirthDate = birthDate,
                    CurrentClub = string.IsNullOrWhiteSpace(club) ? null : club,
                    AgencyStatus = "Activo",
                    ContractStatus = "SinContrato",
                    IsVisible = true,
                    Notes = $"Importado desde CSV por {actor}"
                };
                _dbContext.Players.Add(entity);
                _dbContext.AuditLogs.Add(new AuditLog
                {
                    EntityName = "Jugador",
                    Action = "ImportarCSV",
                    EntityId = entity.Id.ToString(),
                    ChangesSummary = $"Importado {firstName} {lastName}",
                    CreatedBy = actor,
                    ActionAtUtc = DateTime.UtcNow
                });
                created++;
            }
            catch (Exception ex)
            {
                errors.Add($"Línea {lineNum}: {ex.Message}");
                skipped++;
            }
        }

        if (created > 0)
            await _dbContext.SaveChangesAsync(cancellationToken);

        return new BulkImportResult(created, skipped, errors);
    }

    public async Task<PlayerResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbContext.Players
            .Where(x => x.Id == id)
            .Select(x => ToResponse(x))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> GenerateCurriculumPdfAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.AsNoTracking().FirstOrDefaultAsync(x => x.Id == playerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");
        var stats = await _dbContext.PlayerMatchStats.AsNoTracking()
            .Where(x => x.PlayerId == playerId).ToListAsync(cancellationToken);
        var transfers = await _dbContext.Transfers.AsNoTracking()
            .Where(x => x.PlayerId == playerId).ToListAsync(cancellationToken);
        var clubHistory = await _dbContext.PlayerClubHistories.AsNoTracking()
            .Where(x => x.PlayerId == playerId).ToListAsync(cancellationToken);
        var achievements = await _dbContext.PlayerSportingAchievements.AsNoTracking()
            .Where(x => x.PlayerId == playerId).ToListAsync(cancellationToken);
        var activeContract = await _dbContext.RepresentationContracts.AsNoTracking()
            .Where(x => x.PlayerId == playerId && x.Status == "Vigente")
            .OrderByDescending(x => x.EndDate).FirstOrDefaultAsync(cancellationToken);

        var photoPath = ResolvePlayerPhotoPath(playerId);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - player.BirthDate.Year
            - (today < player.BirthDate.AddYears(today.Year - player.BirthDate.Year) ? 1 : 0);

        byte[] bytes;
        try
        {
            bytes = CurriculumPdfDocumentBuilder.Build(
                player, photoPath, age, stats, transfers, clubHistory, achievements, activeContract);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"No se pudo generar el currículum PDF: {ex.Message}", ex);
        }

        return (bytes, $"curriculum_{player.FirstName}_{player.LastName}_{DateTime.UtcNow:yyyyMMdd}.pdf", "application/pdf");
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> GenerateFullReportPdfAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.AsNoTracking().FirstOrDefaultAsync(x => x.Id == playerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");
        var contracts = await _dbContext.RepresentationContracts.AsNoTracking().Where(x => x.PlayerId == playerId).OrderByDescending(x => x.EndDate).ToListAsync(cancellationToken);
        var transfers = await _dbContext.Transfers.AsNoTracking().Where(x => x.PlayerId == playerId).OrderByDescending(x => x.TransferDate).ToListAsync(cancellationToken);
        var stats = await _dbContext.PlayerMatchStats.AsNoTracking().Where(x => x.PlayerId == playerId).OrderByDescending(x => x.MatchDate).ToListAsync(cancellationToken);
        var negotiations = await _dbContext.Negotiations.AsNoTracking().Where(x => x.PlayerId == playerId).OrderByDescending(x => x.OfferDate).ToListAsync(cancellationToken);
        var documents = await _dbContext.PlayerDocuments.AsNoTracking().Where(x => x.PlayerId == playerId).ToListAsync(cancellationToken);

        var totalGoals = stats.Sum(s => s.Goals);
        var totalAssists = stats.Sum(s => s.Assists);
        var avgRating = stats.Count > 0 ? stats.Average(s => (double)s.Rating) : 0;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - player.BirthDate.Year - (today < player.BirthDate.AddYears(today.Year - player.BirthDate.Year) ? 1 : 0);

        QuestPDF.Settings.License = LicenseType.Community;
        var tempFile = Path.GetTempFileName();

        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(36);
                page.Header().Column(h =>
                {
                    h.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("FORTIS GLESNOR GROUP").FontSize(14).Bold().FontColor("#0f4c81");
                            col.Item().Text("Informe Deportivo Completo").FontSize(11).FontColor("#5a6b7d");
                        });
                        row.ConstantItem(120).AlignRight().Text(DateTime.UtcNow.ToString("dd/MM/yyyy")).FontSize(9).FontColor("#5a6b7d");
                    });
                    h.Item().PaddingTop(4).LineHorizontal(1).LineColor("#0f4c81");
                });

                page.Content().PaddingTop(12).Column(col =>
                {
                    col.Spacing(10);

                    // Datos personales
                    col.Item().Text($"{player.FirstName} {player.LastName}").FontSize(20).Bold();
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Posición: {player.MainPosition}").FontSize(10);
                            c.Item().Text($"Nacionalidad: {player.Nationality}").FontSize(10);
                            c.Item().Text($"Edad: {age} años ({player.BirthDate})").FontSize(10);
                            c.Item().Text($"Club actual: {player.CurrentClub ?? "Sin club"}").FontSize(10);
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text($"Estado agencia: {player.AgencyStatus}").FontSize(10);
                            c.Item().Text($"Estado contractual: {player.ContractStatus}").FontSize(10);
                            if (player.HeightCm.HasValue) c.Item().Text($"Altura: {player.HeightCm} cm").FontSize(10);
                            if (player.WeightKg.HasValue) c.Item().Text($"Peso: {player.WeightKg} kg").FontSize(10);
                            if (!string.IsNullOrEmpty(player.PreferredFoot)) c.Item().Text($"Pie dominante: {player.PreferredFoot}").FontSize(10);
                        });
                    });

                    // Resumen estadístico
                    col.Item().PaddingTop(4).Text("Resumen estadístico").FontSize(12).Bold().FontColor("#0f4c81");
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text($"Partidos: {stats.Count}").FontSize(10);
                        row.RelativeItem().Text($"Goles: {totalGoals}").FontSize(10);
                        row.RelativeItem().Text($"Asistencias: {totalAssists}").FontSize(10);
                        row.RelativeItem().Text($"Rating medio: {avgRating:F1}").FontSize(10);
                    });

                    // Estadísticas (tabla)
                    if (stats.Count > 0)
                    {
                        col.Item().PaddingTop(6).Text("Historial de partidos").FontSize(11).Bold();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(3); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });
                            t.Header(h => {
                                foreach (var hdr in new[] { "Fecha", "Rival", "G", "A", "Min", "Rating" })
                                    h.Cell().Background("#eef3f9").Padding(3).Text(hdr).FontSize(9).Bold();
                            });
                            foreach (var s in stats)
                            {
                                t.Cell().Padding(3).Text(s.MatchDate.ToString()).FontSize(9);
                                t.Cell().Padding(3).Text(s.Opponent).FontSize(9);
                                t.Cell().Padding(3).Text(s.Goals.ToString()).FontSize(9);
                                t.Cell().Padding(3).Text(s.Assists.ToString()).FontSize(9);
                                t.Cell().Padding(3).Text(s.MinutesPlayed.ToString()).FontSize(9);
                                t.Cell().Padding(3).Text(s.Rating.ToString("F1")).FontSize(9);
                            }
                        });
                    }

                    // Negociaciones
                    if (negotiations.Count > 0)
                    {
                        col.Item().PaddingTop(6).Text("Negociaciones").FontSize(11).Bold();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(2); c.RelativeColumn(2); c.RelativeColumn(2); });
                            t.Header(h => {
                                foreach (var hdr in new[] { "Club", "Monto", "Estado", "Fecha" })
                                    h.Cell().Background("#eef3f9").Padding(3).Text(hdr).FontSize(9).Bold();
                            });
                            foreach (var n in negotiations)
                            {
                                t.Cell().Padding(3).Text(n.ClubName).FontSize(9);
                                t.Cell().Padding(3).Text($"{n.OfferedAmount:N0} {n.Currency}").FontSize(9);
                                t.Cell().Padding(3).Text(n.Status).FontSize(9);
                                t.Cell().Padding(3).Text(n.OfferDate.ToString()).FontSize(9);
                            }
                        });
                    }

                    // Transferencias
                    if (transfers.Count > 0)
                    {
                        col.Item().PaddingTop(6).Text("Transferencias").FontSize(11).Bold();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(2); c.RelativeColumn(2); c.RelativeColumn(); });
                            t.Header(h => {
                                foreach (var hdr in new[] { "Origen", "Destino", "Tipo", "Estado" })
                                    h.Cell().Background("#eef3f9").Padding(3).Text(hdr).FontSize(9).Bold();
                            });
                            foreach (var tr in transfers)
                            {
                                t.Cell().Padding(3).Text(tr.OriginClub).FontSize(9);
                                t.Cell().Padding(3).Text(tr.DestinationClub).FontSize(9);
                                t.Cell().Padding(3).Text(tr.TransferType).FontSize(9);
                                t.Cell().Padding(3).Text(tr.Status).FontSize(9);
                            }
                        });
                    }

                    // Contratos
                    if (contracts.Count > 0)
                    {
                        col.Item().PaddingTop(6).Text($"Contratos ({contracts.Count})").FontSize(11).Bold();
                        foreach (var c in contracts)
                            col.Item().Text($"  Versión {c.Version}: {c.StartDate} → {c.EndDate} ({c.Status})").FontSize(9);
                    }

                    // Documentos
                    if (documents.Count > 0)
                    {
                        col.Item().PaddingTop(6).Text($"Documentos registrados ({documents.Count})").FontSize(11).Bold();
                        foreach (var d in documents)
                            col.Item().Text($"  {d.DocumentType}: {d.Description} — {d.Status}").FontSize(9);
                    }

                    if (!string.IsNullOrEmpty(player.Notes))
                    {
                        col.Item().PaddingTop(6).Text("Observaciones").FontSize(11).Bold();
                        col.Item().Text(player.Notes).FontSize(9);
                    }
                });

                page.Footer().AlignCenter().Text(txt =>
                {
                    txt.Span("Fortis Glesnor Group · Informe generado el ").FontSize(8).FontColor("#5a6b7d");
                    txt.Span(DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm")).FontSize(8).FontColor("#5a6b7d");
                    txt.Span(" · Página ").FontSize(8).FontColor("#5a6b7d");
                    txt.CurrentPageNumber().FontSize(8).FontColor("#5a6b7d");
                });
            });
        }).GeneratePdf(tempFile);

        var bytes = await File.ReadAllBytesAsync(tempFile, cancellationToken);
        File.Delete(tempFile);
        return (bytes, $"informe_{player.FirstName}_{player.LastName}_{DateTime.UtcNow:yyyyMMdd}.pdf", "application/pdf");
    }

    public async Task<PlayerResponse> UpdateAsync(Guid id, PlayerUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        ValidatePlayerUpdate(request);
        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        player.FirstName = request.FirstName.Trim();
        player.LastName = request.LastName.Trim();
        player.BirthDate = request.BirthDate;
        player.Nationality = request.Nationality.Trim();
        player.MainPosition = request.MainPosition.Trim();
        player.CurrentClub = request.CurrentClub?.Trim();
        player.HeightCm = request.HeightCm;
        player.WeightKg = request.WeightKg;
        player.PreferredFoot = request.PreferredFoot?.Trim();
        player.IdCardNumber = NormalizeOptional(request.IdCardNumber, 60);
        player.City = NormalizeOptional(request.City, 120);
        player.Address = NormalizeOptional(request.Address, 300);
        player.Email = NormalizeOptional(request.Email, 200)?.ToLowerInvariant();
        player.PhoneNumber = NormalizeOptional(request.PhoneNumber, 30);
        player.JerseyNumber = request.JerseyNumber;
        player.AgencyStatus = request.AgencyStatus.Trim();
        player.ContractStatus = request.ContractStatus.Trim();
        player.IsVisible = request.IsVisible;
        player.Notes = request.Notes?.Trim();
        player.UpdatedAtUtc = DateTime.UtcNow;
        player.UpdatedBy = actor;

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Player),
            Action = "Update",
            EntityId = player.Id.ToString(),
            ChangesSummary = $"Se actualizó el jugador {player.FirstName} {player.LastName}.",
            CreatedBy = actor
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(player);
    }

    public async Task<PlayerResponse> UploadPhotoAsync(Guid playerId, Stream fileStream, string contentType, string fileExtension, string actor, CancellationToken cancellationToken)
    {
        var normalizedCt = contentType.Trim().ToLowerInvariant();
        var defaultExt = normalizedCt switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => throw new InvalidOperationException("Formato no permitido. Use JPG, PNG o WEBP.")
        };

        var ext = string.IsNullOrWhiteSpace(fileExtension)
            ? defaultExt
            : (fileExtension.StartsWith('.') ? fileExtension.ToLowerInvariant() : "." + fileExtension.ToLowerInvariant());
        if (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp")
            ext = defaultExt;
        if (ext == ".jpeg")
            ext = ".jpg";

        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == playerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        Directory.CreateDirectory(_photosDirectory);

        foreach (var oldFile in Directory.GetFiles(_photosDirectory, $"{playerId}.*"))
        {
            try { File.Delete(oldFile); }
            catch { /* ignorar bloqueos ocasionales */ }
        }

        var physicalPath = Path.Combine(_photosDirectory, $"{playerId}{ext}");
        await using (var output = File.Create(physicalPath))
            await fileStream.CopyToAsync(output, cancellationToken);

        player.PhotoUrl = $"/uploads/players/{playerId}{ext}";
        player.UpdatedAtUtc = DateTime.UtcNow;
        player.UpdatedBy = actor;

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Player),
            Action = "UpdatePhoto",
            EntityId = player.Id.ToString(),
            ChangesSummary = "Foto del jugador actualizada.",
            CreatedBy = actor
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(player);
    }

    public async Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        TryDeletePhotoFiles(id);

        _dbContext.Players.Remove(player);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Player),
            Action = "Delete",
            EntityId = player.Id.ToString(),
            ChangesSummary = $"Se eliminó el jugador {player.FirstName} {player.LastName}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private string? ResolvePlayerPhotoPath(Guid playerId)
    {
        if (!Directory.Exists(_photosDirectory))
            return null;
        var match = Directory.GetFiles(_photosDirectory, $"{playerId}.*").FirstOrDefault();
        return match is not null && File.Exists(match) ? match : null;
    }

    private void TryDeletePhotoFiles(Guid playerId)
    {
        try
        {
            if (!Directory.Exists(_photosDirectory))
                return;
            foreach (var oldFile in Directory.GetFiles(_photosDirectory, $"{playerId}.*"))
            {
                try { File.Delete(oldFile); }
                catch { /* ignorar */ }
            }
        }
        catch { /* ignorar */ }
    }

    private static PlayerResponse ToResponse(Player player) =>
        new(player.Id, player.FirstName, player.LastName, player.BirthDate, player.Nationality, player.MainPosition, player.CurrentClub, player.HeightCm, player.WeightKg, player.PreferredFoot, player.AgencyStatus, player.ContractStatus, player.IsVisible, player.Notes, player.PhotoUrl, player.IdCardNumber, player.City, player.Address, player.Email, player.PhoneNumber, player.JerseyNumber);

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static void ValidatePlayerCreate(PlayerCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new InvalidOperationException("El nombre y apellido del jugador son obligatorios.");
        }

        if (request.BirthDate > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidOperationException("La fecha de nacimiento no puede estar en el futuro.");
        }
    }

    private static void ValidatePlayerUpdate(PlayerUpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new InvalidOperationException("El nombre y apellido del jugador son obligatorios.");
        }

        if (string.IsNullOrWhiteSpace(request.AgencyStatus) || string.IsNullOrWhiteSpace(request.ContractStatus))
        {
            throw new InvalidOperationException("Los estados del jugador son obligatorios.");
        }
    }
}

public class ContractService : IContractService
{
    private readonly AppDbContext _dbContext;
    private readonly string _storageRoot;
    private readonly ContratoRepresentacionGenerator _contratoRepresentacion;

    public ContractService(
        AppDbContext dbContext,
        IConfiguration configuration,
        ContratoRepresentacionGenerator contratoRepresentacion)
    {
        _dbContext = dbContext;
        _storageRoot = configuration["Storage:RootPath"] ?? "storage";
        _contratoRepresentacion = contratoRepresentacion;
    }

    public async Task<ContractGenerateResult> GenerateAsync(GenerateContractRequest request, string actor, CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == request.PlayerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        ContratoRepresentacionGenerator.ValidarDatosMinimos(player);

        var currentMaxVersion = await _dbContext.RepresentationContracts
            .Where(x => x.PlayerId == player.Id)
            .MaxAsync(x => (int?)x.Version, cancellationToken) ?? 0;
        var nextVersion = currentMaxVersion + 1;

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var durationYears = request.DurationYears.GetValueOrDefault(2);
        if (durationYears < 1) durationYears = 1;
        if (durationYears > 30) durationYears = 30;
        var endDate = startDate.AddYears(durationYears);
        var contractDirectory = Path.Combine(_storageRoot, "contracts");
        Directory.CreateDirectory(contractDirectory);
        var fileName = $"contrato_representacion_{player.LastName}_{player.FirstName}_v{nextVersion}.pdf";
        var fullPath = Path.Combine(contractDirectory, fileName);

        var pdfBytes = await _contratoRepresentacion.GenerarPdfAsync(player, durationYears, cancellationToken);
        await File.WriteAllBytesAsync(fullPath, pdfBytes, cancellationToken);
        var downloadName = $"Contrato_Representacion_{player.LastName}_{player.FirstName}.pdf";

        var entity = new RepresentationContract
        {
            PlayerId = player.Id,
            IssuedAt = startDate,
            StartDate = startDate,
            EndDate = endDate,
            Status = "Vigente",
            Version = nextVersion,
            PdfPath = fullPath,
            CreatedBy = actor
        };

        player.ContractStatus = "Vigente";
        _dbContext.RepresentationContracts.Add(entity);
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Contrato generado",
            Message = $"Se generó contrato v{entity.Version} para {player.FirstName} {player.LastName}.",
            Priority = "Media",
            RelatedPlayerId = player.Id,
            CreatedBy = actor
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(RepresentationContract),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Contrato versión {entity.Version} con vigencia hasta {entity.EndDate}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        var response = new ContractResponse(entity.Id, entity.PlayerId, entity.IssuedAt, entity.StartDate, entity.EndDate, entity.Status, entity.Version);
        return new ContractGenerateResult(response, pdfBytes, downloadName);
    }

    public async Task<(byte[] Content, string FileName)> GenerateRepresentationPdfAsync(Guid playerId, int? durationYears, CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == playerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");
        ContratoRepresentacionGenerator.ValidarDatosMinimos(player);
        var años = durationYears.GetValueOrDefault(2);
        if (años < 1) años = 1;
        if (años > 30) años = 30;
        var pdf = await _contratoRepresentacion.GenerarPdfAsync(player, años, cancellationToken);
        var fileName = $"Contrato_Representacion_{player.LastName}_{player.FirstName}.pdf";
        return (pdf, fileName);
    }

    public async Task<IReadOnlyList<ContractResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        return await _dbContext.RepresentationContracts
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.Version)
            .Select(x => new ContractResponse(x.Id, x.PlayerId, x.IssuedAt, x.StartDate, x.EndDate, x.Status, x.Version))
            .ToListAsync(cancellationToken);
    }

    public async Task<(byte[] Content, string FileName)?> DownloadAsync(Guid contractId, CancellationToken cancellationToken)
    {
        var contract = await _dbContext.RepresentationContracts.FirstOrDefaultAsync(x => x.Id == contractId, cancellationToken);
        if (contract is null || !File.Exists(contract.PdfPath))
        {
            return null;
        }

        return (await File.ReadAllBytesAsync(contract.PdfPath, cancellationToken), Path.GetFileName(contract.PdfPath));
    }
}

public class DocumentService : IDocumentService
{
    private readonly AppDbContext _dbContext;
    private readonly string _storageRoot;

    public DocumentService(AppDbContext dbContext, IConfiguration configuration, IHostEnvironment hostEnvironment)
    {
        _dbContext = dbContext;
        var configured = configuration["Storage:RootPath"] ?? "storage";
        _storageRoot = Path.IsPathRooted(configured)
            ? configured
            : Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, configured));
        Directory.CreateDirectory(_storageRoot);
    }

    private string ResolveDocumentFilePath(string storedPath)
    {
        if (string.IsNullOrWhiteSpace(storedPath))
            return storedPath;

        if (File.Exists(storedPath))
            return Path.GetFullPath(storedPath);

        var candidates = new List<string>();
        if (!Path.IsPathRooted(storedPath))
        {
            candidates.Add(Path.Combine(_storageRoot, storedPath));
            var normalized = storedPath.Replace('\\', '/').TrimStart('/');
            if (normalized.StartsWith("storage/", StringComparison.OrdinalIgnoreCase))
                normalized = normalized["storage/".Length..];
            candidates.Add(Path.Combine(_storageRoot, normalized.Replace('/', Path.DirectorySeparatorChar)));
        }

        var documentsIdx = storedPath.IndexOf("documents", StringComparison.OrdinalIgnoreCase);
        if (documentsIdx >= 0)
        {
            var suffix = storedPath[documentsIdx..].Replace('/', Path.DirectorySeparatorChar);
            candidates.Add(Path.Combine(_storageRoot, suffix));
        }

        foreach (var candidate in candidates)
        {
            var full = Path.GetFullPath(candidate);
            if (File.Exists(full))
                return full;
        }

        return storedPath;
    }

    public async Task<PlayerDocumentResponse> UploadAsync(UploadPlayerDocumentRequest request, Stream stream, string originalFileName, string actor, CancellationToken cancellationToken)
    {
        var playerExists = await _dbContext.Players.AnyAsync(x => x.Id == request.PlayerId, cancellationToken);
        if (!playerExists)
        {
            throw new KeyNotFoundException("Jugador no encontrado.");
        }

        if (request.TransferId is Guid transferId)
        {
            var transfer = await _dbContext.Transfers
                .FirstOrDefaultAsync(x => x.Id == transferId && x.PlayerId == request.PlayerId, cancellationToken)
                ?? throw new InvalidOperationException("La transferencia no pertenece al jugador seleccionado.");
            request = request with { RelatedClub = request.RelatedClub ?? transfer.DestinationClub };
        }

        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".pdf", ".jpg", ".jpeg", ".png", ".webp" };
        if (!allowed.Contains(extension))
        {
            throw new InvalidOperationException("Formato no permitido. Use PDF o imagen (JPG, PNG, WEBP).");
        }

        if (request.TransferId is Guid linkedTransferId)
        {
            var previos = await _dbContext.PlayerDocuments
                .Where(d => d.TransferId == linkedTransferId && d.DocumentType == DocumentTypes.ContratoConElClub)
                .ToListAsync(cancellationToken);
            foreach (var prev in previos)
            {
                var prevPath = ResolveDocumentFilePath(prev.FilePath);
                if (File.Exists(prevPath)) File.Delete(prevPath);
                _dbContext.PlayerDocuments.Remove(prev);
            }
        }

        var directory = Path.Combine(_storageRoot, "documents", request.PlayerId.ToString());
        Directory.CreateDirectory(directory);
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.GetFullPath(Path.Combine(directory, fileName));
        await using (var output = File.Create(fullPath))
        {
            await stream.CopyToAsync(output, cancellationToken);
        }

        var entity = new PlayerDocument
        {
            PlayerId = request.PlayerId,
            DocumentType = request.DocumentType,
            Description = request.Description,
            IssuedAt = request.IssuedAt,
            ExpirationDate = request.ExpirationDate,
            RelatedClub = request.RelatedClub,
            TransferId = request.TransferId,
            Status = request.Status,
            OriginalFileName = originalFileName,
            FilePath = fullPath,
            CreatedBy = actor
        };

        _dbContext.PlayerDocuments.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerDocument),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Se cargó documento {entity.DocumentType} para jugador {entity.PlayerId}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new PlayerDocumentResponse(entity.Id, entity.PlayerId, entity.DocumentType, entity.Description, entity.OriginalFileName, entity.Status, entity.ExpirationDate);
    }

    public async Task<IReadOnlyList<PlayerDocumentResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        return await _dbContext.PlayerDocuments
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new PlayerDocumentResponse(x.Id, x.PlayerId, x.DocumentType, x.Description, x.OriginalFileName, x.Status, x.ExpirationDate))
            .ToListAsync(cancellationToken);
    }

    public async Task<(byte[] Content, string FileName, string ContentType)?> DownloadAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PlayerDocuments.FirstOrDefaultAsync(x => x.Id == documentId, cancellationToken);
        if (entity is null)
            return null;

        var filePath = ResolveDocumentFilePath(entity.FilePath);
        if (!File.Exists(filePath))
            return null;

        var extension = Path.GetExtension(entity.OriginalFileName);
        if (string.IsNullOrEmpty(extension))
            extension = Path.GetExtension(filePath);

        var downloadName = string.IsNullOrWhiteSpace(entity.OriginalFileName)
            ? Path.GetFileName(filePath)
            : entity.OriginalFileName;
        var contentType = ContentTypeForExtension(extension);
        return (await File.ReadAllBytesAsync(filePath, cancellationToken), downloadName, contentType);
    }

    private static string ContentTypeForExtension(string extension) => extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        _ => "application/pdf"
    };
}

public class NegotiationService : INegotiationService
{
    private static readonly string[] EstadosNegociacionValidos =
    [
        "EnAnalisis",
        "NegociandoOferta",
        "NegociandoContraOferta",
        "NegociacionCompletada"
    ];

    private static readonly Dictionary<string, string> MapeoEstadoNegociacionLegado =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["EnNegociacion"] = "NegociandoOferta",
            ["PendienteFirma"] = "NegociandoContraOferta",
            ["Completada"] = "NegociacionCompletada",
        };

    private readonly AppDbContext _dbContext;

    public NegotiationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private static string NormalizeStatus(string status)
    {
        var trimmed = status.Trim();
        if (MapeoEstadoNegociacionLegado.TryGetValue(trimmed, out var legado))
        {
            return legado;
        }

        return EstadosNegociacionValidos.FirstOrDefault(
            x => x.Equals(trimmed, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException(
                "Estado no válido. Use: EnAnalisis, NegociandoOferta, NegociandoContraOferta o NegociacionCompletada.");
    }

    private static string CanonicalizarEstadoAlmacenado(string status)
    {
        var trimmed = status.Trim();
        if (MapeoEstadoNegociacionLegado.TryGetValue(trimmed, out var legado))
        {
            return legado;
        }

        return EstadosNegociacionValidos.FirstOrDefault(
            x => x.Equals(trimmed, StringComparison.OrdinalIgnoreCase))
            ?? trimmed;
    }

    public async Task<NegotiationResponse> CreateAsync(
        NegotiationCreateRequest request,
        string actorEmail,
        string? actorDisplayName,
        CancellationToken cancellationToken)
    {
        ValidarTerminosOferta(request.MonthlyAmount, request.InstallmentsPerYear, request.ContractYears, request.ClubName);

        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == request.PlayerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        var responsable = await ResolveResponsibleNameAsync(request.ResponsibleName, actorEmail, actorDisplayName, cancellationToken);

        var entity = new Negotiation
        {
            PlayerId = request.PlayerId,
            ClubName = request.ClubName.Trim(),
            Currency = request.Currency.Trim(),
            OfferDate = request.OfferDate,
            ResponsibleName = responsable,
            Status = "EnAnalisis",
            CreatedBy = actorEmail
        };
        AplicarTerminosOferta(entity, request);
        entity.Conditions = string.IsNullOrWhiteSpace(request.Conditions)
            ? ResumenCondicionesOferta(entity)
            : request.Conditions.Trim();

        _dbContext.Negotiations.Add(entity);
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Nueva negociación",
            Message = $"Nueva negociación para {player.FirstName} {player.LastName} con club {entity.ClubName}.",
            Priority = "Alta",
            RelatedPlayerId = player.Id,
            CreatedBy = actorEmail
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Negociación creada en estado {entity.Status}.",
            CreatedBy = actorEmail
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        await EnsureInitialOfferVersionAsync(entity, actorEmail, cancellationToken);
        return (await GetByIdAsync(entity.Id, cancellationToken))!;
    }

    public async Task<IReadOnlyList<NegotiationResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var rows = await BuildNegotiationQuery(_dbContext.Negotiations.Where(x => x.PlayerId == playerId))
            .ToListAsync(cancellationToken);

        return rows
            .OrderByDescending(x => x.Negotiation.CreatedAtUtc)
            .Select(MapRow)
            .ToList();
    }

    public async Task<PagedResult<NegotiationResponse>> GetPagedAsync(string? status, string? club, int page, int pageSize, CancellationToken cancellationToken)
    {
        var safePage = page <= 0 ? 1 : page;
        var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);
        var query = _dbContext.Negotiations.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLower();
            query = query.Where(x => x.Status.ToLower() == normalized);
        }

        if (!string.IsNullOrWhiteSpace(club))
        {
            var normalized = club.Trim().ToLower();
            query = query.Where(x => x.ClubName.ToLower().Contains(normalized));
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var pageIds = await query
            .OrderByDescending(x => x.OfferDate)
            .ThenByDescending(x => x.CreatedAtUtc)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        var rows = await BuildNegotiationQuery(_dbContext.Negotiations.Where(x => pageIds.Contains(x.Id)))
            .ToListAsync(cancellationToken);
        var rowById = rows.ToDictionary(x => x.Negotiation.Id);
        var items = pageIds
            .Where(rowById.ContainsKey)
            .Select(id => MapRow(rowById[id]))
            .ToList();
        return new PagedResult<NegotiationResponse>(items, safePage, safePageSize, totalItems);
    }

    public async Task<NegotiationResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var row = await BuildNegotiationQuery(_dbContext.Negotiations.Where(x => x.Id == id))
            .FirstOrDefaultAsync(cancellationToken);
        return row is null ? null : MapRow(row);
    }

    public async Task<NegotiationResponse> UpdateStatusAsync(Guid id, string status, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Negotiations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        var normalized = NormalizeStatus(status);
        if (string.Equals(entity.Status, normalized, StringComparison.OrdinalIgnoreCase))
        {
            return (await GetByIdAsync(id, cancellationToken))!;
        }

        entity.Status = normalized;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;

        _dbContext.Notifications.Add(new Notification
        {
            Title = "Estado de negociación actualizado",
            Message = $"La oferta con {entity.ClubName} pasó a estado {normalized}.",
            Priority = "Media",
            RelatedPlayerId = entity.PlayerId,
            CreatedBy = actor
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "UpdateStatus",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Estado actualizado a {normalized}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<NegotiationResponse> UpdateAsync(Guid id, NegotiationUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Negotiations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");
        ValidarTerminosOferta(request.MonthlyAmount, request.InstallmentsPerYear, request.ContractYears, request.ClubName);

        entity.ClubName = request.ClubName.Trim();
        entity.Currency = request.Currency.Trim();
        AplicarTerminosOferta(entity, request);
        entity.Conditions = ResumenCondicionesOferta(entity);
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "Update",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Negociación actualizada para club {entity.ClubName}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Negotiations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        _dbContext.Negotiations.Remove(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "Delete",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Negociación eliminada.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<NegotiationInteractionResponse> AddInteractionAsync(NegotiationInteractionCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var negotiation = await _dbContext.Negotiations.FirstOrDefaultAsync(x => x.Id == request.NegotiationId, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        var interaction = new NegotiationInteraction
        {
            NegotiationId = negotiation.Id,
            InteractionType = request.InteractionType.Trim(),
            Summary = request.Summary.Trim(),
            NextStep = request.NextStep.Trim(),
            UpdatedStatus = request.UpdatedStatus.Trim(),
            CreatedBy = actor
        };

        negotiation.Status = request.UpdatedStatus.Trim();
        negotiation.UpdatedAtUtc = DateTime.UtcNow;
        negotiation.UpdatedBy = actor;

        _dbContext.NegotiationInteractions.Add(interaction);
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Negociación actualizada",
            Message = $"La negociación {negotiation.Id} cambió a estado {negotiation.Status}.",
            Priority = "Media",
            RelatedPlayerId = negotiation.PlayerId,
            CreatedBy = actor
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "UpdateStatus",
            EntityId = negotiation.Id.ToString(),
            ChangesSummary = $"Estado actualizado a {negotiation.Status}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new NegotiationInteractionResponse(interaction.Id, interaction.NegotiationId, interaction.InteractionAtUtc, interaction.InteractionType, interaction.Summary, interaction.NextStep, interaction.UpdatedStatus);
    }

    public async Task<IReadOnlyList<NegotiationInteractionResponse>> GetInteractionsAsync(Guid negotiationId, CancellationToken cancellationToken)
    {
        return await _dbContext.NegotiationInteractions
            .Where(x => x.NegotiationId == negotiationId)
            .OrderByDescending(x => x.InteractionAtUtc)
            .Select(x => new NegotiationInteractionResponse(x.Id, x.NegotiationId, x.InteractionAtUtc, x.InteractionType, x.Summary, x.NextStep, x.UpdatedStatus))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<NegotiationConversationResponse>> GetConversationsAsync(
        Guid negotiationId,
        CancellationToken cancellationToken)
    {
        var negotiation = await _dbContext.Negotiations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == negotiationId, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        return await GetConversationsByPlayerAsync(negotiation.PlayerId, cancellationToken);
    }

    public async Task<IReadOnlyList<NegotiationConversationResponse>> GetConversationsByPlayerAsync(
        Guid playerId,
        CancellationToken cancellationToken)
    {
        var existe = await _dbContext.Players.AnyAsync(x => x.Id == playerId, cancellationToken);
        if (!existe)
        {
            throw new KeyNotFoundException("Jugador no encontrado.");
        }

        var rows = await (
            from c in _dbContext.NegotiationConversations.AsNoTracking()
            join p in _dbContext.Players on c.PlayerId equals p.Id
            join n in _dbContext.Negotiations on c.NegotiationId equals n.Id into negociaciones
            from n in negociaciones.DefaultIfEmpty()
            where c.PlayerId == playerId
            orderby c.OccurredAtUtc descending, c.CreatedAtUtc descending
            select new
            {
                c,
                PlayerName = p.FirstName + " " + p.LastName,
                Status = n != null ? n.Status : null
            }
        ).ToListAsync(cancellationToken);

        return rows.Select(x => MapConversation(x.c, x.PlayerName.Trim(), x.Status)).ToList();
    }

    public async Task<NegotiationConversationResponse> AddConversationAsync(
        Guid negotiationId,
        NegotiationConversationCreateRequest request,
        string actorEmail,
        string? actorDisplayName,
        CancellationToken cancellationToken)
    {
        var negotiation = await _dbContext.Negotiations.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == negotiationId, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        var club = string.IsNullOrWhiteSpace(request.ClubName) ? negotiation.ClubName : request.ClubName.Trim();
        return await CrearConversacionJugadorAsync(
            negotiation.PlayerId,
            request with { ClubName = club },
            actorEmail,
            actorDisplayName,
            negotiation.Id,
            cancellationToken);
    }

    public Task<NegotiationConversationResponse> AddConversationForPlayerAsync(
        Guid playerId,
        NegotiationConversationCreateRequest request,
        string actorEmail,
        string? actorDisplayName,
        CancellationToken cancellationToken) =>
        CrearConversacionJugadorAsync(playerId, request, actorEmail, actorDisplayName, null, cancellationToken);

    private async Task<NegotiationConversationResponse> CrearConversacionJugadorAsync(
        Guid playerId,
        NegotiationConversationCreateRequest request,
        string actorEmail,
        string? actorDisplayName,
        Guid? negotiationIdHint,
        CancellationToken cancellationToken)
    {
        var player = await _dbContext.Players.FirstOrDefaultAsync(x => x.Id == playerId, cancellationToken)
            ?? throw new KeyNotFoundException("Jugador no encontrado.");

        if (string.IsNullOrWhiteSpace(request.ClubName))
        {
            throw new InvalidOperationException("Indica el club relacionado con esta conversación.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new InvalidOperationException("El contenido de la conversación es obligatorio.");
        }

        var clubName = request.ClubName.Trim();
        var tipo = NormalizarTipoConversacion(request.ConversationType);

        Guid? negotiationId = negotiationIdHint;
        if (negotiationId is null)
        {
            negotiationId = await _dbContext.Negotiations
                .Where(x => x.PlayerId == playerId && x.ClubName.ToLower() == clubName.ToLower())
                .OrderByDescending(x => x.OfferDate)
                .Select(x => (Guid?)x.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        Negotiation? negotiation = null;
        if (negotiationId is not null)
        {
            negotiation = await _dbContext.Negotiations.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == negotiationId, cancellationToken);
        }

        var entity = new NegotiationConversation
        {
            PlayerId = player.Id,
            ClubName = clubName,
            NegotiationId = negotiationId,
            ConversationType = tipo,
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? null : request.Subject.Trim(),
            Content = request.Content.Trim(),
            Participants = string.IsNullOrWhiteSpace(request.Participants) ? null : request.Participants.Trim(),
            OccurredAtUtc = request.OccurredAtUtc ?? DateTime.UtcNow,
            CreatedBy = !string.IsNullOrWhiteSpace(actorDisplayName) ? actorDisplayName.Trim() : actorEmail
        };

        _dbContext.NegotiationConversations.Add(entity);
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Nueva nota en historial",
            Message = $"{EtiquetaTipoConversacion(tipo)} con {clubName} ({player.FirstName} {player.LastName}).",
            Priority = "Baja",
            RelatedPlayerId = player.Id,
            CreatedBy = actorEmail
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(NegotiationConversation),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Conversación ({tipo}) — {clubName}.",
            CreatedBy = actorEmail
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        var playerName = $"{player.FirstName} {player.LastName}".Trim();
        return MapConversation(entity, playerName, negotiation?.Status);
    }

    public async Task DeleteConversationAsync(Guid conversationId, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.NegotiationConversations.FirstOrDefaultAsync(x => x.Id == conversationId, cancellationToken)
            ?? throw new KeyNotFoundException("Registro de conversación no encontrado.");

        _dbContext.NegotiationConversations.Remove(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(NegotiationConversation),
            Action = "Delete",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Conversación eliminada del historial.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static NegotiationConversationResponse MapConversation(
        NegotiationConversation c,
        string? playerFullName = null,
        string? negotiationStatus = null) =>
        new(
            c.Id,
            c.PlayerId,
            c.NegotiationId,
            c.ConversationType,
            EtiquetaTipoConversacion(c.ConversationType),
            c.Subject,
            c.Content,
            c.Participants,
            c.OccurredAtUtc,
            c.CreatedBy ?? string.Empty,
            c.CreatedAtUtc,
            c.ClubName,
            playerFullName,
            negotiationStatus);

    private static string NormalizarTipoConversacion(string conversationType)
    {
        var key = conversationType.Trim().ToLowerInvariant();
        return key switch
        {
            "mensaje" => "Mensaje",
            "correo" => "Correo",
            "reunion" or "reunión" => "Reunion",
            "comentariointerno" or "comentario" or "interno" => "ComentarioInterno",
            _ => throw new InvalidOperationException(
                "Tipo no válido. Use: Mensaje, Correo, Reunion o ComentarioInterno.")
        };
    }

    private static string EtiquetaTipoConversacion(string conversationType) =>
        conversationType switch
        {
            "Mensaje" => "Mensaje / chat",
            "Correo" => "Correo electrónico",
            "Reunion" => "Reunión",
            "ComentarioInterno" => "Comentario interno",
            _ => conversationType
        };

    public async Task<IReadOnlyList<NegotiationOfferVersionResponse>> GetOfferVersionsAsync(Guid negotiationId, CancellationToken cancellationToken)
    {
        var existe = await _dbContext.Negotiations.AnyAsync(x => x.Id == negotiationId, cancellationToken);
        if (!existe)
        {
            throw new KeyNotFoundException("Negociación no encontrada.");
        }

        var rows = await _dbContext.NegotiationOfferVersions
            .AsNoTracking()
            .Where(x => x.NegotiationId == negotiationId)
            .OrderBy(x => x.VersionNumber)
            .ToListAsync(cancellationToken);

        return rows.Select(MapOfferVersion).ToList();
    }

    public async Task<NegotiationResponse> RegisterOfferVersionAsync(
        Guid negotiationId,
        NegotiationOfferVersionRegisterRequest request,
        string actorEmail,
        string? actorDisplayName,
        CancellationToken cancellationToken)
    {
        var negotiation = await _dbContext.Negotiations
            .Include(x => x.OfferVersions)
            .FirstOrDefaultAsync(x => x.Id == negotiationId, cancellationToken)
            ?? throw new KeyNotFoundException("Negociación no encontrada.");

        if (string.Equals(negotiation.Status, "NegociacionCompletada", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("No se pueden registrar versiones en una negociación completada.");
        }

        var proposedBy = NormalizarProposedBy(request.ProposedBy);
        ValidarTerminosOferta(request.MonthlyAmount, request.InstallmentsPerYear, request.ContractYears, request.ClubName);

        var nextVersion = negotiation.OfferVersions.Count > 0
            ? negotiation.OfferVersions.Max(x => x.VersionNumber) + 1
            : negotiation.CurrentVersionNumber > 0 ? negotiation.CurrentVersionNumber + 1 : 1;

        var offerDate = request.OfferDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var version = new NegotiationOfferVersion
        {
            NegotiationId = negotiation.Id,
            VersionNumber = nextVersion,
            ProposedBy = proposedBy,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            ClubName = request.ClubName.Trim(),
            Currency = request.Currency.Trim(),
            OfferDate = offerDate,
            RegisteredAtUtc = DateTime.UtcNow,
            CreatedBy = actorEmail
        };
        AplicarTerminosOferta(version, request);

        negotiation.ClubName = version.ClubName;
        negotiation.Currency = version.Currency;
        negotiation.OfferDate = offerDate;
        AplicarTerminosOferta(negotiation, request);
        negotiation.Conditions = ResumenCondicionesOferta(negotiation);
        negotiation.CurrentVersionNumber = nextVersion;
        negotiation.Status = "NegociandoContraOferta";
        negotiation.UpdatedAtUtc = DateTime.UtcNow;
        negotiation.UpdatedBy = actorEmail;

        _dbContext.NegotiationOfferVersions.Add(version);
        _dbContext.NegotiationInteractions.Add(new NegotiationInteraction
        {
            NegotiationId = negotiation.Id,
            InteractionType = "Contraoferta",
            Summary = $"{EtiquetaProposedBy(proposedBy)} (v{nextVersion}): {negotiation.Conditions}",
            NextStep = "Revisar condiciones y responder",
            UpdatedStatus = negotiation.Status,
            CreatedBy = actorEmail
        });
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Nueva versión de oferta",
            Message = $"Negociación con {negotiation.ClubName}: {EtiquetaProposedBy(proposedBy)} registrada (v{nextVersion}).",
            Priority = "Alta",
            RelatedPlayerId = negotiation.PlayerId,
            CreatedBy = actorEmail
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Negotiation),
            Action = "RegisterOfferVersion",
            EntityId = negotiation.Id.ToString(),
            ChangesSummary = $"Versión {nextVersion} ({proposedBy}) registrada.",
            CreatedBy = actorEmail
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(negotiationId, cancellationToken))!;
    }

    private async Task EnsureInitialOfferVersionAsync(Negotiation negotiation, string actor, CancellationToken cancellationToken)
    {
        var yaTiene = await _dbContext.NegotiationOfferVersions
            .AnyAsync(x => x.NegotiationId == negotiation.Id, cancellationToken);
        if (yaTiene)
        {
            return;
        }

        var version = new NegotiationOfferVersion
        {
            NegotiationId = negotiation.Id,
            VersionNumber = 1,
            ProposedBy = "Inicial",
            ClubName = negotiation.ClubName,
            Currency = negotiation.Currency,
            OfferDate = negotiation.OfferDate,
            RegisteredAtUtc = negotiation.CreatedAtUtc,
            CreatedBy = actor
        };
        CopiarTerminosDesdeNegociacion(version, negotiation);
        negotiation.CurrentVersionNumber = 1;
        _dbContext.NegotiationOfferVersions.Add(version);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> ResolveResponsibleNameAsync(
        string? requestedName,
        string actorEmail,
        string? actorDisplayName,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(requestedName))
        {
            return requestedName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(actorDisplayName))
        {
            return actorDisplayName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(actorEmail))
        {
            var user = await _dbContext.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == actorEmail, cancellationToken);
            if (!string.IsNullOrWhiteSpace(user?.FullName))
            {
                return user.FullName.Trim();
            }

            return actorEmail.Trim();
        }

        return "Sistema";
    }

    private sealed record NegotiationRow(
        Negotiation Negotiation,
        string? CreatorName,
        string PlayerFirstName,
        string PlayerLastName);

    private IQueryable<NegotiationRow> BuildNegotiationQuery(IQueryable<Negotiation> negotiations) =>
        from n in negotiations
        join p in _dbContext.Players on n.PlayerId equals p.Id
        join u in _dbContext.Users on n.CreatedBy equals u.Email into creators
        from u in creators.DefaultIfEmpty()
        select new NegotiationRow(n, u != null ? u.FullName : null, p.FirstName, p.LastName);

    private static NegotiationResponse MapRow(NegotiationRow row)
    {
        row.Negotiation.Status = CanonicalizarEstadoAlmacenado(row.Negotiation.Status);
        return ToResponse(row.Negotiation, row.CreatorName, $"{row.PlayerFirstName} {row.PlayerLastName}".Trim());
    }

    private static NegotiationResponse ToResponse(
        Negotiation negotiation,
        string? creatorFullName = null,
        string? playerFullName = null)
    {
        var responsible = negotiation.ResponsibleName;
        if (string.IsNullOrWhiteSpace(responsible)
            || string.Equals(responsible, "Representante Principal", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(creatorFullName))
            {
                responsible = creatorFullName.Trim();
            }
            else if (!string.IsNullOrWhiteSpace(negotiation.CreatedBy))
            {
                responsible = negotiation.CreatedBy;
            }
        }

        var monthly = negotiation.MonthlyAmount > 0 ? negotiation.MonthlyAmount : negotiation.OfferedAmount;

        return new NegotiationResponse(
            negotiation.Id,
            negotiation.PlayerId,
            negotiation.ClubName,
            monthly,
            monthly,
            negotiation.InstallmentsPerYear > 0 ? negotiation.InstallmentsPerYear : 12,
            negotiation.ContractYears > 0 ? negotiation.ContractYears : 1,
            negotiation.Currency,
            negotiation.Status,
            responsible,
            negotiation.OfferDate,
            negotiation.HasHousingBonus,
            string.IsNullOrWhiteSpace(negotiation.HousingBonusNotes) ? null : negotiation.HousingBonusNotes.Trim(),
            negotiation.HasObjectiveBonus,
            string.IsNullOrWhiteSpace(negotiation.ObjectiveBonusNotes) ? null : negotiation.ObjectiveBonusNotes.Trim(),
            negotiation.HasGoalBonus,
            string.IsNullOrWhiteSpace(negotiation.GoalBonusNotes) ? null : negotiation.GoalBonusNotes.Trim(),
            negotiation.HasSigningBonus,
            string.IsNullOrWhiteSpace(negotiation.SigningBonusNotes) ? null : negotiation.SigningBonusNotes.Trim(),
            playerFullName,
            negotiation.Conditions,
            negotiation.CurrentVersionNumber > 0 ? negotiation.CurrentVersionNumber : 1);
    }

    private static NegotiationOfferVersionResponse MapOfferVersion(NegotiationOfferVersion v) =>
        new(
            v.Id,
            v.NegotiationId,
            v.VersionNumber,
            v.ProposedBy,
            EtiquetaProposedBy(v.ProposedBy),
            v.Notes,
            v.ClubName,
            v.MonthlyAmount,
            v.InstallmentsPerYear,
            v.ContractYears,
            v.HasHousingBonus,
            v.HousingBonusNotes ?? string.Empty,
            v.HasObjectiveBonus,
            v.ObjectiveBonusNotes ?? string.Empty,
            v.HasGoalBonus,
            v.GoalBonusNotes ?? string.Empty,
            v.HasSigningBonus,
            v.SigningBonusNotes ?? string.Empty,
            v.Currency,
            v.OfferDate,
            ResumenCondicionesOferta(v),
            v.RegisteredAtUtc,
            v.CreatedBy ?? string.Empty);

    private static string EtiquetaProposedBy(string proposedBy) =>
        proposedBy.Trim().ToLowerInvariant() switch
        {
            "club" => "Contraoferta del club",
            "agencia" => "Propuesta de la agencia",
            "inicial" => "Oferta inicial",
            _ => proposedBy
        };

    private static string NormalizarProposedBy(string proposedBy)
    {
        var key = proposedBy.Trim().ToLowerInvariant();
        return key switch
        {
            "club" => "Club",
            "agencia" => "Agencia",
            _ => throw new InvalidOperationException("El autor de la propuesta debe ser Club o Agencia.")
        };
    }

    private static void CopiarTerminosDesdeNegociacion(NegotiationOfferVersion version, Negotiation n)
    {
        version.MonthlyAmount = n.MonthlyAmount > 0 ? n.MonthlyAmount : n.OfferedAmount;
        version.InstallmentsPerYear = n.InstallmentsPerYear > 0 ? n.InstallmentsPerYear : 12;
        version.ContractYears = n.ContractYears > 0 ? n.ContractYears : 1;
        version.HasHousingBonus = n.HasHousingBonus;
        version.HousingBonusNotes = n.HousingBonusNotes;
        version.HasObjectiveBonus = n.HasObjectiveBonus;
        version.ObjectiveBonusNotes = n.ObjectiveBonusNotes;
        version.HasGoalBonus = n.HasGoalBonus;
        version.GoalBonusNotes = n.GoalBonusNotes;
        version.HasSigningBonus = n.HasSigningBonus;
        version.SigningBonusNotes = n.SigningBonusNotes;
    }

    private static void AplicarTerminosOferta(NegotiationOfferVersion entity, NegotiationOfferVersionRegisterRequest request)
    {
        entity.MonthlyAmount = request.MonthlyAmount;
        entity.InstallmentsPerYear = request.InstallmentsPerYear;
        entity.ContractYears = request.ContractYears;
        entity.HasHousingBonus = request.HasHousingBonus;
        entity.HousingBonusNotes = request.HasHousingBonus ? (request.HousingBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasObjectiveBonus = request.HasObjectiveBonus;
        entity.ObjectiveBonusNotes = request.HasObjectiveBonus ? (request.ObjectiveBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasGoalBonus = request.HasGoalBonus;
        entity.GoalBonusNotes = request.HasGoalBonus ? (request.GoalBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasSigningBonus = request.HasSigningBonus;
        entity.SigningBonusNotes = request.HasSigningBonus ? (request.SigningBonusNotes ?? string.Empty).Trim() : string.Empty;
    }

    private static void AplicarTerminosOferta(Negotiation entity, NegotiationOfferVersionRegisterRequest request)
    {
        entity.MonthlyAmount = request.MonthlyAmount;
        entity.OfferedAmount = request.MonthlyAmount;
        entity.InstallmentsPerYear = request.InstallmentsPerYear;
        entity.ContractYears = request.ContractYears;
        entity.HasHousingBonus = request.HasHousingBonus;
        entity.HousingBonusNotes = request.HasHousingBonus ? (request.HousingBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasObjectiveBonus = request.HasObjectiveBonus;
        entity.ObjectiveBonusNotes = request.HasObjectiveBonus ? (request.ObjectiveBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasGoalBonus = request.HasGoalBonus;
        entity.GoalBonusNotes = request.HasGoalBonus ? (request.GoalBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasSigningBonus = request.HasSigningBonus;
        entity.SigningBonusNotes = request.HasSigningBonus ? (request.SigningBonusNotes ?? string.Empty).Trim() : string.Empty;
    }

    private static string ResumenCondicionesOferta(NegotiationOfferVersion n)
    {
        var temp = new Negotiation
        {
            MonthlyAmount = n.MonthlyAmount,
            OfferedAmount = n.MonthlyAmount,
            InstallmentsPerYear = n.InstallmentsPerYear,
            ContractYears = n.ContractYears,
            Currency = n.Currency,
            HasHousingBonus = n.HasHousingBonus,
            HousingBonusNotes = n.HousingBonusNotes,
            HasObjectiveBonus = n.HasObjectiveBonus,
            ObjectiveBonusNotes = n.ObjectiveBonusNotes,
            HasGoalBonus = n.HasGoalBonus,
            GoalBonusNotes = n.GoalBonusNotes,
            HasSigningBonus = n.HasSigningBonus,
            SigningBonusNotes = n.SigningBonusNotes
        };
        return ResumenCondicionesOferta(temp);
    }

    private static void ValidarTerminosOferta(decimal monthlyAmount, int installmentsPerYear, int contractYears, string clubName)
    {
        if (monthlyAmount <= 0 || string.IsNullOrWhiteSpace(clubName))
        {
            throw new InvalidOperationException("La negociación debe tener club y monto mensual válido.");
        }

        if (installmentsPerYear is < 1 or > 24)
        {
            throw new InvalidOperationException("Las cuotas por año deben estar entre 1 y 24.");
        }

        if (contractYears is < 1 or > 15)
        {
            throw new InvalidOperationException("La duración del contrato debe estar entre 1 y 15 años.");
        }
    }

    private static void AplicarTerminosOferta(Negotiation entity, NegotiationCreateRequest request)
    {
        entity.MonthlyAmount = request.MonthlyAmount;
        entity.OfferedAmount = request.MonthlyAmount;
        entity.InstallmentsPerYear = request.InstallmentsPerYear;
        entity.ContractYears = request.ContractYears;
        entity.HasHousingBonus = request.HasHousingBonus;
        entity.HousingBonusNotes = request.HasHousingBonus ? (request.HousingBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasObjectiveBonus = request.HasObjectiveBonus;
        entity.ObjectiveBonusNotes = request.HasObjectiveBonus ? (request.ObjectiveBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasGoalBonus = request.HasGoalBonus;
        entity.GoalBonusNotes = request.HasGoalBonus ? (request.GoalBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasSigningBonus = request.HasSigningBonus;
        entity.SigningBonusNotes = request.HasSigningBonus ? (request.SigningBonusNotes ?? string.Empty).Trim() : string.Empty;
    }

    private static void AplicarTerminosOferta(Negotiation entity, NegotiationUpdateRequest request)
    {
        entity.MonthlyAmount = request.MonthlyAmount;
        entity.OfferedAmount = request.MonthlyAmount;
        entity.InstallmentsPerYear = request.InstallmentsPerYear;
        entity.ContractYears = request.ContractYears;
        entity.HasHousingBonus = request.HasHousingBonus;
        entity.HousingBonusNotes = request.HasHousingBonus ? (request.HousingBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasObjectiveBonus = request.HasObjectiveBonus;
        entity.ObjectiveBonusNotes = request.HasObjectiveBonus ? (request.ObjectiveBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasGoalBonus = request.HasGoalBonus;
        entity.GoalBonusNotes = request.HasGoalBonus ? (request.GoalBonusNotes ?? string.Empty).Trim() : string.Empty;
        entity.HasSigningBonus = request.HasSigningBonus;
        entity.SigningBonusNotes = request.HasSigningBonus ? (request.SigningBonusNotes ?? string.Empty).Trim() : string.Empty;
    }

    private static string ResumenCondicionesOferta(Negotiation n)
    {
        var partes = new List<string>
        {
            $"Monto mensual: {n.MonthlyAmount:N0} {n.Currency}",
            $"Cuotas/año: {n.InstallmentsPerYear}",
            $"Duración: {n.ContractYears} año(s)",
            $"Bono vivienda: {(n.HasHousingBonus ? "Sí" : "No")}"
        };
        if (n.HasHousingBonus && !string.IsNullOrWhiteSpace(n.HousingBonusNotes))
        {
            partes.Add($"Detalle vivienda: {n.HousingBonusNotes.Trim()}");
        }

        partes.Add($"Bonos por objetivos: {(n.HasObjectiveBonus ? "Sí" : "No")}");
        if (n.HasObjectiveBonus && !string.IsNullOrWhiteSpace(n.ObjectiveBonusNotes))
        {
            partes.Add($"Detalle objetivos: {n.ObjectiveBonusNotes.Trim()}");
        }

        partes.Add($"Bonos por gol: {(n.HasGoalBonus ? "Sí" : "No")}");
        if (n.HasGoalBonus && !string.IsNullOrWhiteSpace(n.GoalBonusNotes))
        {
            partes.Add($"Detalle goles: {n.GoalBonusNotes.Trim()}");
        }

        partes.Add($"Prima / bono firma: {(n.HasSigningBonus ? "Sí" : "No")}");
        if (n.HasSigningBonus && !string.IsNullOrWhiteSpace(n.SigningBonusNotes))
        {
            partes.Add($"Detalle prima: {n.SigningBonusNotes.Trim()}");
        }

        var totalEstimado = n.MonthlyAmount * n.InstallmentsPerYear * n.ContractYears;
        partes.Add($"Valor total estimado del contrato: {totalEstimado:N0} {n.Currency}");
        return string.Join(" · ", partes);
    }
}

public class TransferService : ITransferService
{
    private readonly AppDbContext _dbContext;
    private readonly IDocumentService _documentService;

    public TransferService(AppDbContext dbContext, IDocumentService documentService)
    {
        _dbContext = dbContext;
        _documentService = documentService;
    }

    public async Task<TransferResponse> CreateAsync(TransferCreateRequest request, string actor, CancellationToken cancellationToken, Stream? clubContractStream = null, string? clubContractFileName = null)
    {
        if (string.IsNullOrWhiteSpace(request.OriginClub) || string.IsNullOrWhiteSpace(request.DestinationClub))
        {
            throw new InvalidOperationException("La transferencia debe tener club origen y destino.");
        }

        var tipo = TransferTypes.Normalize(request.TransferType);
        TransferTypes.ValidateAmount(tipo, request.Amount);

        var playerExists = await _dbContext.Players.AnyAsync(x => x.Id == request.PlayerId, cancellationToken);
        if (!playerExists)
        {
            throw new KeyNotFoundException("Jugador no encontrado.");
        }

        var entity = new Transfer
        {
            PlayerId = request.PlayerId,
            OriginClub = request.OriginClub.Trim(),
            DestinationClub = request.DestinationClub.Trim(),
            TransferDate = request.TransferDate,
            Amount = TransferTypes.RequiresAmount(tipo) ? request.Amount : null,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.Trim(),
            TransferType = tipo,
            Conditions = request.Conditions.Trim(),
            ManagedBy = request.ManagedBy.Trim(),
            Status = TransferTypes.StatusRegistrada,
            CreatedBy = actor
        };

        _dbContext.Transfers.Add(entity);
        _dbContext.Notifications.Add(new Notification
        {
            Title = "Nueva transferencia",
            Message = $"Transferencia creada para jugador {entity.PlayerId} hacia {entity.DestinationClub}.",
            Priority = "Alta",
            RelatedPlayerId = entity.PlayerId,
            CreatedBy = actor
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Transfer),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Transferencia registrada ({entity.TransferType}).",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        Guid? clubContractDocumentId = null;
        if (clubContractStream is not null && !string.IsNullOrWhiteSpace(clubContractFileName))
        {
            var upload = await _documentService.UploadAsync(
                new UploadPlayerDocumentRequest(
                    entity.PlayerId,
                    DocumentTypes.ContratoConElClub,
                    $"Contrato con {entity.DestinationClub}",
                    null,
                    null,
                    entity.DestinationClub,
                    "Vigente",
                    entity.Id),
                clubContractStream,
                clubContractFileName,
                actor,
                cancellationToken);
            clubContractDocumentId = upload.Id;
        }

        return ToResponse(entity, clubContractDocumentId);
    }

    public async Task<IReadOnlyList<TransferResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var transfers = await _dbContext.Transfers
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.TransferDate)
            .ToListAsync(cancellationToken);
        var docMap = await GetClubContractDocumentIdsAsync(transfers.Select(x => x.Id), cancellationToken);
        return transfers.Select(t => ToResponse(t, docMap.GetValueOrDefault(t.Id))).ToList();
    }

    public async Task<PagedResult<TransferResponse>> GetPagedAsync(Guid? playerId, string? club, string? transferType, int page, int pageSize, CancellationToken cancellationToken)
    {
        var safePage = page <= 0 ? 1 : page;
        var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);
        var query = _dbContext.Transfers.AsQueryable();

        if (playerId is { } pid && pid != Guid.Empty)
        {
            query = query.Where(x => x.PlayerId == pid);
        }

        if (!string.IsNullOrWhiteSpace(club))
        {
            var normalized = club.Trim().ToLower();
            query = query.Where(x =>
                x.OriginClub.ToLower().Contains(normalized)
                || x.DestinationClub.ToLower().Contains(normalized));
        }

        if (!string.IsNullOrWhiteSpace(transferType))
        {
            var tipo = TransferTypes.Normalize(transferType);
            query = query.Where(x => x.TransferType == tipo);
        }

        var totalItems = await query.CountAsync(cancellationToken);
        var transfers = await query.OrderByDescending(x => x.TransferDate)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);
        var docMap = await GetClubContractDocumentIdsAsync(transfers.Select(x => x.Id), cancellationToken);
        var items = transfers.Select(t => ToResponse(t, docMap.GetValueOrDefault(t.Id))).ToList();

        return new PagedResult<TransferResponse>(items, safePage, safePageSize, totalItems);
    }

    public async Task<TransferResponse> UpdateAsync(Guid id, TransferUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var transfer = await _dbContext.Transfers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Transferencia no encontrada.");
        if (string.IsNullOrWhiteSpace(request.OriginClub) || string.IsNullOrWhiteSpace(request.DestinationClub))
        {
            throw new InvalidOperationException("La transferencia debe tener club origen y destino.");
        }

        var tipo = TransferTypes.Normalize(request.TransferType);
        TransferTypes.ValidateAmount(tipo, request.Amount);

        transfer.OriginClub = request.OriginClub.Trim();
        transfer.DestinationClub = request.DestinationClub.Trim();
        transfer.TransferDate = request.TransferDate;
        transfer.Amount = TransferTypes.RequiresAmount(tipo) ? request.Amount : null;
        transfer.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.Trim();
        transfer.TransferType = tipo;
        transfer.Conditions = request.Conditions.Trim();
        transfer.ManagedBy = request.ManagedBy.Trim();
        transfer.UpdatedAtUtc = DateTime.UtcNow;
        transfer.UpdatedBy = actor;

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Transfer),
            Action = "Update",
            EntityId = transfer.Id.ToString(),
            ChangesSummary = "Transferencia actualizada.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        var docMap = await GetClubContractDocumentIdsAsync([transfer.Id], cancellationToken);
        return ToResponse(transfer, docMap.GetValueOrDefault(transfer.Id));
    }

    public async Task<TransferResponse> UpdateStatusAsync(Guid transferId, string status, string actor, CancellationToken cancellationToken)
    {
        var transfer = await _dbContext.Transfers.FirstOrDefaultAsync(x => x.Id == transferId, cancellationToken)
            ?? throw new KeyNotFoundException("Transferencia no encontrada.");

        transfer.Status = status.Trim();
        transfer.UpdatedAtUtc = DateTime.UtcNow;
        transfer.UpdatedBy = actor;

        _dbContext.Notifications.Add(new Notification
        {
            Title = "Estado de transferencia actualizado",
            Message = $"La transferencia {transfer.Id} cambió a estado {transfer.Status}.",
            Priority = "Media",
            RelatedPlayerId = transfer.PlayerId,
            CreatedBy = actor
        });
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Transfer),
            Action = "UpdateStatus",
            EntityId = transfer.Id.ToString(),
            ChangesSummary = $"Estado actualizado a {transfer.Status}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        var docMap = await GetClubContractDocumentIdsAsync([transfer.Id], cancellationToken);
        return ToResponse(transfer, docMap.GetValueOrDefault(transfer.Id));
    }

    public async Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var transfer = await _dbContext.Transfers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Transferencia no encontrada.");

        _dbContext.Transfers.Remove(transfer);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Transfer),
            Action = "Delete",
            EntityId = transfer.Id.ToString(),
            ChangesSummary = "Transferencia eliminada.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<Guid, Guid>> GetClubContractDocumentIdsAsync(IEnumerable<Guid> transferIds, CancellationToken cancellationToken)
    {
        var ids = transferIds.Distinct().ToHashSet();
        if (ids.Count == 0) return [];

        var docs = await _dbContext.PlayerDocuments
            .AsNoTracking()
            .Where(d => d.TransferId != null
                && ids.Contains(d.TransferId.Value)
                && d.DocumentType == DocumentTypes.ContratoConElClub)
            .OrderByDescending(d => d.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var result = new Dictionary<Guid, Guid>();
        foreach (var doc in docs)
        {
            if (doc.TransferId is Guid tid && !result.ContainsKey(tid))
                result[tid] = doc.Id;
        }

        return result;
    }

    private static TransferResponse ToResponse(Transfer transfer, Guid? clubContractDocumentId) =>
        new(transfer.Id, transfer.PlayerId, transfer.OriginClub, transfer.DestinationClub, transfer.TransferDate, transfer.Amount, transfer.Currency, transfer.TransferType, transfer.Status, transfer.ManagedBy, clubContractDocumentId);
}

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;

    public NotificationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Notifications
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new NotificationResponse(x.Id, x.Title, x.Message, x.Priority, x.IsRead, x.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var notification = await _dbContext.Notifications.FirstOrDefaultAsync(x => x.Id == notificationId, cancellationToken)
            ?? throw new KeyNotFoundException("Notificación no encontrada.");

        notification.IsRead = true;
        notification.ReadAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> MarkAllAsReadAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        return await _dbContext.Notifications
            .Where(x => !x.IsRead)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAtUtc, now),
                cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(CancellationToken cancellationToken)
        => await _dbContext.Notifications.CountAsync(x => !x.IsRead, cancellationToken);
}

public class AuditService : IAuditService
{
    private readonly AppDbContext _dbContext;

    public AuditService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<AuditLogResponse>> GetFilteredAsync(string? entityName, string? action, string? createdBy, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken cancellationToken)
    {
        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 5, 100);
        var query = _dbContext.AuditLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityName))
            query = query.Where(x => x.EntityName.Contains(entityName));
        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(x => x.Action.Contains(action));
        if (!string.IsNullOrWhiteSpace(createdBy))
            query = query.Where(x => x.CreatedBy != null && x.CreatedBy.Contains(createdBy));
        if (from.HasValue)
            query = query.Where(x => x.ActionAtUtc >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.ActionAtUtc <= to.Value);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.ActionAtUtc)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .Select(x => new AuditLogResponse(x.Id, x.EntityName, x.Action, x.EntityId, x.ChangesSummary, x.CreatedBy, x.ActionAtUtc))
            .ToListAsync(cancellationToken);
        return new PagedResult<AuditLogResponse>(items, safePage, safePageSize, total);
    }
}

public class UserService : IUserService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<AppRole> _roleManager;
    private readonly AppDbContext _dbContext;

    public UserService(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager, AppDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var users = await _userManager.Users.ToListAsync(cancellationToken);
        var result = new List<UserResponse>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new UserResponse(u.Id.ToString(), u.Email ?? string.Empty, u.FullName, u.IsActive, roles.ToList()));
        }
        return result;
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request, string actor, CancellationToken cancellationToken)
    {
        if (await _userManager.FindByEmailAsync(request.Email) != null)
            throw new InvalidOperationException($"El correo {request.Email} ya está registrado.");

        if (!await _roleManager.RoleExistsAsync(request.Role))
            throw new InvalidOperationException($"El rol '{request.Role}' no existe.");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            IsActive = true
        };
        var created = await _userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            throw new InvalidOperationException(string.Join("; ", created.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, request.Role);

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = "Usuario",
            Action = "Crear",
            EntityId = user.Id.ToString(),
            ChangesSummary = $"Nuevo usuario {request.Email} con rol {request.Role}",
            CreatedBy = actor,
            ActionAtUtc = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UserResponse(user.Id.ToString(), user.Email!, user.FullName, user.IsActive, [request.Role]);
    }

    public async Task ChangeRoleAsync(string userId, ChangeUserRoleRequest request, string actor, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        if (!await _roleManager.RoleExistsAsync(request.Role))
            throw new InvalidOperationException($"El rol '{request.Role}' no existe.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, request.Role);

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = "Usuario",
            Action = "CambioRol",
            EntityId = userId,
            ChangesSummary = $"Rol cambiado a {request.Role} por {actor}",
            CreatedBy = actor,
            ActionAtUtc = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(string userId, string actor, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("Usuario no encontrado.");

        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = "Usuario",
            Action = "Desactivar",
            EntityId = userId,
            ChangesSummary = $"Usuario {user.Email} desactivado por {actor}",
            CreatedBy = actor,
            ActionAtUtc = DateTime.UtcNow
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

public class CatalogService : ICatalogService
{
    private readonly AppDbContext _dbContext;

    public CatalogService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CatalogResponse> CreateCatalogAsync(CatalogCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var entity = new Catalog
        {
            Code = request.Code.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            CreatedBy = actor
        };

        _dbContext.Catalogs.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(Catalog),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Catálogo {entity.Code} creado.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new CatalogResponse(entity.Id, entity.Code, entity.Name, entity.Description, entity.IsActive);
    }

    public async Task<IReadOnlyList<CatalogResponse>> GetCatalogsAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Catalogs
            .OrderBy(x => x.Name)
            .Select(x => new CatalogResponse(x.Id, x.Code, x.Name, x.Description, x.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<CatalogItemResponse> CreateItemAsync(CatalogItemCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var catalogExists = await _dbContext.Catalogs.AnyAsync(x => x.Id == request.CatalogId, cancellationToken);
        if (!catalogExists)
        {
            throw new KeyNotFoundException("Catálogo no encontrado.");
        }

        if (request.ParentItemId.HasValue)
        {
            var parentExists = await _dbContext.CatalogItems.AnyAsync(x => x.Id == request.ParentItemId.Value, cancellationToken);
            if (!parentExists)
                throw new KeyNotFoundException("Ítem padre no encontrado.");
        }

        var entity = new CatalogItem
        {
            CatalogId = request.CatalogId,
            Code = request.Code.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            SortOrder = request.SortOrder,
            Country = string.IsNullOrWhiteSpace(request.Country) ? null : request.Country.Trim(),
            City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim(),
            League = string.IsNullOrWhiteSpace(request.League) ? null : request.League.Trim(),
            ParentItemId = request.ParentItemId,
            CreatedBy = actor
        };

        _dbContext.CatalogItems.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(CatalogItem),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Ítem {entity.Code} creado en catálogo {entity.CatalogId}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new CatalogItemResponse(
            entity.Id,
            entity.CatalogId,
            entity.Code,
            entity.Name,
            entity.SortOrder,
            entity.IsActive,
            entity.Country,
            entity.City,
            entity.League,
            entity.ParentItemId);
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> GetItemsAsync(Guid catalogId, CancellationToken cancellationToken)
    {
        return await _dbContext.CatalogItems
            .Where(x => x.CatalogId == catalogId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CatalogItemResponse(
                x.Id,
                x.CatalogId,
                x.Code,
                x.Name,
                x.SortOrder,
                x.IsActive,
                x.Country,
                x.City,
                x.League,
                x.ParentItemId))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> GetItemsByCodeAsync(string catalogCode, CancellationToken cancellationToken)
    {
        var normalizedCode = catalogCode.Trim().ToUpperInvariant();
        return await _dbContext.CatalogItems
            .Where(x => x.Catalog != null && x.Catalog.Code == normalizedCode && x.Catalog.IsActive && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CatalogItemResponse(
                x.Id,
                x.CatalogId,
                x.Code,
                x.Name,
                x.SortOrder,
                x.IsActive,
                x.Country,
                x.City,
                x.League,
                x.ParentItemId))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CatalogItemResponse>> GetItemsByCodeAndParentAsync(string catalogCode, Guid? parentItemId, CancellationToken cancellationToken)
    {
        var normalizedCode = catalogCode.Trim().ToUpperInvariant();
        var query = _dbContext.CatalogItems
            .Where(x => x.Catalog != null && x.Catalog.Code == normalizedCode && x.Catalog.IsActive && x.IsActive);

        query = parentItemId.HasValue
            ? query.Where(x => x.ParentItemId == parentItemId.Value)
            : query.Where(x => x.ParentItemId == null);

        return await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new CatalogItemResponse(
                x.Id,
                x.CatalogId,
                x.Code,
                x.Name,
                x.SortOrder,
                x.IsActive,
                x.Country,
                x.City,
                x.League,
                x.ParentItemId))
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteItemAsync(Guid itemId, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.CatalogItems.FirstOrDefaultAsync(x => x.Id == itemId, cancellationToken);
        if (entity is null)
        {
            throw new KeyNotFoundException("Ítem no encontrado.");
        }

        _dbContext.CatalogItems.Remove(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(CatalogItem),
            Action = "Delete",
            EntityId = itemId.ToString(),
            ChangesSummary = $"Ítem {entity.Code} eliminado del catálogo {entity.CatalogId}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

public class ReportService : IReportService
{
    private readonly AppDbContext _dbContext;

    public ReportService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardReportResponse> GetDashboardAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var in30Days = today.AddDays(30);
        var totalPlayers = await _dbContext.Players.CountAsync(cancellationToken);
        var activeNegotiations = await _dbContext.Negotiations.CountAsync(
            x => x.Status != "NegociacionCompletada" && x.Status != "Completada" && x.Status != "Cancelada",
            cancellationToken);
        var activeTransfers = await _dbContext.Transfers.CountAsync(cancellationToken);
        var contractsExpiringSoon = await _dbContext.RepresentationContracts.CountAsync(x => x.EndDate >= today && x.EndDate <= in30Days, cancellationToken);
        var unreadNotifications = await _dbContext.Notifications.CountAsync(x => !x.IsRead, cancellationToken);
        return new DashboardReportResponse(totalPlayers, activeNegotiations, activeTransfers, contractsExpiringSoon, unreadNotifications);
    }

    public async Task<ContractsReportResponse> GetContractsAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var in30Days = today.AddDays(30);
        var vigentes = await _dbContext.RepresentationContracts.CountAsync(x => x.EndDate >= today, cancellationToken);
        var vencidos = await _dbContext.RepresentationContracts.CountAsync(x => x.EndDate < today, cancellationToken);
        var proximos = await _dbContext.RepresentationContracts.CountAsync(x => x.EndDate >= today && x.EndDate <= in30Days, cancellationToken);
        return new ContractsReportResponse(vigentes, vencidos, proximos);
    }

    public async Task<NegotiationsReportResponse> GetNegotiationsAsync(CancellationToken cancellationToken)
    {
        return new NegotiationsReportResponse(
            await _dbContext.Negotiations.CountAsync(x => x.Status == "EnAnalisis", cancellationToken),
            await _dbContext.Negotiations.CountAsync(x => x.Status == "NegociandoOferta" || x.Status == "EnNegociacion", cancellationToken),
            await _dbContext.Negotiations.CountAsync(x => x.Status == "NegociandoContraOferta" || x.Status == "PendienteFirma", cancellationToken),
            await _dbContext.Negotiations.CountAsync(x => x.Status == "NegociacionCompletada" || x.Status == "Completada", cancellationToken),
            await _dbContext.Negotiations.CountAsync(x => x.Status == "Cancelada", cancellationToken));
    }

    public async Task<TransfersReportResponse> GetTransfersAsync(CancellationToken cancellationToken)
    {
        return new TransfersReportResponse(
            await _dbContext.Transfers.CountAsync(x => x.Status == "EnAnalisis", cancellationToken),
            await _dbContext.Transfers.CountAsync(x => x.Status == "EnNegociacion", cancellationToken),
            await _dbContext.Transfers.CountAsync(x => x.Status == "PendienteFirma", cancellationToken),
            await _dbContext.Transfers.CountAsync(x => x.Status == "Completada", cancellationToken),
            await _dbContext.Transfers.CountAsync(x => x.Status == "Cancelada", cancellationToken));
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> ExportContractsCsvAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var contracts = await _dbContext.RepresentationContracts
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var builder = new StringBuilder();
        builder.AppendLine("ContratoId,JugadorId,FechaInicio,FechaFin,Estado,Version,EsVigente");
        foreach (var contract in contracts)
        {
            var isActive = contract.EndDate >= today ? "SI" : "NO";
            builder.AppendLine($"{contract.Id},{contract.PlayerId},{contract.StartDate},{contract.EndDate},{contract.Status},{contract.Version},{isActive}");
        }

        return (Encoding.UTF8.GetBytes(builder.ToString()), $"reporte_contratos_{DateTime.UtcNow:yyyyMMddHHmm}.csv", "text/csv");
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> ExportNegotiationsCsvAsync(CancellationToken cancellationToken)
    {
        var negotiations = await _dbContext.Negotiations.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
        var builder = new StringBuilder();
        builder.AppendLine("NegociacionId,JugadorId,Club,Monto,Moneda,Estado,Responsable,FechaOferta");
        foreach (var negotiation in negotiations)
        {
            builder.AppendLine($"{negotiation.Id},{negotiation.PlayerId},{negotiation.ClubName},{negotiation.OfferedAmount},{negotiation.Currency},{negotiation.Status},{negotiation.ResponsibleName},{negotiation.OfferDate}");
        }

        return (Encoding.UTF8.GetBytes(builder.ToString()), $"reporte_negociaciones_{DateTime.UtcNow:yyyyMMddHHmm}.csv", "text/csv");
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> ExportTransfersCsvAsync(CancellationToken cancellationToken)
    {
        var transfers = await _dbContext.Transfers.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
        var builder = new StringBuilder();
        builder.AppendLine("TransferenciaId,JugadorId,Origen,Destino,Fecha,Monto,Moneda,Tipo,Estado,Responsable");
        foreach (var transfer in transfers)
        {
            builder.AppendLine($"{transfer.Id},{transfer.PlayerId},{transfer.OriginClub},{transfer.DestinationClub},{transfer.TransferDate},{transfer.Amount},{transfer.Currency},{transfer.TransferType},{transfer.Status},{transfer.ManagedBy}");
        }

        return (Encoding.UTF8.GetBytes(builder.ToString()), $"reporte_transferencias_{DateTime.UtcNow:yyyyMMddHHmm}.csv", "text/csv");
    }

    public async Task<(byte[] Content, string FileName, string ContentType)> ExportDashboardPdfAsync(CancellationToken cancellationToken)
    {
        var dashboard = await GetDashboardAsync(cancellationToken);
        var tempFile = Path.GetTempFileName();
        QuestPDF.Settings.License = LicenseType.Community;
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(35);
                page.Content().Column(col =>
                {
                    col.Spacing(8);
                    col.Item().Text("Reporte Ejecutivo - FORTIS GLESNOR GROUP").FontSize(18).Bold();
                    col.Item().Text($"Generado: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
                    col.Item().Text($"Total de jugadores: {dashboard.TotalPlayers}");
                    col.Item().Text($"Negociaciones activas: {dashboard.ActiveNegotiations}");
                    col.Item().Text($"Transferencias activas: {dashboard.ActiveTransfers}");
                    col.Item().Text($"Contratos próximos a vencer: {dashboard.ContractsExpiringSoon}");
                    col.Item().Text($"Notificaciones sin leer: {dashboard.UnreadNotifications}");
                });
            });
        }).GeneratePdf(tempFile);

        var bytes = await File.ReadAllBytesAsync(tempFile, cancellationToken);
        File.Delete(tempFile);
        return (bytes, $"dashboard_{DateTime.UtcNow:yyyyMMddHHmm}.pdf", "application/pdf");
    }
}

public class IntelligenceService : IIntelligenceService
{
    private readonly AppDbContext _dbContext;

    public IntelligenceService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RankingPlayerResponse>> GetPlayerRankingAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var players = await _dbContext.Players.AsNoTracking().ToListAsync(cancellationToken);
        var contracts = await _dbContext.RepresentationContracts.AsNoTracking().ToListAsync(cancellationToken);
        var negotiations = await _dbContext.Negotiations.AsNoTracking().ToListAsync(cancellationToken);
        var transfers = await _dbContext.Transfers.AsNoTracking().ToListAsync(cancellationToken);
        var matchStats = await _dbContext.PlayerMatchStats.AsNoTracking().ToListAsync(cancellationToken);

        var ranking = players.Select(player =>
        {
            var age = GetAge(player.BirthDate, today);
            var hasActiveContract = contracts.Any(x => x.PlayerId == player.Id && x.EndDate >= today);
            var activeNegotiations = negotiations.Count(x => x.PlayerId == player.Id
                && x.Status != "Cancelada"
                && x.Status != "Completada"
                && x.Status != "NegociacionCompletada");
            var completedTransfers = transfers.Count(x => x.PlayerId == player.Id);
            var visibilityScore = player.IsVisible ? 100m : 40m;
            var contractScore = hasActiveContract ? 92m : 58m;
            var marketActivityScore = Math.Min(activeNegotiations * 20m, 100m) * 0.65m
                                      + Math.Min(completedTransfers * 15m, 100m) * 0.35m;
            var agePotentialScore = AgePotentialFactor(age);
            var statsWindow = matchStats
                .Where(x => x.PlayerId == player.Id)
                .OrderByDescending(x => x.MatchDate)
                .Take(10)
                .ToList();
            var performanceScore = GetPerformanceScore(statsWindow);

            // Scoring de scouting para agencia: rendimiento reciente + proyección + estado comercial.
            var score = performanceScore * 0.45m
                        + agePotentialScore * 0.20m
                        + contractScore * 0.15m
                        + marketActivityScore * 0.10m
                        + visibilityScore * 0.10m;

            return new RankingPlayerResponse(player.Id, $"{player.FirstName} {player.LastName}", player.MainPosition, player.CurrentClub, Math.Round(score, 2));
        })
        .OrderByDescending(x => x.Score)
        .Take(20)
        .ToList();

        return ranking;
    }

    public async Task<IReadOnlyList<CompatibilityResponse>> GetCompatibilityAsync(CompatibilityRequest request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var players = await _dbContext.Players.AsNoTracking().ToListAsync(cancellationToken);
        var contracts = await _dbContext.RepresentationContracts.AsNoTracking().ToListAsync(cancellationToken);
        var matchStats = await _dbContext.PlayerMatchStats.AsNoTracking().ToListAsync(cancellationToken);
        var minRecentDate = today.AddDays(-180);

        var totalWeight = request.WeightPosition + request.WeightAge + request.WeightContract + request.WeightActivity;
        if (totalWeight <= 0)
        {
            throw new InvalidOperationException("Los pesos de compatibilidad deben ser mayores a cero.");
        }

        var result = players.Select(player =>
        {
            var age = GetAge(player.BirthDate, today);
            var positionScore = GetPositionFitScore(player.MainPosition, request.TargetPosition);
            var ageScore = GetAgeFitScore(age, request.MinAge, request.MaxAge);
            var hasActiveContract = contracts.Any(x => x.PlayerId == player.Id && x.EndDate >= today);
            var contractScore = hasActiveContract ? 100m : 60m;
            var playerRecentStats = matchStats
                .Where(x => x.PlayerId == player.Id && x.MatchDate >= minRecentDate)
                .ToList();
            var activityScore = GetActivityScore(playerRecentStats, player.IsVisible);

            var finalScore = (positionScore * request.WeightPosition
                              + ageScore * request.WeightAge
                              + contractScore * request.WeightContract
                              + activityScore * request.WeightActivity) / totalWeight;

            var explanation = $"Ajuste posicional {Math.Round(positionScore, 0)} · Edad {Math.Round(ageScore, 0)} · Contrato {Math.Round(contractScore, 0)} · Actividad reciente {Math.Round(activityScore, 0)}";
            return new CompatibilityResponse(player.Id, $"{player.FirstName} {player.LastName}", Math.Round(finalScore, 2), explanation);
        })
        .OrderByDescending(x => x.CompatibilityScore)
        .Take(20)
        .ToList();

        return result;
    }

    private static int GetAge(DateOnly birthDate, DateOnly today)
    {
        var age = today.Year - birthDate.Year;
        if (birthDate > today.AddYears(-age))
        {
            age--;
        }

        return age;
    }

    private static decimal AgePotentialFactor(int age)
    {
        if (age is < 16) return 45m;
        if (age is >= 16 and <= 19) return 95m;
        if (age is >= 20 and <= 24) return 100m;
        if (age is >= 25 and <= 28) return 90m;
        if (age is >= 29 and <= 32) return 75m;
        if (age is >= 33 and <= 35) return 58m;
        return 45m;
    }

    private static decimal GetPerformanceScore(IReadOnlyCollection<PlayerMatchStat> stats)
    {
        if (stats.Count == 0) return 45m;

        var totalMinutes = Math.Max(1, stats.Sum(x => x.MinutesPlayed));
        var totalContrib = stats.Sum(x => x.Goals + x.Assists);
        var avgRating = stats.Average(x => x.Rating);
        var avgMinutes = stats.Average(x => x.MinutesPlayed);

        var contribPer90 = (decimal)totalContrib / totalMinutes * 90m;
        var contribScore = Math.Min(100m, (contribPer90 / 2.5m) * 100m);
        var ratingScore = Math.Clamp((decimal)avgRating / 10m * 100m, 0m, 100m);
        var availabilityScore = Math.Clamp((decimal)avgMinutes / 90m * 100m, 20m, 100m);

        return contribScore * 0.45m + ratingScore * 0.35m + availabilityScore * 0.20m;
    }

    private static decimal GetPositionFitScore(string playerPosition, string targetPosition)
    {
        var player = NormalizePosition(playerPosition);
        var target = NormalizePosition(targetPosition);

        if (string.Equals(player, target, StringComparison.Ordinal)) return 100m;
        if (AreSimilarPositions(player, target)) return 72m;
        return 35m;
    }

    private static decimal GetAgeFitScore(int age, int minAge, int maxAge)
    {
        if (age >= minAge && age <= maxAge) return 100m;
        var distance = age < minAge ? minAge - age : age - maxAge;
        return Math.Max(40m, 100m - (distance * 12m));
    }

    private static decimal GetActivityScore(IReadOnlyCollection<PlayerMatchStat> recentStats, bool isVisible)
    {
        if (recentStats.Count == 0) return isVisible ? 45m : 30m;

        var matchesScore = Math.Min(100m, recentStats.Count * 12m);
        var avgRating = recentStats.Average(x => x.Rating);
        var ratingScore = Math.Clamp((decimal)avgRating / 10m * 100m, 0m, 100m);
        var visibilityScore = isVisible ? 100m : 50m;

        return matchesScore * 0.45m + ratingScore * 0.35m + visibilityScore * 0.20m;
    }

    private static string NormalizePosition(string position)
    {
        return (position ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool AreSimilarPositions(string player, string target)
    {
        var defense = new[] { "defensa", "defensa central", "central", "lateral", "carrilero" };
        var midfield = new[] { "mediocampista", "volante", "mediocentro", "interior", "pivote" };
        var attack = new[] { "delantero", "extremo", "punta", "segundo delantero", "enganche", "media punta" };
        var gk = new[] { "portero", "arquero" };

        static bool InGroup(string value, IReadOnlyCollection<string> group) => group.Any(g => value.Contains(g, StringComparison.Ordinal));
        if (InGroup(player, defense) && InGroup(target, defense)) return true;
        if (InGroup(player, midfield) && InGroup(target, midfield)) return true;
        if (InGroup(player, attack) && InGroup(target, attack)) return true;
        if (InGroup(player, gk) && InGroup(target, gk)) return true;
        return false;
    }
}

public class PlayerStatsService : IPlayerStatsService
{
    private readonly AppDbContext _dbContext;

    public PlayerStatsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlayerMatchStatResponse> CreateAsync(PlayerMatchStatCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        var playerExists = await _dbContext.Players.AnyAsync(x => x.Id == request.PlayerId, cancellationToken);
        if (!playerExists)
        {
            throw new KeyNotFoundException("Jugador no encontrado.");
        }

        var entity = new PlayerMatchStat
        {
            PlayerId = request.PlayerId,
            MatchDate = request.MatchDate,
            Opponent = request.Opponent.Trim(),
            MinutesPlayed = request.MinutesPlayed,
            Goals = request.Goals,
            Assists = request.Assists,
            YellowCards = request.YellowCards,
            RedCards = request.RedCards,
            Rating = request.Rating,
            PhysicalStatus = request.PhysicalStatus.Trim(),
            Notes = request.Notes.Trim(),
            CreatedBy = actor
        };

        _dbContext.PlayerMatchStats.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerMatchStat),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Se registró estadística para jugador {entity.PlayerId} en fecha {entity.MatchDate}.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<IReadOnlyList<PlayerMatchStatResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        return await _dbContext.PlayerMatchStats
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.MatchDate)
            .Select(x => ToResponse(x))
            .ToListAsync(cancellationToken);
    }

    private static PlayerMatchStatResponse ToResponse(PlayerMatchStat stat) =>
        new(stat.Id, stat.PlayerId, stat.MatchDate, stat.Opponent, stat.MinutesPlayed, stat.Goals, stat.Assists, stat.YellowCards, stat.RedCards, stat.Rating, stat.PhysicalStatus, stat.Notes);
}

public class PlayerClubHistoryService : IPlayerClubHistoryService
{
    private readonly AppDbContext _dbContext;

    public PlayerClubHistoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlayerClubHistoryResponse> CreateAsync(PlayerClubHistoryCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        await EnsurePlayerExistsAsync(request.PlayerId, cancellationToken);
        ValidateYear(request.Year);
        if (string.IsNullOrWhiteSpace(request.ClubName))
            throw new InvalidOperationException("Indica el nombre del club.");

        var entity = new PlayerClubHistory
        {
            PlayerId = request.PlayerId,
            ClubName = request.ClubName.Trim(),
            Category = ClubHistoryCategories.Normalize(request.Category),
            Year = request.Year,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedBy = actor
        };
        _dbContext.PlayerClubHistories.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerClubHistory),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Historial de club: {entity.ClubName} ({entity.Year}).",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<IReadOnlyList<PlayerClubHistoryResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var rows = await _dbContext.PlayerClubHistories
            .AsNoTracking()
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.Year)
            .ThenBy(x => x.ClubName)
            .ToListAsync(cancellationToken);
        return rows.Select(ToResponse).ToList();
    }

    public async Task<PlayerClubHistoryResponse> UpdateAsync(Guid id, PlayerClubHistoryUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PlayerClubHistories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Registro de historial de club no encontrado.");
        ValidateYear(request.Year);
        if (string.IsNullOrWhiteSpace(request.ClubName))
            throw new InvalidOperationException("Indica el nombre del club.");

        entity.ClubName = request.ClubName.Trim();
        entity.Category = ClubHistoryCategories.Normalize(request.Category);
        entity.Year = request.Year;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerClubHistory),
            Action = "Update",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Historial de club actualizado.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PlayerClubHistories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Registro de historial de club no encontrado.");
        _dbContext.PlayerClubHistories.Remove(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerClubHistory),
            Action = "Delete",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Historial de club eliminado.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsurePlayerExistsAsync(Guid playerId, CancellationToken cancellationToken)
    {
        if (!await _dbContext.Players.AnyAsync(x => x.Id == playerId, cancellationToken))
            throw new KeyNotFoundException("Jugador no encontrado.");
    }

    private static void ValidateYear(int year)
    {
        var max = DateTime.UtcNow.Year + 1;
        if (year < 1950 || year > max)
            throw new InvalidOperationException($"El año debe estar entre 1950 y {max}.");
    }

    private static PlayerClubHistoryResponse ToResponse(PlayerClubHistory entity) =>
        new(entity.Id, entity.PlayerId, entity.ClubName, entity.Category, entity.Year, entity.Notes);
}

public class PlayerSportingAchievementService : IPlayerSportingAchievementService
{
    private readonly AppDbContext _dbContext;

    public PlayerSportingAchievementService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlayerSportingAchievementResponse> CreateAsync(PlayerSportingAchievementCreateRequest request, string actor, CancellationToken cancellationToken)
    {
        await EnsurePlayerExistsAsync(request.PlayerId, cancellationToken);
        ValidateYear(request.Year);
        var tipo = AchievementTypes.Normalize(request.AchievementType);
        if (string.IsNullOrWhiteSpace(request.TournamentName))
            throw new InvalidOperationException("Indica el nombre del torneo.");
        if (string.IsNullOrWhiteSpace(request.Country))
            throw new InvalidOperationException("Indica el país.");

        var entity = new PlayerSportingAchievement
        {
            PlayerId = request.PlayerId,
            AchievementType = tipo,
            TournamentName = request.TournamentName.Trim(),
            Country = request.Country.Trim(),
            Year = request.Year,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            CreatedBy = actor
        };
        _dbContext.PlayerSportingAchievements.Add(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerSportingAchievement),
            Action = "Create",
            EntityId = entity.Id.ToString(),
            ChangesSummary = $"Logro deportivo: {entity.TournamentName} ({entity.Year}).",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task<IReadOnlyList<PlayerSportingAchievementResponse>> GetByPlayerAsync(Guid playerId, CancellationToken cancellationToken)
    {
        var rows = await _dbContext.PlayerSportingAchievements
            .AsNoTracking()
            .Where(x => x.PlayerId == playerId)
            .OrderByDescending(x => x.Year)
            .ThenBy(x => x.TournamentName)
            .ToListAsync(cancellationToken);
        return rows.Select(ToResponse).ToList();
    }

    public async Task<PlayerSportingAchievementResponse> UpdateAsync(Guid id, PlayerSportingAchievementUpdateRequest request, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PlayerSportingAchievements.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Logro deportivo no encontrado.");
        ValidateYear(request.Year);
        var tipo = AchievementTypes.Normalize(request.AchievementType);
        if (string.IsNullOrWhiteSpace(request.TournamentName))
            throw new InvalidOperationException("Indica el nombre del torneo.");
        if (string.IsNullOrWhiteSpace(request.Country))
            throw new InvalidOperationException("Indica el país.");

        entity.AchievementType = tipo;
        entity.TournamentName = request.TournamentName.Trim();
        entity.Country = request.Country.Trim();
        entity.Year = request.Year;
        entity.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = actor;
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerSportingAchievement),
            Action = "Update",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Logro deportivo actualizado.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(entity);
    }

    public async Task DeleteAsync(Guid id, string actor, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PlayerSportingAchievements.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Logro deportivo no encontrado.");
        _dbContext.PlayerSportingAchievements.Remove(entity);
        _dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(PlayerSportingAchievement),
            Action = "Delete",
            EntityId = entity.Id.ToString(),
            ChangesSummary = "Logro deportivo eliminado.",
            CreatedBy = actor
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsurePlayerExistsAsync(Guid playerId, CancellationToken cancellationToken)
    {
        if (!await _dbContext.Players.AnyAsync(x => x.Id == playerId, cancellationToken))
            throw new KeyNotFoundException("Jugador no encontrado.");
    }

    private static void ValidateYear(int year)
    {
        var max = DateTime.UtcNow.Year + 1;
        if (year < 1950 || year > max)
            throw new InvalidOperationException($"El año debe estar entre 1950 y {max}.");
    }

    private static PlayerSportingAchievementResponse ToResponse(PlayerSportingAchievement entity) =>
        new(entity.Id, entity.PlayerId, entity.AchievementType, entity.TournamentName, entity.Country, entity.Year, entity.Notes);
}
