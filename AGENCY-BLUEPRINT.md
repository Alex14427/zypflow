# SOLIS DIGITAL - COMPLETE AGENCY BLUEPRINT

> **Purpose:** This document is the complete A-Z blueprint for Solis Digital. It contains every technical detail, credential, workflow, and strategy needed to understand, maintain, or recreate the entire agency from scratch. Treat this as the single source of truth.

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Website Structure](#3-website-structure)
4. [Instant Website Scanner](#4-instant-website-scanner)
5. [Lead Generation Pipeline](#5-lead-generation-pipeline)
6. [Make.com Automation Scenarios](#6-makecom-automation-scenarios)
7. [Command Centre Dashboard](#7-command-centre-dashboard)
8. [Supabase Database Tables](#8-supabase-database-tables)
9. [Cold Outreach System](#9-cold-outreach-system)
10. [SEO & Indexing](#10-seo--indexing)
11. [Tawk.to Chat Configuration](#11-tawkto-chat-configuration)
12. [Pricing Packages](#12-pricing-packages)
13. [Domain & Hosting Setup](#13-domain--hosting-setup)
14. [Branding](#14-branding)
15. [Key Lessons Learned](#15-key-lessons-learned)
16. [Revenue Projections](#16-revenue-projections)
17. [Step-by-Step Recreation Guide](#17-step-by-step-recreation-guide)

---

## 1. OVERVIEW

| Field | Detail |
|-------|--------|
| **Business Name** | Solis Digital |
| **Type** | AI-Powered Marketing Agency |
| **Co-Founders** | Alex (Co-Founder & Strategy), Zain (Co-Founder & Operations) |
| **Location** | London, UK (serves all of the UK remotely) |
| **Target Markets** | London, Nottingham (expanding) |
| **Website** | https://www.solisdigital.co.uk |
| **Email** | info@solisdigital.co.uk |
| **Calendly** | https://calendly.com/solisdigital-info/solis-digital-free-strategy-call |
| **Core Services** | Web Design, SEO, Paid Ads, AI Automation & Chatbots, Content & Copywriting, Hosting & Maintenance |
| **Value Proposition** | AI-powered delivery at a fraction of the cost and time of traditional agencies. Websites in 5-7 days, not 8-12 weeks. |
| **Target Industries** | Dental practices, estate agents, trades (plumbers, electricians), gyms, restaurants, salons, solicitors, accountants |

### Positioning Statement

"Solis Digital builds high-converting websites, runs profitable campaigns, and automates your marketing -- all powered by AI. Based in London, serving the UK."

### Key Differentiators
- AI-powered workflow = 5-7 day delivery vs 8-12 weeks traditional
- Free website audit before any pitch (lead with data, not sales)
- Transparent pricing with no hidden fees
- Client owns all code, content, and design -- no lock-ins
- 100% satisfaction guarantee with 2 rounds of revisions

---

## 2. TECH STACK

### Hosting & Deployment
| Service | Purpose | Details |
|---------|---------|---------|
| **Vercel** | Website hosting | Auto-deploys from GitHub `main` branch |
| **GitHub** | Source control | Repo: `SolisDigitalProject/solis-digital-website` |

### Domain
| Domain | Setup |
|--------|-------|
| `solisdigital.co.uk` | Redirects (307) to `www.solisdigital.co.uk` |
| `www.solisdigital.co.uk` | Primary domain, all canonical URLs use this |

### Database
| Service | Details |
|---------|---------|
| **Supabase** | Project ID: `zqcpktpnfikmshqeqxlg` |
| REST Endpoint | `https://zqcpktpnfikmshqeqxlg.supabase.co/rest/v1` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE` |

### Live Chat
| Service | Details |
|---------|---------|
| **Tawk.to** | Live chat with AI Assist |
| Property ID | `69b9a21c7f0aa71c36e441e0` |
| Widget ID | `1jjui2gh9` |
| JS API Key | `6c83f113a6a4b298ee3bbaa552cee22a6df779e6` |
| AI Bot Name | Apollo / Solis AI |

### Lead Generation & Outreach
| Service | Purpose |
|---------|---------|
| **Apify** | Lead scraping (Google Maps, directories) |
| **Hunter.io** | Email address finding/verification |
| **Instantly.ai** | Email warmup and cold outreach sequences |

### Automation & Integration
| Service | Purpose |
|---------|---------|
| **Make.com** | Workflow automation (connects all tools) |
| **Calendly** | Booking strategy calls |
| **Stripe** | Payment processing |

### Analytics & SEO
| Service | Details |
|---------|---------|
| **Google Analytics** | Property ID: `G-V7ZVJZKH2W` |
| **Google Search Console** | Site verified |
| **PageSpeed Insights API** | Key: `AIzaSyCCd15XjzZE5aoAJ8zJjCLkkW9evdkuHj0` |

---

## 3. WEBSITE STRUCTURE

The entire website is a **single HTML file** (`index.html`) with embedded CSS and JavaScript. No build tools, no frameworks, no dependencies beyond Google Fonts. This is intentional for simplicity, fast loading, and easy deployment.

### Page Sections (in order)

#### Navigation Bar
- Fixed position, glassmorphism background (blur + transparency)
- Logo: gold gradient square with circle overlay + "Solis Digital" text
- Links: Process, Services, Revenue Calculator, Results, Pricing, FAQ
- CTA button: "Free Audit" (links to #contact)
- Hamburger menu for mobile with animated open/close

#### Hero Section
- Eyebrow text: "AI-Powered Marketing Agency -- London, UK"
- Headline: "We Build Brands That Shine *Online*"
- Subhead: "High-converting websites, profitable campaigns, and marketing automation -- all powered by AI. Results in days, not months. Based in London, serving the UK."
- Two CTAs: "Get Your Free Audit" (primary) and "See What You're Losing" (secondary, links to calculator)
- Radial gradient glow effect behind content
- Fade-up animation on load

#### Trust Badges
- 4.9/5 on Google (star icons)
- AI-Powered Delivery
- SSL & GDPR Compliant
- UK Based & Operated

#### Stats Counters (animated on scroll)
- 5-7 Days to Launch
- 24/7 AI-Powered Support
- 100% Satisfaction Guarantee
- 3 Flexible Packages

Counter animation uses IntersectionObserver -- numbers count up from 0 when the section scrolls into view.

#### The Process (4 steps)
1. **Discovery** - Audit website, SEO, competitors, market position
2. **Strategy** - Custom growth plan backed by data
3. **Execute** - AI builds, humans refine, live in 5-7 days
4. **Scale** - Continuous optimisation, monthly reporting

#### Services (6 cards, 2-column grid)
1. **Website Design & Development** - Stunning, fast, mobile-first. 5-7 day delivery.
2. **SEO & Search Rankings** - Technical SEO, local SEO, content strategy, backlinks.
3. **Paid Advertising** - Google Ads, Meta, Instagram. AI-assisted, daily optimisation.
4. **AI Automation & Chatbots** - 24/7 lead capture, email sequences, smart CRM.
5. **Content & Copywriting** - AI-crafted, human-refined copy for all channels.
6. **Hosting & Maintenance** - Fast hosting, SSL, backups, security, updates.

Each card has a left accent bar animation on hover.

#### Revenue Loss Calculator
An interactive tool that estimates how much revenue a business is losing due to a poor website.

**Inputs:**
- Industry (dropdown: dental, estate agent, trades, gym, restaurant, salon, legal, accounting, other)
- Monthly website visitors (number)
- Average customer value in GBP (number)
- Current enquiry rate (Low 0-2/week, Medium 3-5/week, High 6+/week)

**Calculation logic:**
- Each industry has optimised conversion rate and average rate benchmarks
- Example benchmarks: dental (opt: 8%, avg: 2%), trades (opt: 10%, avg: 2.5%), legal (opt: 5%, avg: 1.2%)
- Current rate adjusted by enquiry level: low = avgRate * 0.5, medium = avgRate, high = avgRate * 1.5
- Lost leads = (visitors * optimisedRate) - (visitors * currentRate)
- Lost customers = lostLeads * 0.3 (30% close rate)
- Monthly loss = lostCustomers * avgValue
- Annual loss = monthlyLoss * 12

**Output:**
- Annual revenue loss (large red number)
- Lost leads per month
- Lost customers per month
- Lost revenue per month
- CTA: "Get Your Free Audit -- Stop Losing Money"

#### What You Get (4 feature cards, 2-column grid)
1. **Lightning-Fast Delivery** - 5-7 days vs 8-12 weeks
2. **Free Website Audit** - Show problems before pitching solutions
3. **AI-Powered, Human-Refined** - 10x speed, agency quality, lower cost
4. **You Own Everything** - No lock-ins, hand over all code/content

#### Pricing (3 tiers, 3-column grid)
See [Section 12](#12-pricing-packages) for full details.

#### FAQ Section (7 questions, accordion style)
1. How quickly can you build my website?
2. What makes Solis different from other agencies?
3. Do I own my website after it's built?
4. What if I'm not happy with the design?
5. Do you work with businesses outside London?
6. What's included in the monthly retainer?
7. How does the free audit work?

Click-to-toggle accordion with + icon that rotates to x when open.

#### Team Section
- Alex: Co-Founder & Strategy (gold avatar with "A")
- Zain: Co-Founder & Operations (gold avatar with "Z")

#### Contact / Audit Form (3-step multi-step form)
**Step 1: Website URL**
- Input field for website URL
- "Scan My Website" button
- Triggers instant PageSpeed scan on proceed

**Step 2: Instant Scan Results**
- Shows scanning URL
- Loading indicator: "Scanning your website... this may take 10-20 seconds"
- Three animated progress bars: Speed, SEO, Mobile
- Color coding: red (<50), amber (50-79), green (80+)
- CTA to continue to step 3 for full audit

**Step 3: Contact Details**
- Email (required)
- Name (optional)
- Industry dropdown
- Submit button sends data to Supabase `inquiries` table
- Fires Google Analytics event: `audit_request`
- Success message: "Your full AI audit is on its way!"

Progress indicator: 3 dots showing current step (active = gold, done = green).

#### Footer
- Copyright: "2026 Solis Digital. All rights reserved. | info@solisdigital.co.uk"
- Links: Privacy Policy, Terms, Email

---

## 4. INSTANT WEBSITE SCANNER

The scanner is embedded in the contact form (Step 2) and uses the Google PageSpeed Insights API v5.

### API Configuration
```
Endpoint: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
API Key: AIzaSyCCd15XjzZE5aoAJ8zJjCLkkW9evdkuHj0
Strategy: MOBILE
```

### Critical Implementation Detail
The API URL MUST include explicit category parameters:
```
category=performance&category=seo&category=accessibility
```
Without these, the API only returns performance data and the SEO and Mobile scores show as 0. This was a major bug that took time to diagnose.

### Score Extraction
```javascript
var speed = cats.performance ? Math.round(cats.performance.score * 100) : 0;
var seo = cats.seo ? Math.round(cats.seo.score * 100) : 0;
var mobile = cats.accessibility ? Math.round(cats.accessibility.score * 100) : 0;
```

### Visual Display
- Three horizontal progress bars with animated width transitions
- Color coding:
  - Red (`var(--red)` / `#f87171`): score < 50
  - Amber/Gold (`var(--accent)` / `#e8a23a`): score 50-79
  - Green (`var(--green)` / `#34d399`): score >= 80
- Loading state shows "..." and a pulsing "Scanning your website..." message
- Error state shows "Error" text

### How it's used in the sales process
1. Visitor enters their URL on the website
2. Instant scan runs showing them their poor scores
3. This creates urgency -- they see the problem with data
4. They enter contact details to get the "full audit"
5. Same scan data is used in cold outreach emails and calls ("Your site scored X/100 on speed...")

---

## 5. LEAD GENERATION PIPELINE

This is the complete flow from finding a lead to closing a client.

### Stage 1: Lead Scraping (Apify)
- Use Apify actors to scrape Google Maps and business directories
- Target industries: dental clinics, trades, restaurants, gyms, estate agents, salons, solicitors
- Target locations: London, Nottingham (expanding)
- Data collected: business_name, website, phone, address, industry

### Stage 2: Email Finding (Hunter.io)
- Feed scraped websites into Hunter.io
- Hunter finds associated email addresses
- Verify emails before adding to outreach

### Stage 3: Lead Storage (Supabase)
All leads stored in the `leads` table with fields:
- `business_name`, `website`, `email`, `phone`
- `industry`, `location`
- `lead_score`, `speed_score`, `seo_score`, `mobile_score`
- `audit_summary`, `revenue_loss_estimate`
- `status` (New, Audited, In Outreach, Replied, Call Booked, Client Won, No Website, Rejected)
- `notes`

### Stage 4: Automated Audit (Make.com)
- Make.com scenario runs every 15 minutes
- Picks up all leads with status "New" that have a website
- Runs PageSpeed API on each lead's website
- Stores speed, SEO, mobile scores back in Supabase
- Generates an audit summary
- Updates status to "Audited"

### Stage 5: Lead Scoring
Lead scoring algorithm ranks leads based on how bad their website is. The logic: **worse website = better lead** (they need you more).

Scoring factors:
- Low speed score = higher lead score
- Low SEO score = higher lead score
- Low mobile score = higher lead score
- Having a phone number = bonus points (can cold call)
- Having an email = bonus points (can email)

### Stage 6: Export & Outreach
- Dashboard exports top leads as CSV (email list or call list)
- Email list goes to Instantly for automated cold outreach
- Call list used by Alex and Zain for cold calling
- 5-email cold outreach sequence (see Section 9)
- Personalized with their specific audit scores and revenue loss estimate

### Stage 7: Conversion
- Interested replies get Calendly booking link
- 15-minute free strategy call
- Walk through their audit report
- Present package options
- Stripe payment link sent after agreement
- Payment triggers onboarding automation

### The Full Pipeline Visualized
```
Apify (scrape) --> Hunter.io (find email) --> Supabase (store)
       |
       v
Make.com (auto-audit every 15 min) --> PageSpeed API --> update Supabase
       |
       v
Dashboard (view, filter, score, export)
       |
       +---> CSV Email Export --> Instantly (5-email sequence)
       |
       +---> CSV Call List --> Cold Calls (Alex & Zain)
       |
       v
Reply / Interest --> Calendly (15-min strategy call) --> Stripe (payment) --> Onboarding
```

---

## 6. MAKE.COM AUTOMATION SCENARIOS

### Scenario 1: Lead Ingestion
- **Trigger:** Apify scrape completes
- **Action:** Parse scraped data, insert into Supabase `leads` table
- **Status:** ACTIVE

### Scenario 2: AI Audit (Auto-Audit New Leads)
- **Trigger:** Runs every 15 minutes (scheduled)
- **Action:**
  1. Query Supabase for leads with status = "New" and website is not null
  2. For each lead, call PageSpeed Insights API with performance + seo + accessibility categories
  3. Extract scores (speed, SEO, mobile)
  4. Generate audit summary text
  5. Calculate lead score
  6. Update lead record in Supabase (scores, summary, status = "Audited")
- **Status:** ACTIVE

### Scenario 3: Outreach Export to Instantly
- **Trigger:** Manual or scheduled
- **Action:** Export audited leads with email addresses to Instantly campaign
- **Status:** READY (activate after email warmup completes)

### Scenario 4: Calendly --> Client Pipeline
- **Trigger:** Calendly webhook (new booking)
- **Action:** Update lead status to "Call Booked" in Supabase
- **Status:** ACTIVE

### Scenario 5: Stripe --> Onboarding
- **Trigger:** Stripe webhook (payment received)
- **Action:**
  1. Create new record in `clients` table
  2. Update lead status to "Client Won"
  3. Trigger onboarding email sequence
- **Status:** ACTIVE

---

## 7. COMMAND CENTRE DASHBOARD

**URL:** `https://www.solisdigital.co.uk/dashboard.html`
**File:** `dashboard.html`

### Authentication
- Password protected with simple check
- Password: `Weetabix`
- Uses `sessionStorage` (persists during browser session, clears on close)
- Body has class `locked` which hides all content except auth gate
- On correct password: removes `locked` class, hides auth gate, stores `solis_auth=1` in sessionStorage

### KPI Cards (6 across the top)
1. **Total Leads** - count of all leads, with breakdown by status
2. **Audited** - count of audited leads, shows how many have email
3. **Emails Available** - leads with email addresses, shows percentage
4. **Avg Lead Score** - average score out of 100
5. **Clients Won** - total clients with revenue summary
6. **Outreach Sent** - total emails sent with reply count

### Quick Action Buttons
- **Export Call List CSV** - exports all leads with phone numbers, sorted by lead score
- **Export Email List CSV** - exports all audited leads with emails (for Instantly import)

### Outreach Performance Panel
4-metric grid:
- Total Sent (white)
- Replied (blue)
- Interested (gold/accent)
- Calls Booked (green)

### Revenue Overview Panel
3-metric grid:
- One-Off Revenue (gold)
- Monthly MRR (green)
- Total Clients (blue)
- Package breakdown below (count per package type with one-off + MRR)

### Leads Table
- Columns: Business, Industry, Location, Score, Speed, Phone, Email, Status, Audit Summary
- Shows top 30 leads for current filter
- Score displayed with color + mini bar chart
- Phone numbers are click-to-dial links
- Email shown as checkmark/cross
- Status badges color-coded:
  - New = blue
  - Audited = gold
  - In Outreach = purple
  - Replied = green
  - Call Booked = darker green
  - Client Won = solid green
  - No Website = red

### Filter Bar
Chips for: All, New, Audited, In Outreach, Replied, Call Booked, Client Won, No Website
Each chip shows count in parentheses. Click to filter the leads table.

### Pipeline Funnel (right sidebar)
Visual funnel showing count at each stage:
Total Leads --> Audited --> In Outreach --> Replied --> Call Booked --> Client Won
Bar width proportional to total leads count.

### Call List Panel
- Shows top 15 leads with phone numbers, sorted by lead score
- Each row: rank number, business name, industry, phone (click-to-dial), lead score, speed score, status
- "Mark Called" button for each lead (saves "Called on [date]" to notes field in Supabase)
- Already-called leads show greyed out "Called" button

### Recent Inquiries Panel
- Shows last 10 form submissions from the website
- Email, message preview (80 chars), date

### Technical Details
- All data fetched from Supabase REST API using anon key
- Auto-refreshes every 60 seconds (`setInterval(loadData, 60000)`)
- "Run Bulk Audit" button triggers alert explaining Make.com picks up New leads every 15 minutes
- `meta name="robots" content="noindex, nofollow"` prevents search engine indexing
- Blocked in robots.txt: `Disallow: /dashboard.html`

---

## 8. SUPABASE DATABASE TABLES

### `leads` Table
The main table. Stores all scraped/scored leads.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid/int | Primary key |
| `business_name` | text | Company name |
| `website` | text | Website URL |
| `email` | text | Contact email (from Hunter.io) |
| `phone` | text | Phone number |
| `industry` | text | Business category |
| `location` | text | City/address |
| `lead_score` | integer | Calculated score (0-100, higher = worse website = better lead) |
| `speed_score` | integer | PageSpeed performance score (0-100) |
| `seo_score` | integer | PageSpeed SEO score (0-100) |
| `mobile_score` | integer | PageSpeed accessibility score (0-100) |
| `audit_summary` | text | Generated summary of audit findings |
| `revenue_loss_estimate` | numeric | Estimated annual revenue loss |
| `status` | text | Pipeline stage: New, Audited, In Outreach, Replied, Call Booked, Client Won, No Website, Rejected |
| `notes` | text | Free-text notes (e.g., "Called on 18/03/2026") |
| `created_at` | timestamp | When the lead was added |

### `inquiries` Table
Website form submissions from the audit request form.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid/int | Primary key |
| `email` | text | Visitor's email |
| `name` | text | Visitor's name (optional) |
| `business_url` | text | URL they submitted for scanning |
| `message` | text | Industry selection or message |
| `source` | text | Where it came from (e.g., "website_audit_form") |
| `created_at` | timestamp | Submission time |

### `outreach` Table
Tracks email campaign activity.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid/int | Primary key |
| `lead_id` | reference | Links to leads table |
| `status` | text | Replied, Interested, Call Booked, etc. |
| `sent_at` | timestamp | When email was sent |
| `created_at` | timestamp | Record creation time |

### `clients` Table
Paying customers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid/int | Primary key |
| `lead_id` | reference | Links to original lead |
| `business_name` | text | Client business name |
| `package_type` / `package` | text | Starter, Growth, or Enterprise |
| `one_off_revenue` | numeric | One-time payment amount |
| `monthly_retainer` | numeric | Monthly recurring amount |
| `created_at` | timestamp | When they became a client |

---

## 9. COLD OUTREACH SYSTEM

### Email Warmup (Instantly.ai)
- New email domains/accounts need ~2 weeks of warmup before sending cold emails
- Instantly gradually increases sending volume
- Do NOT skip warmup -- emails will go straight to spam
- Warmup sends automated emails between warming accounts to build sender reputation

### 5-Email Cold Outreach Sequence

All emails are personalized with the lead's specific audit data (speed score, SEO score, revenue loss estimate).

**Email 1 (Day 1):** Introduce audit findings. "We ran a free audit on your website and found some issues..."
**Email 2 (Day 3):** Follow up with specific data points. Revenue loss angle.
**Email 3 (Day 5):** Social proof / case study angle.
**Email 4 (Day 8):** Final value add, offer Calendly booking.
**Email 5 (Day 12):** Breakup email. "Not going to bother you again, but here's your free report..."

### Cold Call Scripts (5 scripts)

All scripts are stored in `templates/cold-call-scripts.md`.

#### Script 1: Main Cold Call (Has Website, Bad Scores)
- Goal: Book a 15-minute strategy call
- Keep under 60 seconds before the ask
- Lead with their specific audit scores: "Your site scored X/100 on speed, X/100 on SEO, X/100 on mobile"
- Position as consultant, not salesperson
- The ask: "Would you have some time this week for a quick 15-minute call?"
- If yes: send Calendly link
- If hesitant: offer to email the free report
- If no: ask to email the report anyway

#### Script 2: No Website
- Easiest sell -- they have NO online presence
- Position the Starter package as a no-brainer at 497 pounds
- Key angle: "When someone searches for [their service], your competitors with websites are getting all those customers"
- Mention Google Business Profile as a quick win
- The ask is still the free 15-minute call

#### Script 3: Follow-Up (Emailed But No Reply)
- Reference the email they received
- "I wanted to make sure it didn't end up in spam"
- If they saw it: ask what they thought, offer to walk through it
- If they didn't see it: re-deliver the key scores verbally
- Objection if not interested: "Is it because you're happy, or a timing thing?"

#### Script 4: Objection Handling
Five common objections with responses:

1. **"We already have a website"** --> "That's why I'm calling. We audited it and the scores suggest it's not performing. Your speed is X/100..."
2. **"We can't afford it"** --> "Starter is just 497, one-off. If it brings in 1-2 extra customers, it's paid for itself."
3. **"We're not interested"** --> "Are you happy with enquiries you're getting online? The audit flagged some things..."
4. **"We already have someone doing this"** --> "Do you know your current speed and SEO scores? We often find sites aren't performing as well as expected."
5. **"Send me an email"** --> Get their email, send report, follow up in 2 days. This is often a brush-off but gives a reason to call back.

#### Script 5: Voicemail
- Keep under 20 seconds
- "I've put together a free report I think you'd find useful. I'll try you again tomorrow."

### Key Call Principles
- **Lead with data** -- always reference their specific scores
- **5-7 day delivery** is a strong differentiator
- **Google Business Profile** -- easy quick win to mention for local businesses
- **Be a consultant, not a salesperson** -- you're helping them understand a problem
- **The ask is ALWAYS the free call** -- never try to close on a cold call
- **Calendly link:** https://calendly.com/solisdigital-info/solis-digital-free-strategy-call

### Call Flow
```
Answer? --YES--> Deliver script --> Book Calendly call
   |                                      |
   NO                                Objection?
   |                                      |
   Leave voicemail              Handle it (Script 4)
                                          |
                                   Still no? --> Offer to email report
                                                       |
                                                 Get their email
                                                       |
                                              Follow up in 2 days (Script 3)
```

---

## 10. SEO & INDEXING

### Google Site Verification
```html
<meta name="google-site-verification" content="O49_v9SSeVPfXSlv1KUO9vXbb1RF1W_LeFJtQbUxn3o">
```

### Canonical URL
```html
<link rel="canonical" href="https://www.solisdigital.co.uk">
```
All canonical URLs use the `www` prefix. This matches the Vercel redirect setup.

### Sitemap (`sitemap.xml`)
```xml
<url>
  <loc>https://www.solisdigital.co.uk/</loc>
  <lastmod>2026-03-17</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://www.solisdigital.co.uk/privacy</loc>
  <priority>0.3</priority>
</url>
<url>
  <loc>https://www.solisdigital.co.uk/terms</loc>
  <priority>0.3</priority>
</url>
```
All URLs use `https://www.solisdigital.co.uk` -- must match the canonical/redirect setup.

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /dashboard.html
Disallow: /scripts/

Sitemap: https://www.solisdigital.co.uk/sitemap.xml
```

### Open Graph Meta Tags
```html
<meta property="og:title" content="Solis Digital -- AI-Powered Marketing Agency | London">
<meta property="og:description" content="High-converting websites, profitable campaigns, and marketing automation -- all powered by AI. Results in days, not months.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.solisdigital.co.uk">
<meta property="og:site_name" content="Solis Digital">
<meta property="og:locale" content="en_GB">
```

### Twitter Card
```html
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Solis Digital -- AI-Powered Marketing Agency | London">
<meta name="twitter:description" content="High-converting websites, profitable campaigns, and marketing automation -- all powered by AI.">
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Solis Digital",
  "description": "AI-Powered Marketing Agency building high-converting websites, running profitable campaigns, and automating marketing for UK businesses.",
  "url": "https://www.solisdigital.co.uk",
  "email": "info@solisdigital.co.uk",
  "areaServed": {"@type": "Country", "name": "United Kingdom"},
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "London",
    "addressRegion": "Greater London",
    "addressCountry": "GB"
  },
  "priceRange": "$$",
  "serviceType": ["Web Design", "SEO", "Digital Marketing", "AI Automation"],
  "founder": [
    {"@type": "Person", "name": "Alex"},
    {"@type": "Person", "name": "Zain"}
  ],
  "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "47"}
}
```

### Google Analytics
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V7ZVJZKH2W"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-V7ZVJZKH2W');
</script>
```

Custom events tracked:
- `audit_request` (category: lead) -- fired when someone submits the audit form

### Meta Tags
```html
<title>Solis Digital -- AI-Powered Marketing Agency | London</title>
<meta name="description" content="Solis Digital builds high-converting websites, runs profitable campaigns, and automates your marketing -- all powered by AI. Based in London, serving the UK.">
<meta name="keywords" content="AI marketing agency London, web design London, SEO agency London, AI website builder, digital marketing UK">
```

### Dashboard SEO Protection
The dashboard has `<meta name="robots" content="noindex, nofollow">` and is blocked in robots.txt.

---

## 11. TAWK.TO CHAT CONFIGURATION

### Embed Code
```html
<script type="text/javascript">
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/69b9a21c7f0aa71c36e441e0/1jjui2gh9';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
</script>
```

### Key IDs
| Item | Value |
|------|-------|
| Property ID | `69b9a21c7f0aa71c36e441e0` |
| Widget ID | `1jjui2gh9` |
| JS API Key | `6c83f113a6a4b298ee3bbaa552cee22a6df779e6` |

### Configuration
- **Header color:** Gold (#d4a24e) to match brand
- **AI Assist:** Activated with custom bot named "Solis AI" / "Apollo"
- **Auto-generated FAQs** scraped from website content
- **Custom FAQs added:** pricing info, how to book a call
- **Behaviour:** Auto-replies to visitors using AI, escalates to email (info@solisdigital.co.uk) when AI cannot answer or when a human is needed
- **Important:** The widget ID is NOT "default" -- you must find the actual widget ID in the Tawk.to dashboard under Administration > Chat Widget > Widget Code. Using "default" as the widget ID will result in the chat not loading.

---

## 12. PRICING PACKAGES

### Starter -- 497 (one-off)
**Tagline:** Professional online presence for small businesses ready to grow.

**Includes:**
- 5-page responsive website
- Mobile-optimised design
- Basic SEO setup
- Contact form + Google Maps integration
- SSL certificate
- Delivered in 5-7 days

**Best for:** Businesses with no website or a very outdated one. Easiest sell on cold calls.

### Growth -- 997 + 197/month
**Tagline:** Full growth engine for businesses serious about scaling.

**Includes:**
- 10-page custom website
- Advanced SEO optimisation
- AI chatbot integration
- Google Business Profile optimisation
- Monthly analytics reporting
- Booking system integration
- Content updates included
- Priority support

**Badge:** MOST POPULAR (displayed on pricing card)

**Best for:** Established businesses wanting to grow online presence and get ongoing support.

### Enterprise -- 2,497 + 397/month
**Tagline:** Full-service digital transformation for established businesses.

**Includes:**
- Unlimited pages
- E-commerce / booking platform
- Full marketing automation
- Google & Meta Ads management
- Monthly SEO campaigns
- Social media management
- Dedicated account manager
- White-glove onboarding

**Best for:** Larger businesses wanting a full-service digital marketing partner.

### Guarantee
All packages include a **100% Satisfaction Guarantee** with 2 rounds of revisions and dedicated support throughout the project.

### Booking
All pricing cards link to the same Calendly: https://calendly.com/solisdigital-info/solis-digital-free-strategy-call

---

## 13. DOMAIN & HOSTING SETUP

### Vercel Configuration
- Project is connected to GitHub repository: `SolisDigitalProject/solis-digital-website`
- Auto-deploys on every merge/push to `main` branch
- No build step needed (static HTML files served directly)

### Domain Setup
- Primary domain: `www.solisdigital.co.uk`
- Bare domain `solisdigital.co.uk` redirects with 307 to `www.solisdigital.co.uk`
- This redirect is configured in Vercel's domain settings

### Critical Rule
**ALL canonical URLs, sitemap URLs, and Open Graph URLs must use `www.solisdigital.co.uk`.**
If you use the non-www version, it will cause:
- Sitemap errors in Google Search Console (URLs don't match canonical)
- Duplicate content issues
- Redirect chains affecting SEO crawl budget

### Deployment Process
1. Make changes locally or in a branch
2. Push to GitHub
3. If on `main` branch: Vercel auto-deploys within ~30 seconds
4. If on a feature branch: create PR, merge to `main`, then auto-deploy

### File Structure
```
/
  index.html          -- Main website (single page)
  dashboard.html      -- Command Centre dashboard
  sitemap.xml         -- XML sitemap for Google
  robots.txt          -- Search engine directives
  templates/
    cold-call-scripts.md  -- Cold calling scripts
  .claude/            -- Claude Code configuration
```

---

## 14. BRANDING

### Colors
| Name | Hex | CSS Variable | Usage |
|------|-----|-------------|-------|
| Background | `#07080a` | `--bg` | Page background |
| Background 2 | `#0c0d10` | `--bg2` | Secondary background |
| Surface | `#111216` | `--surface` | Cards, panels |
| Card | `#15161b` | `--card` | Elevated surfaces |
| Border | `#1c1d24` | `--border` | Default borders |
| Border 2 | `#2a2b35` | `--border2` | Hover/active borders |
| Text Primary | `#eaeaef` | `--text` | Body text |
| Text Secondary | `#8e8fa3` | `--text2` | Muted text |
| Text Tertiary | `#5c5d72` | `--text3` | Subtle text, labels |
| **Accent Gold** | `#e8a23a` | `--accent` | Primary brand color, CTAs |
| Accent Light | `#f0be6a` | `--accentL` | Hover states, italic headings |
| Accent Dark | `#c4872a` | `--accentD` | Gradient end |
| Green | `#34d399` | `--green` | Success, good scores, CTAs |
| Red | `#f87171` | `--red` | Errors, bad scores, revenue loss |
| White | `#ffffff` | `--white` | Headings, emphasis |

### Fonts
| Font | CSS Variable | Usage |
|------|-------------|-------|
| **DM Sans** | `--font-body` | Body text, navigation, buttons, all UI |
| **Fraunces** | `--font-display` | Section headings, hero text, decorative numbers |
| **DM Mono** | `--mono` | Dashboard: phone numbers, revenue figures |

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&display=swap
```

### Logo
- Gold gradient square (`linear-gradient(135deg, #e8a23a, #c4872a)`) with rounded corners (8px)
- White semi-transparent circle overlay (top-left, 14px diameter, 20% opacity)
- Text: "Solis" in bold white + "Digital" in muted grey (`--text3`)
- Font: DM Sans, 21px, font-weight 800

### Design Aesthetic
- Dark mode only (very dark backgrounds, not pure black)
- Subtle film grain noise overlay (SVG filter, 2.5% opacity, pointer-events: none)
- Gold accent color used sparingly for emphasis
- Glassmorphism on nav (backdrop-filter: blur(24px))
- Subtle glow effects on hover (box-shadow with gold rgba)
- Smooth scroll-reveal animations (fade up, 0.7s cubic-bezier)
- Card hover effects: slight lift (translateY), border color change, shadow

### Tone of Voice
- Professional but approachable
- Confident but not arrogant
- Data-driven: lead with numbers, not opinions
- Results-focused: everything ties back to customer outcomes
- Direct: no fluff, no jargon
- UK English spelling (optimise, colour, etc.)

---

## 15. KEY LESSONS LEARNED

These are hard-won lessons from building and iterating on the agency. Read these before making changes.

### Technical Lessons

1. **PageSpeed API needs explicit category params.** If you just call the API with a URL, it only returns performance data. You MUST add `category=performance&category=seo&category=accessibility` to get all three scores. This was a major bug where the website scanner showed only 1 out of 3 scores working.

2. **Tawk.to widget ID is NOT "default".** The embed URL format is `https://embed.tawk.to/{propertyId}/{widgetId}`. The widget ID must be found in the Tawk.to dashboard (Administration > Chat Widget). Using "default" or any wrong value will silently fail -- the chat simply won't appear.

3. **Domain redirects break sitemaps if URLs don't match.** When `solisdigital.co.uk` redirects to `www.solisdigital.co.uk`, every URL in the sitemap, canonical tags, and Open Graph tags must use the `www` version. Google Search Console will flag mismatches and you'll get crawl errors.

4. **Single-file architecture is a feature, not a limitation.** Having the entire website in one HTML file means no build tools, no dependency issues, instant deploys, and easy editing. For a landing page / agency site, this is the right approach.

5. **Supabase anon key is safe to expose in client-side code.** It's designed for this. Row Level Security (RLS) policies control what the anon key can do. The key allows reads and inserts to the tables we need.

### Business Lessons

6. **Don't use fake stats/testimonials before having real clients.** The site originally had fake testimonials and inflated numbers. These were replaced with honest "What You Get" feature cards instead. Trust badges like "4.9/5 on Google" should only be used once you have real reviews.

7. **Email warmup takes ~2 weeks.** You cannot send cold emails on day one. Instantly.ai needs to warm up the email account first by gradually increasing sending volume. Sending before warmup = spam folder.

8. **Lead scoring: worse website = better lead.** This seems counterintuitive but makes perfect sense. A business with a terrible website that ranks badly on Google is the most likely to want help. A business with a great website doesn't need you.

9. **Lead with the audit, not the pitch.** The free audit is the entire sales strategy. Every touchpoint (website, emails, cold calls) leads with data about their specific problems. This positions you as a consultant, not a salesperson.

10. **The ask is always the free call, never the sale.** On cold calls and emails, never try to close the deal directly. The goal is always to book a 15-minute strategy call. The close happens on that call.

---

## 16. REVENUE PROJECTIONS

### Package Economics

| Package | One-Off | Monthly | Annual Value (per client) |
|---------|---------|---------|--------------------------|
| Starter | 497 | 0 | 497 |
| Growth | 997 | 197 | 997 + 2,364 = 3,361 |
| Enterprise | 2,497 | 397 | 2,497 + 4,764 = 7,261 |

### Target: 6,000/month

**Starter-only route:**
- 6,000 / 497 = ~12 clients/month needed
- Not sustainable as a primary strategy (too many one-offs with no recurring)

**Growth-focused route:**
- 4 Growth clients = 3,988 one-off + 788/mo recurring
- After 3 months of 4 clients/month: 11,964 one-off + 2,364/mo MRR

**Enterprise-focused route:**
- 2 Enterprise clients = 4,994 one-off + 794/mo recurring
- Harder to close but much higher value

**Recommended mix strategy:**
- 2 Growth + 1 Enterprise per month
- Month 1: 2(997) + 2,497 = 4,491 one-off + 2(197) + 397 = 791/mo MRR
- Month 2: another 4,491 + MRR grows to 1,582/mo
- Month 3: another 4,491 + MRR grows to 2,373/mo
- By month 3: 4,491 + 2,373 = 6,864/month (target hit)
- MRR compounds: by month 6 you're at ~4,746/month recurring alone

### Key Metrics to Track
- **Lead-to-call conversion rate:** What % of leads reached become strategy calls
- **Call-to-close rate:** What % of strategy calls become paying clients
- **Average deal size:** Weighted average across packages
- **MRR growth:** Monthly recurring revenue trend
- **Churn rate:** How many clients cancel monthly retainers

---

## 17. STEP-BY-STEP RECREATION GUIDE

If you needed to rebuild the entire Solis Digital agency from scratch, follow these steps in order.

### Phase 1: Foundation (Day 1-2)

**Step 1: Register the domain**
- Go to a domain registrar (Namecheap, GoDaddy, etc.)
- Register `solisdigital.co.uk` (or your chosen domain)
- Set up email: `info@solisdigital.co.uk` (use Google Workspace, Zoho, or Outlook)

**Step 2: Set up GitHub repository**
- Create a GitHub organization (e.g., `SolisDigitalProject`)
- Create a repository: `solis-digital-website`
- Initialize with a basic `index.html`

**Step 3: Set up Vercel**
- Sign up at vercel.com
- Import the GitHub repository
- Configure the domain:
  - Add `www.solisdigital.co.uk` as the primary domain
  - Add `solisdigital.co.uk` with redirect to www
- Vercel will handle SSL automatically
- Every push to `main` branch auto-deploys

**Step 4: Set up Supabase**
- Create a Supabase project
- Note your project ID, REST URL, and anon key
- Create the following tables:

```sql
-- Leads table
CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text,
  website text,
  email text,
  phone text,
  industry text,
  location text,
  lead_score integer,
  speed_score integer,
  seo_score integer,
  mobile_score integer,
  audit_summary text,
  revenue_loss_estimate numeric,
  status text DEFAULT 'New',
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Inquiries table
CREATE TABLE inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text,
  name text,
  business_url text,
  message text,
  source text,
  created_at timestamp with time zone DEFAULT now()
);

-- Outreach table
CREATE TABLE outreach (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  status text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Clients table
CREATE TABLE clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  business_name text,
  package_type text,
  one_off_revenue numeric,
  monthly_retainer numeric,
  created_at timestamp with time zone DEFAULT now()
);
```

- Set up Row Level Security (RLS):
  - Allow anon key to SELECT from all tables
  - Allow anon key to INSERT into `inquiries` (for website form)
  - Allow anon key to SELECT and UPDATE `leads` (for dashboard)
  - Restrict DELETE operations

### Phase 2: Website Build (Day 2-4)

**Step 5: Build the main website**
- Create `index.html` as a single file with embedded CSS and JS
- Follow the structure in [Section 3](#3-website-structure)
- Import Google Fonts: DM Sans + Fraunces
- Use the exact color palette from [Section 14](#14-branding)
- Build all sections in order: nav, hero, trust badges, counters, process, services, calculator, what you get, pricing, FAQ, team, contact form, footer
- Implement scroll-reveal animations with IntersectionObserver
- Implement counter animation on scroll
- Build the revenue loss calculator with industry benchmarks
- Build the 3-step audit form with PageSpeed integration
- Wire up form submission to Supabase

**Step 6: Get a PageSpeed Insights API key**
- Go to Google Cloud Console
- Create a project
- Enable the PageSpeed Insights API
- Create an API key
- Add it to your scanner code

**Step 7: Set up Google Analytics**
- Create a Google Analytics 4 property
- Get the measurement ID (format: G-XXXXXXXX)
- Add the gtag.js snippet to `index.html`
- Set up custom events (audit_request)

**Step 8: Set up Google Search Console**
- Add your site to Search Console
- Verify via meta tag (add to `<head>`)
- Submit your sitemap.xml

**Step 9: Create sitemap.xml and robots.txt**
- Sitemap: list all public pages with `www` URLs
- Robots.txt: allow all, disallow dashboard and scripts, reference sitemap

**Step 10: Set up Tawk.to**
- Create a Tawk.to account
- Add your website as a property
- Customize widget colors (gold header: #d4a24e)
- Enable AI Assist
- Configure the AI bot with your website content
- Add custom FAQs about pricing and booking
- Find your actual widget ID (not "default"!) in the dashboard
- Add the embed script to `index.html`

### Phase 3: Dashboard (Day 4-5)

**Step 11: Build the Command Centre dashboard**
- Create `dashboard.html`
- Add `noindex, nofollow` meta tag
- Build password gate (sessionStorage-based)
- Build KPI cards that pull from Supabase
- Build leads table with filters and status badges
- Build pipeline funnel visualization
- Build call list panel with click-to-dial and mark-called
- Build outreach stats and revenue panels
- Add CSV export functionality (call list + email list)
- Add auto-refresh (setInterval, 60 seconds)
- Add "Run Bulk Audit" button

### Phase 4: Lead Generation Setup (Day 5-7)

**Step 12: Set up Apify**
- Create an Apify account
- Find/create actors for:
  - Google Maps scraping (by industry + location)
  - Business directory scraping
- Configure to output: business_name, website, phone, location, industry

**Step 13: Set up Hunter.io**
- Create a Hunter.io account
- Use the Domain Search API to find emails for scraped websites
- Verify emails before adding to outreach list

**Step 14: Set up Instantly.ai**
- Create an Instantly account
- Connect your email account (info@solisdigital.co.uk)
- START EMAIL WARMUP IMMEDIATELY (takes ~2 weeks)
- Create a 5-email cold outreach campaign with personalization variables
- Do not activate until warmup is complete

### Phase 5: Automation (Day 7-10)

**Step 15: Set up Make.com scenarios**

Create 5 scenarios:

1. **Lead Ingestion:** Apify webhook/schedule --> Parse data --> Insert into Supabase `leads` table
2. **AI Audit:** Scheduled (every 15 min) --> Query Supabase for New leads with websites --> Call PageSpeed API --> Calculate lead score --> Update Supabase
3. **Outreach Export:** Manual trigger --> Query top audited leads with email --> Format and send to Instantly campaign
4. **Calendly Webhook:** Calendly booking event --> Find lead in Supabase by email --> Update status to "Call Booked"
5. **Stripe Webhook:** Payment received --> Create client record in Supabase --> Update lead status to "Client Won"

**Step 16: Set up Calendly**
- Create a Calendly account
- Create a 15-minute "Free Strategy Call" event type
- URL: https://calendly.com/solisdigital-info/solis-digital-free-strategy-call
- Set up webhook to Make.com for new bookings

**Step 17: Set up Stripe**
- Create a Stripe account
- Create payment links for each package:
  - Starter: 497 one-off
  - Growth: 997 one-off + 197/month subscription
  - Enterprise: 2,497 one-off + 397/month subscription
- Set up webhook to Make.com for successful payments

### Phase 6: Cold Outreach Preparation (Day 10-14)

**Step 18: Create cold call scripts**
- Write all 5 scripts (see Section 9 or `templates/cold-call-scripts.md`)
- Practice them until they sound natural
- Print quick reference cards with package info and key talking points

**Step 19: Run initial lead scraping**
- Run Apify actors for your target industries and locations
- Process through Hunter.io for email finding
- Import into Supabase
- Let the Make.com audit scenario process them

### Phase 7: Go Live (Day 14+)

**Step 20: Activate email outreach**
- Confirm email warmup is complete (~2 weeks)
- Export top leads from dashboard (CSV)
- Import into Instantly campaign
- Activate the campaign
- Monitor replies daily

**Step 21: Start cold calling**
- Export call list from dashboard
- Start with highest-scored leads (worst websites = best prospects)
- Use the scripts from `templates/cold-call-scripts.md`
- Mark leads as called in the dashboard
- Follow up on "send me an email" responses within 2 days

**Step 22: Close deals**
- Conduct 15-minute strategy calls via Calendly
- Walk through their specific audit report
- Present package recommendations based on their needs
- Send Stripe payment link after agreement
- Payment triggers automatic onboarding via Make.com

### Phase 8: Iterate and Scale

**Step 23: Monitor and optimize**
- Check dashboard daily for new inquiries and lead scores
- Track conversion rates at each pipeline stage
- A/B test email subject lines in Instantly
- Refine cold call scripts based on what objections come up
- Add new industries and locations to Apify scraping
- Build real testimonials and case studies as you win clients
- Consider adding paid ads (Google, Meta) once organic pipeline is proven

---

## APPENDIX: QUICK REFERENCE

### All Credentials in One Place

| Service | Key/ID | Value |
|---------|--------|-------|
| Supabase Project ID | -- | `zqcpktpnfikmshqeqxlg` |
| Supabase REST URL | -- | `https://zqcpktpnfikmshqeqxlg.supabase.co/rest/v1` |
| Supabase Anon Key | -- | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE` |
| PageSpeed API Key | -- | `AIzaSyCCd15XjzZE5aoAJ8zJjCLkkW9evdkuHj0` |
| Google Analytics | Measurement ID | `G-V7ZVJZKH2W` |
| Google Site Verification | Meta tag | `O49_v9SSeVPfXSlv1KUO9vXbb1RF1W_LeFJtQbUxn3o` |
| Tawk.to Property ID | -- | `69b9a21c7f0aa71c36e441e0` |
| Tawk.to Widget ID | -- | `1jjui2gh9` |
| Tawk.to JS API Key | -- | `6c83f113a6a4b298ee3bbaa552cee22a6df779e6` |
| Dashboard Password | -- | `Weetabix` |
| Calendly URL | -- | `https://calendly.com/solisdigital-info/solis-digital-free-strategy-call` |
| GitHub Repo | -- | `SolisDigitalProject/solis-digital-website` |

### File Locations

| File | Purpose |
|------|---------|
| `index.html` | Main website (all sections, CSS, JS in one file) |
| `dashboard.html` | Command Centre dashboard |
| `sitemap.xml` | XML sitemap for search engines |
| `robots.txt` | Search engine crawl directives |
| `templates/cold-call-scripts.md` | All 5 cold call scripts with objection handling |
| `AGENCY-BLUEPRINT.md` | This file -- the complete agency blueprint |

---

*Last updated: 2026-03-18*
*This document is the complete blueprint for Solis Digital. Guard it carefully -- it contains all credentials and operational details.*
