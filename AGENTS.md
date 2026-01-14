# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router pages, server actions, and API routes (for example `app/page.tsx`, `app/actions.ts`, `app/api/proxy/route.ts`).
- `components/` contains reusable UI components.
- `lib/` stores shared logic such as podcast selection and Zustand stores (for example `lib/podcasts.ts`, `lib/store/usePlayerStore.ts`).
- `content/` is the curated data source split by language (`content/zh`, `content/en`) with `feeds.md` and `singles.json`.
- `public/` contains static assets served as-is.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the local dev server at `http://localhost:3000`.
- `npm run build` creates a production build.
- `npm run start` runs the production server from the build output.
- `npm run lint` runs ESLint with the Next.js config.

## Coding Style & Naming Conventions
- TypeScript is the default; follow Next.js App Router conventions (server components by default, client components when needed).
- Keep indentation at 2 spaces in JSON and 2 spaces in config files; TypeScript formatting follows the repo defaults (no explicit formatter configured).
- Use clear, descriptive names for content entries (`title`, `podcastName`, `audioUrl`, `pubDate`, `duration`).

## Testing Guidelines
- There is no dedicated test framework configured yet. Use `npm run lint` as the primary quality gate.
- If you add tests in the future, keep them near their module or in a dedicated `tests/` folder and document the command here.

## Content Maintenance
- RSS whitelist lives in `content/{lang}/feeds.md` and expects one Markdown link per line, e.g. `- [Podcast Name](https://example.com/feed.xml)`.
- Curated single episodes live in `content/{lang}/singles.json` as an array of objects with `title`, `podcastName`, `audioUrl`, `coverImage`, `pubDate`, and `duration`.

## Commit & Pull Request Guidelines
- Git history is minimal (`init`), so there is no established commit message convention yet. Prefer short, imperative summaries (e.g., "Add new feed sources").
- PRs should include: a brief summary, any relevant screenshots for UI changes, and notes on content updates (feeds/singles) if applicable.

## Security & Configuration Tips
- The proxy endpoint at `app/api/proxy/route.ts` is intended for controlled RSS fetching. Avoid routing arbitrary untrusted URLs without review.
