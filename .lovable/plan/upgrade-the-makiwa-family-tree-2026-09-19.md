# Upgrade the Makiwa Family Tree

## What will change
- Replace the current stacked groups with an automatically calculated genealogy canvas centered on the deceased.
- Place descendants above, the deceased and siblings across the middle, and parents/grandparents below, matching the requested orientation.
- Group spouses and co-wives beside their related generation while keeping all people connected and readable.
- Add compact photo/name/relationship cards, clean non-crossing connectors, generation labels, and a stronger visual treatment for the deceased.
- Add pan, zoom in/out, fit-to-screen, and reset controls; make touch and mouse navigation work on both mobile and desktop.
- Recalculate positions automatically whenever family data changes, without changing or deleting existing records.
- Remove Guardian and Friend from both relationship selectors and add Co-wife.

## Technical details
- Keep the existing `family_members` data model and interpret each saved relationship relative to the deceased, so no database migration is required.
- Use a lightweight deterministic layout and SVG connector layer inside the existing family-tree component; do not add a visualization library.
- Preserve the public memorial tree and dashboard editing workflows because both already share the same tree component.
- Keep unknown/custom relationships visible in an extended-family row rather than dropping them.
- Verify compilation and inspect the result at desktop and mobile sizes, including control behavior and overflow.
