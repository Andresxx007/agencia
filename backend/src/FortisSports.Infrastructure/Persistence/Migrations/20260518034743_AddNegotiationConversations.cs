using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNegotiationConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NegotiationConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NegotiationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Content = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Participants = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NegotiationConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NegotiationConversations_Negotiations_NegotiationId",
                        column: x => x.NegotiationId,
                        principalTable: "Negotiations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NegotiationConversations_NegotiationId",
                table: "NegotiationConversations",
                column: "NegotiationId");

            migrationBuilder.CreateIndex(
                name: "IX_NegotiationConversations_OccurredAtUtc",
                table: "NegotiationConversations",
                column: "OccurredAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NegotiationConversations");
        }
    }
}
