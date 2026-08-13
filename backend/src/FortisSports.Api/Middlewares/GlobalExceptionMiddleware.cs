using System.Net;
using System.Text.Json;

namespace FortisSports.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado en la API.");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = ex switch
            {
                KeyNotFoundException => (int)HttpStatusCode.NotFound,
                InvalidOperationException => (int)HttpStatusCode.BadRequest,
                _ => (int)HttpStatusCode.InternalServerError
            };

            // Collect inner exception chain for diagnostics
            var mensajes = new System.Collections.Generic.List<string> { ex.Message };
            var inner = ex.InnerException;
            while (inner != null)
            {
                mensajes.Add(inner.Message);
                inner = inner.InnerException;
            }

            var payload = JsonSerializer.Serialize(new
            {
                message = string.Join(" → ", mensajes),
                statusCode = context.Response.StatusCode
            });

            await context.Response.WriteAsync(payload);
        }
    }
}
