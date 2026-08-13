using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FortisSports.Infrastructure.Services;

public class ExpirationNotificationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpirationNotificationHostedService> _logger;

    public ExpirationNotificationHostedService(IServiceScopeFactory scopeFactory, ILogger<ExpirationNotificationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await GenerateExpirationNotificationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar notificaciones de vencimiento.");
            }

            await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
        }
    }

    private async Task GenerateExpirationNotificationsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var in30Days = today.AddDays(30);

        var contractsToNotify = await dbContext.RepresentationContracts
            .Where(x => x.EndDate >= today && x.EndDate <= in30Days)
            .ToListAsync(cancellationToken);

        foreach (var contract in contractsToNotify)
        {
            var alreadyNotified = await dbContext.Notifications.AnyAsync(
                x => x.Title == "Contrato próximo a vencer" &&
                     x.RelatedPlayerId == contract.PlayerId &&
                     x.Message.Contains(contract.EndDate.ToString()),
                cancellationToken);

            if (alreadyNotified)
            {
                continue;
            }

            dbContext.Notifications.Add(new Domain.Entities.Notification
            {
                Title = "Contrato próximo a vencer",
                Message = $"El contrato del jugador {contract.PlayerId} vence el {contract.EndDate}.",
                Priority = "Alta",
                RelatedPlayerId = contract.PlayerId,
                CreatedBy = "sistema"
            });
        }

        var documentsExpired = await dbContext.PlayerDocuments
            .Where(x => x.ExpirationDate.HasValue && x.ExpirationDate.Value < today && x.Status != "Vencido")
            .ToListAsync(cancellationToken);

        foreach (var document in documentsExpired)
        {
            document.Status = "Vencido";
            document.UpdatedAtUtc = DateTime.UtcNow;
            document.UpdatedBy = "sistema";
            dbContext.Notifications.Add(new Domain.Entities.Notification
            {
                Title = "Documento vencido",
                Message = $"El documento {document.OriginalFileName} del jugador {document.PlayerId} está vencido.",
                Priority = "Alta",
                RelatedPlayerId = document.PlayerId,
                CreatedBy = "sistema"
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
