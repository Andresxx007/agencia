using System;
using FortisSports.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260513000000_AddParentItemId")]
    public partial class AddParentItemId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentItemId",
                table: "CatalogItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogItems_ParentItemId",
                table: "CatalogItems",
                column: "ParentItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_CatalogItems_CatalogItems_ParentItemId",
                table: "CatalogItems",
                column: "ParentItemId",
                principalTable: "CatalogItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CatalogItems_CatalogItems_ParentItemId",
                table: "CatalogItems");

            migrationBuilder.DropIndex(
                name: "IX_CatalogItems_ParentItemId",
                table: "CatalogItems");

            migrationBuilder.DropColumn(
                name: "ParentItemId",
                table: "CatalogItems");
        }
    }
}
