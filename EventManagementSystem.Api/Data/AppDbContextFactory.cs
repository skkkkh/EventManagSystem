using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EventManagementSystem.Api.Data;

// Design-time factory used by EF tools so they don't have to run Program.cs
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();

        // Use the same default connection string as Program.cs when one isn't provided
        optionsBuilder.UseSqlite("Data Source=eventmanagement.db");

        return new AppDbContext(optionsBuilder.Options);
    }
}
