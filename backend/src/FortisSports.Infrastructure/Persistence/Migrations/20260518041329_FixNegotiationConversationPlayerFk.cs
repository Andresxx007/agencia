using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FortisSports.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixNegotiationConversationPlayerFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "NegotiationConversations" c
                SET "PlayerId" = n."PlayerId",
                    "ClubName" = CASE
                        WHEN c."ClubName" IS NULL OR c."ClubName" = '' THEN n."ClubName"
                        ELSE c."ClubName"
                    END
                FROM "Negotiations" n
                WHERE c."NegotiationId" = n."Id"
                  AND c."PlayerId" = '00000000-0000-0000-0000-000000000000';
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint
                        WHERE conname = 'FK_NegotiationConversations_Players_PlayerId'
                    ) THEN
                        ALTER TABLE "NegotiationConversations"
                        ADD CONSTRAINT "FK_NegotiationConversations_Players_PlayerId"
                        FOREIGN KEY ("PlayerId") REFERENCES "Players" ("Id") ON DELETE CASCADE;
                    END IF;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
