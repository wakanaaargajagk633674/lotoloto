# Vercel Analytics Decision

Date: 2026-06-30 JST

## Decision

Use `@vercel/analytics` and mount `Analytics` from `@vercel/analytics/next` in `src/app/layout.tsx`.

## Rationale

- The app uses Next.js App Router.
- The root layout is the correct shared location for page-level analytics collection.
- Keeping the component at the end of `<body>` avoids changing visual layout or app behavior.

## Safety

- No lottery prediction logic was changed.
- No user-facing claims about winning probability were added.
- Analytics data should be used for site usage observation only.
