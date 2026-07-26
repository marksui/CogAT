# Grade 4 CogAT Daily Practice

Static GitHub Pages app for fourth-grade CogAT practice. It includes a daily practice goal, local progress tracking, targeted review sets, a question bank, and a timed mock exam.

## Publish on GitHub Pages

Use the repository root as the Pages source. No build step is needed.

## Progress and history

The app stores question results, daily goals, streaks, and unfinished daily sessions in the browser's `localStorage`. No account or server is required. Use **Progress backup → Export JSON** and **Import JSON** to move that history between browsers or devices.

The question content and practice interface are in English to match the Grade 4 CogAT-style material. This is an independent practice site, not an official CogAT product.

Mock exam results show raw accuracy plus a clearly labeled practice estimate for SAS, percentile, and stanine. The estimate is not an official CogAT score; official scores require the test form, level, age or grade norms, and Riverside conversion tables.

## Optional cross-device sync

The site works locally without Supabase. To enable account-based sync:

1. Create a Supabase project and copy the Project URL plus the publishable key (or legacy `anon` key) into `supabase-config.js`.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) once in Supabase Dashboard → SQL Editor.
3. In Authentication → URL Configuration, add the deployed GitHub Pages URL as the Site URL and redirect URL.
4. Use **Create account** for a new account, or **Sign in** if you already registered. Both use a one-time email link.
5. Sign in with the same email on each device to load the saved progress.

Only the publishable/anon key belongs in this static frontend. Never put a `service_role` or `secret` key in this repository or browser code. The sync table uses Row Level Security so each signed-in user can read and write only their own progress snapshot.
