# Event Management System — Week 1 (Events / Templates / Config Engine module)

This is your Week 1 deliverable: the **Events, Templates & Config Engine**
module, ready to open in Visual Studio.

## What's in here

```
EventManagementSystem.sln
EventManagementSystem.Api/
├── Controllers/
│   ├── EventsController.cs          # CRUD + /upcoming for Events
│   └── EventTemplatesController.cs  # Config engine: templates + custom fields
├── Models/
│   ├── Event.cs                     # The central table — everyone FKs into this
│   ├── EventTemplate.cs
│   ├── CustomField.cs               # Dynamic field definitions (Text/Number/Date/Bool/Dropdown)
│   └── EventFieldValue.cs           # Actual values entered per-event
├── DTOs/
│   ├── EventDtos.cs
│   └── EventTemplateDtos.cs
├── Data/
│   └── AppDbContext.cs              # SHARED — coordinate with the team before editing
├── Repositories/
│   ├── IRepository.cs / Repository.cs       # Generic repo pattern
│   └── IUnitOfWork.cs / UnitOfWork.cs        # Unit of Work over the shared DbContext
├── Program.cs                       # DI, EF Core (SQLite), Swagger, CORS
├── appsettings.json
└── Properties/launchSettings.json
```

## How to open and run it

1. Open **EventManagementSystem.sln** in Visual Studio 2026.
2. Let NuGet restore the packages (EF Core, EF Core Sqlite, Swashbuckle) — needs
   an internet connection the first time.
3. Open the **Package Manager Console** and run, from the `EventManagementSystem.Api` project:
   ```
   Add-Migration InitialCreate
   Update-Database
   ```
   (Or from a terminal in that folder: `dotnet ef migrations add InitialCreate` then `dotnet ef database update`.)
   This creates `eventmanagement.db` (SQLite) — zero setup needed, no SQL Server required.
4. Press **F5** (or `dotnet run`). It launches straight into Swagger at `/swagger`.

## What's implemented

- `Event`, `EventTemplate`, `CustomField`, `EventFieldValue` models with EF Core relationships
- Generic `Repository<T>` + `UnitOfWork` — the OOP/interfaces/generics layer the syllabus wants visible
- `EventsController`: `GET /api/events`, `GET /api/events/{id}`, `GET /api/events/upcoming`,
  `POST /api/events`, `PUT /api/events/{id}`, `DELETE /api/events/{id}`
- `EventTemplatesController`: `GET/POST /api/eventtemplates`, `POST /api/eventtemplates/{id}/fields`,
  `DELETE /api/eventtemplates/{id}`
- Swagger/OpenAPI wired up and set as the launch page
- SQLite by default so teammates can run it with no DB install; swap the
  connection string in `appsettings.json` for SQL Server later if you want

## Next steps for you (rest of Week 1, per the plan)

- Add validation edge cases you want (e.g. reject dropdown fields with no `Options`)
- Start the Reporting piece (a `GET /api/events/reports/...` endpoint or similar)
- When the CS student's and AI student's models land, merge everyone's `DbSet<>`
  additions into `AppDbContext.cs` together — that's the file most likely to conflict

## Coordination note

`AppDbContext.cs` is shared. When the CS student adds `Booking`/`Payment` and
the AI student adds `User`/`Notification`, those DbSets get added here too —
talk before anyone pushes changes to this file.
