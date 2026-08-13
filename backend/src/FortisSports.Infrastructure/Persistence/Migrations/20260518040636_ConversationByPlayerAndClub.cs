using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ConversationByPlayerAndClub : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NegotiationConversations_Negotiations_NegotiationId",
                table: "NegotiationConversations");

            migrationBuilder.AlterColumn<Guid>(
                name: "NegotiationId",
                table: "NegotiationConversations",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "ClubName",
                table: "NegotiationConversations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PlayerId",
                table: "NegotiationConversations",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "NegotiationConversations" c
                SET "PlayerId" = n."PlayerId",
                    "ClubName" = n."ClubName"
                FROM "Negotiations" n
                WHERE c."NegotiationId" = n."Id";
                """);

            migrationBuilder.AlterColumn<string>(
                name: "ClubName",
                table: "NegotiationConversations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<Guid>(
                name: "PlayerId",
                table: "NegotiationConversations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_NegotiationConversations_PlayerId",
                table: "NegotiationConversations",
                column: "PlayerId");

            migrationBuilder.AddForeignKey(
                name: "FK_NegotiationConversations_Negotiations_NegotiationId",
                table: "NegotiationConversations",
                column: "NegotiationId",
                principalTable: "Negotiations",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_NegotiationConversations_Players_PlayerId",
                table: "NegotiationConversations",
                column: "PlayerId",
                principalTable: "Players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NegotiationConversations_Negotiations_NegotiationId",
                table: "NegotiationConversations");

            migrationBuilder.DropForeignKey(
                name: "FK_NegotiationConversations_Players_PlayerId",
                table: "NegotiationConversations");

            migrationBuilder.DropIndex(
                name: "IX_NegotiationConversations_PlayerId",
                table: "NegotiationConversations");

            migrationBuilder.DropColumn(
                name: "ClubName",
                table: "NegotiationConversations");

            migrationBuilder.DropColumn(
                name: "PlayerId",
                table: "NegotiationConversations");

            migrationBuilder.AlterColumn<Guid>(
                name: "NegotiationId",
                table: "NegotiationConversations",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_NegotiationConversations_Negotiations_NegotiationId",
                table: "NegotiationConversations",
                column: "NegotiationId",
                principalTable: "Negotiations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
