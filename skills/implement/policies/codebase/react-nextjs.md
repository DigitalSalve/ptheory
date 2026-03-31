# Policy: React + Next.js Codebase

Enforced by `/implement` when `context.codebase` includes `react-nextjs`.

## Page Pattern (App Router)

```tsx
import { fetchData } from "@/lib/api";

export default async function FeaturePage() {
  const data = await fetchData();
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Feature</h1>
      {/* Content */}
    </section>
  );
}
```

## Component Pattern

```tsx
export function FeatureCard({ title, description }: Props) {
  return (
    <div className="rounded shadow bg-white p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
    </div>
  );
}
```

## MUST Rules

- Use `@/` alias for project root imports
- Named exports for components (`export function`, not `export default`)
- Tailwind utilities for styling — avoid inline styles except brand colors not in palette
- Responsive mobile-first — use `md:` and `lg:` breakpoints
- Consistent content max-width: `max-w-7xl mx-auto px-4`
- Use `<Image>` from `next/image` with explicit width/height
- Semantic HTML: `nav`, `main`, `header`, `section`, `h1-h6`

## Static Export Rules

If `output: "export"` in next.config:
- No `cookies()`, `headers()`, or dynamic server APIs
- `generateStaticParams()` required for dynamic routes `[slug]`
- All data fetched at build time

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Pages | `page.tsx` in kebab-case dirs | `events/[slug]/page.tsx` |
| Components | PascalCase | `Header.tsx`, `FeatureCard.tsx` |
| Functions | PascalCase for components, camelCase for helpers | `fetchEvents()` |

## Layout Pattern

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## MUST NOT Rules

- Do not use CSS-in-JS unless it's the project's established pattern
- Do not use inline styles for anything achievable with Tailwind
- Do not scatter color hex values — centralize as named constants
- Do not introduce new CSS frameworks or component libraries without approval
