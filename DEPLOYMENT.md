# Render Deployment Guide (Supabase)

This document describes how to deploy "Python Weekly" to Render using Supabase for Postgres and file storage.

## Prerequisites
- A Render Web Service (free tier is sufficient).
- A Supabase project with Postgres enabled.
- A Supabase Storage bucket named `submission-uploads`.

## Bucket Choice
A public bucket is the better fit for this application because the current behavior is to expose uploaded screenshots directly through a public URL with no authentication check. The tradeoff is that any user with the URL can view the file, but that matches the existing app behavior and avoids changing the upload/download flow to signed URLs.

## Deployment Steps
1. **Create Web Service on Render**:
   - Connect your GitHub repository.
   - Choose **Node** as the environment.
   - Set build and start commands:
     ```bash
     npm run build
     npm start
     ```
2. **Configure Environment Variables**:
   Add the following variables in Render's Environment tab:
   - `DATABASE_URL` = the Supabase Postgres connection-pooling string
   - `DATABASE_DIRECT_URL` = the Supabase direct connection string used by Prisma migrations
   - `SUPABASE_URL` = the base URL of your Supabase project, for example `https://<project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = the service-role key used by the server-side upload code
   - `SESSION_SECRET` = a long, random secret for cookies
3. **No Persistent Disk Needed**:
   The app no longer depends on local filesystem storage for uploads, so you can skip any disk-mount configuration on Render's free tier.

Deploy, and the app will use Supabase Postgres and Storage directly.
