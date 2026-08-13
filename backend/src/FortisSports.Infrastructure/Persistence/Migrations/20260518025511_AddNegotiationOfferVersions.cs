using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNegotiationOfferVersions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentVersionNumber",
                table: "Negotiations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "NegotiationOfferVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NegotiationId = table.Column<Guid>(type: "uuid", nullable: false),
                    VersionNumber = table.Column<int>(type: "integer", nullable: false),
                    ProposedBy = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ClubName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MonthlyAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    InstallmentsPerYear = table.Column<int>(type: "integer", nullable: false),
                    ContractYears = table.Column<int>(type: "integer", nullable: false),
                    HasHousingBonus = table.Column<bool>(type: "boolean", nullable: false),
                    HousingBonusNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HasObjectiveBonus = table.Column<bool>(type: "boolean", nullable: false),
                    ObjectiveBonusNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HasGoalBonus = table.Column<bool>(type: "boolean", nullable: false),
                    GoalBonusNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    HasSigningBonus = table.Column<bool>(type: "boolean", nullable: false),
                    SigningBonusNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    OfferDate = table.Column<DateOnly>(type: "date", nullable: false),
                    RegisteredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NegotiationOfferVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NegotiationOfferVersions_Negotiations_NegotiationId",
                        column: x => x.NegotiationId,
                        principalTable: "Negotiations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NegotiationOfferVersions_NegotiationId_VersionNumber",
                table: "NegotiationOfferVersions",
                columns: new[] { "NegotiationId", "VersionNumber" },
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO "NegotiationOfferVersions" (
                    "Id", "NegotiationId", "VersionNumber", "ProposedBy", "Notes", "ClubName",
                    "MonthlyAmount", "InstallmentsPerYear", "ContractYears",
                    "HasHousingBonus", "HousingBonusNotes", "HasObjectiveBonus", "ObjectiveBonusNotes",
                    "HasGoalBonus", "GoalBonusNotes", "HasSigningBonus", "SigningBonusNotes",
                    "Currency", "OfferDate", "RegisteredAtUtc", "CreatedAtUtc", "CreatedBy"
                )
                SELECT
                    gen_random_uuid(),
                    n."Id",
                    1,
                    'Inicial',
                    NULL,
                    n."ClubName",
                    CASE WHEN n."MonthlyAmount" > 0 THEN n."MonthlyAmount" ELSE n."OfferedAmount" END,
                    CASE WHEN n."InstallmentsPerYear" > 0 THEN n."InstallmentsPerYear" ELSE 12 END,
                    CASE WHEN n."ContractYears" > 0 THEN n."ContractYears" ELSE 1 END,
                    n."HasHousingBonus",
                    COALESCE(n."HousingBonusNotes", ''),
                    n."HasObjectiveBonus",
                    COALESCE(n."ObjectiveBonusNotes", ''),
                    n."HasGoalBonus",
                    COALESCE(n."GoalBonusNotes", ''),
                    n."HasSigningBonus",
                    COALESCE(n."SigningBonusNotes", ''),
                    n."Currency",
                    n."OfferDate",
                    n."CreatedAtUtc",
                    n."CreatedAtUtc",
                    n."CreatedBy"
                FROM "Negotiations" n;

                UPDATE "Negotiations" SET "CurrentVersionNumber" = 1 WHERE "CurrentVersionNumber" = 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NegotiationOfferVersions");

            migrationBuilder.DropColumn(
                name: "CurrentVersionNumber",
                table: "Negotiations");
        }
    }
}
