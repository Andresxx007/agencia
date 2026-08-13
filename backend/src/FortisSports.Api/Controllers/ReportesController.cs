using FortisSports.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FortisSports.Api.Controllers;

[ApiController]
[Route("api/reportes")]
[Authorize(Policy = "CanRead")]
public class ReportesController : ControllerBase
{
    private readonly IReportService _servicioReportes;

    public ReportesController(IReportService servicioReportes)
    {
        _servicioReportes = servicioReportes;
    }

    [HttpGet("panel")]
    [ProducesResponseType(typeof(DashboardReportResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Panel(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioReportes.GetDashboardAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("contratos")]
    [ProducesResponseType(typeof(ContractsReportResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> InformeContratos(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioReportes.GetContractsAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("negociaciones")]
    [ProducesResponseType(typeof(NegotiationsReportResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> InformeNegociaciones(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioReportes.GetNegotiationsAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("transferencias")]
    [ProducesResponseType(typeof(TransfersReportResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> InformeTransferencias(CancellationToken cancellationToken)
    {
        var respuesta = await _servicioReportes.GetTransfersAsync(cancellationToken);
        return Ok(respuesta);
    }

    [HttpGet("contratos/exportar/csv")]
    [Authorize(Policy = "CanManageOperations")]
    public async Task<IActionResult> ExportarContratosCsv(CancellationToken cancellationToken)
    {
        var archivo = await _servicioReportes.ExportContractsCsvAsync(cancellationToken);
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }

    [HttpGet("negociaciones/exportar/csv")]
    [Authorize(Policy = "CanManageOperations")]
    public async Task<IActionResult> ExportarNegociacionesCsv(CancellationToken cancellationToken)
    {
        var archivo = await _servicioReportes.ExportNegotiationsCsvAsync(cancellationToken);
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }

    [HttpGet("transferencias/exportar/csv")]
    [Authorize(Policy = "CanManageOperations")]
    public async Task<IActionResult> ExportarTransferenciasCsv(CancellationToken cancellationToken)
    {
        var archivo = await _servicioReportes.ExportTransfersCsvAsync(cancellationToken);
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }

    [HttpGet("panel/exportar/pdf")]
    [Authorize(Policy = "CanManageOperations")]
    public async Task<IActionResult> ExportarPanelPdf(CancellationToken cancellationToken)
    {
        var archivo = await _servicioReportes.ExportDashboardPdfAsync(cancellationToken);
        return File(archivo.Content, archivo.ContentType, archivo.FileName);
    }
}
