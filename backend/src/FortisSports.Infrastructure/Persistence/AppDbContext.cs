using FortisSports.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FortisSports.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Player> Players => Set<Player>();
    public DbSet<RepresentationContract> RepresentationContracts => Set<RepresentationContract>();
    public DbSet<PlayerDocument> PlayerDocuments => Set<PlayerDocument>();
    public DbSet<Negotiation> Negotiations => Set<Negotiation>();
    public DbSet<NegotiationInteraction> NegotiationInteractions => Set<NegotiationInteraction>();
    public DbSet<NegotiationOfferVersion> NegotiationOfferVersions => Set<NegotiationOfferVersion>();
    public DbSet<NegotiationConversation> NegotiationConversations => Set<NegotiationConversation>();
    public DbSet<Transfer> Transfers => Set<Transfer>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Catalog> Catalogs => Set<Catalog>();
    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<DataSource> DataSources => Set<DataSource>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<CompetitiveCategory> CompetitiveCategories => Set<CompetitiveCategory>();
    public DbSet<Competition> Competitions => Set<Competition>();
    public DbSet<Club> Clubs => Set<Club>();
    public DbSet<ClubCompetitionSeason> ClubCompetitionSeasons => Set<ClubCompetitionSeason>();
    public DbSet<PlayerMatchStat> PlayerMatchStats => Set<PlayerMatchStat>();
    public DbSet<PlayerClubHistory> PlayerClubHistories => Set<PlayerClubHistory>();
    public DbSet<PlayerSportingAchievement> PlayerSportingAchievements => Set<PlayerSportingAchievement>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Player>(entity =>
        {
            entity.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Nationality).HasMaxLength(100).IsRequired();
            entity.Property(x => x.MainPosition).HasMaxLength(50).IsRequired();
            entity.Property(x => x.PhotoUrl).HasMaxLength(500);
            entity.Property(x => x.IdCardNumber).HasMaxLength(60);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.Address).HasMaxLength(300);
            entity.Property(x => x.Email).HasMaxLength(200);
            entity.Property(x => x.PhoneNumber).HasMaxLength(30);
        });

        builder.Entity<RepresentationContract>(entity =>
        {
            entity.Property(x => x.PdfPath).HasMaxLength(500).IsRequired();
            entity.HasOne(x => x.Player)
                .WithMany(x => x.Contracts)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerDocument>(entity =>
        {
            entity.Property(x => x.FilePath).HasMaxLength(500).IsRequired();
            entity.Property(x => x.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.HasOne(x => x.Player)
                .WithMany(x => x.Documents)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Transfer)
                .WithMany()
                .HasForeignKey(x => x.TransferId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Negotiation>(entity =>
        {
            entity.Property(x => x.ClubName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Currency).HasMaxLength(10).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ResponsibleName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.HousingBonusNotes).HasMaxLength(500);
            entity.Property(x => x.ObjectiveBonusNotes).HasMaxLength(500);
            entity.Property(x => x.GoalBonusNotes).HasMaxLength(500);
            entity.Property(x => x.SigningBonusNotes).HasMaxLength(500);
            entity.HasOne(x => x.Player)
                .WithMany(x => x.Negotiations)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<NegotiationInteraction>(entity =>
        {
            entity.Property(x => x.InteractionType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.UpdatedStatus).HasMaxLength(50).IsRequired();
            entity.HasOne(x => x.Negotiation)
                .WithMany(x => x.Interactions)
                .HasForeignKey(x => x.NegotiationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<NegotiationConversation>(entity =>
        {
            entity.Property(x => x.ClubName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.ConversationType).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Subject).HasMaxLength(200);
            entity.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Participants).HasMaxLength(300);
            entity.HasIndex(x => x.PlayerId);
            entity.HasIndex(x => x.NegotiationId);
            entity.HasIndex(x => x.OccurredAtUtc);
            entity.HasOne(x => x.Player)
                .WithMany()
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Negotiation)
                .WithMany(x => x.Conversations)
                .HasForeignKey(x => x.NegotiationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<NegotiationOfferVersion>(entity =>
        {
            entity.Property(x => x.ProposedBy).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.Property(x => x.ClubName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Currency).HasMaxLength(10).IsRequired();
            entity.Property(x => x.HousingBonusNotes).HasMaxLength(500);
            entity.Property(x => x.ObjectiveBonusNotes).HasMaxLength(500);
            entity.Property(x => x.GoalBonusNotes).HasMaxLength(500);
            entity.Property(x => x.SigningBonusNotes).HasMaxLength(500);
            entity.HasIndex(x => new { x.NegotiationId, x.VersionNumber }).IsUnique();
            entity.HasOne(x => x.Negotiation)
                .WithMany(x => x.OfferVersions)
                .HasForeignKey(x => x.NegotiationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Transfer>(entity =>
        {
            entity.Property(x => x.OriginClub).HasMaxLength(150).IsRequired();
            entity.Property(x => x.DestinationClub).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Currency).HasMaxLength(10).IsRequired();
            entity.Property(x => x.TransferType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ManagedBy).HasMaxLength(120).IsRequired();
            entity.HasOne(x => x.Player)
                .WithMany(x => x.Transfers)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Priority).HasMaxLength(20).IsRequired();
        });

        builder.Entity<AuditLog>(entity =>
        {
            entity.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Action).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ChangesSummary).HasMaxLength(1500).IsRequired();
        });

        builder.Entity<Catalog>(entity =>
        {
            entity.Property(x => x.Code).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<CatalogItem>(entity =>
        {
            entity.Property(x => x.Code).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Country).HasMaxLength(80);
            entity.Property(x => x.City).HasMaxLength(80);
            entity.Property(x => x.League).HasMaxLength(120);
            entity.HasOne(x => x.Catalog)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.CatalogId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.ParentItem)
                .WithMany()
                .HasForeignKey(x => x.ParentItemId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);
        });

        builder.Entity<DataSource>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Type).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Url).HasMaxLength(500);
            entity.Property(x => x.Reliability).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<Country>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Nationality).HasMaxLength(120);
            entity.Property(x => x.FifaCode).HasMaxLength(5);
            entity.Property(x => x.Iso2Code).HasMaxLength(5);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<City>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.RegionDepartment).HasMaxLength(150);
            entity.HasOne(x => x.Country)
                .WithMany()
                .HasForeignKey(x => x.CountryId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(x => new { x.CountryId, x.Name }).IsUnique();
        });

        builder.Entity<CompetitiveCategory>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(600);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<Competition>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Season).HasMaxLength(20).IsRequired();
            entity.HasOne(x => x.Country)
                .WithMany()
                .HasForeignKey(x => x.CountryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CompetitiveCategory)
                .WithMany()
                .HasForeignKey(x => x.CompetitiveCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.DataSource)
                .WithMany()
                .HasForeignKey(x => x.DataSourceId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => new { x.CountryId, x.Name, x.Season }).IsUnique();
        });

        builder.Entity<Club>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.Property(x => x.ShortName).HasMaxLength(80);
            entity.Property(x => x.CrestUrl).HasMaxLength(1000);
            entity.Property(x => x.ApiProvider).HasMaxLength(80);
            entity.Property(x => x.ApiTeamId).HasMaxLength(80);
            entity.Property(x => x.ValidationStatus).HasMaxLength(30).IsRequired();
            entity.HasOne(x => x.Country)
                .WithMany()
                .HasForeignKey(x => x.CountryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.City)
                .WithMany()
                .HasForeignKey(x => x.CityId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(x => x.DataSource)
                .WithMany()
                .HasForeignKey(x => x.DataSourceId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => new { x.CountryId, x.Name }).IsUnique();
        });

        builder.Entity<ClubCompetitionSeason>(entity =>
        {
            entity.Property(x => x.Season).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasOne(x => x.Club)
                .WithMany()
                .HasForeignKey(x => x.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Competition)
                .WithMany()
                .HasForeignKey(x => x.CompetitionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.DataSource)
                .WithMany()
                .HasForeignKey(x => x.DataSourceId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(x => new { x.ClubId, x.CompetitionId, x.Season }).IsUnique();
        });

        builder.Entity<PlayerMatchStat>(entity =>
        {
            entity.Property(x => x.Opponent).HasMaxLength(150).IsRequired();
            entity.Property(x => x.PhysicalStatus).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(1000).IsRequired();
            entity.HasOne(x => x.Player)
                .WithMany(x => x.MatchStats)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerClubHistory>(entity =>
        {
            entity.Property(x => x.ClubName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasOne(x => x.Player)
                .WithMany(x => x.ClubHistory)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerSportingAchievement>(entity =>
        {
            entity.Property(x => x.AchievementType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TournamentName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Country).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasOne(x => x.Player)
                .WithMany(x => x.SportingAchievements)
                .HasForeignKey(x => x.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
