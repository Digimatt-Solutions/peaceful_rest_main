# Family Tree Export, Reordering, and Expanded View

## What will change
- Add **Expand** to the existing family-tree toolbar. It will open the same interactive tree in a responsive Makiwa dialog, retaining pan, zoom, fit-to-screen, and reset controls.
- Add **Print** and **Download PDF** actions. The exported document will show the complete automatically arranged tree, the highlighted deceased anchor, every name and relationship label, generation headings, and a concise legend.
- Allow dashboard editors to drag one family member onto another valid slot within the same relationship generation. The two members will swap positions, preserving aligned rows and avoiding gaps, overlaps, or crossed levels.
- Reject invalid drops, including moves onto the deceased anchor or into another generation, and clearly explain why the move was not accepted.
- Preserve public memorial viewing: visitors can expand, print, and download, but only authorized dashboard editors can rearrange members.

## Technical details
- Reuse `FamilyTreeView` for inline, expanded, and export layouts rather than creating separate tree implementations.
- Add an optional ordering field to family members so approved swaps persist and the automatic layout remains deterministic after refresh; existing records will retain their current automatic order.
- Generate a print-optimized tree snapshot in the browser and create a downloadable PDF without exposing private data or changing memorial visibility rules.
- Use the existing dialog and button components, existing Makiwa colors, and the current relationship-to-generation rules.
- Verify desktop and mobile layouts, drag/drop validation, expanded controls, PDF content, printing, compilation, and runtime errors.
