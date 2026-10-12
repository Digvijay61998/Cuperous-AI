# Requirements Document

## Introduction

The JarCube Landing Site is a statically-hosted, multi-page marketing website for JarCube — a WhatsApp Business platform offering shared inbox, AI chatbots, automation flows, broadcast campaigns, and API integrations. The site is built with React + TypeScript + Vite as a multi-page application (MPA), producing one real HTML file per route so it can be served directly from Amazon S3 (optionally fronted by CloudFront) with no server-side runtime and no SPA rewrite rules.

The site comprises 13 routes: a landing page, pricing, industry, contact, partner, five feature detail pages, a blog index, and two legal pages. Because static hosting has no backend, all lead capture is handled client-side by composing a pre-filled WhatsApp deep link to the JarCube business number.

All visual design, iconography, illustration, and marketing copy in this site is original work authored for JarCube. The site's page inventory and section ordering follow widely-used SaaS marketing conventions (hero, feature grid, social proof, process, pricing, FAQ, footer). No third-party site's copy, images, icons, stylesheets, or visual design are reproduced.

## Glossary

- **Site**: The JarCube marketing website produced by this spec, residing at `templates/jarcube-landing/`
- **MPA**: Multi-Page Application — a build that emits a separate HTML entry file per route, as opposed to a single-page application with client-side routing
- **Route**: A user-facing URL path on the Site (e.g. `/pricing`) backed by its own emitted HTML file
- **Page_Shell**: The shared layout wrapper providing the announcement bar, navigation header, and footer to every Route
- **Section**: A self-contained horizontal band of content within a Route (e.g. the Hero, the FAQ accordion)
- **Design_Tokens**: The set of CSS custom properties defining the Site's colours, typography scale, spacing scale, radii, and shadows
- **WhatsApp_Deep_Link**: A `https://wa.me/<number>?text=<encoded message>` URL that opens WhatsApp with a pre-composed message
- **Lead_Form**: A client-side form that validates input and, on submit, opens a WhatsApp_Deep_Link containing the entered values
- **Business_Number**: The JarCube WhatsApp business number `917558510587`
- **Pricing_Tier**: One of the four JarCube plans — Starter, Growth, Business, Enterprise
- **Billing_Period**: Either `monthly` or `annual`, toggled by the user on the pricing UI
- **Feature_Flag**: A build-time boolean in a central config module that enables or disables a Section without deleting its implementation
- **Logo_Wall**: The Section displaying customer logos as social proof
- **Meta_Charges_Disclaimer**: The notice clarifying that WhatsApp/Meta per-message fees are billed separately from the JarCube subscription
- **Reduced_Motion**: The user preference expressed by the `prefers-reduced-motion: reduce` media query

## Requirements

### Requirement 1: Project Scaffolding and Build Output

**User Story:** As a developer, I want the Site to live in the existing monorepo and build through the existing tooling, so that I can package and ship it the same way as every other artifact in this repository.

#### Acceptance Criteria

1. THE Site SHALL reside at `templates/jarcube-landing/` so that it is matched by the `templates/*` glob in `pnpm-workspace.yaml` and resolvable by the `--filter` flag used in `tooling/build-and-zip.ts`
2. THE Site SHALL declare a `package.json` with the package name `jarcube-landing` and a `build` script, so that `pnpm build:template jarcube-landing` succeeds without modification to `tooling/build-and-zip.ts`
3. THE Site SHALL configure Vite with `base: './'` so that all emitted asset references are relative and the build is hostable from either a bucket root or a sub-path without rebuilding
4. THE Site build SHALL emit `dist/index.html` at the root of the output directory, satisfying the existence check in `tooling/build-and-zip.ts`
5. THE Site build SHALL emit one HTML file per Route defined in Requirement 3, each containing server-rendered-equivalent static markup for its Sections
6. WHEN `pnpm build:template jarcube-landing` completes, THEN THE tooling SHALL produce `releases/jarcube-landing.zip` containing the contents of `dist/` with `index.html` at the archive root
7. THE Site SHALL compile with `tsc --noEmit` reporting zero errors
8. THE Site SHALL produce a total production bundle where the sum of all JavaScript and CSS in `dist/` is below 350 KB gzipped, excluding raster image assets

---

### Requirement 2: Static Hosting Compatibility

**User Story:** As an operator, I want the Site to work correctly when uploaded to an S3 bucket, so that I can host the marketing site without running a server.

#### Acceptance Criteria

1. THE Site SHALL function with no server-side runtime, no API routes, and no build-time secrets
2. WHERE a Route is nested (e.g. `/features/flow-builder`), THE build SHALL emit the corresponding HTML at a matching directory path with the filename `index.html`, so that S3 static website hosting resolves the Route without a rewrite rule
3. THE Site SHALL reference all internal Routes using root-relative or directory-style hrefs that resolve correctly under S3 static website hosting
4. THE Site SHALL NOT depend on client-side history-API routing for initial page resolution, so that a direct request to any Route returns that Route's HTML with HTTP 200
5. THE Site SHALL include a `404.html` at the build output root providing the Page_Shell and a navigation link back to `/`
6. THE Site SHALL emit a `robots.txt` permitting crawling and referencing the sitemap location, and a `sitemap.xml` enumerating every Route from Requirement 3

---

### Requirement 3: Route Inventory

**User Story:** As a visitor, I want to reach every part of the JarCube marketing site by URL, so that I can navigate directly and share links.

#### Acceptance Criteria

1. THE Site SHALL provide a Route at `/` rendering the landing page defined in Requirements 6 through 16
2. THE Site SHALL provide a Route at `/pricing` rendering the pricing page defined in Requirements 17 and 18
3. THE Site SHALL provide a Route at `/industry` rendering the industry index defined in Requirement 24
4. THE Site SHALL provide eight industry-detail Routes at `/industry/healthcare`, `/industry/real-estate`, `/industry/finance`, `/industry/distributors`, `/industry/education`, `/industry/home-services`, `/industry/e-commerce`, and `/industry/automobiles`, as defined in Requirement 25
5. THE Site SHALL provide a Route at `/contact` rendering the contact page defined in Requirement 27
6. THE Site SHALL provide a Route at `/partner` rendering the partner programme defined in Requirement 26
7. THE Site SHALL provide five feature-detail Routes at `/features/whatsapp-api-integration`, `/features/knowledge-base`, `/features/marketing-campaigns`, `/features/shared-inbox`, and `/features/flow-builder`
8. THE Site SHALL provide a Route at `/blog` rendering a post index
9. THE Site SHALL provide Routes at `/legal/privacy-policy` and `/legal/terms-of-service`
10. WHEN a visitor requests any Route enumerated in this requirement, THEN THE Site SHALL respond with that Route's own HTML document containing its full Section markup
11. THE Site SHALL derive its Route list from a single route manifest module, so that the build inputs, the sitemap, and the navigation links cannot fall out of sync

---

### Requirement 4: Design System and Theming

**User Story:** As a brand owner, I want JarCube to have its own distinct visual identity, so that the site is recognisably ours and not derivative of a competitor.

#### Acceptance Criteria

1. THE Site SHALL define Design_Tokens as CSS custom properties on the document root covering colour, typography scale, spacing scale, border radii, and shadow elevations
2. THE Design_Tokens SHALL define the colour palette as: ink `#0F172A`, surface `#F8FAFC`, primary `#4338CA`, accent `#F59E0B`, success `#10B981`, and a neutral ramp of at least five steps
3. THE Site SHALL declare a heading typeface and a body typeface, each with a system-font fallback stack, so that text renders legibly before and without webfont load
4. THE Site SHALL express every colour, font-family, spacing, radius, and shadow declaration through a Design_Token reference, applying no literal colour or font values outside the token definitions and their fallbacks
5. THE Site SHALL render all decorative graphics, product illustrations, and iconography as inline SVG or CSS authored for JarCube, and SHALL NOT embed screenshots or graphics sourced from third-party websites
6. WHERE the user has expressed Reduced_Motion, THE Site SHALL disable or reduce all non-essential transitions and animations to a duration of no more than 1 millisecond

---

### Requirement 5: Page Shell — Announcement Bar, Navigation, Footer

**User Story:** As a visitor, I want consistent navigation on every page, so that I can move around the site and always find a call to action.

#### Acceptance Criteria

1. THE Page_Shell SHALL render an announcement bar at the top of every Route containing a short message and a call-to-action link
2. WHEN the visitor dismisses the announcement bar, THEN THE Page_Shell SHALL hide it and SHALL persist the dismissal in `localStorage` so that it remains hidden on subsequent Route views within the same browser
3. IF `localStorage` is unavailable or throws on access, THEN THE Page_Shell SHALL render the announcement bar and treat dismissal as session-only, without raising a visible error
4. THE Page_Shell SHALL render a navigation header containing the JarCube wordmark linking to `/`, navigation links to `/pricing`, `/industry`, `/blog`, and `/contact`, and a primary call-to-action button
5. WHEN the viewport width is below 900 CSS pixels, THE navigation header SHALL collapse its links into a toggleable menu control with a minimum tap target of 44 by 44 CSS pixels
6. WHEN the collapsed navigation menu is open, THE Page_Shell SHALL set `aria-expanded="true"` on the toggle control and SHALL return keyboard focus to the toggle control when the menu is closed
7. WHILE the visitor scrolls a Route, THE navigation header SHALL remain fixed to the top of the viewport
8. THE Page_Shell SHALL render a footer on every Route containing the JarCube wordmark, a tagline, a company link column, a social link column, a newsletter Lead_Form, a copyright line, and links to both legal Routes
9. THE Page_Shell SHALL render a persistent WhatsApp contact affordance that opens a WhatsApp_Deep_Link to the Business_Number

---

### Requirement 6: Landing Page — Hero Section

**User Story:** As a first-time visitor, I want to understand what JarCube does within a few seconds, so that I can decide whether to keep reading.

#### Acceptance Criteria

1. THE Hero Section SHALL render a single `<h1>` element containing the JarCube value proposition
2. THE Hero Section SHALL render a supporting subheading paragraph beneath the `<h1>`
3. THE Hero Section SHALL render two call-to-action controls: a primary control opening a WhatsApp_Deep_Link to the Business_Number, and a secondary control navigating to `/contact`
4. THE Hero Section SHALL render an original product visual composed of inline SVG or CSS depicting a WhatsApp conversation interface
5. WHERE Reduced_Motion is not expressed, THE Hero product visual MAY animate on mount with a duration between 200 and 600 milliseconds
6. THE Hero Section SHALL render its `<h1>` text as real DOM text rather than as an image, so that the value proposition is machine-readable

---

### Requirement 7: Landing Page — Feature Grid Section

**User Story:** As a visitor evaluating JarCube, I want to see the platform's core capabilities, so that I can find the feature I care about.

#### Acceptance Criteria

1. THE Feature_Grid Section SHALL render one card for each of the five feature-detail Routes defined in Requirement 3, criterion 6
2. THE Feature_Grid SHALL render each card containing an original inline-SVG icon, a feature title, a one-sentence description, and a link to that feature's Route
3. WHEN the visitor activates any part of a feature card, THEN THE Site SHALL navigate to that card's feature Route
4. THE Feature_Grid SHALL render each card as a single focusable link region rather than nesting multiple independently-focusable links inside one card

---

### Requirement 8: Landing Page — Logo Wall Section

**User Story:** As a visitor, I want to see which businesses use JarCube, so that I can gauge credibility.

#### Acceptance Criteria

1. THE Logo_Wall Section SHALL render a section heading and a horizontal arrangement of customer logo images
2. THE Logo_Wall SHALL source its entries from a single logo manifest module, so that adding or removing a logo requires editing exactly one file
3. THE Logo_Wall SHALL render each logo with an `alt` attribute containing that company's name
4. WHERE a logo entry declares that it requires a light background, THE Logo_Wall SHALL render that logo on a light backing surface with sufficient padding to keep the mark legible
5. IF the logo manifest is empty, THEN THE Logo_Wall Section SHALL be omitted from the rendered output rather than rendering an empty container
6. THE Logo_Wall SHALL be gated behind a Feature_Flag so that it can be disabled without deleting its implementation

---

### Requirement 9: Landing Page — Testimonials Section

**User Story:** As a visitor, I want to read what customers say about JarCube, so that I can trust the claims.

#### Acceptance Criteria

1. THE Testimonials Section SHALL render each entry containing a quotation, an attributed person or team name, an organisation name, and an optional headline metric
2. THE Testimonials Section SHALL source its entries from a single testimonials content module
3. THE Testimonials Section SHALL render only entries present in that content module, and SHALL NOT render placeholder or fabricated quotations in the production build
4. IF the testimonials content module is empty, THEN THE Testimonials Section SHALL be omitted from the rendered output
5. WHERE the Section renders as a carousel, THE Site SHALL provide previous and next controls that are keyboard-operable and labelled for assistive technology
6. THE Testimonials Section SHALL be gated behind a Feature_Flag

---

### Requirement 10: Landing Page — Process Section

**User Story:** As a visitor, I want to understand how JarCube works step by step, so that I can picture using it.

#### Acceptance Criteria

1. THE Process Section SHALL render an ordered sequence of six steps
2. THE Process Section SHALL render each step containing a two-digit ordinal label, a step heading, and a description paragraph
3. THE Process Section SHALL render the steps using an ordered-list element so that their sequence is conveyed to assistive technology
4. WHEN the viewport width is below 700 CSS pixels, THE Process Section SHALL render its steps in a single column

---

### Requirement 11: Landing Page — Industry Demos Section

**User Story:** As a visitor in a specific industry, I want to see how JarCube applies to my business, so that the value is concrete rather than abstract.

#### Acceptance Criteria

1. THE Industry_Demos Section SHALL render six cards covering Distributors and Manufacturers, Spa and Salons, Healthcare, Finance Teams, D2C Brands, and Real Estate
2. THE Industry_Demos Section SHALL render each card containing an industry name, a question framing the manual-process pain point, a one-sentence outcome description, and a link to `/industry`
3. THE Industry_Demos Section SHALL render each card with an original inline-SVG industry icon

---

### Requirement 12: Landing Page — Pricing Teaser Section

**User Story:** As a visitor, I want a summary of pricing on the landing page, so that I can judge affordability without leaving.

#### Acceptance Criteria

1. THE Pricing_Teaser Section SHALL render a condensed summary of the four Pricing_Tiers showing, for each, the tier name, the monthly price, and its headline limits
2. THE Pricing_Teaser Section SHALL render a link to `/pricing`
3. THE Pricing_Teaser Section SHALL read its tier data from the same pricing data module used by the `/pricing` Route, so that the two Routes cannot display contradictory prices
4. THE Pricing_Teaser Section SHALL render the Meta_Charges_Disclaimer
5. THE Pricing_Teaser Section SHALL be gated behind a Feature_Flag

---

### Requirement 13: Landing Page — FAQ Section

**User Story:** As a visitor with objections, I want answers to common questions, so that I can resolve doubts without contacting sales.

#### Acceptance Criteria

1. THE FAQ Section SHALL render a list of question-and-answer entries sourced from a single FAQ content module
2. WHEN the visitor activates a question, THEN THE FAQ Section SHALL expand that entry's answer
3. THE FAQ Section SHALL render each question as a button element with `aria-expanded` reflecting its current expanded state and `aria-controls` referencing its answer region
4. THE FAQ Section SHALL render all answer text in the initial HTML document rather than fetching it after load, so that answers are indexable by crawlers
5. WHEN the visitor activates a question whose answer is already expanded, THEN THE FAQ Section SHALL collapse that answer

---

### Requirement 14: Landing Page — Blog Teasers Section

**User Story:** As a visitor, I want to see recent JarCube writing, so that I can judge the team's expertise.

#### Acceptance Criteria

1. THE Blog_Teasers Section SHALL render up to three post cards sourced from a single blog content module
2. THE Blog_Teasers Section SHALL render each card containing a post title, a publication date, an estimated read time, and a link to that post
3. THE Blog_Teasers Section SHALL render a link to `/blog`
4. IF the blog content module contains no entries, THEN THE Blog_Teasers Section SHALL be omitted from the rendered output
5. THE Blog_Teasers Section SHALL be gated behind a Feature_Flag

---

### Requirement 15: Landing Page — Book a Call Section

**User Story:** As an interested visitor, I want to start a conversation with JarCube, so that I can get my questions answered directly.

#### Acceptance Criteria

1. THE Book_A_Call Section SHALL render a heading, a supporting paragraph, and a call-to-action control
2. WHEN the visitor activates the Book_A_Call call-to-action, THEN THE Site SHALL open a WhatsApp_Deep_Link to the Business_Number with a pre-composed enquiry message

---

### Requirement 16: Landing Page — Section Order

**User Story:** As a marketer, I want the landing page sections in a deliberate order, so that the page tells a coherent story.

#### Acceptance Criteria

1. THE `/` Route SHALL render its Sections in the following order: Hero, Feature_Grid, Logo_Wall, Testimonials, Process, Industry_Demos, Pricing_Teaser, FAQ, Blog_Teasers, Book_A_Call
2. WHERE a Section is disabled by its Feature_Flag or omitted for empty content, THE `/` Route SHALL render the remaining Sections in the same relative order with no residual vertical gap

---

### Requirement 17: Pricing Page — Tiers and Billing Toggle

**User Story:** As a prospective customer, I want to compare JarCube's plans and see annual savings, so that I can choose the right tier.

#### Acceptance Criteria

1. THE `/pricing` Route SHALL render four Pricing_Tier cards: Starter, Growth, Business, and Enterprise
2. THE `/pricing` Route SHALL render a Billing_Period toggle offering `monthly` and `annual`, defaulting to `monthly`
3. WHEN the Billing_Period is `monthly`, THE pricing cards SHALL display ₹999 for Starter, ₹2,999 for Growth, ₹7,999 for Business, and a non-numeric custom-pricing label for Enterprise
4. WHEN the Billing_Period is `annual`, THE pricing cards SHALL display ₹9,990 for Starter, ₹29,990 for Growth, ₹79,990 for Business, and a non-numeric custom-pricing label for Enterprise
5. WHEN the Billing_Period is `annual`, THE `/pricing` Route SHALL display a savings indicator of approximately 17 percent
6. THE Billing_Period toggle SHALL be operable by keyboard and SHALL convey the selected period to assistive technology
7. THE `/pricing` Route SHALL visually distinguish the Growth tier as the most popular option using a badge and an elevated card treatment
8. THE `/pricing` Route SHALL render, for each tier, its agent-seat limit, contact limit, monthly automation-message allowance, flow limit, and WhatsApp-number limit, with values: Starter 2 agents / 1,000 contacts / 2,000 messages / 5 flows / 1 number; Growth 5 agents / 5,000 contacts / 10,000 messages / 25 flows / 2 numbers; Business 15 agents / 25,000 contacts / 50,000 messages / unlimited flows / 5 numbers; Enterprise unlimited agents / custom contacts / custom messages / unlimited flows / custom numbers
9. THE `/pricing` Route SHALL render each tier's feature list, with Growth, Business, and Enterprise each indicating that they include the preceding tier's capabilities
10. THE `/pricing` Route SHALL render tier-specific call-to-action controls: Starter and Growth offering a trial or sign-up action, Business offering a demo-booking action, and Enterprise offering a contact-sales action
11. WHERE no sign-up destination is configured, THE trial and sign-up call-to-action controls SHALL open a WhatsApp_Deep_Link to the Business_Number with a message identifying the selected tier

---

### Requirement 18: Pricing Page — Meta Charges Disclaimer and Feature Flag

**User Story:** As a business owner, I want it stated clearly that Meta's messaging fees are separate, so that customers do not assume JarCube absorbs WhatsApp costs.

#### Acceptance Criteria

1. THE `/pricing` Route SHALL render the Meta_Charges_Disclaimer beneath the pricing cards, stating that WhatsApp messaging fees are charged separately by Meta and that the JarCube subscription covers the platform, automation, AI, and team features
2. THE `/pricing` Route SHALL label the per-tier message allowances as JarCube platform automation allowances rather than as WhatsApp message quotas
3. THE entire pricing presentation — the `/pricing` Route body and the Pricing_Teaser Section — SHALL be gated behind a single Feature_Flag, so that pricing can be hidden site-wide by changing one value
4. WHEN the pricing Feature_Flag is disabled, THEN THE `/pricing` Route SHALL render a contact-sales call to action in place of the tier cards, and THE Pricing_Teaser Section SHALL be omitted from the `/` Route
5. WHEN the pricing Feature_Flag is disabled, THEN THE navigation header SHALL omit its `/pricing` link

---

### Requirement 19: Lead Capture via WhatsApp

**User Story:** As a visitor, I want to send JarCube my enquiry without creating an account, so that contacting the team is frictionless.

#### Acceptance Criteria

1. THE Lead_Form SHALL render input fields for name, business name, phone number, and message, each associated with a visible `<label>` element
2. THE Lead_Form SHALL treat the name field and the phone field as required
3. WHEN the visitor submits the Lead_Form while the name field contains no non-whitespace character or the phone field contains no non-whitespace character, THEN THE Lead_Form SHALL block submission and display a field-level validation message associated with the offending field
4. WHEN the visitor submits the Lead_Form with all required fields satisfied, THEN THE Lead_Form SHALL compose a WhatsApp_Deep_Link to the Business_Number whose `text` parameter contains the entered field values, and SHALL open it
5. THE Lead_Form SHALL percent-encode all user-entered values when composing the WhatsApp_Deep_Link `text` parameter, so that reserved characters cannot corrupt or inject content into the resulting URL
6. THE Lead_Form SHALL read the Business_Number from a single site configuration module rather than embedding the number at each usage site
7. THE Lead_Form SHALL NOT transmit entered values to any endpoint other than the WhatsApp_Deep_Link opened by the visitor's own action
8. WHEN the visitor submits the newsletter Lead_Form in the footer, THEN THE Site SHALL apply the same composition and encoding behaviour with a newsletter-specific pre-composed message

---

### Requirement 20: SEO and Social Metadata

**User Story:** As a marketer, I want each page to be indexable and to preview correctly when shared, so that the site earns traffic.

#### Acceptance Criteria

1. THE Site SHALL render on every Route a unique `<title>` element and a unique meta description reflecting that Route's content
2. THE Site SHALL render on every Route Open Graph tags for title, description, type, url, and image, and a Twitter card tag
3. THE Site SHALL render on every Route a canonical link element referencing that Route's absolute URL
4. THE Site SHALL render exactly one `<h1>` element per Route
5. THE Site SHALL render a JSON-LD `Organization` structured-data block on the `/` Route
6. THE Site SHALL render a JSON-LD `FAQPage` structured-data block on the `/` Route whose entries correspond to the FAQ Section content
7. THE Site SHALL declare `lang="en"` on the `<html>` element of every Route

---

### Requirement 21: Responsive Layout and Performance

**User Story:** As a visitor on a phone, I want the site to be readable and fast, so that I do not abandon it.

#### Acceptance Criteria

1. THE Site SHALL render every Route without horizontal overflow at any viewport width between 320 and 1920 CSS pixels
2. THE Site SHALL constrain its content columns to a maximum width of 1200 CSS pixels, centred horizontally
3. THE Site SHALL render all interactive controls with a minimum tap target of 44 by 44 CSS pixels
4. THE Site SHALL apply the `loading="lazy"` attribute to every image positioned below the initial viewport fold
5. THE Site SHALL declare explicit `width` and `height` attributes or an equivalent aspect-ratio declaration on every raster image, so that layout does not shift as images load
6. THE Site SHALL achieve a Largest Contentful Paint below 2.5 seconds when measured on a simulated 4G connection profile

---

### Requirement 22: Accessibility

**User Story:** As a visitor using assistive technology, I want to navigate the JarCube site independently, so that I can evaluate the product.

#### Acceptance Criteria

1. THE Site SHALL structure every Route using semantic landmark elements: `header`, `nav`, `main`, and `footer`
2. THE Site SHALL render a skip link as the first focusable element of every Route that moves focus to the `main` landmark
3. THE Site SHALL ensure body text maintains a contrast ratio of at least 4.5 to 1 against its background, and that large text, icons, and interactive control boundaries maintain at least 3 to 1, per WCAG 2.1 Level AA
4. THE Site SHALL render a visible focus indicator on every focusable element with a contrast ratio of at least 3 to 1 against adjacent colours
5. THE Site SHALL make every interactive control reachable and operable by keyboard alone, in an order matching its visual reading order
6. THE Site SHALL provide an accessible name for every control whose visible content is an icon alone
7. THE Site SHALL provide an `alt` attribute on every image, using an empty value for purely decorative images
8. WHERE a Section renders a heading, THE Site SHALL nest heading levels without skipping a level

---

### Requirement 23: Content Provenance

**User Story:** As the site owner, I want all site content to be ours or properly licensed, so that we are not exposed to an intellectual-property claim.

#### Acceptance Criteria

1. THE Site SHALL contain only marketing copy authored for JarCube
2. THE Site SHALL contain only iconography and illustration authored for JarCube or used under a licence permitting commercial use
3. THE Site SHALL NOT embed images, stylesheets, icon sets, or copy retrieved from any third-party marketing website
4. THE Site SHALL render customer logos only for organisations recorded in the logo manifest, and the manifest SHALL carry a per-entry field recording whether written usage permission has been obtained
5. WHERE a logo manifest entry records that permission has not been obtained, THE Logo_Wall SHALL omit that entry from the rendered output
6. THE Site SHALL render testimonial quotations only as supplied by the attributed customer

---

### Requirement 24: Industry Index Page

**User Story:** As a visitor in a particular sector, I want to find my industry from a single list, so that I can jump straight to relevant content.

#### Acceptance Criteria

1. THE `/industry` Route SHALL render an eyebrow label, a single `<h1>`, and a supporting paragraph introducing the industry stories
2. THE `/industry` Route SHALL render one card for each of the eight industry-detail Routes defined in Requirement 3, criterion 4
3. THE `/industry` Route SHALL render each card containing the industry name, a one-to-two sentence description of the manual-process pain point that industry faces, an original inline-SVG industry icon, and a link to that industry's detail Route
4. THE `/industry` Route SHALL source its card content from a single industry content module shared with the industry-detail Routes and the landing page Industry_Demos Section, so that industry names and descriptions cannot diverge between Routes
5. THE `/industry` Route SHALL render each card as a single focusable link region
6. THE `/industry` Route SHALL render the Book_A_Call Section defined in Requirement 15

---

### Requirement 25: Industry Detail Pages

**User Story:** As a visitor in a specific industry, I want a page dedicated to my sector, so that I can see exactly how JarCube applies to my business.

#### Acceptance Criteria

1. EACH industry-detail Route SHALL render a single `<h1>` naming that industry
2. EACH industry-detail Route SHALL render a pain-point Section describing the manual processes that industry currently handles by hand
3. EACH industry-detail Route SHALL render a use-case Section listing at least three concrete JarCube automations applicable to that industry
4. EACH industry-detail Route SHALL render a call-to-action Section opening a WhatsApp_Deep_Link to the Business_Number with a message identifying that industry
5. EACH industry-detail Route SHALL render the Book_A_Call Section defined in Requirement 15
6. EACH industry-detail Route SHALL read its content from the shared industry content module keyed by its industry slug
7. THE industry-detail Routes SHALL be generated from the shared industry content module rather than authored as eight independently-maintained page implementations, so that a change to the page structure applies to all eight

---

### Requirement 26: Partner Programme Page

**User Story:** As a prospective reseller, I want to understand JarCube's partner terms and what I would earn, so that I can decide whether to apply.

#### Acceptance Criteria

1. THE `/partner` Route SHALL render an eyebrow label, a single `<h1>`, and an introductory passage describing the partner opportunity
2. THE `/partner` Route SHALL render a benefits Section containing at least four cards covering ongoing product updates, customer retention, market demand, and user-base growth
3. THE `/partner` Route SHALL render a partnership-model Section stating the revenue split as 20 percent recurring commission to the partner and 80 percent retained by JarCube to cover platform usage, automation setup, support, and development
4. THE partnership-model Section SHALL state that Meta WhatsApp campaign charges are paid directly by the client or the partner and are not borne by JarCube
5. THE partnership-model Section SHALL state that resale above an agreed price threshold requires mutual discussion
6. THE `/partner` Route SHALL render a commission-growth table illustrating cumulative recurring commission across three months, presenting per-month total sales, partner commission, and cumulative growth percentage
7. THE commission-growth table SHALL be rendered as a `<table>` element with a `<caption>` and `<th>` header cells carrying an explicit `scope` attribute, so that its structure is conveyed to assistive technology
8. THE commission-growth table SHALL compute its commission values from the commission rate declared in the partner content module rather than from hard-coded figures in the markup, so that changing the rate updates every displayed value
9. THE `/partner` Route SHALL render a feature-matrix Section grouping platform capabilities under at least the headings Conversations, User Management, Outbounds, Integrations, Analytics, and Knowledge Base, each group listing its individual capabilities with a name and a one-sentence description
10. THE `/partner` Route SHALL render a division-of-responsibilities Section distinguishing partner-owned Level 1 support from JarCube-owned Level 2 technical support, and distinguishing basic flow building from complex flow building
11. THE `/partner` Route SHALL render a comparison Section presenting JarCube capabilities alongside the corresponding limitations of generic alternatives, using neutral category descriptions and naming no competitor product
12. THE `/partner` Route SHALL render the FAQ Section defined in Requirement 13 and the Book_A_Call Section defined in Requirement 15
13. THE `/partner` Route SHALL render a Lead_Form as defined in Requirement 19 for partner applications, with a pre-composed message identifying the enquiry as a partner application

---

### Requirement 27: Contact Page

**User Story:** As a visitor with a question, I want several ways to reach JarCube, so that I can use whichever channel suits me.

#### Acceptance Criteria

1. THE `/contact` Route SHALL render an eyebrow label, a single `<h1>`, and a supporting paragraph inviting enquiries
2. THE `/contact` Route SHALL render the Business_Number as a `tel:` link and at least one contact email address as a `mailto:` link
3. THE `/contact` Route SHALL render social profile links
4. THE `/contact` Route SHALL render a Lead_Form as defined in Requirement 19
5. THE `/contact` Route SHALL render an office-address Section and a stated office-hours range
6. THE `/contact` Route SHALL read all contact details — phone numbers, email addresses, addresses, office hours, and social URLs — from the single site configuration module referenced in Requirement 19, criterion 6
7. THE `/contact` Route SHALL render the FAQ Section defined in Requirement 13
8. IF the site configuration module declares no office address, THEN THE office-address Section SHALL be omitted rather than rendering an empty container

---

### Requirement 28: Shared Section Reuse

**User Story:** As a developer, I want repeated sections implemented once, so that a copy change lands everywhere it appears without my hunting through files.

#### Acceptance Criteria

1. THE Site SHALL implement the FAQ Section as a single component consumed by the `/`, `/partner`, and `/contact` Routes
2. THE Site SHALL implement the Book_A_Call Section as a single component consumed by the `/`, `/industry`, the eight industry-detail, and `/partner` Routes
3. THE Site SHALL implement the Lead_Form as a single component consumed by the `/contact`, `/partner`, and Page_Shell footer newsletter contexts, parameterised by its pre-composed message and its visible field set
4. WHEN the FAQ content module is edited, THEN every Route rendering the FAQ Section SHALL reflect that edit without further code change
