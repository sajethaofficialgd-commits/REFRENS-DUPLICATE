/* ============================================================
   REFRENS-STYLE INVOICE GENERATOR — script.js
   Full GST Engine · CGST/SGST/IGST · HSN/SAC · TDS · Round-off
   ============================================================ */

// ── CONSTANTS ────────────────────────────────────────────────
const STORAGE_KEY  = "refrens_invoice_v2";
const AUTOSAVE_MS  = 4000;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS     = ["pcs","hrs","days","kg","g","L","mL","m","ft","sq.ft","sq.m","months","fixed"];

const TEMPLATES = [
  { id:"classic",     name:"Classic",     desc:"Clean GST invoice layout" },
  { id:"minimal",     name:"Minimal",     desc:"Simple no-frills document" },
  { id:"modern",      name:"Modern",      desc:"Bold colored header" },
  { id:"elegant",     name:"Elegant",     desc:"Warm premium style" },
  { id:"bold",        name:"Bold",        desc:"Dark executive look" },
];

const PALETTE = [
  "#7c3aed","#2563eb","#059669","#dc2626","#d97706",
  "#0891b2","#db2777","#4f46e5","#16a34a","#b45309",
];

const PAYMENT_TERMS = ["Due on Receipt","Net 7","Net 15","Net 30","Net 45","Net 60","Custom"];

// ── STATE ────────────────────────────────────────────────────
let state         = null;
let autosaveTimer = null;
let dragIdx       = null;
let toastTimer    = null;

// ── BOOT ─────────────────────────────────────────────────────
state = loadState();
init();

function init() {
  applyTheme();
  populateStateSelects();
  bindGlobalEvents();
  renderTemplateGallery();
  render();
}

// ── PERSISTENCE ──────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.version === 2) return p;
    }
  } catch (_) {}
  return createInitialState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createInitialState() {
  const orgs = [
    {
      id: "org_1", name: "Grofast Digital", currency: "INR",
      business: {
        businessName: "Grofast Digital",
        gstin: "33ABCDE1234F1Z5", pan: "ABCDE1234F",
        phone: "+91 91591 24541", email: "grofastdigital@gmail.com",
        address: "4/188 C, Poomalai Nagar, Kaveripattinam", state: "Tamil Nadu",
        bankName: "ICICI Bank", accountNumber: "720201508823",
        accountHolder: "Grofast Digital", ifscCode: "ICIC0001234",
        upiId: "sajethasiva6@okicici", paymentLink: "",
      },
    },
    {
      id: "org_2", name: "GD Commerce LLP", currency: "USD",
      business: {
        businessName: "GD Commerce LLP",
        gstin: "", pan: "ZZZZZ9999Z",
        phone: "+1 415 555 0192", email: "finance@gdcommerce.com",
        address: "2900 Market Street, San Francisco, CA", state: "",
        bankName: "", accountNumber: "", accountHolder: "", ifscCode: "",
        upiId: "", paymentLink: "",
      },
    },
  ];

  const clients = [
    {
      id: "cli_1", orgId: "org_1",
      name: "MR FITNESS", companyName: "MR FITNESS", clientType: "Company",
      taxTreatment: "Registered", gstin: "33AAACM8812J1Z2", pan: "",
      phone: "+91 90036 39222", email: "owner@mrfitness.in",
      state: "Tamil Nadu",
      address: "No 5/8, Teachers Colony, Hosur, Tamil Nadu - 635 109",
    },
    {
      id: "cli_2", orgId: "org_1",
      name: "S7 Cars India Pvt.", companyName: "S7 Cars India Pvt.", clientType: "Company",
      taxTreatment: "Registered", gstin: "33AAKCS9123Q1ZG", pan: "",
      phone: "+91 81223 11118", email: "accounts@s7cars.in",
      state: "Tamil Nadu",
      address: "Bangalore Road, Hosur, Tamil Nadu - 635 109",
    },
  ];

  const now = new Date().toISOString();

  const invoices = [
    {
      id: "inv_1", orgId: "org_1",
      invoiceNumber: "INV-002", invoiceType: "Tax Invoice",
      issueDate: "2026-02-14", dueDate: "2026-02-21",
      placeOfSupply: "Tamil Nadu", currency: "INR", reference: "PO-MR-95",
      businessDetails: { ...orgs[0].business },
      clientId: "cli_1", clientDetails: { ...clients[0] },
      lineItems: [
        { id:"li_1", itemName:"Meta Ad Campaign Management", description:"30-day service charge", hsn:"998311", quantity:12, unit:"months", unitPrice:20000, discount:0, taxPercent:18 },
        { id:"li_2", itemName:"Business Automation System", description:"CRM & workflow setup", hsn:"998314", quantity:12, unit:"months", unitPrice:5000, discount:0, taxPercent:18 },
      ],
      invoiceDiscount: { type:"percent", value:0, label:"Discount" },
      charges: [],
      tds: { enabled:false, type:"percent", value:2, label:"TDS" },
      roundOff: false,
      paymentInfo: { terms:"Net 7", customDays:7, showBank:true, showUpi:true, paymentLink:"" },
      notes: "Thank you for your trust and continued support.",
      terms: "50% advance required. Balance due within 7 days of invoice date.",
      amountPaid: 0,
      status: "Sent", deleted: false,
      recurring: { enabled:true, interval:"monthly", nextRun:"2026-03-14" },
      timeline: [
        { status:"Created", at:now },
        { status:"Sent", at:now },
      ],
      activity: [
        { at:now, text:"Invoice created." },
        { at:now, text:"Invoice sent to client." },
      ],
      createdAt:now, updatedAt:now, templateId:"classic", templateColor:"#7c3aed",
    },
    {
      id: "inv_2", orgId: "org_1",
      invoiceNumber: "INV-001", invoiceType: "Tax Invoice",
      issueDate: "2026-02-10", dueDate: "2026-02-15",
      placeOfSupply: "Tamil Nadu", currency: "INR", reference: "PO-S7-94",
      businessDetails: { ...orgs[0].business },
      clientId: "cli_2", clientDetails: { ...clients[1] },
      lineItems: [
        { id:"li_3", itemName:"Automation Maintenance Retainer", description:"Monthly servicing & integrations", hsn:"998314", quantity:1, unit:"months", unitPrice:30000, discount:0, taxPercent:18 },
      ],
      invoiceDiscount: { type:"percent", value:0, label:"Discount" },
      charges: [{ id:"ch_1", label:"Courier Charges", amount:250, taxable:false }],
      tds: { enabled:false, type:"percent", value:2, label:"TDS" },
      roundOff: true,
      paymentInfo: { terms:"Net 5", customDays:5, showBank:true, showUpi:true, paymentLink:"" },
      notes: "Please clear pending dues immediately.",
      terms: "Payment due in 5 days.",
      amountPaid: 0,
      status: "Overdue", deleted: false,
      recurring: { enabled:false, interval:"monthly", nextRun:"" },
      timeline: [{ status:"Created", at:now }, { status:"Sent", at:now }],
      activity: [{ at:now, text:"Invoice created." }],
      createdAt:now, updatedAt:now, templateId:"classic", templateColor:"#7c3aed",
    },
  ];

  return {
    version: 2,
    theme: "light",
    template: "classic",
    templateColor: "#7c3aed",
    currentOrgId: "org_1",
    orgs, clients, invoices,
    notifications: [
      { id:uid("note"), at:now, text:"Ctrl+S save · Ctrl+Enter send · Ctrl+P preview · Ctrl+Z undo", read:false },
    ],
    editorDraft: null,
    ui: {
      route: "dashboard",
      dashboardTab: "active",
      viewingId: "inv_1",
      selectedIds: [],
      filters: { status:"all", client:"all", startDate:"", endDate:"", minAmt:"", maxAmt:"", search:"" },
      editorDirty: false,
      autosaveLabel: "",
      editorHistory: [],
    },
  };
}

// ── UTILITIES ─────────────────────────────────────────────────
function uid(p)       { return `${p}_${Math.random().toString(36).slice(2,9)}`; }
function deepCopy(v)  { return JSON.parse(JSON.stringify(v)); }
function todayIso()   { return new Date().toISOString().slice(0,10); }

function addDaysISO(base, days) {
  const d = new Date(base); d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0,10);
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function fmt(amount, currency) {
  const n = Number(amount || 0);
  try { return new Intl.NumberFormat("en-IN", { style:"currency", currency, maximumFractionDigits:2 }).format(n); }
  catch (_) { return `${currency} ${n.toFixed(2)}`; }
}

function esc(v) {
  return String(v || "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function amountInWords(amount) {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero Rupees Only";
  const ones  = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens  = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function w(num) {
    if (!num) return "";
    if (num < 20)    return ones[num] + " ";
    if (num < 100)   return tens[Math.floor(num/10)] + " " + (num%10 ? ones[num%10] + " " : "");
    if (num < 1000)  return ones[Math.floor(num/100)] + " Hundred " + w(num%100);
    if (num < 1e5)   return w(Math.floor(num/1000)) + "Thousand " + w(num%1000);
    if (num < 1e7)   return w(Math.floor(num/1e5))  + "Lakh "     + w(num%1e5);
    return w(Math.floor(num/1e7)) + "Crore " + w(num%1e7);
  }
  return w(n).trim() + " Rupees Only";
}

// ── GETTERS ───────────────────────────────────────────────────
function getCurrentOrg()   { return state.orgs.find(o => o.id === state.currentOrgId) || state.orgs[0]; }
function getOrgClients()   { return state.clients.filter(c => c.orgId === state.currentOrgId); }
function getOrgInvoices()  { return state.invoices.filter(i => i.orgId === state.currentOrgId); }
function getInvoiceById(id){ return state.invoices.find(i => i.id === id); }

function upsertInvoice(inv) {
  const idx = state.invoices.findIndex(i => i.id === inv.id);
  if (idx === -1) state.invoices.unshift(inv); else state.invoices[idx] = inv;
}

// ── GST CALCULATION ENGINE ────────────────────────────────────
function calculateTotals(invoice) {
  const currency      = invoice.currency || "INR";
  const sellerState   = (invoice.businessDetails?.state || "").trim();
  const placeOfSupply = (invoice.placeOfSupply || "").trim();
  const isIntraState  = !!(sellerState && placeOfSupply && sellerState === placeOfSupply);
  const isExport      = invoice.invoiceType === "Export Invoice";
  const isBillOfSupply= invoice.invoiceType === "Bill of Supply";

  // ── Line items
  let subtotal = 0, totalItemDiscount = 0;
  const rows = (invoice.lineItems || []).map(item => {
    const qty      = +item.quantity  || 0;
    const rate     = +item.unitPrice || 0;
    const itemDisc = +item.discount  || 0;
    const taxRate  = +item.taxPercent|| 0;
    const base     = qty * rate;
    const taxable  = Math.max(0, base - itemDisc);
    subtotal        += base;
    totalItemDiscount += itemDisc;
    return { ...item, qty, rate, itemDisc, taxable, taxRate, base };
  });

  const netAfterItemDisc = Math.max(0, subtotal - totalItemDiscount);

  // ── Invoice-level discount
  const invDiscCfg  = invoice.invoiceDiscount || { type:"percent", value:0 };
  const invDiscVal  = +invDiscCfg.value || 0;
  const invDiscAmt  = invDiscCfg.type === "percent"
    ? (netAfterItemDisc * invDiscVal) / 100
    : invDiscVal;
  const discRatio   = netAfterItemDisc > 0 ? invDiscAmt / netAfterItemDisc : 0;
  const netTaxableBase = Math.max(0, netAfterItemDisc - invDiscAmt);

  // ── Additional charges
  const charges = invoice.charges || [];
  let taxableCharges = 0, nonTaxableCharges = 0;
  for (const ch of charges) {
    const a = +ch.amount || 0;
    if (ch.taxable) taxableCharges += a; else nonTaxableCharges += a;
  }

  // ── Tax by rate group
  const taxByRate = {};
  if (!isExport && !isBillOfSupply) {
    for (const row of rows) {
      if (!row.taxRate) continue;
      const adjTaxable = row.taxable * (1 - discRatio);
      taxByRate[row.taxRate] = (taxByRate[row.taxRate] || 0) + adjTaxable;
    }
  }

  let totalTax = 0;
  const cgstLines = [], sgstLines = [], igstLines = [];

  for (const [rStr, base] of Object.entries(taxByRate)) {
    const rate   = +rStr;
    const taxAmt = (base * rate) / 100;
    totalTax += taxAmt;
    if (isIntraState) {
      cgstLines.push({ rate: rate / 2, base, amount: taxAmt / 2 });
      sgstLines.push({ rate: rate / 2, base, amount: taxAmt / 2 });
    } else {
      igstLines.push({ rate, base, amount: taxAmt });
    }
  }

  // ── Update each row's line total
  for (const row of rows) {
    const adjTaxable = row.taxable * (1 - discRatio);
    const lineTax = (!isExport && !isBillOfSupply) ? (adjTaxable * row.taxRate) / 100 : 0;
    row.lineTotal = adjTaxable + lineTax;
  }

  const grossTotal = netTaxableBase + taxableCharges + nonTaxableCharges + totalTax;

  // ── Round off
  const roundOffAmt = invoice.roundOff ? Math.round(grossTotal) - grossTotal : 0;
  const grandTotal  = grossTotal + roundOffAmt;

  // ── TDS
  const tdsCfg = invoice.tds || { enabled:false, type:"percent", value:0 };
  const tdsAmt = tdsCfg.enabled
    ? (tdsCfg.type === "percent" ? (grandTotal * (+tdsCfg.value || 0)) / 100 : +tdsCfg.value || 0)
    : 0;

  const amountPaid = +invoice.amountPaid || 0;
  const netPayable = Math.max(0, grandTotal - tdsAmt);
  const balanceDue = Math.max(0, netPayable - amountPaid);

  return {
    rows, currency,
    subtotal, totalItemDiscount, netAfterItemDisc,
    invDiscAmt, netTaxableBase, discRatio,
    taxableCharges, nonTaxableCharges,
    totalCharges: taxableCharges + nonTaxableCharges,
    totalTax, cgstLines, sgstLines, igstLines,
    isIntraState, isExport, isBillOfSupply,
    grossTotal, roundOffAmt, grandTotal,
    tdsAmt, amountPaid, netPayable, balanceDue,
  };
}

function isOverdue(inv) {
  if (inv.status === "Paid" || inv.deleted) return false;
  const due = new Date(inv.dueDate), today = new Date(todayIso());
  const t = calculateTotals(inv);
  return !!(due && due < today && t.balanceDue > 0 && inv.status !== "Draft");
}

function resolveStatus(inv) {
  if (inv.deleted) return "Deleted";
  if (inv.status === "Paid") return "Paid";
  if (inv.status === "Draft") return "Draft";
  if (isOverdue(inv)) return "Overdue";
  if ((inv.timeline || []).some(e => e.status === "Viewed")) return "Viewed";
  return inv.status || "Draft";
}

// ── THEME ─────────────────────────────────────────────────────
function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

// ── STATE SELECTS ─────────────────────────────────────────────
function populateStateSelects() {
  const opts = INDIAN_STATES.map(s => `<option value="${s}">${s}</option>`).join("");
  const el = document.getElementById("clientStateSelect");
  if (el) el.innerHTML = `<option value="">Select State</option>` + opts;
}

// ── RENDER ROUTER ─────────────────────────────────────────────
function render() {
  renderNotifCount();
  updateNavState();
  if (state.ui.route === "editor") { renderEditor(); startAutosave(); return; }
  stopAutosave();
  if (state.ui.route === "view")    return renderView();
  if (state.ui.route === "clients") return renderClients();
  renderDashboard();
}

function updateNavState() {
  document.querySelectorAll(".nav-btn[data-nav]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.nav === state.ui.route);
  });
}

function renderNotifCount() {
  const el = document.getElementById("notifCount");
  if (el) el.textContent = String(state.notifications.filter(n => !n.read).length);
}

function syncOrgSwitcher() {
  const el = document.getElementById("orgSwitcher");
  if (el) el.value = state.currentOrgId;
}

// ── GLOBAL EVENTS ─────────────────────────────────────────────
function bindGlobalEvents() {
  syncOrgSwitcher();

  document.getElementById("createInvoiceTop").addEventListener("click", () => openEditor());

  document.getElementById("toggleTheme").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(); saveState();
  });

  document.getElementById("orgSwitcher").addEventListener("change", e => {
    state.currentOrgId = e.target.value;
    state.ui.selectedIds = [];
    state.ui.filters.client = "all";
    state.ui.route = "dashboard";
    saveState(); render();
  });

  document.getElementById("globalSearch").addEventListener("input", e => {
    state.ui.filters.search = e.target.value;
    if (state.ui.route === "dashboard") renderDashboard();
  });

  document.getElementById("openTemplates").addEventListener("click", () => showModal("templateModal"));

  document.getElementById("openNotifications").addEventListener("click", () => {
    const unread = state.notifications.filter(n => !n.read);
    if (!unread.length) return showToast("No new notifications");
    unread.forEach(n => { n.read = true; });
    saveState(); renderNotifCount();
    showToast(unread[0].text);
  });

  document.getElementById("runAutomation").addEventListener("click", () => {
    const r = runAutomation();
    showToast(`Automation: ${r.created} recurring created, ${r.reminders} reminders sent.`);
    saveState();
    if (state.ui.route === "dashboard") renderDashboard();
  });

  document.getElementById("exportCsv").addEventListener("click", () => {
    downloadCsv(applyFilters(getOrgInvoices()));
  });

  document.querySelectorAll(".nav-btn[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      if (nav === "editor")  return openEditor();
      if (nav === "view")    { const inv = getOrgInvoices()[0]; if (inv) { state.ui.viewingId = inv.id; markViewed(inv.id); } state.ui.route = "view"; saveState(); return render(); }
      if (nav === "clients") { state.ui.route = "clients"; saveState(); return render(); }
      state.ui.route = "dashboard"; stopAutosave(); saveState(); render();
    });
  });

  document.getElementById("closeClientModal").addEventListener("click",   () => hideModal("clientModal"));
  document.getElementById("cancelClientModal").addEventListener("click",  () => hideModal("clientModal"));
  document.getElementById("closeTemplateModal").addEventListener("click", () => hideModal("templateModal"));

  document.getElementById("clientForm").addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const client = {
      id: uid("cli"), orgId: state.currentOrgId,
      name:         (fd.get("name")         || "").trim(),
      companyName:  (fd.get("name")         || "").trim(),
      clientType:   fd.get("clientType")    || "Company",
      email:        (fd.get("email")        || "").trim(),
      phone:        (fd.get("phone")        || "").trim(),
      gstin:        (fd.get("gstin")        || "").trim().toUpperCase(),
      pan:          (fd.get("pan")          || "").trim().toUpperCase(),
      state:        fd.get("state")         || "",
      taxTreatment: fd.get("taxTreatment")  || "Registered",
      address:      (fd.get("address")      || "").trim(),
    };
    if (!client.name) return showToast("Client name is required.");
    state.clients.push(client);
    if (state.editorDraft) {
      state.editorDraft.clientId = client.id;
      state.editorDraft.clientDetails = deepCopy(client);
      markDirty();
    }
    e.target.reset();
    hideModal("clientModal");
    saveState();
    if (state.ui.route === "editor") renderEditor();
    showToast("Client saved successfully.");
  });

  document.addEventListener("keydown", e => {
    if (state.ui.route !== "editor") return;
    if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); }
    if (e.ctrlKey && e.key === "Enter")            { e.preventDefault(); sendInvoice(); }
    if (e.ctrlKey && e.key.toLowerCase() === "p")  { e.preventDefault(); previewPdf(); }
    if (e.ctrlKey && e.key.toLowerCase() === "z")  { e.preventDefault(); undoChange(); }
  });
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const root     = document.getElementById("screenRoot");
  const org      = getCurrentOrg();
  const invoices = applyFilters(getOrgInvoices());
  const clients  = getOrgClients();
  const cur      = org.currency;

  const metrics = invoices.reduce((acc, inv) => {
    if (inv.deleted) return acc;
    const t = calculateTotals(inv);
    const s = resolveStatus(inv);
    acc.count++;
    acc.total  += t.grandTotal;
    acc.balance+= t.balanceDue;
    if (s === "Overdue") acc.overdue++;
    if (s === "Paid")    { acc.paid++; acc.paidAmt += t.grandTotal; }
    return acc;
  }, { count:0, total:0, balance:0, overdue:0, paid:0, paidAmt:0 });

  root.innerHTML = `
    <div class="dash-header">
      <div class="dash-title">Dashboard</div>
      <button class="primary-btn" id="dashCreateBtn" type="button">+ New Invoice</button>
    </div>

    <div class="metric-grid">
      <div class="metric-card metric-primary">
        <div class="metric-label">Total Invoices</div>
        <div class="metric-value">${metrics.count}</div>
        <div class="metric-sub">${state.ui.dashboardTab} view</div>
      </div>
      <div class="metric-card metric-primary">
        <div class="metric-label">Total Billed</div>
        <div class="metric-value">${fmt(metrics.total, cur)}</div>
        <div class="metric-sub">across all invoices</div>
      </div>
      <div class="metric-card metric-warning">
        <div class="metric-label">Balance Due</div>
        <div class="metric-value">${fmt(metrics.balance, cur)}</div>
        <div class="metric-sub">${metrics.overdue} overdue</div>
      </div>
      <div class="metric-card metric-success">
        <div class="metric-label">Paid</div>
        <div class="metric-value">${fmt(metrics.paidAmt, cur)}</div>
        <div class="metric-sub">${metrics.paid} invoices</div>
      </div>
    </div>

    <div class="card">
      <div class="dash-toolbar">
        <div class="filter-row">
          <label>Status
            <select id="fStatus">
              <option value="all">All</option>
              ${["Draft","Sent","Viewed","Paid","Overdue"].map(s => `<option value="${s}" ${state.ui.filters.status===s?"selected":""}>${s}</option>`).join("")}
            </select>
          </label>
          <label>Client
            <select id="fClient">
              <option value="all">All Clients</option>
              ${clients.map(c => `<option value="${c.id}" ${state.ui.filters.client===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}
            </select>
          </label>
          <label>From Date<input id="fStart" type="date" value="${state.ui.filters.startDate}" /></label>
          <label>To Date<input id="fEnd" type="date" value="${state.ui.filters.endDate}" /></label>
          <label>Min Amt<input id="fMin" type="number" min="0" value="${state.ui.filters.minAmt}" /></label>
          <label>Max Amt<input id="fMax" type="number" min="0" value="${state.ui.filters.maxAmt}" /></label>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="secondary-btn" id="applyFiltersBtn">Apply</button>
          <button class="ghost-btn" id="clearFiltersBtn">Clear</button>
        </div>
      </div>

      <div class="tab-bar">
        ${["active","recurring","deleted"].map(t => `<button class="tab-pill ${state.ui.dashboardTab===t?"active":""}" data-tab="${t}" type="button">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join("")}
      </div>

      ${state.ui.selectedIds.length ? `
        <div class="bulk-bar">
          <strong style="font-size:0.84rem;color:var(--primary);">${state.ui.selectedIds.length} selected</strong>
          <div class="bulk-actions">
            <button class="secondary-btn" data-bulk="send">Send</button>
            <button class="secondary-btn" data-bulk="download">Download PDF</button>
            <button class="secondary-btn" data-bulk="paid">Mark Paid</button>
            <button class="danger-btn" data-bulk="delete">Delete</button>
          </div>
        </div>
      ` : ""}

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAll" ${invoices.length && state.ui.selectedIds.length===invoices.length?"checked":""}></th>
              <th>Invoice #</th><th>Client</th><th>Issue Date</th><th>Due Date</th>
              <th>Amount</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoices.length ? invoices.map(inv => {
              const s = resolveStatus(inv);
              const t = calculateTotals(inv);
              return `<tr>
                <td><input type="checkbox" data-sel="${inv.id}" ${state.ui.selectedIds.includes(inv.id)?"checked":""}></td>
                <td><strong>${esc(inv.invoiceNumber)}</strong></td>
                <td>${esc(inv.clientDetails?.name || "—")}</td>
                <td>${fmtDate(inv.issueDate)}</td>
                <td>${fmtDate(inv.dueDate)}</td>
                <td><strong>${fmt(t.grandTotal, inv.currency)}</strong></td>
                <td><span class="status-badge status-${s.toLowerCase()}">${s}</span></td>
                <td>
                  <div class="td-actions">
                    <button data-action="view"     data-id="${inv.id}">View</button>
                    <button data-action="edit"     data-id="${inv.id}">Edit</button>
                    <button data-action="duplicate"data-id="${inv.id}">Duplicate</button>
                    <button data-action="download" data-id="${inv.id}">PDF</button>
                    <button data-action="send"     data-id="${inv.id}">Send</button>
                    <button data-action="delete"   data-id="${inv.id}">Delete</button>
                  </div>
                </td>
              </tr>`;
            }).join("") : `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px;">No invoices found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("dashCreateBtn").addEventListener("click", () => openEditor());
  document.getElementById("applyFiltersBtn").addEventListener("click", () => {
    state.ui.filters.status   = document.getElementById("fStatus").value;
    state.ui.filters.client   = document.getElementById("fClient").value;
    state.ui.filters.startDate= document.getElementById("fStart").value;
    state.ui.filters.endDate  = document.getElementById("fEnd").value;
    state.ui.filters.minAmt   = document.getElementById("fMin").value;
    state.ui.filters.maxAmt   = document.getElementById("fMax").value;
    saveState(); renderDashboard();
  });
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    state.ui.filters = { status:"all", client:"all", startDate:"", endDate:"", minAmt:"", maxAmt:"", search:"" };
    saveState(); renderDashboard();
  });

  document.querySelectorAll(".tab-pill").forEach(btn => btn.addEventListener("click", () => {
    state.ui.dashboardTab = btn.dataset.tab;
    state.ui.selectedIds  = [];
    saveState(); renderDashboard();
  }));

  const selAll = document.getElementById("selectAll");
  if (selAll) selAll.addEventListener("change", () => {
    state.ui.selectedIds = selAll.checked ? invoices.map(i => i.id) : [];
    saveState(); renderDashboard();
  });

  document.querySelectorAll("input[data-sel]").forEach(cb => cb.addEventListener("change", () => {
    const id = cb.dataset.sel;
    if (cb.checked && !state.ui.selectedIds.includes(id)) state.ui.selectedIds.push(id);
    if (!cb.checked) state.ui.selectedIds = state.ui.selectedIds.filter(x => x !== id);
    saveState(); renderDashboard();
  }));

  document.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => handleAction(btn.dataset.action, btn.dataset.id)));
  document.querySelectorAll("[data-bulk]").forEach(btn => btn.addEventListener("click", () => handleBulk(btn.dataset.bulk)));
}

function applyFilters(invoices) {
  const f = state.ui.filters;
  const q = (f.search || "").toLowerCase();
  return invoices.filter(inv => {
    const s = resolveStatus(inv);
    if (state.ui.dashboardTab === "active"    && (inv.deleted || (inv.recurring?.enabled))) return false;
    if (state.ui.dashboardTab === "recurring" && !(inv.recurring?.enabled && !inv.deleted))  return false;
    if (state.ui.dashboardTab === "deleted"   && !inv.deleted) return false;
    if (f.status !== "all" && s !== f.status) return false;
    if (f.client !== "all" && inv.clientId !== f.client) return false;
    const d = new Date(inv.issueDate);
    if (f.startDate && d < new Date(f.startDate)) return false;
    if (f.endDate   && d > new Date(f.endDate))   return false;
    const t = calculateTotals(inv);
    if (f.minAmt && t.grandTotal < +f.minAmt) return false;
    if (f.maxAmt && t.grandTotal > +f.maxAmt) return false;
    if (q) {
      const hay = `${inv.invoiceNumber} ${inv.clientDetails?.name || ""} ${t.grandTotal}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function handleAction(action, id) {
  const inv = getInvoiceById(id); if (!inv) return;
  if (action === "view")      { state.ui.viewingId = id; state.ui.route = "view"; markViewed(id); saveState(); return render(); }
  if (action === "edit")      return openEditor(id);
  if (action === "duplicate") { openEditor(id, true); return showToast("Duplicate opened in editor."); }
  if (action === "download")  return downloadPdf(inv);
  if (action === "send")      { markSent(id); saveState(); showToast(`Invoice ${inv.invoiceNumber} sent.`); return renderDashboard(); }
  if (action === "delete")    { inv.deleted = true; logActivity(inv, "Invoice deleted."); state.ui.selectedIds = state.ui.selectedIds.filter(x=>x!==id); saveState(); return renderDashboard(); }
}

function handleBulk(action) {
  const sel = state.ui.selectedIds.map(id => getInvoiceById(id)).filter(Boolean);
  if (!sel.length) return;
  if (action === "send")     sel.forEach(inv => markSent(inv.id));
  if (action === "download") { sel.slice(0,3).forEach(inv => downloadPdf(inv)); showToast(`Downloading ${Math.min(3,sel.length)} PDFs.`); }
  if (action === "paid")     sel.forEach(inv => markPaid(inv.id));
  if (action === "delete")   sel.forEach(inv => { inv.deleted = true; logActivity(inv, "Bulk deleted."); });
  if (action !== "download") showToast(`Done: ${sel.length} invoice(s) ${action}.`);
  state.ui.selectedIds = [];
  saveState(); renderDashboard();
}

// ── EDITOR ────────────────────────────────────────────────────
function nextInvoiceNumber() {
  const nums = getOrgInvoices()
    .map(i => (i.invoiceNumber.match(/(\d+)$/) || [])[1])
    .filter(Boolean).map(Number);
  return `INV-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3,"0")}`;
}

function openEditor(invoiceId = null, duplicate = false) {
  const org = getCurrentOrg();
  if (invoiceId) {
    const src = getInvoiceById(invoiceId); if (!src) return;
    const draft = deepCopy(src);
    if (duplicate) {
      draft.id            = uid("inv");
      draft.invoiceNumber = nextInvoiceNumber();
      draft.status        = "Draft"; draft.amountPaid = 0; draft.deleted = false;
      draft.timeline      = [{ status:"Created", at:new Date().toISOString() }];
      draft.activity      = [{ at:new Date().toISOString(), text:"Invoice duplicated." }];
    }
    state.editorDraft = draft;
  } else {
    const today = todayIso();
    state.editorDraft = {
      id: uid("inv"), orgId: state.currentOrgId,
      invoiceNumber: nextInvoiceNumber(), invoiceType: "Tax Invoice",
      issueDate: today, dueDate: addDaysISO(today, 30),
      placeOfSupply: org.business.state || "",
      currency: org.currency, reference: "",
      businessDetails: deepCopy(org.business),
      clientId: "", clientDetails: { id:"", name:"", companyName:"", clientType:"Company", taxTreatment:"Registered", gstin:"", pan:"", phone:"", email:"", state:"", address:"" },
      lineItems: [{ id:uid("li"), itemName:"", description:"", hsn:"", quantity:1, unit:"pcs", unitPrice:0, discount:0, taxPercent:18 }],
      invoiceDiscount: { type:"percent", value:0, label:"Discount" },
      charges: [],
      tds: { enabled:false, type:"percent", value:2, label:"TDS" },
      roundOff: false,
      paymentInfo: { terms:"Net 30", customDays:30, showBank:true, showUpi:true, paymentLink:"" },
      notes: "", terms: "", amountPaid: 0, status: "Draft", deleted: false,
      recurring: { enabled:false, interval:"monthly", nextRun:"" },
      timeline: [{ status:"Created", at:new Date().toISOString() }],
      activity: [{ at:new Date().toISOString(), text:"Draft invoice initiated." }],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      templateId: state.template, templateColor: state.templateColor,
    };
  }
  state.ui.route        = "editor";
  state.ui.editorDirty  = false;
  state.ui.autosaveLabel= "";
  state.ui.editorHistory= [deepCopy(state.editorDraft)];
  saveState(); render();
}

function renderEditor() {
  const root = document.getElementById("screenRoot");
  if (!state.editorDraft) return openEditor();
  const d      = state.editorDraft;
  const t      = calculateTotals(d);
  const clients= getOrgClients();
  const cur    = d.currency;
  const stOpts = INDIAN_STATES.map(s => `<option value="${s}" ${d.businessDetails?.state===s?"selected":""}>${s}</option>`).join("");
  const posOpts= INDIAN_STATES.map(s => `<option value="${s}" ${d.placeOfSupply===s?"selected":""}>${s}</option>`).join("");
  const cliStOpts= INDIAN_STATES.map(s => `<option value="${s}" ${d.clientDetails?.state===s?"selected":""}>${s}</option>`).join("");

  root.innerHTML = `
  <div class="editor-wrap">
    <!-- ── FORM ── -->
    <div class="editor-main">

      <!-- Top bar -->
      <div class="card autosave-bar">
        <div style="display:flex;align-items:center;gap:12px;">
          <button class="ghost-btn" id="backBtn" type="button">← Back</button>
          <strong style="font-size:0.9rem;">${d.id.startsWith("inv_") && !d.id.includes("_") ? "Edit" : "New"} Invoice</strong>
          <span style="color:var(--muted);font-size:0.78rem;">${esc(state.ui.autosaveLabel||"Unsaved")}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <kbd>Ctrl+S</kbd> Save &nbsp; <kbd>Ctrl+Enter</kbd> Send &nbsp; <kbd>Ctrl+P</kbd> Preview &nbsp; <kbd>Ctrl+Z</kbd> Undo
        </div>
      </div>

      <!-- 1. Invoice Header -->
      <div class="section-card">
        <div class="section-head"><h3>1 · Invoice Header</h3></div>
        <div class="section-body">
          <div class="form-g3">
            <label>Invoice Number<input class="field" data-path="invoiceNumber" value="${esc(d.invoiceNumber)}" /></label>
            <label>Invoice Type
              <select class="field" data-path="invoiceType">
                ${["Tax Invoice","Bill of Supply","Export Invoice","Proforma Invoice"].map(v=>`<option ${d.invoiceType===v?"selected":""}>${v}</option>`).join("")}
              </select>
            </label>
            <label>Currency
              <select class="field" data-path="currency">
                ${["INR","USD","EUR","GBP","AED","SGD","CAD","AUD"].map(c=>`<option ${d.currency===c?"selected":""}>${c}</option>`).join("")}
              </select>
            </label>
            <label>Issue Date<input class="field" type="date" data-path="issueDate" value="${d.issueDate}" /></label>
            <label>Due Date<input class="field" type="date" data-path="dueDate" value="${d.dueDate}" /></label>
            <label>PO / Reference<input class="field" data-path="reference" value="${esc(d.reference)}" /></label>
            <label>Place of Supply
              <select class="field" data-path="placeOfSupply" id="posSelect">
                <option value="">Select State</option>${posOpts}
              </select>
            </label>
            <label>Payment Terms
              <select class="field" id="payTerms" data-path="paymentInfo.terms">
                ${PAYMENT_TERMS.map(t=>`<option ${d.paymentInfo.terms===t?"selected":""}>${t}</option>`).join("")}
              </select>
            </label>
            ${d.paymentInfo.terms==="Custom"?`<label>Custom Days<input class="field" type="number" min="0" data-path="paymentInfo.customDays" value="${d.paymentInfo.customDays||0}" /></label>`:``}
          </div>
        </div>
      </div>

      <!-- 2. Business Details -->
      <div class="section-card">
        <div class="section-head"><h3>2 · Your Business Details</h3></div>
        <div class="section-body">
          <div class="form-g3">
            <label>Business Name<input class="field" data-path="businessDetails.businessName" value="${esc(d.businessDetails?.businessName)}" /></label>
            <label>GSTIN<input class="field" data-path="businessDetails.gstin" value="${esc(d.businessDetails?.gstin)}" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase" /></label>
            <label>PAN<input class="field" data-path="businessDetails.pan" value="${esc(d.businessDetails?.pan)}" placeholder="AAAAA0000A" style="text-transform:uppercase" /></label>
            <label>Phone<input class="field" data-path="businessDetails.phone" value="${esc(d.businessDetails?.phone)}" /></label>
            <label>Email<input class="field" type="email" data-path="businessDetails.email" value="${esc(d.businessDetails?.email)}" /></label>
            <label>State
              <select class="field" data-path="businessDetails.state">
                <option value="">Select State</option>${stOpts}
              </select>
            </label>
            <label class="span3">Address<textarea class="field" rows="2" data-path="businessDetails.address">${esc(d.businessDetails?.address)}</textarea></label>
          </div>
          <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Bank Details</div>
            <div class="form-g4">
              <label>Bank Name<input class="field" data-path="businessDetails.bankName" value="${esc(d.businessDetails?.bankName)}" /></label>
              <label>Account Number<input class="field" data-path="businessDetails.accountNumber" value="${esc(d.businessDetails?.accountNumber)}" /></label>
              <label>IFSC Code<input class="field" data-path="businessDetails.ifscCode" value="${esc(d.businessDetails?.ifscCode)}" /></label>
              <label>UPI ID<input class="field" data-path="businessDetails.upiId" value="${esc(d.businessDetails?.upiId)}" /></label>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Client Details -->
      <div class="section-card">
        <div class="section-head">
          <h3>3 · Client Details</h3>
          <button class="secondary-btn" id="addClientBtn" type="button">+ Add New Client</button>
        </div>
        <div class="section-body">
          <div class="form-g3" style="margin-bottom:12px;">
            <label class="span3">Select Existing Client
              <select class="field" id="clientSelector">
                <option value="">— Select client —</option>
                ${clients.map(c=>`<option value="${c.id}" ${d.clientId===c.id?"selected":""}>${esc(c.name)}${c.gstin?" · "+c.gstin:""}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="form-g3">
            <label>Client Name<input class="field" data-path="clientDetails.name" value="${esc(d.clientDetails?.name)}" /></label>
            <label>Client Type
              <select class="field" data-path="clientDetails.clientType">
                <option ${d.clientDetails?.clientType==="Company"?"selected":""}>Company</option>
                <option ${d.clientDetails?.clientType==="Individual"?"selected":""}>Individual</option>
              </select>
            </label>
            <label>Tax Treatment
              <select class="field" data-path="clientDetails.taxTreatment">
                ${["Registered","Unregistered","Consumer","Overseas","SEZ"].map(v=>`<option ${d.clientDetails?.taxTreatment===v?"selected":""}>${v}</option>`).join("")}
              </select>
            </label>
            <label>GSTIN<input class="field" data-path="clientDetails.gstin" value="${esc(d.clientDetails?.gstin)}" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase" /></label>
            <label>PAN<input class="field" data-path="clientDetails.pan" value="${esc(d.clientDetails?.pan)}" placeholder="AAAAA0000A" style="text-transform:uppercase" /></label>
            <label>State
              <select class="field" data-path="clientDetails.state">
                <option value="">Select State</option>${cliStOpts}
              </select>
            </label>
            <label>Email<input class="field" type="email" data-path="clientDetails.email" value="${esc(d.clientDetails?.email)}" /></label>
            <label>Phone<input class="field" data-path="clientDetails.phone" value="${esc(d.clientDetails?.phone)}" /></label>
            <label class="span3">Billing Address<textarea class="field" rows="2" data-path="clientDetails.address">${esc(d.clientDetails?.address)}</textarea></label>
          </div>
        </div>
      </div>

      <!-- 4. Line Items -->
      <div class="section-card">
        <div class="section-head">
          <h3>4 · Line Items</h3>
          <button class="secondary-btn" id="addItemBtn" type="button">+ Add Row</button>
        </div>
        <div class="section-body" style="padding:0;overflow-x:auto;">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width:30px;"></th>
                <th style="min-width:200px;">Description</th>
                <th style="width:80px;">HSN/SAC</th>
                <th style="width:65px;">Qty</th>
                <th style="width:80px;">Unit</th>
                <th style="width:100px;">Rate (${esc(cur)})</th>
                <th style="width:90px;">Discount (${esc(cur)})</th>
                <th style="width:80px;">Tax %</th>
                <th style="width:100px;">Amount</th>
                <th style="width:36px;"></th>
              </tr>
            </thead>
            <tbody>
              ${t.rows.map((row, i) => `
                <tr draggable="true" data-row="${i}">
                  <td><span class="drag-handle" title="Drag to reorder">⠿</span></td>
                  <td>
                    <input data-item="${i}" data-field="itemName"    value="${esc(row.itemName)}"    placeholder="Item name" />
                    <input data-item="${i}" data-field="description" value="${esc(row.description)}" placeholder="Description (optional)" style="margin-top:4px;font-size:0.78rem;" />
                  </td>
                  <td><input data-item="${i}" data-field="hsn" value="${esc(row.hsn||"")}" placeholder="9983" /></td>
                  <td><input type="number" min="0" data-item="${i}" data-field="quantity"  value="${row.qty}" /></td>
                  <td>
                    <select data-item="${i}" data-field="unit">
                      ${UNITS.map(u=>`<option ${(row.unit||"pcs")===u?"selected":""}>${u}</option>`).join("")}
                    </select>
                  </td>
                  <td><input type="number" min="0" step="0.01" data-item="${i}" data-field="unitPrice" value="${row.rate}" /></td>
                  <td><input type="number" min="0" step="0.01" data-item="${i}" data-field="discount"  value="${row.itemDisc}" /></td>
                  <td>
                    <select data-item="${i}" data-field="taxPercent">
                      ${GST_RATES.map(r=>`<option value="${r}" ${row.taxRate===r?"selected":""}>${r}%</option>`).join("")}
                      <option value="custom" ${!GST_RATES.includes(row.taxRate)?"selected":""}>Custom</option>
                    </select>
                    ${!GST_RATES.includes(row.taxRate)?`<input type="number" min="0" max="100" data-item="${i}" data-field="taxPercent" value="${row.taxRate}" style="margin-top:4px;" />`:``}
                  </td>
                  <td class="item-amount">${fmt(row.lineTotal, cur)}</td>
                  <td><button class="item-remove" data-remove="${i}" title="Remove row">✕</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. Discount & Charges -->
      <div class="section-card">
        <div class="section-head"><h3>5 · Discounts &amp; Additional Charges</h3></div>
        <div class="section-body">
          <div class="form-g3" style="margin-bottom:12px;">
            <label>Discount Label<input class="field" data-path="invoiceDiscount.label" value="${esc(d.invoiceDiscount?.label||"Discount")}" /></label>
            <label>Discount Type
              <select class="field" data-path="invoiceDiscount.type" id="discType">
                <option value="percent" ${d.invoiceDiscount?.type==="percent"?"selected":""}>Percentage (%)</option>
                <option value="amount"  ${d.invoiceDiscount?.type==="amount" ?"selected":""}>Fixed Amount (${esc(cur)})</option>
              </select>
            </label>
            <label>Discount Value
              <div class="field-inline">
                <span style="color:var(--muted);font-size:0.85rem;">${d.invoiceDiscount?.type==="percent"?"%":cur}</span>
                <input class="field" type="number" min="0" step="0.01" data-path="invoiceDiscount.value" value="${d.invoiceDiscount?.value||0}" />
              </div>
            </label>
          </div>

          <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:0.82rem;font-weight:600;color:var(--muted);">Additional Charges</span>
            <button class="secondary-btn" id="addChargeBtn" type="button">+ Add Charge</button>
          </div>
          <div id="chargesContainer">
            ${(d.charges||[]).map((ch,i) => `
              <div class="charge-row" data-charge-idx="${i}">
                <input class="field" data-charge="${i}" data-cf="label"  value="${esc(ch.label)}" placeholder="Label (e.g. Shipping)" />
                <input class="field" type="number" min="0" step="0.01" data-charge="${i}" data-cf="amount" value="${ch.amount||0}" style="max-width:120px;" />
                <label style="flex-direction:row;align-items:center;gap:5px;color:var(--muted);font-size:0.8rem;white-space:nowrap;">
                  <input type="checkbox" data-charge="${i}" data-cf="taxable" ${ch.taxable?"checked":""} /> Taxable
                </label>
                <button class="item-remove" data-rem-charge="${i}" title="Remove">✕</button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 6. Tax Configuration -->
      <div class="section-card">
        <div class="section-head"><h3>6 · Tax Configuration</h3></div>
        <div class="section-body">
          <div class="form-g3">
            <label style="flex-direction:row;align-items:center;gap:8px;">
              <input type="checkbox" id="tdsToggle" ${d.tds?.enabled?"checked":""} />
              <span>Enable TDS</span>
            </label>
            ${d.tds?.enabled ? `
              <label>TDS Label<input class="field" data-path="tds.label" value="${esc(d.tds?.label||"TDS")}" /></label>
              <label>TDS Type
                <select class="field" data-path="tds.type">
                  <option value="percent" ${d.tds?.type==="percent"?"selected":""}>Percentage (%)</option>
                  <option value="amount"  ${d.tds?.type==="amount" ?"selected":""}>Fixed Amount</option>
                </select>
              </label>
              <label>TDS Value<input class="field" type="number" min="0" step="0.01" data-path="tds.value" value="${d.tds?.value||2}" /></label>
            ` : ``}
            <label style="flex-direction:row;align-items:center;gap:8px;">
              <input type="checkbox" id="roundOffToggle" ${d.roundOff?"checked":""} />
              <span>Enable Round Off</span>
            </label>
          </div>
          <div style="margin-top:10px;padding:10px;background:var(--primary-soft);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--muted);">
            <strong>GST Rule:</strong>
            ${d.businessDetails?.state && d.placeOfSupply
              ? (d.businessDetails.state === d.placeOfSupply
                  ? `<span style="color:var(--success);">Intra-state → CGST + SGST applied</span>`
                  : `<span style="color:var(--info);">Inter-state → IGST applied</span>`)
              : `<span>Fill Business State &amp; Place of Supply to auto-determine GST type.</span>`}
            ${d.invoiceType === "Export Invoice" ? `<span style="color:var(--warning);"> (Export: 0% GST)</span>` : ``}
          </div>
        </div>
      </div>

      <!-- 7. Payment Info -->
      <div class="section-card">
        <div class="section-head"><h3>7 · Payment Information</h3></div>
        <div class="section-body">
          <div class="form-g3">
            <label>Amount Paid (${esc(cur)})<input class="field" type="number" min="0" step="0.01" data-path="amountPaid" value="${d.amountPaid||0}" /></label>
            <label style="flex-direction:row;align-items:center;gap:8px;margin-top:auto;">
              <input type="checkbox" id="showBankToggle" ${d.paymentInfo?.showBank?"checked":""} />
              <span style="color:var(--muted);">Show Bank Details on Invoice</span>
            </label>
            <label style="flex-direction:row;align-items:center;gap:8px;margin-top:auto;">
              <input type="checkbox" id="showUpiToggle" ${d.paymentInfo?.showUpi?"checked":""} />
              <span style="color:var(--muted);">Show UPI on Invoice</span>
            </label>
            <label>Payment Link (optional)<input class="field" data-path="paymentInfo.paymentLink" value="${esc(d.paymentInfo?.paymentLink||"")}" placeholder="https://razorpay.com/..." /></label>
          </div>
          <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px;">
            <div class="form-g3">
              <label style="flex-direction:row;align-items:center;gap:8px;">
                <input type="checkbox" id="recurringToggle" ${d.recurring?.enabled?"checked":""} />
                <span>Recurring Invoice</span>
              </label>
              ${d.recurring?.enabled ? `
                <label>Interval
                  <select class="field" data-path="recurring.interval">
                    ${["weekly","monthly","quarterly","half-yearly","yearly"].map(r=>`<option ${d.recurring?.interval===r?"selected":""}>${r}</option>`).join("")}
                  </select>
                </label>
                <label>Next Run Date<input class="field" type="date" data-path="recurring.nextRun" value="${d.recurring?.nextRun||""}" /></label>
              ` : ``}
            </div>
          </div>
        </div>
      </div>

      <!-- 8. Notes & Terms -->
      <div class="section-card">
        <div class="section-head"><h3>8 · Notes &amp; Terms</h3></div>
        <div class="section-body">
          <div class="form-g2">
            <label>Notes to Client<textarea class="field" rows="4" data-path="notes">${esc(d.notes)}</textarea></label>
            <label>Terms &amp; Conditions<textarea class="field" rows="4" data-path="terms">${esc(d.terms)}</textarea></label>
          </div>
        </div>
      </div>

    </div><!-- /editor-main -->

    <!-- ── SIDEBAR ── -->
    <div class="editor-sidebar">

      <!-- Totals -->
      <div class="summary-card">
        <div class="summary-title">Invoice Summary</div>
        <div class="summary-lines">
          <div class="summary-line"><span>Subtotal</span><span>${fmt(t.subtotal, cur)}</span></div>
          ${t.totalItemDiscount>0?`<div class="summary-line"><span>Item Discounts</span><span>−${fmt(t.totalItemDiscount,cur)}</span></div>`:""}
          ${t.invDiscAmt>0?`<div class="summary-line"><span>${esc(d.invoiceDiscount?.label||"Discount")}</span><span>−${fmt(t.invDiscAmt,cur)}</span></div>`:""}
          ${(t.totalItemDiscount>0||t.invDiscAmt>0)?`<div class="summary-line"><span>Taxable Amount</span><span><strong>${fmt(t.netTaxableBase,cur)}</strong></span></div>`:``}
          <div class="summary-divider"></div>
          ${t.cgstLines.map(l=>`<div class="summary-line"><span>CGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
          ${t.sgstLines.map(l=>`<div class="summary-line"><span>SGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
          ${t.igstLines.map(l=>`<div class="summary-line"><span>IGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
          ${t.totalCharges>0?`<div class="summary-line"><span>Additional Charges</span><span>${fmt(t.totalCharges,cur)}</span></div>`:""}
          ${t.roundOffAmt!==0?`<div class="summary-line"><span>Round Off</span><span>${t.roundOffAmt>0?"+":""}${fmt(t.roundOffAmt,cur)}</span></div>`:""}
          <div class="summary-divider"></div>
        </div>
        <div class="summary-grand"><span>Grand Total</span><span>${fmt(t.grandTotal, cur)}</span></div>
        ${t.tdsAmt>0?`<div class="summary-line" style="margin-top:6px;"><span>${esc(d.tds?.label||"TDS")}</span><span>−${fmt(t.tdsAmt,cur)}</span></div>`:""}
        ${t.amountPaid>0?`<div class="summary-line"><span>Amount Paid</span><span>−${fmt(t.amountPaid,cur)}</span></div>`:""}
        ${t.balanceDue>0?`<div class="summary-balance"><span>Balance Due</span><span>${fmt(t.balanceDue,cur)}</span></div>`:""}
        <div class="summary-tax-note">
          ${t.isIntraState?"CGST + SGST": t.isExport?"Zero-rated (Export)":"IGST"} applied
          · ${esc(d.placeOfSupply||"—")}
        </div>
      </div>

      <!-- Template & Color -->
      <div class="summary-card">
        <div class="summary-title">Template</div>
        <select class="field" id="templateSelect" style="margin-bottom:8px;">
          ${TEMPLATES.map(tp=>`<option value="${tp.id}" ${d.templateId===tp.id?"selected":""}>${tp.name}</option>`).join("")}
        </select>
        <div class="summary-title" style="margin-top:8px;">Invoice Color</div>
        <div class="color-swatches">
          ${PALETTE.map(c=>`<div class="color-swatch ${d.templateColor===c?"active":""}" data-color="${c}" style="background:${c}" title="${c}"></div>`).join("")}
        </div>
      </div>

      <!-- Actions -->
      <div class="summary-card editor-actions">
        <button class="primary-btn"   id="sendBtn"     type="button">Send Invoice</button>
        <button class="secondary-btn" id="saveDraftBtn" type="button">Save Draft</button>
        <button class="secondary-btn" id="previewBtn"  type="button">Preview PDF</button>
        <button class="secondary-btn" id="downloadBtn" type="button">Download PDF</button>
        <button class="ghost-btn"     id="undoBtn"     type="button">Undo (Ctrl+Z)</button>
      </div>

    </div><!-- /editor-sidebar -->
  </div><!-- /editor-wrap -->
  `;

  bindEditorEvents(t);
}

function bindEditorEvents() {
  const root = document.getElementById("screenRoot");
  const d    = state.editorDraft;

  // Generic path-bound fields
  root.querySelectorAll("[data-path]").forEach(el => {
    el.addEventListener("input", () => {
      setPath(d, el.dataset.path, parseVal(el));
      if (["issueDate","paymentInfo.terms","paymentInfo.customDays"].includes(el.dataset.path)) syncDueDate();
      markDirty(); renderEditor();
    });
  });

  // Line items
  root.querySelectorAll("[data-item][data-field]").forEach(el => {
    el.addEventListener("input", () => {
      const i    = +el.dataset.item;
      const field= el.dataset.field;
      const row  = d.lineItems[i]; if (!row) return;
      if (field === "taxPercent" && el.tagName === "SELECT" && el.value === "custom") return;
      const numFields = ["quantity","unitPrice","discount","taxPercent"];
      row[field] = numFields.includes(field) ? +el.value || 0 : el.value;
      markDirty(); renderEditor();
    });
  });

  // Charge fields
  root.querySelectorAll("[data-charge][data-cf]").forEach(el => {
    el.addEventListener(el.type==="checkbox"?"change":"input", () => {
      const i  = +el.dataset.charge;
      const cf = el.dataset.cf;
      const ch = d.charges[i]; if (!ch) return;
      ch[cf] = el.type==="checkbox" ? el.checked : (cf==="amount" ? +el.value||0 : el.value);
      markDirty(); renderEditor();
    });
  });

  // Add item
  document.getElementById("addItemBtn")?.addEventListener("click", () => {
    d.lineItems.push({ id:uid("li"), itemName:"", description:"", hsn:"", quantity:1, unit:"pcs", unitPrice:0, discount:0, taxPercent:18 });
    markDirty(); renderEditor();
  });

  // Remove item
  root.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", () => {
    const i = +btn.dataset.remove;
    d.lineItems.splice(i, 1);
    if (!d.lineItems.length) d.lineItems.push({ id:uid("li"), itemName:"", description:"", hsn:"", quantity:1, unit:"pcs", unitPrice:0, discount:0, taxPercent:18 });
    markDirty(); renderEditor();
  }));

  // Add charge
  document.getElementById("addChargeBtn")?.addEventListener("click", () => {
    d.charges.push({ id:uid("ch"), label:"", amount:0, taxable:false });
    markDirty(); renderEditor();
  });

  // Remove charge
  root.querySelectorAll("[data-rem-charge]").forEach(btn => btn.addEventListener("click", () => {
    d.charges.splice(+btn.dataset.remCharge, 1);
    markDirty(); renderEditor();
  }));

  // Drag & drop rows
  root.querySelectorAll("tr[data-row]").forEach(row => {
    row.addEventListener("dragstart", () => { dragIdx = +row.dataset.row; });
    row.addEventListener("dragover",  e => e.preventDefault());
    row.addEventListener("drop", () => {
      const to = +row.dataset.row;
      if (dragIdx !== null && dragIdx !== to) {
        const [item] = d.lineItems.splice(dragIdx, 1);
        d.lineItems.splice(to, 0, item);
        markDirty(); renderEditor();
      }
      dragIdx = null;
    });
  });

  // Client selector
  document.getElementById("clientSelector")?.addEventListener("change", e => {
    const id  = e.target.value;
    d.clientId= id;
    if (id) {
      const cli = state.clients.find(c => c.id === id);
      if (cli) d.clientDetails = deepCopy(cli);
    }
    markDirty(); renderEditor();
  });

  // Add client btn
  document.getElementById("addClientBtn")?.addEventListener("click", () => showModal("clientModal"));

  // TDS toggle
  document.getElementById("tdsToggle")?.addEventListener("change", e => {
    d.tds = d.tds || { type:"percent", value:2, label:"TDS" };
    d.tds.enabled = e.target.checked;
    markDirty(); renderEditor();
  });

  // Round-off toggle
  document.getElementById("roundOffToggle")?.addEventListener("change", e => {
    d.roundOff = e.target.checked;
    markDirty(); renderEditor();
  });

  // Show bank / UPI toggles
  document.getElementById("showBankToggle")?.addEventListener("change", e => { d.paymentInfo.showBank = e.target.checked; markDirty(); });
  document.getElementById("showUpiToggle")?.addEventListener("change",  e => { d.paymentInfo.showUpi  = e.target.checked; markDirty(); });

  // Recurring toggle
  document.getElementById("recurringToggle")?.addEventListener("change", e => {
    d.recurring.enabled = e.target.checked;
    if (e.target.checked && !d.recurring.nextRun) d.recurring.nextRun = addDaysISO(d.issueDate, 30);
    markDirty(); renderEditor();
  });

  // Template select
  document.getElementById("templateSelect")?.addEventListener("change", e => {
    d.templateId = e.target.value;
    state.template = e.target.value;
    markDirty(); renderEditor();
  });

  // Color swatches
  root.querySelectorAll(".color-swatch").forEach(sw => sw.addEventListener("click", () => {
    d.templateColor      = sw.dataset.color;
    state.templateColor  = sw.dataset.color;
    markDirty(); renderEditor();
  }));

  // Actions
  document.getElementById("backBtn")?.addEventListener("click",     () => { state.ui.route="dashboard"; saveState(); render(); });
  document.getElementById("saveDraftBtn")?.addEventListener("click", () => saveDraft());
  document.getElementById("sendBtn")?.addEventListener("click",      () => sendInvoice());
  document.getElementById("previewBtn")?.addEventListener("click",   () => previewPdf());
  document.getElementById("downloadBtn")?.addEventListener("click",  () => downloadPdf(d));
  document.getElementById("undoBtn")?.addEventListener("click",      () => undoChange());
}

function setPath(obj, path, val) {
  const keys = path.split(".");
  let ref = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!ref[keys[i]] || typeof ref[keys[i]] !== "object") ref[keys[i]] = {};
    ref = ref[keys[i]];
  }
  ref[keys[keys.length - 1]] = val;
}

function parseVal(el) {
  if (el.type === "number")   return +el.value || 0;
  if (el.type === "checkbox") return el.checked;
  return el.value;
}

function syncDueDate() {
  const d    = state.editorDraft; if (!d) return;
  const issue= d.issueDate || todayIso();
  const terms= d.paymentInfo.terms;
  let days   = +d.paymentInfo.customDays || 0;
  if (terms === "Net 7")           days = 7;
  if (terms === "Net 15")          days = 15;
  if (terms === "Net 30")          days = 30;
  if (terms === "Net 45")          days = 45;
  if (terms === "Net 60")          days = 60;
  if (terms === "Due on Receipt")  days = 0;
  d.paymentInfo.customDays = days;
  d.dueDate = addDaysISO(issue, days);
}

function markDirty() {
  state.ui.editorDirty    = true;
  state.editorDraft.updatedAt = new Date().toISOString();
  const h   = state.ui.editorHistory;
  const snap= deepCopy(state.editorDraft);
  if (!h.length || JSON.stringify(h[h.length-1]) !== JSON.stringify(snap)) {
    h.push(snap);
    if (h.length > 40) h.shift();
  }
}

function undoChange() {
  const h = state.ui.editorHistory;
  if (h.length <= 1) return showToast("Nothing to undo.");
  h.pop();
  state.editorDraft     = deepCopy(h[h.length-1]);
  state.ui.editorDirty  = true;
  renderEditor();
  showToast("Undone.");
}

function saveDraft() {
  if (!state.editorDraft) return;
  const inv = deepCopy(state.editorDraft);
  inv.status = "Draft";
  ensureTimeline(inv, "Created");
  logActivity(inv, "Draft saved.");
  upsertInvoice(inv);
  state.editorDraft       = inv;
  state.ui.editorDirty    = false;
  state.ui.autosaveLabel  = `Saved ${new Date().toLocaleTimeString()}`;
  saveState(); showToast("Draft saved."); renderEditor();
}

function sendInvoice() {
  if (!state.editorDraft) return;
  const inv   = deepCopy(state.editorDraft);
  inv.status  = "Sent"; inv.deleted = false;
  ensureTimeline(inv, "Created"); ensureTimeline(inv, "Sent");
  logActivity(inv, "Invoice sent to client.");
  upsertInvoice(inv);
  state.editorDraft       = inv;
  state.ui.editorDirty    = false;
  state.ui.route          = "view";
  state.ui.viewingId      = inv.id;
  state.notifications.unshift({ id:uid("note"), at:new Date().toISOString(), text:`Invoice ${inv.invoiceNumber} sent.`, read:false });
  saveState(); render();
}

function previewPdf() {
  if (!state.editorDraft) return;
  openPrintPreview(state.editorDraft, calculateTotals(state.editorDraft), true);
}

function startAutosave() {
  if (autosaveTimer) return;
  autosaveTimer = setInterval(() => {
    if (state.ui.route !== "editor" || !state.editorDraft || !state.ui.editorDirty) return;
    const inv = deepCopy(state.editorDraft);
    inv.status = inv.status || "Draft";
    logActivity(inv, "Autosaved.");
    upsertInvoice(inv);
    state.editorDraft      = inv;
    state.ui.editorDirty   = false;
    state.ui.autosaveLabel = `Autosaved ${new Date().toLocaleTimeString()}`;
    saveState(); renderEditor();
  }, AUTOSAVE_MS);
}

function stopAutosave() {
  if (autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null; }
}

// ── INVOICE VIEW ──────────────────────────────────────────────
function renderView() {
  const root = document.getElementById("screenRoot");
  const inv  = getInvoiceById(state.ui.viewingId);
  if (!inv)  { state.ui.route = "dashboard"; return render(); }
  const t    = calculateTotals(inv);
  const steps= ["Created","Sent","Viewed","Paid"];

  root.innerHTML = `
    <div class="card" style="margin-bottom:12px;">
      <div class="view-header">
        <div class="view-title">Invoice ${esc(inv.invoiceNumber)}</div>
        <button class="ghost-btn" id="backFromView">← Dashboard</button>
      </div>

      <div class="timeline-strip">
        ${steps.map(s => {
          const found = (inv.timeline||[]).find(e => e.status===s);
          return `<div class="timeline-step ${found?"done":""}">
            <div class="ts-label">${s}</div>
            <div class="ts-date">${found ? fmtDate(found.at) : "Pending"}</div>
          </div>`;
        }).join("")}
      </div>

      <div class="view-actions">
        <button class="secondary-btn" data-va="edit">Edit</button>
        <button class="secondary-btn" data-va="duplicate">Duplicate</button>
        <button class="secondary-btn" data-va="download">Download PDF</button>
        <button class="secondary-btn" data-va="remind">Send Reminder</button>
        <button class="secondary-btn" data-va="paid">Mark as Paid</button>
        <button class="danger-btn"    data-va="delete">Delete</button>
      </div>
    </div>

    <div class="inv-preview">
      ${buildPreviewHtml(inv, t)}
    </div>

    <div class="card" style="margin-top:12px;">
      <h3 style="font-size:0.88rem;font-weight:600;margin-bottom:10px;">Activity History</h3>
      <div class="activity-log">
        ${(inv.activity||[]).map(a => `
          <div class="log-item">
            <div class="log-dot"></div>
            <div>
              <div>${esc(a.text)}</div>
              <div class="log-time">${fmtDate(a.at)}</div>
            </div>
          </div>
        `).join("") || `<div class="log-item"><div class="log-dot"></div><div>No activity yet.</div></div>`}
      </div>
    </div>
  `;

  document.getElementById("backFromView").addEventListener("click", () => { state.ui.route="dashboard"; saveState(); render(); });
  document.querySelectorAll("[data-va]").forEach(btn => btn.addEventListener("click", () => handleViewAction(btn.dataset.va, inv.id)));
}

function handleViewAction(action, id) {
  if (action === "edit")      return openEditor(id);
  if (action === "duplicate") { openEditor(id, true); return showToast("Duplicate opened."); }
  if (action === "download")  { const inv = getInvoiceById(id); if (inv) downloadPdf(inv); return; }
  if (action === "paid")      { markPaid(id); saveState(); showToast("Marked as paid."); return renderView(); }
  if (action === "delete")    { const inv = getInvoiceById(id); if (!inv) return; inv.deleted=true; logActivity(inv,"Deleted from view."); state.ui.route="dashboard"; saveState(); render(); }
  if (action === "remind")    {
    const inv = getInvoiceById(id); if (!inv) return;
    logActivity(inv, "Payment reminder sent via email and WhatsApp.");
    state.notifications.unshift({ id:uid("note"), at:new Date().toISOString(), text:`Reminder sent for ${inv.invoiceNumber}.`, read:false });
    saveState(); showToast("Reminder sent."); renderView();
  }
}

// ── CLIENTS ───────────────────────────────────────────────────
function renderClients() {
  const root    = document.getElementById("screenRoot");
  const clients = getOrgClients();

  root.innerHTML = `
    <div class="clients-header">
      <div class="dash-title">Clients</div>
      <button class="primary-btn" id="addClientTopBtn">+ Add Client</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>GSTIN</th><th>Phone</th><th>Email</th><th>State</th><th>Actions</th></tr></thead>
          <tbody>
            ${clients.length ? clients.map(c => `
              <tr>
                <td><strong>${esc(c.name)}</strong></td>
                <td>${esc(c.clientType||"Company")}</td>
                <td>${esc(c.gstin||"—")}</td>
                <td>${esc(c.phone||"—")}</td>
                <td>${esc(c.email||"—")}</td>
                <td>${esc(c.state||"—")}</td>
                <td>
                  <div class="td-actions">
                    <button data-cli-create="${c.id}">Create Invoice</button>
                    <button data-cli-del="${c.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("") : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px;">No clients found. Add one above.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("addClientTopBtn").addEventListener("click", () => showModal("clientModal"));
  document.querySelectorAll("[data-cli-create]").forEach(btn => btn.addEventListener("click", () => {
    const c = state.clients.find(x => x.id === btn.dataset.cliCreate); if (!c) return;
    openEditor();
    state.editorDraft.clientId      = c.id;
    state.editorDraft.clientDetails = deepCopy(c);
    renderEditor();
  }));
  document.querySelectorAll("[data-cli-del]").forEach(btn => btn.addEventListener("click", () => {
    state.clients = state.clients.filter(c => c.id !== btn.dataset.cliDel);
    saveState(); renderClients();
    showToast("Client removed.");
  }));
}

// ── STATUS HELPERS ────────────────────────────────────────────
function markSent(id)   { const inv=getInvoiceById(id); if (!inv) return; inv.status="Sent";  ensureTimeline(inv,"Created"); ensureTimeline(inv,"Sent"); logActivity(inv,"Invoice sent."); }
function markViewed(id) { const inv=getInvoiceById(id); if (!inv) return; ensureTimeline(inv,"Viewed"); logActivity(inv,"Invoice viewed."); }
function markPaid(id)   {
  const inv=getInvoiceById(id); if (!inv) return;
  const t=calculateTotals(inv); inv.amountPaid=t.grandTotal; inv.status="Paid";
  ensureTimeline(inv,"Paid"); logActivity(inv,"Payment received — marked as paid.");
  state.notifications.unshift({ id:uid("note"), at:new Date().toISOString(), text:`Payment confirmed for ${inv.invoiceNumber}.`, read:false });
}

function ensureTimeline(inv, status) {
  if (!(inv.timeline||[]).some(e => e.status===status))
    inv.timeline.push({ status, at:new Date().toISOString() });
}

function logActivity(inv, text) {
  inv.activity = inv.activity || [];
  inv.activity.unshift({ at:new Date().toISOString(), text });
  inv.updatedAt = new Date().toISOString();
}

// ── AUTOMATION ────────────────────────────────────────────────
function runAutomation() {
  const today = todayIso();
  let created = 0, reminders = 0;
  getOrgInvoices().forEach(inv => {
    if (inv.deleted) return;
    if (inv.recurring?.enabled && inv.recurring?.nextRun && inv.recurring.nextRun <= today) {
      const dup = deepCopy(inv);
      dup.id            = uid("inv");
      dup.invoiceNumber = nextInvoiceNumber();
      dup.issueDate     = inv.recurring.nextRun;
      dup.dueDate       = addDaysISO(dup.issueDate, dup.paymentInfo?.customDays || 30);
      dup.status        = "Draft"; dup.amountPaid = 0; dup.deleted = false;
      dup.timeline      = [{ status:"Created", at:new Date().toISOString() }];
      dup.activity      = [{ at:new Date().toISOString(), text:"Auto-created from recurring schedule." }];
      const step = { weekly:7, monthly:30, quarterly:90, "half-yearly":180, yearly:365 };
      inv.recurring.nextRun = addDaysISO(inv.recurring.nextRun, step[inv.recurring.interval] || 30);
      logActivity(inv, `Recurring executed. Next: ${inv.recurring.nextRun}`);
      state.invoices.unshift(dup); created++;
    }
    if (isOverdue(inv)) { logActivity(inv, "Automated overdue reminder sent."); reminders++; }
  });
  if (created || reminders) state.notifications.unshift({ id:uid("note"), at:new Date().toISOString(), text:`Automation: ${created} recurring, ${reminders} reminders.`, read:false });
  return { created, reminders };
}

// ── TEMPLATE GALLERY ──────────────────────────────────────────
function renderTemplateGallery() {
  const grid = document.getElementById("templateGrid");
  if (!grid) return;
  grid.innerHTML = TEMPLATES.map(tp => `
    <div class="tmpl-card ${state.template===tp.id?"active":""}" data-tmpl="${tp.id}">
      <div class="tmpl-thumb tmpl-thumb-${tp.id}"></div>
      <div class="tmpl-info">
        <strong>${tp.name}</strong>
        <small>${tp.desc}</small>
        <button class="tmpl-use-btn" data-tmpl-sel="${tp.id}">Use Template</button>
      </div>
    </div>
  `).join("");
  grid.querySelectorAll("[data-tmpl-sel]").forEach(btn => btn.addEventListener("click", () => {
    const id = btn.dataset.tmplSel;
    state.template = id;
    if (state.editorDraft) { state.editorDraft.templateId = id; markDirty(); }
    saveState(); renderTemplateGallery();
    if (state.ui.route==="editor") renderEditor();
    hideModal("templateModal");
    showToast(`Template: ${id}`);
  }));
}

// ── PDF GENERATION ────────────────────────────────────────────
function downloadPdf(invoice) {
  openPrintPreview(invoice, calculateTotals(invoice), false);
}

function openPrintPreview(invoice, totals, previewOnly) {
  const stage = document.createElement("div");
  stage.className = "print-stage";
  stage.innerHTML = buildPrintHtml(invoice, totals);
  document.body.appendChild(stage);
  const sheet = stage.querySelector(".print-sheet");
  const fname = `${(invoice.invoiceNumber||"invoice").replace(/[^a-z0-9-_]/gi,"-")}.pdf`;
  if (typeof window.html2pdf !== "function") { window.print(); stage.remove(); return; }
  const opts = {
    margin:     [5,5,5,5],
    filename:   fname,
    image:      { type:"jpeg", quality:0.98 },
    html2canvas:{ scale:2, backgroundColor:"#fff", useCORS:true },
    jsPDF:      { unit:"mm", format:"a4", orientation:"portrait" },
  };
  if (previewOnly) {
    window.html2pdf().set(opts).from(sheet).toPdf().get("pdf").then(pdf => {
      const url = URL.createObjectURL(pdf.output("blob"));
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    }).finally(() => stage.remove());
  } else {
    window.html2pdf().set(opts).from(sheet).save().finally(() => stage.remove());
  }
}

function buildPreviewHtml(invoice, t) {
  const cur = t.currency;
  const isIntra = t.isIntraState;
  return `
    <div class="inv-preview-head">
      <div>
        <div class="inv-preview-title">${esc(invoice.invoiceType || "Tax Invoice")}</div>
        <div class="inv-preview-meta">
          #${esc(invoice.invoiceNumber)} &nbsp;·&nbsp;
          ${fmtDate(invoice.issueDate)} &nbsp;·&nbsp;
          Due: ${fmtDate(invoice.dueDate)}
          ${invoice.reference ? " &nbsp;·&nbsp; PO: " + esc(invoice.reference) : ""}
        </div>
      </div>
      <div><span class="status-badge status-${resolveStatus(invoice).toLowerCase()}">${resolveStatus(invoice)}</span></div>
    </div>
    <div class="inv-preview-parties">
      <div class="inv-party-box">
        <h5>Billed By</h5>
        <strong>${esc(invoice.businessDetails?.businessName||"—")}</strong>
        <div>${esc(invoice.businessDetails?.address||"")}</div>
        ${invoice.businessDetails?.gstin?`<div>GSTIN: ${esc(invoice.businessDetails.gstin)}</div>`:""}
        <div>${esc(invoice.businessDetails?.phone||"")} ${invoice.businessDetails?.email?"· "+esc(invoice.businessDetails.email):""}</div>
      </div>
      <div class="inv-party-box">
        <h5>Billed To</h5>
        <strong>${esc(invoice.clientDetails?.name||"—")}</strong>
        <div>${esc(invoice.clientDetails?.address||"")}</div>
        ${invoice.clientDetails?.gstin?`<div>GSTIN: ${esc(invoice.clientDetails.gstin)}</div>`:""}
        <div>${esc(invoice.clientDetails?.phone||"")} ${invoice.clientDetails?.email?"· "+esc(invoice.clientDetails.email):""}</div>
        ${invoice.placeOfSupply?`<div>Place of Supply: ${esc(invoice.placeOfSupply)}</div>`:""}
      </div>
    </div>
    <table class="preview-table">
      <thead>
        <tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Disc.</th><th>Tax</th><th>Amount</th></tr>
      </thead>
      <tbody>
        ${t.rows.map((r,i) => `
          <tr>
            <td>${i+1}</td>
            <td><strong>${esc(r.itemName)}</strong>${r.description?`<br><small style="color:#6b7280">${esc(r.description)}</small>`:""}</td>
            <td>${esc(r.hsn||"—")}</td>
            <td>${r.qty} ${esc(r.unit||"")}</td>
            <td>${fmt(r.rate,cur)}</td>
            <td>${r.itemDisc?fmt(r.itemDisc,cur):"—"}</td>
            <td>${r.taxRate}%</td>
            <td><strong>${fmt(r.lineTotal,cur)}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="inv-summary">
      <div class="inv-summary-row"><span>Subtotal</span><span>${fmt(t.subtotal,cur)}</span></div>
      ${t.totalItemDiscount>0?`<div class="inv-summary-row"><span>Item Discounts</span><span>−${fmt(t.totalItemDiscount,cur)}</span></div>`:""}
      ${t.invDiscAmt>0?`<div class="inv-summary-row"><span>${esc(invoice.invoiceDiscount?.label||"Discount")}</span><span>−${fmt(t.invDiscAmt,cur)}</span></div>`:""}
      <div class="inv-summary-divider"></div>
      ${t.cgstLines.map(l=>`<div class="inv-summary-row"><span>CGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
      ${t.sgstLines.map(l=>`<div class="inv-summary-row"><span>SGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
      ${t.igstLines.map(l=>`<div class="inv-summary-row"><span>IGST (${l.rate}%)</span><span>${fmt(l.amount,cur)}</span></div>`).join("")}
      ${t.totalCharges>0?`<div class="inv-summary-row"><span>Additional Charges</span><span>${fmt(t.totalCharges,cur)}</span></div>`:""}
      ${t.roundOffAmt!==0?`<div class="inv-summary-row"><span>Round Off</span><span>${t.roundOffAmt>0?"+":""}${fmt(t.roundOffAmt,cur)}</span></div>`:""}
      <div class="inv-summary-divider"></div>
      <div class="inv-summary-row inv-summary-grand"><span>Grand Total</span><span>${fmt(t.grandTotal,cur)}</span></div>
      ${t.tdsAmt>0?`<div class="inv-summary-row"><span>${esc(invoice.tds?.label||"TDS")}</span><span>−${fmt(t.tdsAmt,cur)}</span></div>`:""}
      ${t.amountPaid>0?`<div class="inv-summary-row"><span>Amount Paid</span><span>−${fmt(t.amountPaid,cur)}</span></div>`:""}
      ${t.balanceDue>0?`<div class="inv-summary-row" style="font-weight:700;color:#dc2626;"><span>Balance Due</span><span>${fmt(t.balanceDue,cur)}</span></div>`:""}
    </div>
    <div class="inv-amount-words">${amountInWords(t.grandTotal)}</div>
    <div class="inv-gst-note">
      ${isIntra?"CGST + SGST applied (Intra-state)":t.isExport?"Zero-rated (Export)":"IGST applied (Inter-state)"}
    </div>
  `;
}

function buildPrintHtml(invoice, t) {
  const cur    = t.currency;
  const tmpl   = invoice.templateId || "classic";
  const color  = invoice.templateColor || "#7c3aed";
  const biz    = invoice.businessDetails || {};
  const cli    = invoice.clientDetails   || {};
  const pay    = invoice.paymentInfo     || {};
  const isIntra= t.isIntraState;

  const headerStyle = (tmpl === "modern" || tmpl === "bold")
    ? `background:${color};color:#fff;padding:24px 40px 24px;margin:-36px -40px 20px;`
    : `border-bottom:3px solid ${color};padding-bottom:16px;margin-bottom:20px;`;

  const invTypeColor = (tmpl === "modern" || tmpl === "bold") ? "rgba(255,255,255,0.9)" : color;
  const metaColor    = (tmpl === "modern" || tmpl === "bold") ? "rgba(255,255,255,0.75)" : "#6b7280";
  const bizAddrColor = (tmpl === "modern" || tmpl === "bold") ? "rgba(255,255,255,0.8)"  : "#6b7280";

  return `
  <div class="print-sheet print-${tmpl}">

    <!-- Header -->
    <div style="${headerStyle}display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:14px;font-weight:800;color:${(tmpl==="modern"||tmpl==="bold")?"#fff":color};">${esc(biz.businessName||"Business Name")}</div>
        <div style="font-size:11px;color:${bizAddrColor};margin-top:4px;max-width:260px;">${esc(biz.address||"")}</div>
        ${biz.gstin?`<div style="font-size:10px;color:${bizAddrColor};margin-top:2px;">GSTIN: ${esc(biz.gstin)}</div>`:""}
        ${biz.pan?`<div style="font-size:10px;color:${bizAddrColor};">PAN: ${esc(biz.pan)}</div>`:""}
        <div style="font-size:10px;color:${bizAddrColor};margin-top:2px;">${esc(biz.phone||"")} ${biz.email?"· "+esc(biz.email):""}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:15px;font-weight:700;color:${invTypeColor};margin-bottom:6px;">${esc(invoice.invoiceType||"Tax Invoice")}</div>
        <div style="font-size:12px;font-weight:600;color:${(tmpl==="modern"||tmpl==="bold")?"#fff":color};">#${esc(invoice.invoiceNumber)}</div>
        <div style="font-size:11px;color:${metaColor};margin-top:4px;">Date: ${fmtDate(invoice.issueDate)}</div>
        <div style="font-size:11px;color:${metaColor};">Due: ${fmtDate(invoice.dueDate)}</div>
        ${invoice.reference?`<div style="font-size:11px;color:${metaColor};">PO: ${esc(invoice.reference)}</div>`:""}
      </div>
    </div>

    <!-- Parties -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:11px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:6px;">Billed By</div>
        <div style="font-weight:700;font-size:12px;margin-bottom:3px;">${esc(biz.businessName||"")}</div>
        <div style="color:#6b7280;white-space:pre-wrap;">${esc(biz.address||"")}</div>
        ${biz.gstin?`<div style="margin-top:4px;font-weight:600;">GSTIN: ${esc(biz.gstin)}</div>`:""}
        ${biz.pan?`<div>PAN: ${esc(biz.pan)}</div>`:""}
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:11px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:6px;">Billed To</div>
        <div style="font-weight:700;font-size:12px;margin-bottom:3px;">${esc(cli.name||"")}</div>
        <div style="color:#6b7280;white-space:pre-wrap;">${esc(cli.address||"")}</div>
        ${cli.gstin?`<div style="margin-top:4px;font-weight:600;">GSTIN: ${esc(cli.gstin)}</div>`:""}
        ${cli.pan?`<div>PAN: ${esc(cli.pan)}</div>`:""}
        ${invoice.placeOfSupply?`<div style="margin-top:4px;color:#6b7280;">Place of Supply: ${esc(invoice.placeOfSupply)}</div>`:""}
      </div>
    </div>

    <!-- Line Items -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px;">
      <thead>
        <tr>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">#</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">Description</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;">HSN/SAC</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:center;">Qty</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Rate</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Discount</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:center;">Tax</th>
          <th style="border:1px solid #e5e7eb;padding:7px 9px;background:#f3f4f6;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;color:#6b7280;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${t.rows.map((r,i) => `
          <tr>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:center;color:#6b7280;">${i+1}</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;">
              <strong>${esc(r.itemName)}</strong>
              ${r.description?`<br><span style="font-size:10px;color:#6b7280;">${esc(r.description)}</span>`:""}
            </td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:center;color:#6b7280;">${esc(r.hsn||"—")}</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:center;">${r.qty} ${esc(r.unit||"")}</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:right;">${fmt(r.rate,cur)}</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:right;">${r.itemDisc?fmt(r.itemDisc,cur):"—"}</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:center;">${r.taxRate}%</td>
            <td style="border:1px solid #e5e7eb;padding:7px 9px;text-align:right;font-weight:600;">${fmt(r.lineTotal,cur)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Footer: Payment + Totals -->
    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin-top:8px;">

      <!-- Payment / Notes -->
      <div style="font-size:11px;">
        ${(pay.showBank && biz.bankName) ? `
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:6px;">Bank Details</div>
          <div style="display:flex;gap:4px;margin-bottom:2px;"><span style="color:#9ca3af;min-width:70px;">Bank</span><span>${esc(biz.bankName)}</span></div>
          <div style="display:flex;gap:4px;margin-bottom:2px;"><span style="color:#9ca3af;min-width:70px;">Account</span><span>${esc(biz.accountNumber||"")}</span></div>
          <div style="display:flex;gap:4px;margin-bottom:2px;"><span style="color:#9ca3af;min-width:70px;">IFSC</span><span>${esc(biz.ifscCode||"")}</span></div>
        ` : ""}
        ${(pay.showUpi && biz.upiId) ? `
          <div style="display:flex;gap:4px;margin-bottom:2px;margin-top:4px;"><span style="color:#9ca3af;min-width:70px;">UPI</span><span>${esc(biz.upiId)}</span></div>
        ` : ""}
        ${invoice.notes ? `
          <div style="margin-top:10px;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:4px;">Notes</div>
            <div style="color:#6b7280;">${esc(invoice.notes)}</div>
          </div>
        ` : ""}
        ${invoice.terms ? `
          <div style="margin-top:8px;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;margin-bottom:4px;">Terms &amp; Conditions</div>
            <div style="color:#6b7280;">${esc(invoice.terms)}</div>
          </div>
        ` : ""}
      </div>

      <!-- Totals -->
      <div style="font-size:11px;">
        ${row("Subtotal", fmt(t.subtotal,cur))}
        ${t.totalItemDiscount>0 ? row("Item Discounts", "−"+fmt(t.totalItemDiscount,cur)) : ""}
        ${t.invDiscAmt>0 ? row(esc(invoice.invoiceDiscount?.label||"Discount"), "−"+fmt(t.invDiscAmt,cur)) : ""}
        ${(t.totalItemDiscount>0||t.invDiscAmt>0) ? row("Taxable Amount", fmt(t.netTaxableBase,cur), true) : ""}
        ${t.cgstLines.map(l => row(`CGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
        ${t.sgstLines.map(l => row(`SGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
        ${t.igstLines.map(l => row(`IGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
        ${t.totalCharges>0 ? row("Additional Charges", fmt(t.totalCharges,cur)) : ""}
        ${t.roundOffAmt!==0 ? row("Round Off", (t.roundOffAmt>0?"+":"")+fmt(t.roundOffAmt,cur)) : ""}
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid ${color};font-size:13px;font-weight:700;color:${color};">
          <span>Grand Total</span><span>${fmt(t.grandTotal,cur)}</span>
        </div>
        ${t.tdsAmt>0 ? row(esc(invoice.tds?.label||"TDS"), "−"+fmt(t.tdsAmt,cur)) : ""}
        ${t.amountPaid>0 ? row("Amount Paid", "−"+fmt(t.amountPaid,cur)) : ""}
        ${t.balanceDue>0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:600;color:#dc2626;"><span>Balance Due</span><span>${fmt(t.balanceDue,cur)}</span></div>` : ""}
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #e5e7eb;font-size:10px;color:#6b7280;font-style:italic;">
          ${amountInWords(t.grandTotal)}
        </div>
        <div style="font-size:9px;color:#9ca3af;margin-top:4px;">
          ${isIntra?"CGST + SGST applied":t.isExport?"Zero-rated (Export)":"IGST applied"} · ${esc(invoice.placeOfSupply||"—")}
        </div>
      </div>
    </div>

    <!-- Signature row -->
    <div style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;font-size:11px;color:#9ca3af;">
      <div style="text-align:center;min-width:160px;">
        <div style="border-bottom:1px solid #d1d5db;padding-bottom:30px;margin-bottom:8px;"></div>
        Authorised Signatory<br>${esc(biz.businessName||"")}
      </div>
    </div>

    <div style="text-align:center;font-size:9px;color:#9ca3af;margin-top:20px;padding-top:12px;border-top:1px solid #f3f4f6;">
      This is a computer-generated invoice and does not require a physical signature.
    </div>

  </div>
  `;
}

function row(label, value, bold = false) {
  return `<div style="display:flex;justify-content:space-between;padding:3px 0;color:#374151;${bold?"font-weight:600;":""}"><span>${label}</span><span>${value}</span></div>`;
}

// ── CSV EXPORT ────────────────────────────────────────────────
function downloadCsv(invoices) {
  if (!invoices.length) return showToast("No invoices to export.");
  const headers = ["Invoice #","Type","Client","GSTIN","Issue Date","Due Date","Currency","Subtotal","GST","Grand Total","Balance Due","Status"];
  const rows = invoices.map(inv => {
    const t = calculateTotals(inv);
    return [
      inv.invoiceNumber, inv.invoiceType, inv.clientDetails?.name||"",
      inv.clientDetails?.gstin||"", inv.issueDate, inv.dueDate,
      inv.currency, t.subtotal.toFixed(2), t.totalTax.toFixed(2),
      t.grandTotal.toFixed(2), t.balanceDue.toFixed(2), resolveStatus(inv),
    ];
  });
  const csv  = [headers,...rows].map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href:url, download:`invoices-${todayIso()}.csv` });
  a.click(); URL.revokeObjectURL(url);
  showToast("CSV exported.");
}

// ── MODAL / TOAST ─────────────────────────────────────────────
function showModal(id) { document.getElementById(id)?.classList.remove("hidden"); }
function hideModal(id) { document.getElementById(id)?.classList.add("hidden"); }

function showToast(msg, type = "") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className   = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3000);
}
