using FortisSports.Application.Contracts;
using FortisSports.Domain.Entities;
using FortisSports.Infrastructure.Persistence;
using FortisSports.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace FortisSports.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("No existe la cadena de conexión.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddIdentity<AppUser, AppRole>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 8;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("No existe configuración JWT.");
        var issuer = configuration["Jwt:Issuer"] ?? "FortisSports";
        var audience = configuration["Jwt:Audience"] ?? "FortisSports.Client";
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = signingKey,
                ClockSkew = TimeSpan.FromMinutes(2)
            };
        });

        services.AddAuthorization();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IPlayerService, PlayerService>();
        services.AddSingleton<LibreOfficePdfConverter>();
        services.AddScoped<ContratoRepresentacionGenerator>();
        services.AddScoped<IContractService, ContractService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<INegotiationService, NegotiationService>();
        services.AddScoped<ITransferService, TransferService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IIntelligenceService, IntelligenceService>();
        services.AddScoped<IPlayerStatsService, PlayerStatsService>();
        services.AddScoped<IPlayerClubHistoryService, PlayerClubHistoryService>();
        services.AddScoped<IPlayerSportingAchievementService, PlayerSportingAchievementService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISportsStructureService, SportsStructureService>();
        services.AddHostedService<ExpirationNotificationHostedService>();

        return services;
    }
}
