using System.Linq.Expressions;
using EventManagementSystem.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSystem.Api.Repositories;

/// <summary>
/// EF Core-backed implementation of IRepository&lt;T&gt;. Note this never
/// calls SaveChanges — that's the Unit of Work's job, so multiple
/// repository operations can be committed as one transaction.
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

    public async Task<IReadOnlyList<T>> GetAllAsync() =>
        await _dbSet.AsNoTracking().ToListAsync();

    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
        await _dbSet.AsNoTracking().Where(predicate).ToListAsync();

    public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

    public void Update(T entity) => _dbSet.Update(entity);

    public void Remove(T entity) => _dbSet.Remove(entity);
}
