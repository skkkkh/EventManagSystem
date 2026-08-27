using Microsoft.AspNetCore.Identity;
using EventManagementSystem.Api.Models;

namespace EventManagementSystem.Api.Services;

public interface IIdentificationHasher
{
    string Hash(User user, string idNumber);
    bool Verify(User user, string idNumber, string storedHash);
    string GetLast4(string idNumber);
}

public class IdentificationHasher : IIdentificationHasher
{
    private readonly IPasswordHasher<User> _passwordHasher;

    public IdentificationHasher(IPasswordHasher<User> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public string Hash(User user, string idNumber) =>
        _passwordHasher.HashPassword(user, idNumber);

    public bool Verify(User user, string idNumber, string storedHash) =>
        _passwordHasher.VerifyHashedPassword(user, storedHash, idNumber) != PasswordVerificationResult.Failed;

    public string GetLast4(string idNumber) =>
        idNumber.Length >= 4 ? idNumber[^4..] : idNumber;
}