using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260517160000_AddCategoryToPlayerClubHistory")]
public partial class AddCategoryToPlayerClubHistory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Category",
            table: "PlayerClubHistories",
            type: "character varying(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "PrimeraDivision");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Category",
            table: "PlayerClubHistories");
    }
}
