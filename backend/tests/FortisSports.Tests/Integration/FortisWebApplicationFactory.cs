using FortisSports.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FortisSports.Tests.Integration;

/// <summary>
/// Host de pruebas con base de datos en memoria (sin PostgreSQL).
/// </summary>
public class FortisWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // UseSetting tiene prioridad alta para que la clave JWT exista en pruebas.
        builder.UseSetting("Jwt:Key", "CLAVE_PRUEBAS_INTEGRACION_MINIMO_32_CARACTERES_XX");
        builder.UseSetting("Jwt:Issuer", "FortisSports.Api.Test");
        builder.UseSetting("Jwt:Audience", "FortisSports.Web.Test");
        builder.UseSetting("Jwt:ExpiresMinutes", "120");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=localhost;Database=test;Username=x;Password=x");
        builder.UseSetting("Storage:RootPath", Path.Combine(Path.GetTempPath(), "fortis_test_storage"));
        builder.ConfigureServices(services =>
        {
            var opciones = services.Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)).ToList();
            foreach (var d in opciones)
            {
                services.Remove(d);
            }

            var contextos = services.Where(d => d.ServiceType == typeof(AppDbContext)).ToList();
            foreach (var d in contextos)
            {
                services.Remove(d);
            }

            // Nombre fijo: una sola base en memoria por host de prueba (evita desincronía entre peticiones HTTP y siembra).
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase("Fortis_IntegrationTests");
            });
        });
    }
}
