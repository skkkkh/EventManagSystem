# Presentation Content — Event Management System / "Eventora"
*Compiled 2026-09-01 by reading the actual codebase at `EventManagSystem` (backend + React) and `event_management_app` (Flutter). Anything not verifiable from the code or a cited source is flagged as such rather than guessed.*

---

## 1. Title

The repo is named `EventManagSystem`; the Flutter mobile app is branded **"Eventora"** in its own code (`main.dart`, `MaterialApp(title: 'Eventora', ...)`). There's no single official title covering the whole system (web + mobile) recorded anywhere in the project — you'll need to pick one. A reasonable option grounded in what it actually does:

**"Eventora — A Full-Stack Event Management & Discovery Platform"**

**3 points for the slide:**
- One system, two front ends: a React web console for organizers/admins and a Flutter mobile app ("Eventora") for attendees, both talking to one ASP.NET Core API.
- Built as a modular team project — the README explicitly splits ownership into an Events/Templates module, a Bookings/Payments module, and a Users/Notifications/AI module.
- Covers the full event lifecycle: create → discover → book → pay → get notified → review.

---

## 2. Problem Statement

Inferred from what the code actually solves (not from a written brief, since none exists in the repo):

**3 points:**
- Organizers (student societies/clubs/small organizations, going by the payment options — see Target User) have no single tool to define event templates, manage ticket capacity, and track payments end-to-end; before this, payment confirmation and bookings would be manual/ad hoc.
- Attendees have no centralized place to discover events, book them, self-report payment, and be notified about status changes (booking confirmed, payment confirmed, event updated/cancelled) — this is the gap the in-app notification + email system fills.
- There was no structured way for an organizer to present a public profile/team ("About Us"), or for attendees to leave structured feedback (Reviews) — both were bolted on as first-class features.

---

## 3. Target Client / User

Grounded facts: the system seeds exactly three roles — **Admin, Organizer, Attendee** (`Program.cs`). The self-reported payment methods wired into the booking flow are **JazzCash, EasyPaisa, bank transfer, and cash** — these are Pakistani mobile-wallet/banking rails, which is a strong signal (inference, not a stated fact) that the target context is Pakistani campus/community organizations rather than a global consumer market.

**3 points:**
- **Organizers**: student societies, clubs, university departments, or small community groups running conferences/workshops/meetings/shows.
- **Attendees**: students/community members discovering and booking events, with interest-based recommendations.
- **Admins**: platform-level oversight — approving/validating organizers (via a salted-hash ID-verification flow), and visibility into all bookings/payments across organizers.

*(Verify this campus/Pakistan framing against your own knowledge of the assignment brief — it's my read of the payment options in the code, not a documented target-market statement.)*

---

## 4. Size of Market / User / Client

I don't have any user counts, pilot data, or market research inside the codebase — there is no analytics or usage data to report here, and I'm not going to invent numbers for a slide that will get fact-checked.

What I can responsibly give you:
- One industry data point, with a source: per a MarketsandMarkets report, the **global event management software market was about USD 18.6 billion in 2026, projected to reach USD 36.8 billion by 2031 (14.6% CAGR 2026–2031)**. I'm flagging this as one estimate from one research firm — other firms (Grand View Research, Fortune Business Insights, Mordor Intelligence — see Sources) publish different figures and forecast horizons, so pick one source and cite it consistently rather than blending numbers from several.
- That figure is for the *global enterprise ticketing/event-tech market* — it's not a market-size estimate for a campus/society-scale tool like this one, and using it as if it were would overstate your addressable market.

**3 points:**
- Global event management software market: ~$18.6B (2026) → ~$36.8B by 2031 at 14.6% CAGR (MarketsandMarkets — verify against the primary source before citing in a graded presentation).
- Recommend a bottom-up number instead: (registered student societies at your university) × (avg. events/year) × (avg. attendees/event) — a number you can actually defend if asked.
- No real usage/pilot data exists yet in this project to cite; if you've piloted it, use your real numbers instead of an industry estimate.

---

## 5. Technology Stack with Versions

Read directly from the project's `.csproj`, `package.json`, and `pubspec.yaml` files.

**Backend — ASP.NET Core Web API**
- Target framework: **.NET 10** (`net10.0`)
- EF Core **10.0.11** (`Microsoft.EntityFrameworkCore`, `.Sqlite`, `.Design`, `.Tools`) — SQLite as the database provider
- ASP.NET Core Identity **10.0.11**, JWT Bearer auth **10.0.11** + `System.IdentityModel.Tokens.Jwt` **8.22.0**
- MediatR **12.4.1** (CQRS command/query pattern)
- Swashbuckle/Swagger **7.2.0** (API docs)
- MailKit **4.17.0** (SMTP email)
- SQLitePCLRaw **3.53.3**

**Web frontend — React** (`frontend/package.json`)
- React **19.2.8**, React Router DOM **7.18.2**, Axios **1.19.0**
- Vite **8.2.0** (build tool), oxlint **1.75.0** (linting)
- *(all pinned with `^`, so installed versions may float slightly higher within the same major)*

**Mobile — Flutter/Dart** (`pubspec.yaml`)
- Dart SDK **^3.10.4**
- provider 6.1.2, http 1.2.2, flutter_secure_storage 9.2.2, intl 0.19.0, local_auth 2.3.0 (biometric login), google_fonts 6.2.1, image_picker 1.1.2, flutter_lints 6.0.0

**AI / third-party**
- Google **Gemini API** — model configured as `gemini-3.5-flash-lite` in `appsettings.json`. I can't independently confirm that exact model name is a currently valid/available Gemini model — it's just what's literally in the config; verify against Google's current model list before stating it as fact on a slide.

**Testing**
- xUnit **2.4.2**, Moq **4.18.4**, `Microsoft.AspNetCore.Mvc.Testing` **10.0.11**

**3 points:**
- .NET 10 / ASP.NET Core Web API + EF Core 10 + SQLite backend, secured with ASP.NET Core Identity + JWT.
- React 19 (Vite) web console + Flutter/Dart mobile app as the two client front ends.
- MediatR-driven CQRS, Google Gemini API for AI recommendations, MailKit for transactional email.

---

## 6. Project Architecture / Structure

From `Docs/ARCHITECTURE.md` and the actual folder layout — this is a genuinely useful slide because the architecture is a deliberate, if partial, migration, not a finished textbook design.

**3 points:**
- **Repository + Unit of Work** pattern (`IRepository<T>`/`Repository<T>`, `IUnitOfWork`) wraps EF Core; on top of that sits an **incrementally-adopted CQRS layer via MediatR** — Events, Bookings, Groups, Images, Notifications, Recommendations and Reviews are migrated to commands/queries/handlers, while some newer controllers (`BookingFlowController`, `DashboardController`, `OrganizerProfileController`, `SavedEventsController`) still talk to `AppDbContext` directly — a real, acknowledged architectural inconsistency, not a mistake to hide.
- **Domain pipeline**: `EventTemplate → CustomField → EventFieldValue` (a dynamic config engine for per-event custom fields) feeds into `Event → TicketType → Registration/Booking → Payment`; `Groups` restrict events to a member list, and `Notifications` fire on both email and in-app channels via MediatR's multiple-handlers-per-event support.
- **Three client surfaces, one API**: a legacy Razor/MVC `Views/` folder, a React 19 SPA, and a Flutter mobile app — unified by a custom **"SmartScheme"** dual auth policy that routes `/api/*` requests to JWT and MVC page requests to cookie auth.

---

## 7. Software Engineering / DSA / OOP / Database Concepts

**OOP & design patterns actually in the code:**
- Inheritance: `User : IdentityUser<int>`
- Interfaces + Dependency Injection everywhere: `IRepository<T>`, `IUnitOfWork`, `IEmailService`, `IRecommendationService`, `IInterestMatcher`, `IReasonEnhancer`, `IIdentificationHasher` — all constructor-injected via ASP.NET Core's built-in container, which also makes them swappable (e.g. Gemini-backed vs. keyword-fallback interest matching behind the same interface — a Strategy-pattern-shaped design).
- Generics: the generic `Repository<T>` and `IUnitOfWork.Repository<T>()`.
- Mediator pattern: MediatR for CQRS.
- Enums for domain state: `EventCategory`, `NotificationType`, `PaymentStatus`, `BookingStatus`.

**Algorithm/DSA content you can honestly point to:**
- `RecommendationService.GetRecommendationsForUserAsync` is a real content-based scoring/ranking algorithm: it builds a `HashSet` of the user's previously-attended categories, tokenizes free-text interests, scores every candidate event (category match + an AI or keyword-overlap interest score), and ranks/filters by remaining seat capacity. This is the one part of the project with genuine algorithmic content beyond CRUD.
- Be honest with your audience: this is primarily an **applied enterprise-patterns project** (CQRS, repository/UoW, auth), not an algorithms-heavy one — don't oversell DSA content that isn't really there.

**Database:**
- SQLite via EF Core, code-first migrations (several were hand-written rather than generated, since `dotnet ef` wasn't available in some working sessions).
- Relational schema: `User`, `Event`, `Booking`, `Payment`, `TicketType`, `Registration`, `Group`/`GroupMember`, `Notification`, `Review`, `SavedEvent`, `TeamMember`, `EventTemplate`/`CustomField`/`EventFieldValue`, with FKs, cascade deletes, and unique composite indexes (e.g. `SavedEvent(UserId, EventId)`).

**3 points:**
- Design patterns actually used: Repository, Unit of Work, Mediator (CQRS), Dependency Injection, Strategy-shaped interfaces (swap Gemini vs. keyword matching without changing callers).
- One real algorithm: a content-based recommendation scorer combining category-history matching with AI/keyword interest matching, filtered by live seat availability.
- Relational schema in SQLite/EF Core with 13+ entities, foreign keys, cascade deletes, and unique constraints — not a DSA showcase, but a legitimate normalized data model.

---

## 8. Third-Party APIs

**3 points:**
- **Google Gemini API** — used for two things: semantically matching a user's free-text interests against candidate events (`GeminiInterestMatcher`), and generating human-readable recommendation reasons (`GeminiRecommendationService`/`GeminiReasonEnhancer`). Falls back to plain keyword overlap if no API key is configured.
- **SMTP email** via MailKit (`SmtpEmailService`) — generically configured, so it works with Gmail SMTP (the base `appsettings.json` default) or SendGrid (the dev-environment override). As of the last session, real credentials hadn't been added yet, so confirmation emails aren't actually sending — the pipeline itself is fully wired.
- **Image upload is NOT a third-party API** — worth noting explicitly, since it's easy to assume otherwise: `UploadImageCommandHandler` saves files straight to local disk (`wwwroot/uploads`) on the API server, not to a cloud service like S3/Cloudinary.

---

## 9. Testing

**3 points:**
- Automated backend tests exist but are narrow: `EventManagementSystem.Api.Tests` (DTO tests + one `WebApplicationFactory`-based integration test) and `EventManagementSystem.UnitTests` (DTO tests), using xUnit + Moq — coverage is currently concentrated on the Events module, not Bookings/Payments/Auth/Notifications.
- The Flutter app only has the default Flutter-generated `test/widget_test.dart` boilerplate — no custom widget or unit tests have been written for it yet.
- Most real bug-finding so far has been manual/exploratory rather than automated — e.g., a JWT role-claim-mapping bug and missing ownership checks on event/booking endpoints were both caught by hand-testing, per the project's own change log, not by a test suite.

---

## 10. Deployment

**3 points:**
- Dockerized: a multi-stage backend `Dockerfile` (`mcr.microsoft.com/dotnet/sdk:10.0` → `aspnet:10.0`) and a frontend `Dockerfile` (Node 20 build → served via nginx:alpine), wired together with `docker-compose.yml` for local/dev use.
- SQLite is an embedded file database — great for zero-install local dev, but the current `docker-compose.yml` doesn't declare a persistent volume for it yet (the project's own `DockerVerification.md` flags this), and a real deployment would need either a mounted volume or a swap to a networked DB (SQL Server/Postgres) to survive container restarts or scale past one instance.
- No cloud hosting config, secrets manager, or CI/CD pipeline exists yet — the JWT signing key and other secrets currently sit in plain `appsettings.json` rather than environment variables or a secrets store, which is a real thing to flag as future work rather than something to hide.

---

## 11. Gap Analysis

**3 points:**
- **No real payment gateway**: payment is "organizer manually confirms," not "attendee pays online" — there's no integration with an actual payment processor, and the standalone "Payment Methods" profile screen is a deliberate, acknowledged stub (not a bug).
- **Feature/branch gap**: Groups, Reviews, Image upload, AI recommendations, and organizer-ID verification currently live only on an unmerged `feature/organiser-groups` branch — `main` doesn't have them yet, so "what's in the repo" and "what's shippable" aren't the same thing right now.
- **Operational gaps**: email confirmations aren't actually sending (placeholder SMTP credentials), booking-capacity concurrency control uses an in-process `SemaphoreSlim` that won't hold up across multiple API instances, dropdown custom-field values aren't server-validated against their allowed options, and there's no automated CI pipeline running the existing tests on push.

---

## 12. Competitor / Current Solution

General industry knowledge plus a 2026 web search for university-focused platforms — cited below. I have not independently verified pricing/feature claims on these vendor sites beyond their own listicle titles, so treat this as a starting point, not verified competitive intelligence.

**3 points:**
- Established, general-purpose players (**Eventbrite**, **Meetup**) and university-specific ticketing platforms (**UniversityTickets**, **AudienceView**, **Guidebook**, **iCommunify**, **Almabase**, **FreshTix** — see Sources) are built for large-scale, often paid, ticketed events — heavier tools than a small student society typically needs.
- The most likely "current solution" this project is actually replacing, at a single-society scale, is **manual**: event announcements over WhatsApp/social media, registration via a Google Form, and payment tracked by hand in cash or via JazzCash/EasyPaisa transfers — this is an inference from the payment options coded into the app, not a confirmed fact about your specific context, so double-check it matches what you're actually pitching against.
- Differentiator to lead with: native support for informal/local payment rails (JazzCash, EasyPaisa, bank, cash) with organizer-side confirmation, private group-restricted events, and AI-assisted recommendations — none of which the big global platforms are built around for this market segment.

---

## Sources (for Sections 4 and 12 — external, non-code claims)

- [Event Management Software Market worth $36.8 billion by 2031 - Report by MarketsandMarkets](https://www.prnewswire.com/news-releases/event-management-software-market-worth-36-8-billion-by-2031---report-by-marketsandmarkets-302828401.html)
- [Event Management Software Market Report 2026-2031 (MarketsandMarkets)](https://www.marketsandmarkets.com/Market-Reports/event-management-software-market-136859992.html)
- [Event Management Software Market Size, Share & Growth Report (Fortune Business Insights)](https://www.fortunebusinessinsights.com/event-management-software-market-102611)
- [Event Management Software Market Growth Report (Mordor Intelligence)](https://www.mordorintelligence.com/industry-reports/event-management-software-market)
- [The Best Event Ticketing Platforms for Universities (2026 Guide) — AudienceView](https://audienceview.com/thought-leadership/the-best-event-ticketing-platforms-for-universities-2026-guide/)
- [Best Event Management Software for Higher Education (2026) — Guidebook](https://www.guidebook.com/post/best-event-management-software-higher-education)
- [Best Event Platforms for Student Orgs 2026 — iCommunify](https://icommunify.com/blog/best-event-management-platforms-for-student-organizations-in-2026)

*Everything in Sections 1, 3, 5, 6, 7, 8, 9, 10, and 11 above (except where explicitly marked as inference) is read directly from the project's own source files, not from search or assumption.*
