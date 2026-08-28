Demo preparation steps

Flow to demo end-to-end:

1) Create an EventTemplate with a required custom field
   - Use DB admin UI or seed directly into DB: create EventTemplate "Conference" with CustomField Name="Dietary" IsRequired=true.

2) Attempt to create an Event without providing the required custom field
   - API: POST /api/events as Organizer with body excluding the required field value
   - Expect: 400 Bad Request with message mentioning required field missing

3) Create the Event supplying the required field
   - API: POST /api/events with FieldValues including CustomFieldId and Value
   - Expect: 201 Created and EventDto returned

4) Create a TicketType for that Event
   - API: POST /api/tickettypes with EventId set to created event.Id
   - Expect: 201 Created

5) Create a Registration for a user
   - API: POST /api/registrations with EventId
   - Expect: 201 Created

6) Create a Booking for the Registration and TicketType
   - API: POST /api/bookings (CQRS command) with RegistrationId, TicketTypeId, Quantity
   - Expect: 201 Created and BookingResponseDto

Fragile spots to call out during demo
- JWT vs Cookie auth: API endpoints require Bearer tokens. Ensure test accounts are created and JWTs generated for demo consumers.
- SQLite file permissions: containerized runs need writable volume mounted for the file used by DefaultConnection.
- Concurrency in bookings: CreateBookingCommandHandler uses a SemaphoreSlim inside the API instance—works for single-instance demo but a distributed lock is required for multiple API replicas.
- Dropdown option validation not implemented: if you rely on Dropdown Options to constrain values, add server-side validation.
