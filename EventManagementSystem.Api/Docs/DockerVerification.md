Standalone API Docker run instructions

Build the API image and run it standalone (no db/frontend services):

1. Build the image

   docker build -t eventmanagement-api -f EventManagementSystem.Api/Dockerfile .

2. Run the container with a writeable volume for SQLite DB

   docker run -d --name eventmanagement-api \
	 -p 5000:80 \
	 -v %cd%/EventManagementSystem.Api:/app \ 
	 -v %cd%/data:/data \ 
	 -e ConnectionStrings__DefaultConnection="Data Source=/data/eventmanagement.db" \
	 eventmanagement-api

Notes:
- Program.cs calls db.Database.Migrate() on startup and role seeding, so the container must be able to write the SQLite file. Mount a host directory to the container path used in the connection string.
- The example uses Windows PowerShell variable expansion; adjust paths for Linux/macOS.

Checklist when adding db/frontend services to docker-compose:
- Ensure a persistent volume is declared for the SQLite file and mounted where the API expects it (ConnectionStrings__DefaultConnection).
- Expose ports or configure a reverse proxy so frontend can reach API's /api endpoints.
- Ensure environment variables for Jwt:Key/Issuer/Audience are shared or secrets managed.
- Start order: database (if not SQLite), then API, then frontend. If database is a containerized RDBMS, ensure migrations run successfully on first API start and that the API can reach the DB.
