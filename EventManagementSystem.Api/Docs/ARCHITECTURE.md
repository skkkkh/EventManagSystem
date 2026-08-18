Architecture notes

CQRS migration
- Five Events endpoints are migrated to MediatR commands/queries + handlers:
  - GetEventsQuery / GetEventsQueryHandler (list)
  - GetEventByIdQuery / GetEventByIdQueryHandler (single)
  - GetUpcomingEventsQuery / GetUpcomingEventsQueryHandler (filtered list)
  - CreateEventCommand / CreateEventCommandHandler (create)
  - UpdateEventCommand / UpdateEventCommandHandler (update)
  - DeleteEventCommand / DeleteEventCommandHandler (delete)

Handlers are constructor-injected with IUnitOfWork, perform domain validations and throw InvalidOperationException for business rule violations. Controller actions call _mediator.Send and translate InvalidOperationException into BadRequest or NotFound as appropriate.

EventTemplate -> CustomField -> EventFieldValue design
- EventTemplate defines reusable custom fields (CustomField) and many Events are created from a template.
- Each Event stores EventFieldValue entries linking a CustomField to its string Value for that specific event.
- Validation rules applied on create/update:
  - Every CustomFieldId provided in FieldValues must belong to the EventTemplate.CustomFields collection.
  - Every CustomField on the template where IsRequired==true must have a non-empty provided value.
  - Dropdown option validation is a suggested enhancement (verify provided Value appears in CustomField.Options).

SmartScheme dual-auth setup
- Program.cs registers a PolicyScheme "SmartScheme" that forwards to JwtBearer for paths starting with /api and to cookie auth for MVC requests. This allows API routes to require JWT while MVC pages use cookie authentication.

Integration points
- Bookings: Event.Id is the canonical identifier consumed by TicketType.EventId and Registration.EventId. Booking flow:
  Event -> TicketType(s) -> Registration -> Booking
  The Bookings module is responsible for enforcing capacity (Event.Capacity). Recommended checks:
  - When creating/updating TicketType, ensure ticket allocations + existing bookings do not exceed Event.Capacity.
  - When creating a Booking, check aggregate booked seats across ticket types + requested quantity <= Event.Capacity.

- Notifications/Recommendations: EventDto includes fields necessary for notifications (Id, Title, StartDateTime, etc.). RecommendationService is registered in DI and can consume EventRepository to produce suggestions.
