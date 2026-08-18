using System.Linq.Expressions;

namespace EventManagementSystem.Api.Repositories;

/// <summary>
/// Generic repository contract. Kept intentionally small — this is the
/// abstraction the syllabus wants visible (OOP: interfaces + generics),
/// not a full spec sheet.
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IReadOnlyList<T>> GetAllAsync();
    Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
}
