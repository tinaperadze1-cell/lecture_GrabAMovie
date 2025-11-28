# Architecture Overview (GRABAMOVIE)

## Current State
- **Frontend**: Vite + React single-page app served via `npm run dev`. Handles UI concerns (hero, header, movie list, rating interactions). Fetches movies and authenticates via backend API.
- **Backend**: Express server exposing REST endpoints:
  - `GET /api/health` - Health check with database connection status
  - `GET /api/movies` - Fetch all movies from database
  - `POST /api/login` - Authenticate users from database
- **Database**: PostgreSQL (Neon) with `movies` and `users` tables. All hardcoded data migrated to database.
- **Docs**: All planning artifacts live in `docs/`. Daily updates are timestamped markdown files.

## Near-Term Plan
1. ✅ **Database integration**: PostgreSQL connected, movies and users stored in database.
2. ✅ **API endpoints**: `/api/movies` and `/api/login` implemented.
3. **State handling**: Keep React state simple (e.g., `useState`) until complexity justifies context or a store.
4. **Styling**: Plain CSS modules/files to avoid extra tooling overhead for now.

## Future Evolution
- Add rating persistence to database (store user ratings per movie).
- Add password hashing (bcrypt) for user passwords.
- Add JWT-based session handling for authenticated requests.
- Consider deployment split (Netlify/Vercel for frontend, Render/Fly/railway for backend) once we need hosting.

This doc will be updated whenever the architecture changes in a meaningful way.*** End Patch}>>>>>  

