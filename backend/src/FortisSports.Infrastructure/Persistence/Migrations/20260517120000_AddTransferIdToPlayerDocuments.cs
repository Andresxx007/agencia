using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260517120000_AddTransferIdToPlayerDocuments")]
public partial class AddTransferIdToPlayerDocuments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "TransferId",
            table: "PlayerDocuments",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_PlayerDocuments_TransferId",
            table: "PlayerDocuments",
            column: "TransferId");

        migrationBuilder.AddForeignKey(
            name: "FK_PlayerDocuments_Transfers_TransferId",
            table: "PlayerDocuments",
            column: "TransferId",
            principalTable: "Transfers",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_PlayerDocuments_Transfers_TransferId",
            table: "PlayerDocuments");

        migrationBuilder.DropIndex(
            name: "IX_PlayerDocuments_TransferId",
            table: "PlayerDocuments");

        migrationBuilder.DropColumn(
            name: "TransferId",
            table: "PlayerDocuments");
    }
}
