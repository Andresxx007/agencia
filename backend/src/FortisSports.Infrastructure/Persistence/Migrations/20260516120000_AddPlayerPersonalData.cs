using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260516120000_AddPlayerPersonalData")]
public partial class AddPlayerPersonalData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "IdCardNumber",
            table: "Players",
            type: "character varying(60)",
            maxLength: 60,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "City",
            table: "Players",
            type: "character varying(120)",
            maxLength: 120,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Address",
            table: "Players",
            type: "character varying(300)",
            maxLength: 300,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Email",
            table: "Players",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "JerseyNumber",
            table: "Players",
            type: "integer",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "IdCardNumber", table: "Players");
        migrationBuilder.DropColumn(name: "City", table: "Players");
        migrationBuilder.DropColumn(name: "Address", table: "Players");
        migrationBuilder.DropColumn(name: "Email", table: "Players");
        migrationBuilder.DropColumn(name: "JerseyNumber", table: "Players");
    }
}
