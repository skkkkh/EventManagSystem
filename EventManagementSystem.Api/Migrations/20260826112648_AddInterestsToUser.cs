using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddInterestsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Interests",
                table: "Users",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Interests",
                table: "Users");
        }
    }
}
