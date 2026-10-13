# Architecture rules

- All memorial invitation and QR sharing uses `src/lib/memorialSharing.ts` so names, messages, and clean memorial URLs remain consistent.
- Memorial posters use the existing memorial-media upload flow and a shared MemorialPoster renderer so saved posters display consistently across screen sizes.
- Per-memorial head metadata uses Helmet under the root provider and a Netlify Edge Function injecting matching tags into original memorial URLs; social crawlers cannot read client-side Helmet updates. Both use the shared invitation helper, and the edge lookup uses only public credentials and public memorials.