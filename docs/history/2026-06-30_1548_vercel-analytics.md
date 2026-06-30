# Vercel Analytics Setup

Date: 2026-06-30 15:48 JST

## Scope

- Added Vercel Web Analytics package.
- Mounted the Analytics component in the Next.js root app layout.
- Kept the change limited to site measurement infrastructure.

## Files

- `package.json`
- `package-lock.json`
- `.npmrc`
- `src/app/layout.tsx`

## Notes

- Initial `npm install @vercel/analytics` failed due to npm peer dependency resolution around optional framework peers.
- Re-ran with `--legacy-peer-deps`; this project uses Next.js and imports `@vercel/analytics/next`.
- Added `.npmrc` with `legacy-peer-deps=true` so Vercel install uses the same dependency resolution.
- Analytics is measurement only. It does not affect lottery data, scoring, or prediction behavior.
