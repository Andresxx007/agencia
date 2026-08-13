// Validación declarativa de modelos de entrada con FluentValidation.
using FluentValidation;
// Integración automática de FluentValidation con ASP.NET Core.
using FluentValidation.AspNetCore;
// Middleware global de manejo de excepciones HTTP.
using FortisSports.Api.Middlewares;
// Interfaces de servicios de aplicación (por ejemplo semilla de admin).
using FortisSports.Application.Contracts;
// Extensión que registra EF Core, identidad y servicios de infraestructura.
using FortisSports.Infrastructure;
// Contexto de base de datos Entity Framework.
using FortisSports.Infrastructure.Persistence;
// Extensiones para configurar DbContext y migraciones.
using Microsoft.EntityFrameworkCore;
// Modelos OpenAPI para documentar Swagger.
using Microsoft.OpenApi.Models;
// Proveedor de logging estructurado Serilog.
using Serilog;

// Crea el objeto host con configuración de appsettings.json y variables de entorno.
var builder = WebApplication.CreateBuilder(args);

// Configura Serilog para leer niveles desde configuración y escribir en consola.
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console();
});

// Registra repositorios, servicios de dominio, DbContext e Identity.
builder.Services.AddInfrastructure(builder.Configuration);
// Habilita controladores MVC/Web API clásicos (no minimal APIs en este archivo).
builder.Services.AddControllers();
// Activa la validación automática antes de entrar a las acciones del controlador.
builder.Services.AddFluentValidationAutoValidation();
// Escanea ensamblados en busca de clases que hereden AbstractValidator<>.
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
// Expone metadatos para generación de documentación Swagger/OpenAPI.
builder.Services.AddEndpointsApiExplorer();
// Configura generación de documento Swagger con seguridad JWT.
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Fortis Sports API",
        Version = "v1",
        Description = "API para gestión de representación deportiva."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token JWT."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Define políticas basadas en roles para lectura, operaciones y configuración.
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanRead", p => p.RequireRole("Administrador", "Supervisor", "Representante", "Consulta"));
    options.AddPolicy("CanManageOperations", p => p.RequireRole("Administrador", "Supervisor", "Representante"));
    options.AddPolicy("CanConfigure", p => p.RequireRole("Administrador"));
});

// Permite llamadas desde el front Vite u otro origen configurado en Cors:FrontendUrl.
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        var adminUrl   = builder.Configuration["Cors:FrontendUrl"]  ?? "http://localhost:5173";
        var portalUrl  = builder.Configuration["Cors:PortalUrl"]    ?? "http://localhost:5174";
        policy.WithOrigins(adminUrl, portalUrl)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Construye la aplicación HTTP lista para configurar pipeline y middleware.
var app = builder.Build();

var dbNameForLog = "desconocida";
try
{
    var cs = app.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(cs))
    {
        var dbKey = "Database=";
        var idx = cs.IndexOf(dbKey, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
        {
            var start = idx + dbKey.Length;
            var end = cs.IndexOf(';', start);
            dbNameForLog = end < 0 ? cs[start..] : cs[start..end];
        }
    }
}
catch
{
    /* solo diagnóstico de arranque */
}

Log.Information(
    "Fortis API ({Environment}) → base de datos «{Database}». Admin: {AdminUrl}",
    app.Environment.EnvironmentName,
    dbNameForLog,
    builder.Configuration["Cors:FrontendUrl"] ?? "http://localhost:5173");

// Primera pieza del pipeline: captura excepciones no controladas y las convierte en respuestas JSON.
app.UseMiddleware<GlobalExceptionMiddleware>();

// En desarrollo habilita interfaz interactiva /swagger y JSON crudo.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Aplica la política CORS definida arriba a todas las solicitudes entrantes.
app.UseCors("frontend");
// Habilita el middleware que interpreta el encabezado Authorization Bearer.
app.UseAuthentication();
// Evalúa [Authorize] y políticas de rol en los controladores.
app.UseAuthorization();
// Sirve fotos de jugadores y otros estáticos desde wwwroot (ej. /uploads/players/…).
app.UseStaticFiles();
// Descubre y registra rutas de todos los controladores del ensamblado.
app.MapControllers();

// Ámbito de servicios para operaciones de arranque que requieren DbContext transitorio.
using (var scope = app.Services.CreateScope())
{
    // Resuelve el contexto EF para aplicar migraciones o crear esquema en pruebas.
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsEnvironment("Testing"))
    {
        // En tests de integración crea tablas en memoria o SQLite sin historial de migraciones.
        await dbContext.Database.EnsureCreatedAsync();
    }
    else
    {
        // En entornos reales aplica migraciones pendientes automáticamente al iniciar.
        await dbContext.Database.MigrateAsync();
    }

    // Garantiza que exista al menos un usuario administrador inicial.
    var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
    await authService.SeedAdminAsync(CancellationToken.None);
}

// Bloquea hasta cerrar el proceso; inicia Kestrel y escucha peticiones HTTP.
app.Run();
