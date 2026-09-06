using MediatR;
using Microsoft.AspNetCore.Http;

namespace EventManagementSystem.Api.CQRS.Images;

public record UploadImageCommand(IFormFile File) : IRequest<string>;
