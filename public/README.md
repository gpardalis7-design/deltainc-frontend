# Public Assets

## Logo

The LuminaLearn platform uses the Delta Inc logo located at:

- **SVG Logo**: `/public/logo.svg` (vector, scalable)
- **PNG Logo**: `/public/logo.png` (raster, optional - you can add your own PNG logo here)

### Current Implementation

The logo is currently using an SVG version that includes:
- Delta triangle symbol with gradient (#C58D2A gold)
- "Delta Inc" text in Inter font
- Decorative accent elements
- Navy (#13233A) and cream (#F6F2E8) brand colors

### Usage

The logo is imported in:
- `/src/app/components/Navbar.tsx` - Header logo
- `/src/app/components/Footer.tsx` - Footer logo (with inverted colors)
- `/src/app/lib/seo.ts` - SEO/Schema.org metadata

### Replacing the Logo

To replace with your own logo:
1. Add your PNG logo to `/public/logo.png`
2. Optionally add SVG version to `/public/logo.svg`
3. The components will automatically use the updated files
4. Recommended size: 200x60px (or similar 10:3 aspect ratio)
