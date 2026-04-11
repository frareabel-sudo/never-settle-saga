# Never Settle Saga

Premium handmade lithophane lamps, laser-engraved personalised gifts, 3D printed products, and custom photo gifts. Based in London.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Custom components inspired by shadcn/ui
- **Deployment**: Vercel-ready

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, featured products, manifesto, testimonials, newsletter |
| `/shop` | Product grid with category filters, search, and sorting |
| `/shop/[slug]` | Product detail — gallery, description, customisation, add to cart |
| `/about` | Brand story, meet the makers, process, equipment |
| `/blog` | Journal with category filters and featured post |
| `/blog/[slug]` | Blog post detail |
| `/contact` | Contact form, info, and social links |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Click **Deploy** — no configuration needed

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Landing page
│   ├── about/page.tsx      # About page
│   ├── blog/
│   │   ├── page.tsx        # Blog listing
│   │   └── [slug]/page.tsx # Blog post detail
│   ├── contact/page.tsx    # Contact page
│   └── shop/
│       ├── page.tsx        # Shop listing
│       └── [slug]/page.tsx # Product detail
├── components/
│   ├── ui/                 # Button, Badge, Input, Textarea
│   ├── header.tsx          # Site header with mobile menu
│   ├── footer.tsx          # Site footer
│   ├── product-card.tsx    # Product card component
│   └── motion-wrapper.tsx  # Framer Motion animation wrappers
├── hooks/
│   └── use-cart.ts         # Cart hook using external store
└── lib/
    ├── cart-store.ts       # Client-side cart state
    ├── data.ts             # Product, blog, and testimonial data
    └── utils.ts            # cn() helper and formatPrice()
```

## Customisation

- **Colours**: Edit `tailwind.config.ts` — `amber` and `charcoal` palettes
- **Products**: Edit `src/lib/data.ts`
- **Images**: Replace Unsplash URLs with your own product photography
- **Content**: Each page component contains its own copy — edit directly

## Next Steps for Production

- [ ] Connect to a CMS (Sanity, Contentful) for blog posts and products
- [ ] Integrate Stripe or Shopify for checkout
- [ ] Add authentication for customer accounts
- [ ] Set up email service for newsletter and contact form
- [ ] Replace placeholder images with real product photography
- [ ] Add sitemap.xml and robots.txt
- [ ] Set up analytics (Vercel Analytics, GA4)
