using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizerAboutUsAndTeamMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AboutUs",
                table: "Users",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TeamMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrganizerId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    PhotoUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamMembers_Users_OrganizerId",
                        column: x => x.OrganizerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeamMembers_OrganizerId",
                table: "TeamMembers",
                column: "OrganizerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "AboutUs",
                table: "Users");
        }
    }
}
