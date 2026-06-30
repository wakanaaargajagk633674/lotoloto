# Vercel Analytics Decision

Date: 2026-06-30 JST

## Decision

Use `@vercel/analytics` and mount `Analytics` from `@vercel/analytics/next` in `src/app/layout.tsx`.

Also commit `.npmrc` with `legacy-peer-deps=true` because the package install required legacy peer resolution in this repo.

## Rationale

- The app uses Next.js App Router.
- The root layout is the correct shared location for page-level analytics collection.
- Keeping the component at the end of `<body>` avoids changing visual layout or app behavior.
- Matching Vercel's install behavior to local install avoids deployment failures caused by optional peer dependency resolution.

## Safety

- No lottery prediction logic was changed.
- No user-facing claims about winning probability were added.
- Analytics data should be used for site usage observation only.
