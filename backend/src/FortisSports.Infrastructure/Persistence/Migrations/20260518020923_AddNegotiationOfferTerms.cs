using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNegotiationOfferTerms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContractYears",
                table: "Negotiations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "GoalBonusNotes",
                table: "Negotiations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "HasGoalBonus",
                table: "Negotiations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasHousingBonus",
                table: "Negotiations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasObjectiveBonus",
                table: "Negotiations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasSigningBonus",
                table: "Negotiations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "HousingBonusNotes",
                table: "Negotiations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "InstallmentsPerYear",
                table: "Negotiations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyAmount",
                table: "Negotiations",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ObjectiveBonusNotes",
                table: "Negotiations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SigningBonusNotes",
                table: "Negotiations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Negotiations"
                SET "MonthlyAmount" = "OfferedAmount",
                    "InstallmentsPerYear" = 12,
                    "ContractYears" = 1
                WHERE "MonthlyAmount" = 0 OR "InstallmentsPerYear" = 0 OR "ContractYears" = 0;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContractYears",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "GoalBonusNotes",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "HasGoalBonus",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "HasHousingBonus",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "HasObjectiveBonus",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "HasSigningBonus",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "HousingBonusNotes",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "InstallmentsPerYear",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "MonthlyAmount",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "ObjectiveBonusNotes",
                table: "Negotiations");

            migrationBuilder.DropColumn(
                name: "SigningBonusNotes",
                table: "Negotiations");
        }
    }
}
