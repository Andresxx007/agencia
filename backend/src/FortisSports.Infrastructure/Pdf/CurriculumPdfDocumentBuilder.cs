using FortisSports.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FortisSports.Infrastructure.Pdf;

public static class CurriculumPdfDocumentBuilder
{
    private const string Navy = "#0f4c81";
    private const string Green = "#2ecc71";
    private const string GreenDark = "#27ae60";
    private const string PageBg = "#0d0f12";
    private const string CardBg = "#161b24";
    private const string CardBgLight = "#1e2633";
    private const string Muted = "#7d8fa8";
    private const string LightText = "#f0f4fa";
    private const string Border = "#2d3748";

    public static byte[] Build(
        Player player,
        string? photoPath,
        int age,
        IReadOnlyList<PlayerMatchStat> stats,
        IReadOnlyList<Transfer> transfers,
        IReadOnlyList<PlayerClubHistory> clubHistory,
        IReadOnlyList<PlayerSportingAchievement> achievements,
        RepresentationContract? activeContract)
    {
        var fullName = $"{player.FirstName} {player.LastName}".Trim();
        var generatedAt = DateTime.UtcNow.ToString("dd/MM/yyyy");
        var (pitchX, pitchY, posAbbr, posLabel) = MapPosition(player.MainPosition);
        var totalGoals = stats.Sum(s => s.Goals);
        var totalAssists = stats.Sum(s => s.Assists);
        var totalMinutes = stats.Sum(s => s.MinutesPlayed);
        var avgRating = stats.Count > 0 ? stats.Average(s => (double)s.Rating) : 0;
        var timeline = clubHistory.OrderBy(h => h.Year).ThenBy(h => h.ClubName).ToList();
        var lastTransfer = transfers.OrderByDescending(t => t.TransferDate).FirstOrDefault();
        var goalsPerMatch = stats.Count > 0 ? (double)totalGoals / stats.Count : 0;
        var assistsPerMatch = stats.Count > 0 ? (double)totalAssists / stats.Count : 0;
        var minsPerMatch = stats.Count > 0 ? totalMinutes / (double)stats.Count : 0;
        var heightText = player.HeightCm.HasValue ? $"{player.HeightCm:0} cm" : "—";

        var donutParticipacion = (float)Math.Min(minsPerMatch / 90.0 * 100, 100);
        var donutGoles = (float)Math.Min(goalsPerMatch / 1.2 * 100, 100);
        var donutAsistencias = (float)Math.Min(assistsPerMatch / 0.8 * 100, 100);
        var donutRating = avgRating > 0 ? (float)Math.Min(avgRating / 10.0 * 100, 100) : 0;

        QuestPDF.Settings.License = LicenseType.Community;

        using var stream = new MemoryStream();
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(16);
                page.Background().Background(PageBg);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(LightText));

                page.Content().Column(root =>
                {
                    root.Spacing(8);

                    // ── Barra marca ──
                    root.Item().Background(Navy).Padding(8).Row(h =>
                    {
                        h.RelativeItem().Text("FORTIS GLESNOR GROUP").FontSize(10).Bold().FontColor(Colors.White);
                        h.ConstantItem(90).AlignRight().Text($"Perfil scouting · {generatedAt}")
                            .FontSize(7).FontColor("#b8d4e8");
                    });

                    // ── 1. Cabecera jugador (foto | identidad | club) ──
                    root.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(12).Row(header =>
                    {
                        header.ConstantItem(76).AlignMiddle().Column(ph =>
                        {
                            ph.Item().Width(68).Height(68).Background(CardBgLight).Border(2).BorderColor(Green)
                                .Padding(2).AlignCenter().AlignMiddle().Element(box =>
                                {
                                    if (photoPath is not null)
                                        box.Image(photoPath).FitArea();
                                    else
                                    {
                                        var ini = $"{(player.FirstName.Length > 0 ? player.FirstName[0] : '?')}{(player.LastName.Length > 0 ? player.LastName[0] : '?')}".ToUpperInvariant();
                                        box.Text(ini).FontSize(20).Bold().FontColor(Green);
                                    }
                                });
                        });

                        header.RelativeItem().PaddingHorizontal(12).AlignMiddle().Column(id =>
                        {
                            id.Item().Text(fullName).FontSize(18).Bold().FontColor(Colors.White);
                            id.Item().PaddingTop(5).Row(meta =>
                            {
                                meta.AutoItem().Background(Green).PaddingHorizontal(7).PaddingVertical(2)
                                    .Text(posAbbr).FontSize(8).Bold().FontColor(PageBg);
                                meta.AutoItem().PaddingLeft(8).Text(posLabel).FontSize(9).FontColor(LightText);
                                meta.AutoItem().PaddingLeft(10).Text($"{age} años").FontSize(9).FontColor(Muted);
                                meta.AutoItem().PaddingLeft(10).Text(player.Nationality).FontSize(9).FontColor(Muted);
                            });
                            id.Item().PaddingTop(4).Text($"Profesional · {player.AgencyStatus} · Contrato {player.ContractStatus}")
                                .FontSize(8).FontColor(Muted);
                            if (player.JerseyNumber.HasValue)
                                id.Item().PaddingTop(2).Text($"Camiseta #{player.JerseyNumber}").FontSize(8).FontColor(Muted);
                        });

                        header.ConstantItem(130).Background(CardBgLight).Border(1).BorderColor(Border).Padding(10)
                            .Column(club =>
                            {
                                club.Item().Text("Club actual").FontSize(7).FontColor(Muted);
                                club.Item().PaddingTop(3).Text(player.CurrentClub ?? "Sin club").FontSize(11).Bold().FontColor(Colors.White);
                                club.Item().PaddingTop(6).Text("Representación").FontSize(7).FontColor(Muted);
                                club.Item().Text("Fortis Glesnor Group").FontSize(8).FontColor(Green);
                                if (activeContract is not null)
                                {
                                    club.Item().PaddingTop(5).Text("Contrato hasta").FontSize(7).FontColor(Muted);
                                    club.Item().Text(activeContract.EndDate.ToString("dd/MM/yyyy")).FontSize(9).Bold();
                                }
                            });
                    });

                    // ── 2. Cuerpo: columna izquierda | contenido principal ──
                    root.Item().Row(body =>
                    {
                        body.ConstantItem(122).Column(sidebar =>
                        {
                            sidebar.Spacing(8);

                            // Iconos rápidos: posición mini, pie, altura
                            sidebar.Item().Row(quick =>
                            {
                                quick.RelativeItem().Background(CardBgLight).Border(1).BorderColor(Border).Padding(4)
                                    .Column(c =>
                                    {
                                        c.Item().Height(36).Svg(_ => BuildMiniPitchSvg(pitchX, pitchY, posAbbr));
                                        c.Item().AlignCenter().Text(posAbbr).FontSize(6).FontColor(Muted);
                                    });
                                quick.ConstantItem(4);
                                quick.RelativeItem().Background(CardBgLight).Border(1).BorderColor(Border).Padding(6)
                                    .AlignMiddle().Column(c =>
                                    {
                                        c.Item().AlignCenter().Text("Pie").FontSize(6).FontColor(Muted);
                                        c.Item().AlignCenter().PaddingTop(2).Text(FormatFootShort(player.PreferredFoot))
                                            .FontSize(8).Bold().FontColor(Green);
                                    });
                                quick.ConstantItem(4);
                                quick.RelativeItem().Background(CardBgLight).Border(1).BorderColor(Border).Padding(6)
                                    .AlignMiddle().Column(c =>
                                    {
                                        c.Item().AlignCenter().Text("Altura").FontSize(6).FontColor(Muted);
                                        c.Item().AlignCenter().PaddingTop(2).Text(heightText).FontSize(7).Bold();
                                    });
                            });

                            sidebar.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(8).Column(data =>
                            {
                                CardTitle(data, "Datos del jugador");
                                data.Item().PaddingTop(6);
                                DataLineDark(data, "Peso", player.WeightKg.HasValue ? $"{player.WeightKg:0} kg" : "—");
                                DataLineDark(data, "Nacimiento", player.BirthDate.ToString("dd/MM/yyyy"));
                                DataLineDark(data, "Ciudad", player.City ?? "—");
                                DataLineDark(data, "Nacionalidad", player.Nationality);
                                if (!string.IsNullOrWhiteSpace(player.IdCardNumber))
                                    DataLineDark(data, "Carnet", player.IdCardNumber);
                                if (!string.IsNullOrWhiteSpace(player.Address))
                                    DataLineDark(data, "Domicilio", Truncate(player.Address, 28));
                            });

                            sidebar.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(8).Column(ag =>
                            {
                                CardTitle(ag, "Agencia");
                                ag.Item().PaddingTop(4).Text("Fortis Glesnor Group").FontSize(8).FontColor(Green);
                                if (!string.IsNullOrWhiteSpace(player.Email))
                                    ag.Item().PaddingTop(4).Text(player.Email).FontSize(7).FontColor(Muted);
                                if (!string.IsNullOrWhiteSpace(player.PhoneNumber))
                                    ag.Item().PaddingTop(2).Text(player.PhoneNumber).FontSize(7).FontColor(Muted);
                            });
                        });

                        body.RelativeItem().PaddingLeft(8).Column(main =>
                        {
                            main.Spacing(8);

                            // ── Rendimiento (tabla estilo referencia) ──
                            main.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(10).Column(perf =>
                            {
                                CardTitle(perf, "Rendimiento");
                                perf.Item().PaddingTop(6).Table(t =>
                                {
                                    t.ColumnsDefinition(c =>
                                    {
                                        c.RelativeColumn(2); c.RelativeColumn(2);
                                        c.ConstantColumn(28); c.ConstantColumn(32);
                                        c.ConstantColumn(24); c.ConstantColumn(24);
                                    });
                                    t.Header(h =>
                                    {
                                        foreach (var hdr in new[] { "Temporada", "Registro", "PJ", "Min", "G", "As" })
                                            h.Cell().Background(CardBgLight).Padding(4)
                                                .Text(hdr).FontSize(7).Bold().FontColor(Muted);
                                    });
                                    if (stats.Count > 0)
                                    {
                                        var byYear = stats.GroupBy(s => s.MatchDate.Year).OrderByDescending(g => g.Key).Take(3);
                                        foreach (var g in byYear)
                                        {
                                            var yStats = g.ToList();
                                            t.Cell().Padding(4).Text($"'{g.Key % 100:D2}").FontSize(8);
                                            t.Cell().Padding(4).Text("Partidos CRM").FontSize(8).FontColor(Muted);
                                            t.Cell().Padding(4).AlignCenter().Text(yStats.Count.ToString()).FontSize(8);
                                            t.Cell().Padding(4).AlignCenter().Text(yStats.Sum(x => x.MinutesPlayed).ToString()).FontSize(8);
                                            t.Cell().Padding(4).AlignCenter().Text(yStats.Sum(x => x.Goals).ToString()).FontSize(8).Bold().FontColor(Green);
                                            t.Cell().Padding(4).AlignCenter().Text(yStats.Sum(x => x.Assists).ToString()).FontSize(8).Bold();
                                        }
                                        t.Cell().Background(CardBgLight).Padding(4).Text("Total").FontSize(8).Bold();
                                        t.Cell().Background(CardBgLight).Padding(4).Text("—").FontSize(8);
                                        t.Cell().Background(CardBgLight).Padding(4).AlignCenter().Text(stats.Count.ToString()).FontSize(8).Bold().FontColor(Green);
                                        t.Cell().Background(CardBgLight).Padding(4).AlignCenter().Text(totalMinutes.ToString()).FontSize(8).Bold();
                                        t.Cell().Background(CardBgLight).Padding(4).AlignCenter().Text(totalGoals.ToString()).FontSize(8).Bold().FontColor(Green);
                                        t.Cell().Background(CardBgLight).Padding(4).AlignCenter().Text(totalAssists.ToString()).FontSize(8).Bold();
                                    }
                                    else
                                    {
                                        t.Cell().ColumnSpan(6).Padding(8).Text("Sin partidos registrados en el sistema.")
                                            .FontSize(8).Italic().FontColor(Muted);
                                    }
                                });
                            });

                            // ── Indicadores circulares ──
                            main.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(10).Column(metrics =>
                            {
                                CardTitle(metrics, $"Estadísticas · {DateTime.UtcNow.Year}");
                                metrics.Item().PaddingTop(6).Row(donuts =>
                                {
                                    DonutCell(donuts, "Minutos / PJ", donutParticipacion);
                                    DonutCell(donuts, "Goles / PJ", donutGoles);
                                    DonutCell(donuts, "Asist. / PJ", donutAsistencias);
                                    DonutCell(donuts, "Rating", donutRating);
                                });
                            });

                            // ── Posiciones | Trayectoria (misma fila) ──
                            main.Item().Row(bottom =>
                            {
                                bottom.RelativeItem().Background(CardBg).Border(1).BorderColor(Border).Padding(8)
                                    .Column(pos =>
                                    {
                                        CardTitle(pos, "Posiciones");
                                        pos.Item().PaddingTop(4).Height(118).Svg(_ => BuildPitchSvg(pitchX, pitchY, posAbbr));
                                        pos.Item().PaddingTop(4).AlignCenter().Text(posLabel).FontSize(8).FontColor(Muted);
                                    });

                                bottom.ConstantItem(8);

                                bottom.RelativeItem().Background(CardBg).Border(1).BorderColor(Border).Padding(8)
                                    .Column(traj =>
                                    {
                                        CardTitle(traj, "Trayectoria");
                                        if (timeline.Count > 0)
                                        {
                                            traj.Item().PaddingTop(4).Height(52).Svg(_ => BuildTimelineSvg(timeline));
                                            traj.Item().PaddingTop(6).Column(list =>
                                            {
                                                foreach (var h in timeline.OrderByDescending(x => x.Year).Take(4))
                                                {
                                                    list.Item().PaddingVertical(2).Row(r =>
                                                    {
                                                        r.ConstantItem(32).Text(h.Year.ToString()).FontSize(8).FontColor(Green);
                                                        r.RelativeItem().Text(h.ClubName).FontSize(8);
                                                        r.ConstantItem(52).AlignRight().Text(FormatClubCategory(h.Category))
                                                            .FontSize(7).FontColor(Muted);
                                                    });
                                                }
                                            });
                                        }
                                        else
                                            traj.Item().PaddingTop(8).Text("Sin historial de clubes.").FontSize(8).Italic().FontColor(Muted);
                                    });
                            });

                            // ── Última transferencia ──
                            if (lastTransfer is not null)
                            {
                                main.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(8).Column(tr =>
                                {
                                    CardTitle(tr, "Última transferencia");
                                    tr.Item().PaddingTop(6).Table(t =>
                                    {
                                        t.ColumnsDefinition(c =>
                                        {
                                            c.ConstantColumn(44); c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn();
                                        });
                                        t.Header(h =>
                                        {
                                            foreach (var hdr in new[] { "Fecha", "Origen", "Destino", "Estado" })
                                                h.Cell().Background(CardBgLight).Padding(3)
                                                    .Text(hdr).FontSize(7).Bold().FontColor(Muted);
                                        });
                                        t.Cell().Padding(4).Text(lastTransfer.TransferDate.ToString("dd/MM/yyyy")).FontSize(8);
                                        t.Cell().Padding(4).Text(lastTransfer.OriginClub).FontSize(8);
                                        t.Cell().Padding(4).Text(lastTransfer.DestinationClub).FontSize(8);
                                        t.Cell().Padding(4).Text(lastTransfer.Status).FontSize(8).FontColor(Green);
                                    });
                                });
                            }

                            if (!string.IsNullOrWhiteSpace(player.Notes))
                            {
                                main.Item().Background(CardBgLight).Border(1).BorderColor(GreenDark).Padding(8).Column(n =>
                                {
                                    CardTitle(n, "Perfil destacado");
                                    n.Item().PaddingTop(4).Text(player.Notes).FontSize(8);
                                });
                            }

                            if (achievements.Count > 0)
                            {
                                main.Item().Background(CardBg).Border(1).BorderColor(Border).Padding(8).Column(ach =>
                                {
                                    CardTitle(ach, "Logros");
                                    ach.Item().PaddingTop(4).Column(list =>
                                    {
                                        foreach (var a in achievements.Take(4))
                                        {
                                            list.Item().PaddingVertical(2).Text(text =>
                                            {
                                                text.Span($"{a.Year} · ").FontColor(Green).FontSize(8);
                                                text.Span($"{FormatAchievementType(a.AchievementType)} — {a.TournamentName} ({a.Country})")
                                                    .FontSize(8).FontColor(LightText);
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                });

                page.Footer().PaddingTop(4).Row(f =>
                {
                    f.RelativeItem().Text("Fortis Glesnor Group · Documento confidencial para clubes")
                        .FontSize(6).FontColor(Muted);
                    f.ConstantItem(40).AlignRight().Text(t =>
                    {
                        t.Span("Pág. ").FontSize(6).FontColor(Muted);
                        t.CurrentPageNumber().FontSize(6).FontColor(Muted);
                    });
                });
            });
        }).GeneratePdf(stream);

        return stream.ToArray();
    }

    private static void CardTitle(ColumnDescriptor col, string title)
    {
        col.Item().Row(r =>
        {
            r.ConstantItem(2).Height(14).Background(Green);
            r.AutoItem().PaddingLeft(6).Text(title).FontSize(9).Bold().FontColor(LightText);
        });
    }

    private static void DataLineDark(ColumnDescriptor col, string label, string value)
    {
        col.Item().PaddingVertical(2).Row(r =>
        {
            r.ConstantItem(58).Text(label).FontSize(7).FontColor(Muted);
            r.RelativeItem().Text(value).FontSize(7).SemiBold().FontColor(LightText);
        });
    }

    private static void DonutCell(RowDescriptor row, string label, float percent)
    {
        row.RelativeItem().Padding(2).Column(c =>
        {
            c.Item().Height(52).Svg(_ => BuildDonutSvg(label, percent));
            c.Item().PaddingTop(2).AlignCenter().Text(label).FontSize(6).FontColor(Muted);
        });
    }

    private static string FormatFootShort(string? foot)
    {
        var f = (foot ?? "").Trim().ToLowerInvariant();
        if (f.Contains("izquier")) return "Izq";
        if (f.Contains("derech")) return "Der";
        if (f.Contains("amb")) return "Amb";
        return f.Length > 0 ? f[..Math.Min(3, f.Length)] : "—";
    }

    private static string BuildDonutSvg(string label, float percent)
    {
        var pct = Math.Clamp(percent, 0, 100);
        var r = 22;
        var c = 2 * Math.PI * r;
        var dash = pct / 100.0 * c;
        var gap = c - dash;
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="{r}" fill="none" stroke="#2d3748" stroke-width="5"/>
              <circle cx="28" cy="28" r="{r}" fill="none" stroke="#2ecc71" stroke-width="5"
                stroke-dasharray="{dash:F1} {gap:F1}" stroke-linecap="round"
                transform="rotate(-90 28 28)"/>
              <text x="28" y="28" text-anchor="middle" dominant-baseline="middle"
                    fill="#f0f4fa" font-family="Arial" font-size="9" font-weight="bold">{pct:F0}%</text>
            </svg>
            """;
    }

    private static string BuildMiniPitchSvg(float normX, float normY, string abbr)
    {
        var cx = normX * 40;
        var cy = normY * 28 + 4;
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 36">
              <rect width="40" height="36" fill="#1e2633" rx="3"/>
              <rect x="3" y="3" width="34" height="30" fill="#243029" stroke="#4a7c59" stroke-width="0.5"/>
              <line x1="3" y1="18" x2="37" y2="18" stroke="#6bcf8a" stroke-width="0.4" opacity="0.5"/>
              <circle cx="{cx:F1}" cy="{cy:F1}" r="5" fill="#2ecc71"/>
              <text x="{cx:F1}" y="{cy:F1}" text-anchor="middle" dominant-baseline="middle"
                    fill="#0d0f12" font-size="5" font-weight="bold">{EscapeXml(abbr)}</text>
            </svg>
            """;
    }

    private static string BuildPitchSvg(float normX, float normY, string abbr)
    {
        var cx = normX * 100;
        var cy = normY * 100 + 8;
        return $"""
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 118">
              <rect width="100" height="118" fill="#1e2633" rx="4"/>
              <rect x="6" y="6" width="88" height="106" fill="#243029" stroke="#4a7c59" stroke-width="0.8" rx="2"/>
              <line x1="6" y1="59" x2="94" y2="59" stroke="#6bcf8a" stroke-width="0.6" opacity="0.5"/>
              <rect x="26" y="6" width="48" height="14" fill="none" stroke="#6bcf8a" stroke-width="0.5" opacity="0.4"/>
              <rect x="26" y="98" width="48" height="14" fill="none" stroke="#6bcf8a" stroke-width="0.5" opacity="0.4"/>
              <circle cx="50" cy="59" r="12" fill="none" stroke="#6bcf8a" stroke-width="0.5" opacity="0.35"/>
              <circle cx="{cx:F1}" cy="{cy:F1}" r="10" fill="#2ecc71" stroke="#fff" stroke-width="1"/>
              <text x="{cx:F1}" y="{cy:F1}" text-anchor="middle" dominant-baseline="middle"
                    fill="#0d0f12" font-family="Arial" font-size="7" font-weight="bold">{EscapeXml(abbr)}</text>
            </svg>
            """;
    }

    private static string BuildTimelineSvg(IReadOnlyList<PlayerClubHistory> items)
    {
        var list = items.Take(7).ToList();
        if (list.Count == 0)
            return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 40"></svg>""";

        var n = list.Count;
        var step = n > 1 ? 250.0 / (n - 1) : 0;
        var sb = new System.Text.StringBuilder();
        sb.Append("""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 48">""");
        sb.Append("""<line x1="25" y1="18" x2="275" y2="18" stroke="#3d4f66" stroke-width="2"/>""");

        for (var i = 0; i < n; i++)
        {
            var x = 25 + (n > 1 ? step * i : 137);
            var club = EscapeXml(Truncate(list[i].ClubName, 10));
            var year = list[i].Year.ToString();
            sb.Append($"<circle cx=\"{x:F0}\" cy=\"18\" r=\"6\" fill=\"#2ecc71\" stroke=\"#0d0f12\" stroke-width=\"1\"/>");
            sb.Append($"<text x=\"{x:F0}\" y=\"34\" text-anchor=\"middle\" fill=\"#7d8fa8\" font-size=\"7\" font-family=\"Arial\">{year}</text>");
            sb.Append($"<text x=\"{x:F0}\" y=\"44\" text-anchor=\"middle\" fill=\"#f0f4fa\" font-size=\"5.5\" font-family=\"Arial\">{club}</text>");
        }

        sb.Append("</svg>");
        return sb.ToString();
    }

    private static (float X, float Y, string Abbr, string Label) MapPosition(string mainPosition)
    {
        var p = mainPosition.Trim().ToLowerInvariant();
        if (p.Contains("portero")) return (0.5f, 0.88f, "POR", "Portero");
        if (p.Contains("lateral"))
        {
            var right = p.Contains("derech") || p.Contains(" der");
            return (right ? 0.86f : 0.14f, 0.72f, "LAT", right ? "Lateral derecho" : "Lateral izquierdo");
        }
        if (p.Contains("defensa") || p.Contains("central") || p.Contains("zaguero"))
            return (0.5f, 0.76f, "DFC", "Defensa central");
        if (p.Contains("mediocamp") && (p.Contains("defens") || p.Contains("conten")))
            return (0.5f, 0.58f, "MCD", "Mediocampista defensivo");
        if (p.Contains("volante")) return (0.5f, 0.46f, "VOL", "Volante");
        if (p.Contains("mediocamp") && p.Contains("ofens"))
            return (0.5f, 0.30f, "MCO", "Mediocampista ofensivo");
        if (p.Contains("mediocamp")) return (0.5f, 0.52f, "MC", "Mediocampista");
        if (p.Contains("extremo"))
        {
            var left = p.Contains("izquierd") || p.Contains(" izq");
            return (left ? 0.18f : 0.82f, 0.28f, "EXT", left ? "Extremo izquierdo" : "Extremo derecho");
        }
        if (p.Contains("delantero")) return (0.5f, 0.14f, "DEL", "Delantero");
        return (0.5f, 0.5f, AbbrFromText(mainPosition), mainPosition);
    }

    private static string AbbrFromText(string text)
    {
        var words = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0) return "—";
        if (words.Length == 1) return words[0].Length <= 4 ? words[0].ToUpperInvariant() : words[0][..3].ToUpperInvariant();
        return $"{words[0][0]}{words[1][0]}".ToUpperInvariant();
    }

    private static string FormatClubCategory(string category) => category switch
    {
        "PrimeraDivision" => "1ª",
        "SegundaDivision" => "2ª",
        "Reserva" => "Reserva",
        "Sub20" => "Sub-20", "Sub19" => "Sub-19", "Sub18" => "Sub-18",
        "Sub17" => "Sub-17", "Sub16" => "Sub-16", "Sub15" => "Sub-15",
        "Sub14" => "Sub-14", "Sub13" => "Sub-13", "Formativa" => "Form.",
        _ => string.IsNullOrWhiteSpace(category) ? "—" : category
    };

    private static string FormatAchievementType(string type) => type switch
    {
        "TituloTorneo" => "Título",
        "ParticipacionInternacional" => "Int. oficial",
        _ => type
    };

    private static string EscapeXml(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");

    private static string Truncate(string s, int max) =>
        s.Length <= max ? s : s[..(max - 1)] + "…";
}
