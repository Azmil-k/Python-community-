# Python Weekly

Python Weekly is a cohort tracking web application designed for a student Python learning community. Students submit weekly task progress and extra challenge responses, mentors review and grade submissions for their assigned pods (~5–6 students per pod), and admins manage learning modules/weeks, pods, user accounts, announcements, and badge awards.

## Getting Started & Local Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in the real values from your Supabase project dashboard:
   - `DATABASE_URL`: The Supabase Postgres connection-pooling string.
   - `DATABASE_DIRECT_URL`: The Supabase direct connection string used by Prisma for migrations.
   - `SUPABASE_URL`: The base URL of your Supabase project.
   - `SUPABASE_SERVICE_ROLE_KEY`: The service-role key used by server-side uploads.
   - `SESSION_SECRET`: A long, secure random string used to sign session cookies.

3. **Database Migration & Seeding**:
   Run the database migration and seed default development credentials:
   ```bash
   npx prisma migrate dev --name postgres_migration
   npx prisma db seed # or node prisma/seed.js
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

This application is built with the **Next.js App Router** (React 19) and **Prisma ORM** on **Postgres via Supabase**, with uploaded screenshots stored in **Supabase Storage**.

- **Mutation Pattern**: Server Actions serve as the primary mutation pattern. Server action files are named `actions.js` and colocated alongside pages (`"use server"`).
- **REST Exception**: The `/api/extraTask` route is currently implemented as a REST-style API route for extra task management.
- **Session Auth**: Auth tokens are handled via HTTP-only JWT cookies using `jose` with custom middleware verification (`middleware.js`) and API authorization helpers (`src/lib/apiAuth.js`).

## Styling Convention

- **Primary Pattern**: Components use `.js`/`.jsx` files styled using inline `style={{}}` objects combined with CSS custom properties defined in `src/app/globals.css`.
- **Tailwind CSS**: Tailwind CSS is installed but not the primary styling approach in this codebase, with only minor ad-hoc utility usage (e.g. `BadgeShelf.jsx`). New components should follow the inline-style + CSS-variable pattern for consistency.
- **Language / TypeScript**: JavaScript (`.js`/`.jsx`) is the project default. TypeScript files (`FadeIn.tsx`, `SlideUp.tsx`) exist specifically for motion wrappers; do not create new `.tsx` files unless explicitly required.

## Upload Retention & File Maintenance

- **File Storage Location**: All user-submitted task screenshots and PDF files are stored in a Supabase Storage bucket named `submission-uploads`.
- **Retention Policy**: Files remain in Supabase Storage until they are explicitly removed or their database references are pruned.
- **Recommended Maintenance Workflow**:
  - Periodically review the storage bucket at the end of each cohort cycle.
  - Files can be safely removed once they are older than $N$ months and their corresponding database submission records have been pruned.

