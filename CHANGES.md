# Changes Made — Event Management System

Summary of everything fixed/added on `feature/organiser-groups`, split by backend and frontend.

## Backend (`EventManagementSystem.Api`)

### 1. Real payment flow for bookings (core bug fix)
Previously every booking — free or paid — was created as `IsPaid = true` with an instantly-confirmed seat, no real payment step. Now:
- `Controllers/BookingsController.cs` — `Reserve`: computes `isFreeEvent` from the event's price. Paid events now require a `PaymentMethod` before the booking is even created (`400 Bad Request` otherwise). Free events skip payment entirely and confirm instantly.
- `CQRS/Bookings/CreateBookingCommandHandler.cs` — booking `Status`/`IsPaid` now reflect the real payment state (`Pending` for paid-but-unconfirmed, `Confirmed` for free or admin-confirmed). Creates a `Payment` row with `Status = Pending` whenever a payment method is declared but not yet confirmed.
- `Controllers/BookingsController.cs` — new `GET /api/Bookings/pending-payments` (Admin sees all organisers' pending bookings, Organizer sees only their own events) and `PUT /api/Bookings/{id}/confirm-payment` (organiser/admin marks a booking as actually paid — flips `IsPaid`, `Status`, and the `Payment` row to `Completed`).
- `Controllers/PaymentsController.cs` — `CreatePayment` now also sets `booking.IsPaid = true` (previously only set `Status = Confirmed`, leaving `IsPaid` stuck `false`).
- `DTOs/BookingPaymentDtos.cs` — new `PendingPaymentDto`.

### 2. In-app notifications (previously email-only)
- `Models/Notification.cs` — added `PaymentConfirmed` and `PaymentPending` to `NotificationType`.
- New: `CQRS/Notifications/PaymentConfirmedEvent.cs`, `AddBookingInAppNotificationHandler.cs`, `AddOrganizerBookingInAppNotificationHandler.cs`, `AddPaymentConfirmedInAppNotificationHandler.cs`, `SendPaymentConfirmedHandler.cs` — these write real `Notification` rows (not just emails) whenever a booking is made, an organiser gets a new booking, or a payment is confirmed.
- `CQRS/Notifications/BookingConfirmedEvent.cs`, `OrganizerBookingUpdateEvent.cs` — added `UserId`/`IsPaid` so notifications can be routed to the right user and worded correctly for paid vs. free.

### 3. Past events split for regular users
Previously "past events" only existed inside the admin/organiser panel. Attendees now get their own past-events view (see frontend section) — no backend changes needed beyond the existing `GET /api/Events?includeExpired=true`.

### 4. Groups — edit & delete
- New: `CQRS/Groups/UpdateGroupCommand.cs` + handler (rename a group), `CQRS/Groups/DeleteGroupCommand.cs` + handler.
- `Controllers/GroupControllers.cs` — new `PUT {groupId}` and `DELETE {groupId}` endpoints, both checking the requesting organiser actually owns the group.
- `CQRS/Groups/GetGroupsByOrganiserQuery.cs` — fixed a bug where every group always showed "0 members" (member count is now computed from the real `GroupMember` rows).
- `DTOs/GroupDTOs.cs` — new `UpdateGroupDto`.

### 5. Email sending (SendGrid)
- `appsettings.Development.json` (new, gitignored — not committed) — SMTP config for SendGrid, reusing the existing generic `SmtpEmailService`. You'll need to fill in your own API key.

### 6. Authentication bug — role checks were silently broken (found during testing)
- `Program.cs` — added `options.MapInboundClaims = false;` to the JWT bearer config. Without this, .NET's default JWT handler silently remaps short claim names (`role`, `sub`, ...) to legacy long-form URIs before building the user's identity, so `RoleClaimType = "role"` never matched anything. Every `[Authorize(Roles = "...")]` endpoint in the app — including the pre-existing `validate-organiser` endpoint — was rejecting valid Admins/Organizers with a 403. This predates our changes; it's just never been exercised/tested before now.

### 7. CORS was hardcoded to specific ports
- `Program.cs` — CORS policy now accepts any `localhost`/`127.0.0.1` origin (any port) in addition to the configured production `FrontendUrl`, instead of a fixed list of `5173`/`5174`. Vite auto-increments its port whenever the previous one is still busy, which kept breaking login.

### 8. Access-control gaps (found while testing the admin-portal bug you caught)
- `Controllers/EventsController.cs` — `Create`/`Update`/`Delete` previously only required `[Authorize]` (any logged-in user, Attendees included) with **no ownership check**. Any attendee could have called these directly and edited/deleted someone else's event. Now restricted to `[Authorize(Roles = "Admin,Organizer")]`, and `Update`/`Delete` verify the requesting organiser actually owns the event (Admins bypass this).
- `Controllers/BookingsController.cs` — `cancel` had no ownership check at all; any signed-in user could cancel any other user's booking by guessing the (small, sequential) booking ID. Now requires being the booking's owner, that event's organiser, or an admin.

## Frontend (`frontend/src`)

### 1. Booking flow
- `bookingService.js` — new `getPendingPayments`, `confirmPayment`.
- `App.jsx` — `AttendeePortal.confirmReservation` and the reservation confirmation modal: free events skip the payment-method field and confirm with one click; paid events require entering a payment method, submit as "Pending," and show a message that the seat confirms once the organiser verifies payment.

### 2. Host Control Center (admin/organiser dashboard)
- New **Pending Payments** tab: lists bookings awaiting confirmation with a "Confirm Payment Received" button.
- Past events tab is now a flat "overall past events" list (previously wrongly tried to split attended/not-attended here — that logic belongs to the attendee, not the organiser).
- Tabs (Upcoming / Past / Payments) now refetch their data every time you click into them — previously they only fetched once at login, so switching tabs could show stale (e.g. empty) data.
- Groups tab: added inline **Edit** (rename) and **Delete** buttons per group.

### 3. Past events for regular attendees (new)
- New `PastEventCard` / `PastEventsView` components and a `/my-past-events` route + header nav link, splitting events into "attended" vs. "not attended" for the logged-in user.

### 4. In-app notifications
- Notification bell now reflects real backend data (booking made, payment pending, payment confirmed, etc.) instead of showing nothing.

### 5. Host Portal access control (bug you found during testing)
- `App.jsx` — the Host Control Center previously rendered for **any** logged-in user, regardless of role — if you were already signed in as an attendee elsewhere in the app, navigating to `/admin` skipped the login screen entirely. Fixed: the panel now checks the current user actually has the `Admin` or `Organizer` role before showing anything; otherwise it shows the Host Portal login form.
- The Host Portal's own login form previously accepted any valid account (Attendee included) with no role check. It now explicitly rejects non-Admin/Organizer accounts with "Access Denied."

### 6. Groups
- `groupService.js` — new `updateGroup`, `deleteGroup`.
