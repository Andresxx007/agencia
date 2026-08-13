using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260517150000_AddPlayerClubHistoryAndAchievements")]
public partial class AddPlayerClubHistoryAndAchievements : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PlayerClubHistories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                ClubName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                Year = table.Column<int>(type: "integer", nullable: false),
                Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                CreatedBy = table.Column<string>(type: "text", nullable: true),
                UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                UpdatedBy = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerClubHistories", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerClubHistories_Players_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "Players",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "PlayerSportingAchievements",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                PlayerId = table.Column<Guid>(type: "uuid", nullable: false),
                AchievementType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                TournamentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Year = table.Column<int>(type: "integer", nullable: false),
                Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                CreatedBy = table.Column<string>(type: "text", nullable: true),
                UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                UpdatedBy = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerSportingAchievements", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerSportingAchievements_Players_PlayerId",
                    column: x => x.PlayerId,
                    principalTable: "Players",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PlayerClubHistories_PlayerId",
            table: "PlayerClubHistories",
            column: "PlayerId");

        migrationBuilder.CreateIndex(
            name: "IX_PlayerSportingAchievements_PlayerId",
            table: "PlayerSportingAchievements",
            column: "PlayerId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PlayerSportingAchievements");
        migrationBuilder.DropTable(name: "PlayerClubHistories");
    }
}
