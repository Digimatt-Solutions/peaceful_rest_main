# Architecture rules

- All memorial invitation and QR sharing uses `src/lib/memorialSharing.ts` so names, messages, and clean memorial URLs remain consistent.
- Per-memorial head metadata uses Helmet under the root provider; classic static hosting does not expose these tags to non-JavaScript social crawlers, so server-rendered hosting is required for personalized social previews at the original URLs.