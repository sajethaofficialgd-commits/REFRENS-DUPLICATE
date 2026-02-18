# Refrens-Style Invoice Generator — Complete Feature Specification

> **Scope:** Invoice feature only (no payroll, HR, or procurement modules).
> **Reference:** [https://www.refrens.com](https://www.refrens.com)
> **Target Users:** Indian freelancers, consultants, and small businesses (GST-registered and unregistered).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack](#2-tech-stack)
3. [Color Palette & Typography](#3-color-palette--typography)
4. [Page Layout & Navigation](#4-page-layout--navigation)
5. [Dashboard](#5-dashboard)
6. [Invoice Creation — Full Flow](#6-invoice-creation--full-flow)
   - 6.1 [Invoice Header Fields](#61-invoice-header-fields)
   - 6.2 [Business / Seller Fields](#62-business--seller-fields)
   - 6.3 [Client / Customer Fields](#63-client--customer-fields)
   - 6.4 [Line Items Table](#64-line-items-table)
   - 6.5 [Tax Calculation Engine](#65-tax-calculation-engine)
   - 6.6 [Additional Charges & Discounts](#66-additional-charges--discounts)
   - 6.7 [Totals Summary Block](#67-totals-summary-block)
   - 6.8 [Payment Details Section](#68-payment-details-section)
   - 6.9 [Notes & Terms](#69-notes--terms)
7. [Invoice Templates & Customization](#7-invoice-templates--customization)
8. [Live Preview Panel](#8-live-preview-panel)
9. [PDF Export & Sharing](#9-pdf-export--sharing)
10. [Invoice Status Lifecycle](#10-invoice-status-lifecycle)
11. [Invoice List View](#11-invoice-list-view)
12. [Recurring Invoices](#12-recurring-invoices)
13. [Quick Document Conversions](#13-quick-document-conversions)
14. [Client Management](#14-client-management)
15. [Settings](#15-settings)
16. [Keyboard Shortcuts](#16-keyboard-shortcuts)
17. [Data Persistence & State Management](#17-data-persistence--state-management)
18. [UI/UX Guidelines](#18-uiux-guidelines)
19. [Verification Checklist](#19-verification-checklist)

---

## 1. Product Overview

| Item | Detail |
|------|--------|
| Product Name | Refrens-style Invoice Generator |
| Primary Market | India (GST-compliant) |
| Secondary Market | Global (multi-currency) |
| Deployment | Static site (browser-only) or with lightweight backend |
| Authentication | Optional (localStorage for offline, Firebase Auth for cloud) |
| Key Differentiator | GST auto-calculation (CGST/SGST/IGST), 250+ templates, UPI QR, WhatsApp share |

---

## 2. Tech Stack

### Recommended (no-backend)
```
Frontend:    HTML5, CSS3, Vanilla JS (or React/Vue)
PDF Export:  html2pdf.js or jsPDF
Storage:     localStorage / IndexedDB
Fonts:       Google Fonts (Inter, DM Sans, Playfair Display)
Icons:       Lucide Icons or Heroicons
QR Code:     qrcode.js
```

### Optional Backend (for cloud sync & email)
```
Backend:     Node.js + Express  /  Firebase Functions
Database:    Firestore  /  PostgreSQL
Email:       Nodemailer  /  SendGrid
Auth:        Firebase Auth  /  Supabase Auth
Hosting:     Vercel / Netlify / Firebase Hosting
```

---

## 3. Color Palette & Typography

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#7c3aed` | Buttons, active nav, links |
| `--primary-dark` | `#5b21b6` | Hover states |
| `--accent` | `#ec4899` | Highlights, badges |
| `--success` | `#16a34a` | Paid status, positive values |
| `--warning` | `#d97706` | Due soon, draft status |
| `--danger` | `#dc2626` | Overdue, delete actions |
| `--info` | `#0ea5e9` | Sent/Viewed status |
| `--bg-light` | `#f8f7ff` | Page background (light mode) |
| `--bg-dark` | `#0e0126` | Page background (dark mode) |
| `--surface` | `#ffffff` | Card/panel background |
| `--border` | `#e5e7eb` | Dividers, input borders |
| `--text-primary` | `#111827` | Main body text |
| `--text-muted` | `#6b7280` | Labels, secondary text |

> **Magic Color** — When a business logo is uploaded, automatically extract its dominant color and apply it as the invoice accent color.

### Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| App UI | Inter | 400 / 600 | 13–15px |
| Invoice body | DM Sans | 400 / 500 | 12–14px |
| Invoice headings | Playfair Display | 700 | 20–28px |
| Monospace (amounts) | JetBrains Mono | 400 | 13px |

---

## 4. Page Layout & Navigation

### Overall Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER BAR (64px)                                               │
│  [Logo]  [Org Switcher ▾]  [Search]  [Theme] [+ New] [Profile]  │
├──────────┬───────────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT AREA                                    │
│ (220px)  │                                                       │
│          │  (Dashboard / Invoice Editor / Invoice List / etc.)   │
│          │                                                       │
│          │                                                       │
└──────────┴───────────────────────────────────────────────────────┘
```

### Sidebar Navigation Items

```
📊  Dashboard
─── INVOICING ───────────────
🧾  Invoices
📄  Quotations
📋  Proforma Invoices
🛒  Sales Orders
🏷️  Credit / Debit Notes
📦  Delivery Challans
─── CLIENTS ─────────────────
👥  Clients
─── PAYMENTS ────────────────
💰  Payment Receipts
─── REPORTS ─────────────────
📈  GST Reports
    ├── GSTR-1
    └── GSTR-2
📑  TDS Reports
─── SETTINGS ────────────────
⚙️  Business Settings
🎨  Invoice Settings
```

---

## 5. Dashboard

### Metric Cards (top row)

| Card | Value | Color |
|------|-------|-------|
| Total Invoices | Count | Neutral |
| Total Billed | Sum of all invoice amounts | Blue |
| Balance Due | Unpaid + Overdue | Orange |
| Overdue | Past due date, unpaid | Red |
| Paid This Month | Received payments | Green |

### Invoice Summary Table

Columns:
```
☐  Invoice #  |  Client Name  |  Invoice Date  |  Due Date  |  Amount  |  Status  |  Actions
```

Actions per row: `View` · `Edit` · `Download PDF` · `Send` · `Mark Paid` · `Duplicate` · `Delete`

### Filters & Search

- **Search:** by invoice number, client name, amount
- **Status filter:** All / Draft / Sent / Viewed / Paid / Overdue / Cancelled
- **Client filter:** dropdown from client list
- **Date range:** Invoice Date or Due Date
- **Amount range:** Min / Max input

### Bulk Actions

Select multiple invoices → bulk action toolbar appears:
- Send selected
- Download selected as ZIP
- Mark selected as Paid
- Delete selected

### Export

- **Export CSV** button → downloads all filtered invoices as `.csv`

---

## 6. Invoice Creation — Full Flow

The invoice editor is a **two-panel layout**:
- **Left panel (60%):** Form inputs
- **Right panel (40%):** Live preview (updates in real time)

---

### 6.1 Invoice Header Fields

| Field | Type | Notes |
|-------|------|-------|
| Invoice Number | Text | Auto-generated; editable. Format: `INV-001`. Supports prefix/suffix config |
| Invoice Date | Date picker | Default: today |
| Due Date | Date picker | Default: invoice date + payment terms days |
| PO Number | Text | Optional purchase order reference |
| Place of Supply | Dropdown | Indian state selector (critical for GST type) |
| Invoice Type | Dropdown | Tax Invoice / Bill of Supply / Export Invoice |
| Currency | Dropdown | INR (default), USD, EUR, GBP, AED, SGD, etc. |

---

### 6.2 Business / Seller Fields

| Field | Type | Notes |
|-------|------|-------|
| Business Name | Text | Auto-filled from business profile |
| Logo | Image upload | PNG/JPG, max 2MB; position: left/center/right |
| Address Line 1 | Text | |
| Address Line 2 | Text | |
| City | Text | |
| State | Dropdown | Indian states |
| PIN Code | Text | 6-digit |
| Country | Dropdown | Default: India |
| GSTIN | Text | 15-char GST number; validates format |
| PAN | Text | 10-char; shown on invoice if GSTIN not available |
| Email | Text | Optional display on invoice |
| Phone | Text | Optional display on invoice |
| Digital Signature | Image upload | PNG with transparent bg; shown at bottom |

**Bank Account Details** (shown in Payment section on invoice):

| Field | Notes |
|-------|-------|
| Bank Name | |
| Account Holder Name | |
| Account Number | Masked in UI |
| Account Type | Savings / Current / Overdraft |
| IFSC Code | Indian branch code |
| SWIFT Code | For international payments |
| IBAN | For European payments |
| UPI ID | e.g., `business@okaxis` |

---

### 6.3 Client / Customer Fields

| Field | Type | Notes |
|-------|------|-------|
| Client Name | Text + Search | Search from saved client list; or type new |
| Client Type | Toggle | Individual / Company |
| Email | Text | Checkbox: "Show on invoice" |
| Phone | Text | Checkbox: "Show on invoice" |
| Billing Address | Form group | Street, City, State, Country, PIN |
| GSTIN | Text | B2B invoices; validates 15-char format |
| PAN | Text | For TDS-applicable invoices |
| Tax Treatment | Dropdown | Registered / Unregistered / Consumer / Overseas / SEZ |
| Save as client | Checkbox | Auto-saves to client database |

---

### 6.4 Line Items Table

Each row represents one product or service:

| Column | Type | Notes |
|--------|------|-------|
| # | Auto | Row number |
| Description | Text (multiline) | Product/service name and details |
| HSN Code | Text + autocomplete | For goods (Harmonized System of Nomenclature) |
| SAC Code | Text + autocomplete | For services (Service Accounting Code) |
| Qty | Number | Decimal supported |
| Unit | Dropdown | Pcs / Hrs / Kg / L / Sq.ft / Days / Months / custom |
| Rate (₹) | Number | Price per unit |
| Discount | Number | Per-item; toggle between % or ₹ |
| Tax Rate | Dropdown | 0% / 5% / 12% / 18% / 28% / Custom % |
| Amount (₹) | Auto-calculated | `(Qty × Rate) − Discount` |

**Table Controls:**
- `+ Add Item` button → appends new empty row
- Drag handle (⠿) on each row for drag-and-drop reorder
- Delete (🗑) icon to remove row
- `+ Add Group` → create a labeled group of line items (e.g., "Design Services", "Development")

**HSN/SAC Autocomplete:**
- Type code or keyword → suggest matching codes from embedded library
- Selecting a code auto-fills standard tax rate

---

### 6.5 Tax Calculation Engine

**GST Logic (India):**

```
Place of Supply === Business State  →  CGST + SGST (split equally)
Place of Supply !== Business State  →  IGST (single tax)
Place of Supply = Export / SEZ      →  0% (Zero-rated / LUT)
```

**Tax Types Supported:**

| Tax | Rate Options | Applies When |
|-----|-------------|--------------|
| CGST | 0 / 2.5 / 6 / 9 / 14% | Intra-state supply |
| SGST | 0 / 2.5 / 6 / 9 / 14% | Intra-state supply |
| IGST | 0 / 5 / 12 / 18 / 28% | Inter-state supply |
| CESS | Custom % | Applicable goods/services |
| TDS | 1 / 2 / 5 / 10% or custom | Deductible at source |

**Tax Settings Panel** (above line items table):
- Toggle: "Tax Inclusive" (price includes tax) vs "Tax Exclusive" (tax added on top)
- Toggle: Show/Hide HSN/SAC column
- Toggle: Show/Hide Discount column
- Configure Tax → add multiple tax rates to the invoice

**Tax Breakdown (below totals):**

```
CGST  9%    ₹   810.00
SGST  9%    ₹   810.00
────────────────────────
Total Tax   ₹ 1,620.00
```

---

### 6.6 Additional Charges & Discounts

**Invoice-Level Discount** (applied to subtotal):
- Dropdown: Percentage (%) or Fixed Amount (₹)
- Label field: customizable (e.g., "Festival Discount", "Early Payment Discount")

**Additional Charges** (added after subtotal, before tax):
- Add multiple charge lines with label + amount
- Common labels: Shipping, Packaging, Handling, Installation
- Each charge can be toggled as taxable or non-taxable

---

### 6.7 Totals Summary Block

```
Subtotal                          ₹  9,000.00
(–) Discount  10%                 ₹    900.00
(+) Shipping                      ₹    200.00
──────────────────────────────────────────────
Taxable Amount                    ₹  8,300.00
CGST  9%                          ₹    747.00
SGST  9%                          ₹    747.00
──────────────────────────────────────────────
Grand Total                       ₹  9,794.00
Amount in Words:  Nine Thousand Seven Hundred Ninety-Four Rupees Only
──────────────────────────────────────────────
(–) TDS  2%                       ₹    185.88
──────────────────────────────────────────────
Net Payable                       ₹  9,608.12
```

**Round-off toggle:** Round Grand Total to nearest ₹1 and display difference.

---

### 6.8 Payment Details Section

| Field | Type |
|-------|------|
| Payment Terms | Dropdown: Due on Receipt / Net 7 / Net 15 / Net 30 / Net 60 / Custom |
| Payment Method | Dropdown: Bank Transfer / UPI / Cash / Cheque / Card / Online |
| Bank Details to Show | Multi-select from saved bank accounts |
| UPI QR Code | Toggle to show/hide; auto-generated from UPI ID |
| Payment Link | Text input: Razorpay / Stripe / PayPal / Custom URL |
| Advance Received | Number: record partial payment |
| Balance Due | Auto-calculated: Grand Total − Advance |

---

### 6.9 Notes & Terms

| Field | Type | Notes |
|-------|------|-------|
| Customer Notes | Textarea | Shown on invoice; e.g., "Thank you for your business!" |
| Terms & Conditions | Textarea | Legal/payment terms; supports saved templates |
| Internal Notes | Textarea | NOT shown on invoice; for internal reference only |
| Custom Footer | Text | Short text in invoice footer |

---

## 7. Invoice Templates & Customization

### Template Gallery

- **250+ pre-designed templates** browsable in a modal grid
- Categories: Classic, Minimal, Bold, Modern, Elegant, Colorful, Indian, International

### Per-Template Customization

| Option | Detail |
|--------|--------|
| Primary Color | 240+ color swatches; hex input |
| Magic Color | Auto-extract dominant color from uploaded logo |
| Font Family | DM Sans / Inter / Playfair / Lato / Roboto / custom |
| Logo Position | Left / Center / Right |
| Logo Size | Small / Medium / Large |
| Show/Hide Fields | Toggle: GSTIN, PAN, Phone, Email, HSN, Discount, Signature, etc. |
| Header Layout | Logo + Name side by side / stacked / name only |
| Color Theme | Applied to: header bg, table header, borders, totals block |
| Watermark | None (default) / custom text watermark |
| Signature | Upload image; positioned bottom-right |
| Page Margins | Narrow / Normal / Wide |
| Paper Size | A4 / Letter / Legal |
| Orientation | Portrait (default) / Landscape |

---

## 8. Live Preview Panel

- Updates in **real time** as user fills the form (no save needed)
- Renders the invoice exactly as it will appear on PDF
- Zoom controls: 50% / 75% / 100% / Fit Width
- Scroll within preview for multi-page invoices
- "Open Full Preview" button → modal with full-screen preview
- Page break indicator for multi-page invoices

---

## 9. PDF Export & Sharing

### Download

| Option | Detail |
|--------|--------|
| Download PDF | Single-page or multi-page A4; high-quality vector rendering |
| Print | Opens browser print dialog with print-optimized styles |

### Sharing

| Channel | Detail |
|---------|--------|
| Email | Compose email modal with subject, body, CC; PDF attached automatically |
| WhatsApp | Generates WhatsApp Web link with pre-filled message and download link |
| Shareable Link | Unique read-only URL (e.g., `yourapp.com/inv/abc123`); no login needed for client |
| QR Code | QR of shareable link; downloadable as PNG |
| Copy Link | One-click clipboard copy |

### Tracking (requires backend)

- Log when client opens the shareable link → update invoice status to "Viewed"
- Email open tracking pixel
- Show timestamp of first open in invoice activity log

---

## 10. Invoice Status Lifecycle

```
[Draft] ──Send──▶ [Sent] ──Client Opens──▶ [Viewed]
                                                │
                                         ┌──────┴──────┐
                                      Payment        Due Date
                                      Received       Passed
                                         │               │
                                       [Paid]        [Overdue]
                                                         │
                                                      Payment
                                                      Received
                                                         │
                                                       [Paid]

Any state ──Cancel──▶ [Cancelled]
```

### Status Badge Colors

| Status | Color |
|--------|-------|
| Draft | Gray `#6b7280` |
| Sent | Blue `#3b82f6` |
| Viewed | Cyan `#06b6d4` |
| Paid | Green `#16a34a` |
| Overdue | Red `#dc2626` |
| Cancelled | Dark Gray `#374151` |

### Activity Timeline

Every invoice has an activity log panel:
```
● Invoice created                          Feb 18, 2026  10:00 AM
● Invoice sent to client@example.com       Feb 18, 2026  10:05 AM
● Invoice viewed by client                 Feb 19, 2026   9:30 AM
● Payment of ₹9,794 received               Feb 20, 2026   2:15 PM
● Invoice marked as Paid                   Feb 20, 2026   2:15 PM
```

---

## 11. Invoice List View

### Table Columns

```
☐  |  Invoice #  |  Client  |  Invoice Date  |  Due Date  |  Amount  |  Status  |  Actions
```

### Pagination

- 10 / 25 / 50 records per page (dropdown)
- Page navigation

### Sorting

- Click column header to sort ascending/descending

### Row Quick Actions

Hover on a row → inline action icons appear:
- 👁 View
- ✏️ Edit
- 📄 Duplicate
- ⬇️ Download PDF
- ✉️ Send
- ✅ Mark as Paid
- 🗑 Delete

---

## 12. Recurring Invoices

| Setting | Options |
|---------|---------|
| Frequency | Weekly / Bi-weekly / Monthly / Quarterly / Half-yearly / Yearly |
| Start Date | Date picker |
| End Condition | Never / After N occurrences / On specific date |
| Auto-send | Toggle: auto-email to client on generation |
| Client | Same as original invoice |

Recurring invoices appear in a separate **"Recurring"** tab in the invoice list.
Each generated invoice from a recurring schedule links back to the parent template.

---

## 13. Quick Document Conversions

One-click actions available from invoice view:

| Source | Convert To | Notes |
|--------|-----------|-------|
| Quotation | Invoice | Copies all fields; sets status to Draft |
| Invoice | Credit Note | Pre-fills negative line items |
| Invoice | Proforma Invoice | Duplicate with "Proforma" label |
| Invoice | Delivery Challan | Removes financial fields |
| Invoice | Debit Note | Pre-fills extra charge line items |

---

## 14. Client Management

### Client List View

Columns: `Name | Type | Email | Phone | GSTIN | Total Billed | Actions`

### Add / Edit Client

Full form with all fields from [Section 6.3](#63-client--customer-fields).

### Client Profile Page

- Contact details
- All invoices for this client (filterable)
- Total billed, balance due, overdue amounts
- Payment history
- Notes field (internal)

### Quick Add

From invoice editor → "Add New Client" link opens a minimal modal (Name + Email + GSTIN only); full details can be completed later.

---

## 15. Settings

### Business Settings

| Section | Fields |
|---------|--------|
| Business Profile | Name, Logo, Address, GSTIN, PAN, Email, Phone, Website |
| Multiple GSTINs | Add multiple GST registrations (e.g., different states) |
| Invoice Number Series | Prefix (e.g., `INV-`), Starting Number, Padding (e.g., `001`) |
| Financial Year | April–March (India default) / Jan–Dec / Custom |
| Default Currency | INR / USD / etc. |
| Default Payment Terms | Net 30 / custom |
| Bank Accounts | Add multiple; mark one as default |
| UPI ID | + QR code preview |
| Digital Signature | Upload image |
| Tax Configuration | Default tax rates, tax inclusive/exclusive default |

### Invoice Settings (Template Defaults)

| Setting | Options |
|---------|---------|
| Default Template | Select from gallery |
| Default Color | Color picker |
| Default Font | Font selector |
| Show/Hide Columns | HSN, SAC, Discount, Tax, Unit, etc. |
| Custom Fields | Add extra fields to client section or line items |
| Custom Labels | Rename field labels (e.g., "Invoice" → "Tax Invoice") |
| Saved T&Cs | Create and name multiple T&C templates |
| Thank You Message | Default message for all invoices |
| Footer Text | Shown at bottom of every invoice |

---

## 16. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save invoice |
| `Ctrl + Enter` | Save and send invoice |
| `Ctrl + P` | Open PDF preview |
| `Ctrl + D` | Duplicate invoice |
| `Ctrl + Z` | Undo last change |
| `Ctrl + Shift + Z` | Redo |
| `Tab` | Next field in form |
| `Enter` (in line items) | Add new line item row |
| `Delete` (selected row) | Remove line item |
| `Escape` | Close modal / cancel |

---

## 17. Data Persistence & State Management

### localStorage (browser-only build)

```js
// Storage key
const STORAGE_KEY = "refrens_invoice_v1"

// Data shape
{
  businesses: [...],       // org profiles
  clients: [...],          // client database
  invoices: [...],         // all invoices
  settings: {...},         // app settings
  templates: [...]         // custom template configs
}
```

- **Autosave:** Every 4 seconds while invoice editor is open
- **Undo/Redo:** 40-step history stack (deep copy of state)
- **Data Export:** Download all data as `.json` (backup)
- **Data Import:** Upload `.json` to restore

### Firebase (cloud build)

- `Firestore` collections: `businesses`, `clients`, `invoices`, `settings`
- `Firebase Auth` for user login
- `Firebase Storage` for logo and signature images
- Real-time sync across devices

---

## 18. UI/UX Guidelines

### Layout Rules

- **Editor:** Two-panel (60/40 split). Below 1024px → tabs (Form | Preview)
- **Sidebar:** Collapsible on ≤1280px screens
- **Mobile (≤768px):** Full-screen editor; bottom navigation bar
- **Card elevation:** `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` for cards; `0 4px 12px rgba(0,0,0,0.15)` for modals

### Interactive Feedback

- **Toast notifications** (bottom-right): Success (green), Error (red), Info (blue), Warning (yellow) — auto-dismiss 4s
- **Inline validation:** Show errors beneath each invalid field on blur
- **Loading states:** Skeleton loaders for lists; spinner for PDF generation
- **Autosave indicator:** "Saving…" → "Saved ✓" in editor header

### Accessibility

- All form fields have `<label>` elements
- Focus rings on interactive elements
- `aria-live` regions for toast notifications
- Color contrast ratio ≥ 4.5:1 for body text

### Dark Mode

- Toggle in top header (☀️ / 🌙)
- Persisted in `localStorage`
- CSS custom properties (variables) switch for dark theme

### Modals

Used for: Add Client, Template Gallery, Full Preview, Send Email, Confirm Delete, Bulk Upload

- Backdrop `rgba(0,0,0,0.5)`
- `Escape` key closes
- Focus trap inside modal while open

---

## 19. Verification Checklist

### Invoice Creation Flow

- [ ] Create new invoice from "+" button
- [ ] Fill in business details (pre-populated from settings)
- [ ] Select or add a new client
- [ ] Add 3+ line items with different tax rates
- [ ] Verify CGST+SGST appears for same-state, IGST for different-state
- [ ] Apply item-level discount on one row
- [ ] Apply invoice-level discount
- [ ] Add shipping charge
- [ ] Enable TDS — verify net payable is reduced
- [ ] Enable round-off — verify totals adjust
- [ ] Verify "Amount in Words" updates correctly
- [ ] Add bank details and UPI — verify QR code appears in preview

### Template & Preview

- [ ] Switch between 5+ templates — verify layout changes in preview
- [ ] Change primary color — verify color updates across invoice
- [ ] Upload logo — verify Magic Color extracts dominant color
- [ ] Toggle HSN/Discount columns — verify columns hide in preview
- [ ] Upload digital signature — verify it appears at bottom

### Export & Sharing

- [ ] Download PDF — verify all data renders correctly on A4
- [ ] Verify multi-page invoice breaks at correct position
- [ ] Copy shareable link — verify link opens read-only invoice view
- [ ] Test WhatsApp share button
- [ ] Test email send (if backend available)

### Status & Tracking

- [ ] Send invoice → status changes to "Sent"
- [ ] Open shareable link → status changes to "Viewed"
- [ ] Mark as Paid → status changes to "Paid"
- [ ] Verify activity timeline shows each event

### Dashboard & List

- [ ] Metric cards show correct totals
- [ ] Filter by "Overdue" — only past-due invoices shown
- [ ] Bulk select + bulk download works
- [ ] CSV export contains all expected columns

### Client Management

- [ ] Add new client from editor (quick add modal)
- [ ] Select existing client → fields auto-populate
- [ ] Edit client → changes reflect in future invoices
- [ ] Client profile shows invoice history and balance

### Recurring Invoices

- [ ] Create recurring invoice (monthly)
- [ ] Verify it appears in "Recurring" tab
- [ ] Simulate schedule trigger → new invoice generated

### Settings

- [ ] Change invoice number prefix → verify new invoices use new prefix
- [ ] Save T&C template → verify it appears in dropdown on editor
- [ ] Add second bank account → verify both appear in payment section

---

*Specification Version: 1.0*
*Last Updated: February 2026*
*Reference: [https://www.refrens.com](https://www.refrens.com)*
