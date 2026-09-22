# Swahili Dishes — Lead Generation System Documentation

## Overview

The Swahili Dishes app includes a comprehensive CRM/lead generation system built on InsForge (PostgreSQL backend). Leads are captured from multiple touchpoints across the website, scored, tracked through a lifecycle, and managed via an admin dashboard.

---

## Lead Capture Entry Points

### 1. **Newsletter / Email Capture** (`/api/crm/capture`)
- **Trigger**: User submits email (footer newsletter, popups, checkout opt-in)
- **Data**: email, name, phone, whatsapp, source, consent flags
- **Deduplication**: By email → updates existing lead
- **Events**: `LEAD_CAPTURED` tracked, automation triggered

### 2. **Catering Inquiry Form** (`/api/crm/catering`)
- **Trigger**: Customer submits catering request (corporate events, weddings, parties)
- **Data**: name, phone, email, guest count, event type/date, location, budget, requirements
- **Creates**: Lead + Opportunity + Automation workflow
- **Events**: `CATERING_REQUEST` with metadata (guest_count, event_type, budget)
- **Opportunity**: Auto-created with estimated value (budget or guest_count × 1500 KES)

### 3. **Behavioral Event Tracking** (`/api/crm/event`)
- **Trigger**: Client-side events sent from browser
- **Event Types**: 30+ types including:
  - `PAGE_VIEW`, `PRODUCT_VIEW`, `RECIPE_VIEW`, `VIDEO_VIEW`
  - `SEARCH`, `AI_CHAT`, `AI_RECOMMENDATION`, `RECIPE_DOWNLOAD`
  - `ADD_TO_CART`, `CHECKOUT_STARTED`, `CHECKOUT_ABANDONED`, `PURCHASE_COMPLETED`
  - `WHATSAPP_CLICK`, `PHONE_CLICK`, `EMAIL_CLICK`
  - `NEWSLETTER_SIGNUP`, `QR_SCAN`, `TV_SESSION`, `TV_TO_PHONE_CONNECTION`
- **Identity Resolution**: By user_id (auth) → anonymous_id (cookie) → new lead
- **Auto-creates** lead if none exists
- **Automation**: Processes `processEvent()` for matching rules

### 4. **WhatsApp / Phone Click Tracking**
- Frontend click handlers call `/api/crm/event` with `WHATSAPP_CLICK` / `PHONE_CLICK`
- Links intent to contact preferences

### 5. **AI Chat Assistant**
- Conversations tracked via `AI_CHAT` / `AI_RECOMMENDATION` events
- Product clicks from AI recommendations tracked as `AI_RECOMMENDATION` + `PRODUCT_VIEW_MULTI`

### 6. **Recipe Downloads / Content Engagement**
- `RECIPE_DOWNLOAD`, `RECIPE_VIEW` events
- Links content consumption to lead profile

### 7. **QR Code / TV Integration**
- `QR_SCAN` events from physical QR codes (tables, flyers)
- `TV_SESSION` / `TV_TO_PHONE_CONNECTION` for connected TV app

### 8. **Checkout / Purchase**
- `CHECKOUT_STARTED`, `CHECKOUT_ABANDONED`, `PURCHASE_COMPLETED`
- Links orders to lead → updates `total_orders`, `total_spent`, converts lead to `CONVERTED`

---

## Lead Data Model (`lib/crm/types.ts`)

### Core Identity
- `id` (UUID), `user_id` (auth user), `anonymous_id` (cookie)
- `email`, `phone`, `whatsapp`, `name`

### Source Attribution
- `source`: `DIRECT | GOOGLE | INSTAGRAM | FACEBOOK | TIKTOK | WHATSAPP | YOUTUBE | TV | QR_CODE | REFERRAL | EMAIL | CAMPAIGN`
- `source_campaign`, `utm_source/medium/campaign/content/term`

### Scoring & Temperature
- `lead_score` (numeric, starts at 3 for captured leads, 0 for behavioral)
- `lead_temperature`: `COLD | WARM | HOT`
- `status`: `NEW | CONTACTED | QUALIFIED | INTERESTED | CONVERTED | LOST`

### Intent & Preferences
- `intent`: `BROWSE | RECIPE | PURCHASE | CATERING | RESELLER | PARTNERSHIP`
- `preferred_contact`: `email | phone | whatsapp | sms`
- `interests[]`, `preferred_foods[]`
- `viewed_products[]`, `viewed_recipes[]`, `watched_videos[]`

### Catering Fields
- `catering_guest_count`, `catering_event_type`, `catering_event_date`
- `catering_budget`, `catering_location`

### Consent
- `consent_marketing`, `consent_whatsapp`, `consent_email`

### Commercial
- `cart_value`, `total_orders`, `total_spent`
- `assigned_admin` (staff user ID)

---

## Lead Scoring & Automation

### Event-Based Scoring (`lib/crm/scoring.ts` + `automation.ts`)
Each `EventType` has a score delta configured in `lead_scoring_rules` table:
- `PAGE_VIEW`: +1
- `PRODUCT_VIEW`: +2
- `ADD_TO_CART`: +5
- `CHECKOUT_STARTED`: +10
- `PURCHASE_COMPLETED`: +25
- `CATERING_REQUEST`: +15
- `WHATSAPP_CLICK`: +8
- `NEWSLETTER_SIGNUP`: +5

### Automation Rules (`automation_rules` table)
- **Trigger**: Any `EventType`
- **Conditions**: e.g., `min_cart_value`, `lead_temperature`, `lead_has_whatsapp_consent`
- **Actions**:
  - `NOTIFY_ADMIN` (logs for admin dashboard)
  - `UPDATE_LEAD` (change status, temperature, score)
  - `CREATE_OPPORTUNITY` (for high-value leads)
  - `SEND_WHATSAPP` / `SEND_EMAIL` (queues message in `message_logs`)
  - `UPDATE_SCORE`, `ADD_NOTE`

### Example Automation Flows
1. **Abandoned Cart** (`CHECKOUT_ABANDONED`) → WhatsApp reminder (if consent) + update lead to `INTERESTED`
2. **High-Value Catering** (`CATERING_REQUEST` + guest_count > 50) → Notify admin + create opportunity
3. **Repeated Recipe Views** (`RECIPE_VIEW_MULTI`) → Email recipe collection + update temperature to `WARM`
4. **WhatsApp Opt-in** → Set `preferred_contact=whatsapp`, `consent_whatsapp=true`

---

## Admin Dashboard (`/admin/leads`)

### Dashboard Stats
- Total / New / Hot / Warm / Qualified / Converted leads
- Conversion rate, source breakdown, temperature breakdown

### Lead Management
- Filter by status, temperature, source, search
- Lead detail view with timeline (events, score changes)
- Actions: Update status, add notes, assign to staff

### Opportunity Pipeline
- Stages: `PROSPECTING → QUALIFICATION → PROPOSAL → NEGOTIATION → CLOSED_WON/LOST`
- Value tracking, probability, expected close date

---

## Data Flow Summary

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  /api/crm/event  │────▶│  InsForge DB    │
│  (clicks, views,│     │  /api/crm/capture│     │  leads          │
│  forms, chats)  │     │  /api/crm/catering│    │  lead_events    │
└─────────────────┘     └──────────────────┘     │  opportunities  │
                                                  │  automation_runs│
                                                  └────────┬────────┘
                                                           │
                                                  ┌────────▼────────┐
                                                  │  Automation     │
                                                  │  (rules +      │
                                                  │   actions)      │
                                                  └────────┬────────┘
                                                           │
                                                  ┌────────▼────────┐
                                                  │  Admin Dashboard│
                                                  │  /admin/leads   │
                                                  └─────────────────┘
```

---

## Key Implementation Files

| File | Purpose |
|------|---------|
| `lib/crm/leads.ts` | Create, update, query leads |
| `lib/crm/events.ts` | Track behavioral events |
| `lib/crm/catering.ts` | Catering inquiry → lead + opportunity |
| `lib/crm/automation.ts` | Rule engine, action execution |
| `lib/crm/scoring.ts` | Score calculation per event |
| `lib/crm/types.ts` | All TypeScript interfaces |
| `app/api/crm/capture/route.ts` | Newsletter/form capture endpoint |
| `app/api/crm/catering/route.ts` | Catering form endpoint |
| `app/api/crm/event/route.ts` | Behavioral event ingestion |
| `app/admin/crm-actions.ts` | Server actions for admin UI |
| `app/admin/leads/page.tsx` | Admin leads dashboard |

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `INSFORGE_URL` | Backend API base |
| `INSFORGE_API_KEY` | Admin write access (server) |
| `NEXT_PUBLIC_INSFORGE_URL` | Browser client read access |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Browser client anon access |
| `WHATSAPP_API_KEY` | WhatsApp Business API (for SEND_WHATSAPP automation) |
| `EMAIL_API_KEY` | Email provider (for SEND_EMAIL automation) |

---

## Testing Lead Generation

1. **Newsletter**: POST `/api/crm/capture` with `{email: "test@example.com", source: "TEST"}`
2. **Catering**: POST `/api/crm/catering` with required fields
3. **Event**: POST `/api/crm/event` with `{event_type: "PRODUCT_VIEW", anonymous_id: "abc123", metadata: {product_id: "..."}}`
4. **Check Admin**: Visit `/admin/leads` → should see new lead with events

---

## Future Enhancements

- **Lead Scoring ML**: Train model on converted vs lost leads
- **Segmentation API**: Export segments for email/WhatsApp campaigns
- **Webhook Integrations**: HubSpot, Salesforce, Pipedrive sync
- **Real-time Notifications**: WebSocket/push to admin on HOT leads
- **A/B Testing**: Form variants, lead magnet performance