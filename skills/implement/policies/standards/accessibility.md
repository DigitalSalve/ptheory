# Policy: Accessibility Standards

Enforced by `/implement` when `context.standards` includes `accessibility`.

## Requirements

| Check | Standard |
|-------|----------|
| Color contrast | 4.5:1 normal text, 3:1 large text |
| Keyboard navigation | All interactive elements focusable, visible focus indicators |
| Screen readers | Semantic HTML (`nav`, `main`, `header`, `h1-h6`), Flutter `Semantics` |
| Alt text | All images: descriptive alt (empty `alt=""` for decorative) |
| Touch targets | Min 48x48dp (Flutter), 44x44px (web) |
| Heading hierarchy | One `h1` per page, sequential levels |
| aria-label | On icon-only buttons, nav landmarks |
| Focus management | Expandable menus: `aria-expanded`, proper focus trapping |
