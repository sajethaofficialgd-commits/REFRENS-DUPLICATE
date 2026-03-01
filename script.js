/* ============================================================
   REFRENS-STYLE INVOICE GENERATOR — script.js
   Full GST Engine · CGST/SGST/IGST · HSN/SAC · TDS · Round-off
   ============================================================ */

// ── CONSTANTS ────────────────────────────────────────────────
const STORAGE_KEY  = "refrens_invoice_v3";
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
      if (p && p.version === 3) return p;
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

  const clients = [];

  const invoices = [];

  return {
    version: 3,
    theme: "light",
    template: "classic",
    templateColor: "#7c3aed",
    currentOrgId: "org_1",
    orgs, clients, invoices,
    notifications: [
      { id:uid("note"), at:new Date().toISOString(), text:"Ctrl+S save · Ctrl+Enter send · Ctrl+P preview · Ctrl+Z undo", read:false },
    ],
    editorDraft: null,
    ui: {
      route: "dashboard",
      dashboardTab: "active",
      viewingId: "",
      selectedIds: [],
      filters: { status:"all", client:"all", startDate:"", endDate:"", minAmt:"", maxAmt:"", search:"" },
      editorDirty: false,
      autosaveLabel: "",
      editorHistory: [],
      dashPage: 1,
      dashPerPage: 10,
      dashFiltersOpen: true,
      dashSummaryOpen: false,
      dashGraphOpen: false,
      dashSort: { col: "date", dir: "desc" },
      bizExpanded: false,
      discExpanded: false,
      chargesExpanded: false,
      notesTab: "notes",
      showPayLink: false,
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
    if (state.ui.route === "editor" && state.editorDraft) {
      state.editorDraft.clientId = client.id;
      state.editorDraft.clientDetails = deepCopy(client);
      markDirty();
    }
    e.target.reset();
    hideModal("clientModal");
    saveState();
    if (state.ui.route === "editor")  renderEditor();
    if (state.ui.route === "clients") renderClients();
    showToast("Client saved successfully.");
  });

  document.addEventListener("keydown", e => {
    if (state.ui.route !== "editor") return;
    if (e.ctrlKey && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); }
    if (e.ctrlKey && e.key === "Enter")            { e.preventDefault(); sendInvoice(); }
    if (e.ctrlKey && e.key.toLowerCase() === "p")  { e.preventDefault(); previewPdf(); }
    if (e.ctrlKey && e.key.toLowerCase() === "z")  { e.preventDefault(); undoChange(); }
    // Prevent Space from scrolling the page when not inside an input/textarea
    if (e.key === " ") {
      const tag = document.activeElement?.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
      }
    }
  });
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const root    = document.getElementById("screenRoot");
  const org     = getCurrentOrg();
  const allInv  = applyFilters(getOrgInvoices());
  const clients = getOrgClients();
  const cur     = org.currency;
  const ui      = state.ui;

  // ensure new state fields exist on old saved states
  if (!ui.dashPage)    ui.dashPage    = 1;
  if (!ui.dashPerPage) ui.dashPerPage = 10;
  if (ui.dashFiltersOpen === undefined) ui.dashFiltersOpen = true;
  if (ui.dashSummaryOpen === undefined) ui.dashSummaryOpen = false;
  if (ui.dashGraphOpen   === undefined) ui.dashGraphOpen   = false;
  if (!ui.dashSort) ui.dashSort = { col:"date", dir:"desc" };

  // ── Sort ──────────────────────────────────────────────────
  const sortedInv = [...allInv].sort((a, b) => {
    const dir = ui.dashSort.dir === "asc" ? 1 : -1;
    if (ui.dashSort.col === "date")    return dir * (new Date(a.issueDate) - new Date(b.issueDate));
    if (ui.dashSort.col === "invoice") return dir * a.invoiceNumber.localeCompare(b.invoiceNumber);
    if (ui.dashSort.col === "amount")  return dir * (calculateTotals(a).grandTotal - calculateTotals(b).grandTotal);
    if (ui.dashSort.col === "due")     return dir * (new Date(a.dueDate) - new Date(b.dueDate));
    return 0;
  });

  // ── Pagination ────────────────────────────────────────────
  const total      = sortedInv.length;
  const totalPages = Math.max(1, Math.ceil(total / ui.dashPerPage));
  if (ui.dashPage > totalPages) ui.dashPage = totalPages;
  const start   = (ui.dashPage - 1) * ui.dashPerPage;
  const pageInv = sortedInv.slice(start, start + ui.dashPerPage);

  // ── Metrics (from ALL invoices, not paginated) ────────────
  const metrics = allInv.reduce((acc, inv) => {
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

  // ── Active filter chips ───────────────────────────────────
  const f = ui.filters;
  const chips = [];
  if (f.status !== "all") chips.push({ label: f.status, key:"status" });
  if (f.client !== "all") { const c = clients.find(x=>x.id===f.client); chips.push({ label: c?.name||"Client", key:"client" }); }
  if (f.startDate) chips.push({ label: "From: "+f.startDate, key:"startDate" });
  if (f.endDate)   chips.push({ label: "To: "+f.endDate,     key:"endDate" });
  if (f.minAmt)    chips.push({ label: "Min: "+f.minAmt,     key:"minAmt" });
  if (f.maxAmt)    chips.push({ label: "Max: "+f.maxAmt,     key:"maxAmt" });

  // ── Sort arrow helper ─────────────────────────────────────
  const sortArrow = col => ui.dashSort.col === col ? (ui.dashSort.dir==="asc"?" ↑":" ↓") : "";

  // ── Page buttons ──────────────────────────────────────────
  const pageButtons = () => {
    let btns = "";
    const maxBtns = 5;
    let s2 = Math.max(1, ui.dashPage - 2);
    let e2 = Math.min(totalPages, s2 + maxBtns - 1);
    if (e2 - s2 < maxBtns - 1) s2 = Math.max(1, e2 - maxBtns + 1);
    for (let p = s2; p <= e2; p++) {
      btns += `<button class="page-btn ${p===ui.dashPage?"active":""}" data-page="${p}">${p}</button>`;
    }
    return btns;
  };

  root.innerHTML = `
    <!-- ── TOP BAR ── -->
    <div class="dash-header">
      <div class="dash-title">Invoices</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div class="tab-bar" style="margin:0;">
          ${["active","recurring","deleted"].map(t => `<button class="tab-pill ${ui.dashboardTab===t?"active":""}" data-tab="${t}" type="button">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join("")}
        </div>
        <button class="primary-btn" id="dashCreateBtn" type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Invoice
        </button>
      </div>
    </div>

    <!-- ── FILTERS CARD ── -->
    <div class="card dash-filters-card">
      <div class="dash-filters-head" id="toggleFilters">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          <strong style="font-size:0.88rem;">Filters</strong>
          ${chips.length ? `<button class="clear-filters-link" id="clearFiltersBtn">× Clear All Filters</button>` : ""}
        </div>
        <svg class="collapse-arrow ${ui.dashFiltersOpen?"open":""}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      ${ui.dashFiltersOpen ? `
      <div class="dash-filters-body">
        <div class="filters-grid">
          <label class="filter-field-label">Select Invoice Status
            <select class="field" id="fStatus">
              <option value="all">All</option>
              ${["Draft","Sent","Viewed","Paid","Overdue"].map(s => `<option value="${s}" ${f.status===s?"selected":""}>${s}</option>`).join("")}
            </select>
          </label>
          <label class="filter-field-label">Search Client
            <select class="field" id="fClient">
              <option value="all">All Clients</option>
              ${clients.map(c => `<option value="${c.id}" ${f.client===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}
            </select>
          </label>
          <label class="filter-field-label">Select Date Range
            <div class="date-range-wrap">
              <input class="field" id="fStart" type="date" value="${f.startDate}" placeholder="Start date" />
              <span style="color:var(--muted);font-size:0.78rem;">—</span>
              <input class="field" id="fEnd" type="date" value="${f.endDate}" placeholder="End date" />
            </div>
          </label>
          <label class="filter-field-label">Amount Range
            <div class="date-range-wrap">
              <input class="field" id="fMin" type="number" min="0" value="${f.minAmt}" placeholder="Min" />
              <span style="color:var(--muted);font-size:0.78rem;">—</span>
              <input class="field" id="fMax" type="number" min="0" value="${f.maxAmt}" placeholder="Max" />
            </div>
          </label>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
          <button class="primary-btn" id="applyFiltersBtn" style="padding:6px 16px;">Apply Filters</button>
          <button class="ghost-btn" id="clearFiltersBtn2">Clear</button>
          ${chips.length ? `<div class="active-chips">${chips.map(ch=>`<span class="filter-chip">${esc(ch.label)} <span class="chip-x" data-clear="${ch.key}">×</span></span>`).join("")}</div>` : `<span style="font-size:0.78rem;color:var(--muted);">Applied Filters: None</span>`}
        </div>
      </div>
      ` : ""}
    </div>

    <!-- ── INVOICE SUMMARY (collapsible) ── -->
    <div class="card dash-collapse-card">
      <div class="dash-collapse-head" id="toggleSummary">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg class="collapse-arrow ${ui.dashSummaryOpen?"open":""}" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          <strong style="font-size:0.88rem;">Invoice Summary</strong>
        </div>
      </div>
      ${ui.dashSummaryOpen ? `
      <div class="metric-grid" style="padding:16px;border-top:1px solid var(--line);">
        <div class="metric-card metric-primary">
          <div class="metric-label">Total Invoices</div>
          <div class="metric-value">${metrics.count}</div>
          <div class="metric-sub">${ui.dashboardTab} view</div>
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
          <div class="metric-label">Collected</div>
          <div class="metric-value">${fmt(metrics.paidAmt, cur)}</div>
          <div class="metric-sub">${metrics.paid} paid invoices</div>
        </div>
      </div>
      ` : ""}
    </div>

    <!-- ── INVOICE GRAPH (collapsible) ── -->
    <div class="card dash-collapse-card">
      <div class="dash-collapse-head" id="toggleGraph">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg class="collapse-arrow ${ui.dashGraphOpen?"open":""}" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          <strong style="font-size:0.88rem;">Invoice Graph</strong>
        </div>
      </div>
      ${ui.dashGraphOpen ? `
      <div style="padding:20px;border-top:1px solid var(--line);">
        ${renderMiniGraph(allInv, cur)}
      </div>
      ` : ""}
    </div>

    <!-- ── MAIN TABLE CARD ── -->
    <div class="card" style="padding:0;overflow:hidden;">

      <!-- Table toolbar -->
      <div class="table-toolbar">
        <div style="font-size:0.82rem;color:var(--muted);">
          Showing <strong>${start+1}</strong> to <strong>${Math.min(start+ui.dashPerPage, total)}</strong> of <strong>${total}</strong> Invoice${total!==1?"s":""}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${state.ui.selectedIds.length ? `
            <div class="bulk-bar" style="margin:0;padding:0;border:none;background:none;">
              <strong style="font-size:0.82rem;color:var(--primary);">${state.ui.selectedIds.length} selected</strong>
              <button class="secondary-btn" data-bulk="send">Send</button>
              <button class="secondary-btn" data-bulk="download">PDF</button>
              <button class="secondary-btn" data-bulk="paid">Mark Paid</button>
              <button class="danger-btn" data-bulk="delete">Delete</button>
            </div>
          ` : ""}
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:0.78rem;color:var(--muted);">Per page:</span>
            <select class="field" id="perPageSel" style="padding:3px 6px;width:auto;font-size:0.78rem;">
              ${[10,25,50].map(n=>`<option value="${n}" ${ui.dashPerPage===n?"selected":""}>${n}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap" style="margin:0;">
        <table class="dash-table">
          <thead>
            <tr>
              <th style="width:36px;"><input type="checkbox" id="selectAll" ${pageInv.length && state.ui.selectedIds.length===allInv.length?"checked":""}></th>
              <th style="width:36px;color:var(--muted);">#</th>
              <th class="sortable-th" data-sort="date">Date${sortArrow("date")}</th>
              <th class="sortable-th" data-sort="invoice">Invoice #${sortArrow("invoice")}</th>
              <th>Billed To</th>
              <th class="sortable-th" data-sort="amount" style="text-align:right;">Amount${sortArrow("amount")}</th>
              <th>Status</th>
              <th class="sortable-th" data-sort="due">Due Date${sortArrow("due")}</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageInv.length ? pageInv.map((inv, idx) => {
              const s  = resolveStatus(inv);
              const tt = calculateTotals(inv);
              const rowNum = start + idx + 1;
              return `<tr class="dash-row">
                <td><input type="checkbox" data-sel="${inv.id}" ${state.ui.selectedIds.includes(inv.id)?"checked":""}></td>
                <td style="color:var(--muted);font-size:0.78rem;">${rowNum}</td>
                <td style="color:var(--muted);font-size:0.82rem;">${fmtDate(inv.issueDate)}</td>
                <td><strong style="font-size:0.85rem;">${esc(inv.invoiceNumber)}</strong>
                  ${inv.invoiceType&&inv.invoiceType!=="Tax Invoice"?`<div style="font-size:0.72rem;color:var(--muted);">${esc(inv.invoiceType)}</div>`:""}
                </td>
                <td>
                  <div style="font-weight:500;font-size:0.85rem;">${esc(inv.clientDetails?.name||"—")}</div>
                  ${inv.clientDetails?.gstin?`<div style="font-size:0.72rem;color:var(--muted);">${esc(inv.clientDetails.gstin)}</div>`:""}
                </td>
                <td style="text-align:right;font-weight:600;font-size:0.88rem;">${fmt(tt.grandTotal, inv.currency)}</td>
                <td><span class="status-badge status-${s.toLowerCase()}">${s}</span>
                  ${tt.balanceDue>0&&s!=="Paid"?`<div style="font-size:0.72rem;color:var(--danger);">Due ${fmtDate(inv.dueDate)}</div>`:""}
                </td>
                <td style="font-size:0.82rem;color:var(--muted);">${fmtDate(inv.dueDate)}</td>
                <td>
                  <div class="row-actions">
                    <button class="row-act-btn" data-action="view"      data-id="${inv.id}" title="Open">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Open
                    </button>
                    <button class="row-act-btn" data-action="edit"      data-id="${inv.id}" title="Edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button class="row-act-btn row-act-paid" data-action="paid" data-id="${inv.id}" title="Mark Paid">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Mark Paid
                    </button>
                    <button class="row-act-btn" data-action="duplicate" data-id="${inv.id}" title="Duplicate">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Duplicate
                    </button>
                    <button class="row-act-btn row-act-danger" data-action="delete" data-id="${inv.id}" title="Delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join("") : `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:48px 0;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3" style="display:block;margin:0 auto 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              No invoices found. <a href="#" id="emptyCreateLink" style="color:var(--primary);">Create your first invoice →</a>
            </td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      ${totalPages > 1 ? `
      <div class="pagination-bar">
        <button class="page-btn" data-page="${ui.dashPage-1}" ${ui.dashPage<=1?"disabled":""}>‹</button>
        ${pageButtons()}
        <button class="page-btn" data-page="${ui.dashPage+1}" ${ui.dashPage>=totalPages?"disabled":""}>›</button>
      </div>` : ""}

    </div>
  `;

  // ── Bind events ────────────────────────────────────────────
  document.getElementById("dashCreateBtn").addEventListener("click", () => openEditor());
  document.getElementById("emptyCreateLink")?.addEventListener("click", e => { e.preventDefault(); openEditor(); });

  // Collapsibles
  document.getElementById("toggleFilters").addEventListener("click",  () => { ui.dashFiltersOpen  = !ui.dashFiltersOpen;  saveState(); renderDashboard(); });
  document.getElementById("toggleSummary").addEventListener("click",  () => { ui.dashSummaryOpen  = !ui.dashSummaryOpen;  saveState(); renderDashboard(); });
  document.getElementById("toggleGraph").addEventListener("click",    () => { ui.dashGraphOpen    = !ui.dashGraphOpen;    saveState(); renderDashboard(); });

  // Filters apply / clear
  document.getElementById("applyFiltersBtn")?.addEventListener("click", () => {
    f.status    = document.getElementById("fStatus").value;
    f.client    = document.getElementById("fClient").value;
    f.startDate = document.getElementById("fStart").value;
    f.endDate   = document.getElementById("fEnd").value;
    f.minAmt    = document.getElementById("fMin").value;
    f.maxAmt    = document.getElementById("fMax").value;
    ui.dashPage = 1;
    saveState(); renderDashboard();
  });
  const clearAll = () => {
    state.ui.filters = { status:"all", client:"all", startDate:"", endDate:"", minAmt:"", maxAmt:"", search:"" };
    ui.dashPage = 1; saveState(); renderDashboard();
  };
  document.getElementById("clearFiltersBtn")?.addEventListener("click", clearAll);
  document.getElementById("clearFiltersBtn2")?.addEventListener("click", clearAll);
  document.querySelectorAll(".chip-x").forEach(el => el.addEventListener("click", e => {
    e.stopPropagation();
    const key = el.dataset.clear;
    if (key === "status") f.status = "all";
    else if (key === "client") f.client = "all";
    else f[key] = "";
    ui.dashPage = 1; saveState(); renderDashboard();
  }));

  // Tab pills
  document.querySelectorAll(".tab-pill").forEach(btn => btn.addEventListener("click", () => {
    ui.dashboardTab = btn.dataset.tab;
    ui.selectedIds  = [];
    ui.dashPage     = 1;
    saveState(); renderDashboard();
  }));

  // Sort columns
  document.querySelectorAll(".sortable-th").forEach(th => th.addEventListener("click", () => {
    const col = th.dataset.sort;
    if (ui.dashSort.col === col) ui.dashSort.dir = ui.dashSort.dir === "asc" ? "desc" : "asc";
    else { ui.dashSort.col = col; ui.dashSort.dir = "desc"; }
    ui.dashPage = 1; saveState(); renderDashboard();
  }));

  // Per-page selector
  document.getElementById("perPageSel")?.addEventListener("change", e => {
    ui.dashPerPage = +e.target.value;
    ui.dashPage    = 1;
    saveState(); renderDashboard();
  });

  // Pagination buttons
  document.querySelectorAll(".page-btn").forEach(btn => btn.addEventListener("click", () => {
    const p = +btn.dataset.page;
    if (p >= 1 && p <= totalPages) { ui.dashPage = p; saveState(); renderDashboard(); }
  }));

  // Select all (page only)
  const selAll = document.getElementById("selectAll");
  if (selAll) selAll.addEventListener("change", () => {
    if (selAll.checked) pageInv.forEach(i => { if (!ui.selectedIds.includes(i.id)) ui.selectedIds.push(i.id); });
    else pageInv.forEach(i => { ui.selectedIds = ui.selectedIds.filter(x => x !== i.id); });
    saveState(); renderDashboard();
  });

  // Row checkboxes
  document.querySelectorAll("input[data-sel]").forEach(cb => cb.addEventListener("change", () => {
    const id = cb.dataset.sel;
    if (cb.checked && !ui.selectedIds.includes(id)) ui.selectedIds.push(id);
    if (!cb.checked) ui.selectedIds = ui.selectedIds.filter(x => x !== id);
    saveState(); renderDashboard();
  }));

  // Row actions (paid is special)
  document.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => {
    if (btn.dataset.action === "paid") { markPaid(btn.dataset.id); saveState(); showToast("Marked as paid."); renderDashboard(); }
    else handleAction(btn.dataset.action, btn.dataset.id);
  }));

  // Bulk actions
  document.querySelectorAll("[data-bulk]").forEach(btn => btn.addEventListener("click", () => handleBulk(btn.dataset.bulk)));
}

// ── MINI GRAPH ────────────────────────────────────────────────
function renderMiniGraph(invoices, cur) {
  if (!invoices.length) return `<div style="text-align:center;color:var(--muted);padding:20px;">No data to chart.</div>`;

  // Group by month (last 6)
  const months = {};
  const now    = new Date();
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const lbl = d.toLocaleString("default", { month:"short", year:"2-digit" });
    months[key] = { label: lbl, total: 0, paid: 0 };
  }
  invoices.forEach(inv => {
    if (inv.deleted) return;
    const key = inv.issueDate?.slice(0,7);
    if (months[key]) {
      const t = calculateTotals(inv);
      months[key].total += t.grandTotal;
      if (resolveStatus(inv) === "Paid") months[key].paid += t.grandTotal;
    }
  });

  const vals = Object.values(months);
  const maxVal = Math.max(...vals.map(v => v.total), 1);
  const barW = 44;
  const gap  = 14;
  const h    = 100;
  const svgW = vals.length * (barW + gap) + gap;

  const bars = vals.map((v, i) => {
    const x    = gap + i * (barW + gap);
    const bh   = Math.round((v.total / maxVal) * h);
    const bh2  = Math.round((v.paid  / maxVal) * h);
    const y    = h - bh;
    const y2   = h - bh2;
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="var(--primary)" opacity="0.18"/>
      <rect x="${x}" y="${y2}" width="${barW}" height="${bh2}" rx="4" fill="var(--primary)" opacity="0.85"/>
      <text x="${x+barW/2}" y="${h+16}" text-anchor="middle" font-size="9" fill="var(--muted)">${v.label}</text>
      ${bh>8?`<title>${v.label}: ${fmt(v.total,cur)} billed, ${fmt(v.paid,cur)} paid</title>`:""}
    `;
  }).join("");

  return `
    <div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap;">
      <div>
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Monthly Revenue (last 6 months)</div>
        <svg width="${svgW}" height="${h+24}" viewBox="0 0 ${svgW} ${h+24}" style="overflow:visible;">${bars}</svg>
        <div style="display:flex;gap:14px;margin-top:8px;font-size:0.74rem;color:var(--muted);">
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--primary);opacity:0.2;border-radius:2px;margin-right:4px;"></span>Billed</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:var(--primary);border-radius:2px;margin-right:4px;"></span>Collected</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:0.82rem;">
        ${vals.map(v => v.total>0 ? `<div style="display:flex;justify-content:space-between;gap:24px;"><span style="color:var(--muted);">${v.label}</span><span style="font-weight:600;">${fmt(v.total,cur)}</span></div>` : "").join("")}
      </div>
    </div>
  `;
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
      invoiceTitle: "", invoiceSubtitle: "",
      issueDate: today, dueDate: addDaysISO(today, 30),
      placeOfSupply: org.business.state || "",
      currency: org.currency, reference: "",
      businessDetails: deepCopy(org.business),
      clientId: "", clientDetails: { id:"", name:"", companyName:"", clientType:"Company", taxTreatment:"Registered", gstin:"", pan:"", phone:"", email:"", state:"", address:"" },
      lineItems: [{ id:uid("li"), itemName:"", description:"", sku:"", hsn:"", quantity:1, unit:"pcs", unitPrice:0, discount:0, taxPercent:18 }],
      invoiceDiscount: { type:"percent", value:0, label:"Discount" },
      charges: [],
      tds: { enabled:false, type:"percent", value:2, label:"TDS" },
      roundOff: false,
      paymentInfo: { terms:"Net 30", customDays:30, showBank:true, showUpi:true, paymentLink:"" },
      notes: "", additionalInfo: "", terms: "", termsItems: [], amountPaid: 0, status: "Draft", deleted: false,
      shipping: { enabled:false, name:"", address:"", city:"", state:"", pin:"", country:"India" },
      displayOptions: { unitDisplay:"merge", taxSummary:"none", hidePlaceOfSupply:false, showSku:false, descriptionFullWidth:false, summariseTotalQty:false, showTotalInWords:true },
      signature: { enabled:false, label:"Authorized Signatory" },
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

  // Save focus so typing isn't interrupted by re-renders
  const prev = document.activeElement;
  const focusId    = prev?.id || null;
  const focusPath  = prev?.dataset?.path || null;
  const focusItem  = prev?.dataset?.item  ?? null;
  const focusField = prev?.dataset?.field || null;
  const focusSel   = (prev?.selectionStart != null) ? { s: prev.selectionStart, e: prev.selectionEnd } : null;
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
          <div class="editor-stepper">
            <span class="stepper-step active">
              <span class="stepper-num">1</span> Add Invoice Details
            </span>
            <span class="stepper-sep">›</span>
            <span class="stepper-step">
              <span class="stepper-num">2</span> Design &amp; Share
            </span>
          </div>
          <span style="color:var(--muted);font-size:0.78rem;">${esc(state.ui.autosaveLabel||"Unsaved")}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <kbd>Ctrl+S</kbd> Save &nbsp; <kbd>Ctrl+Z</kbd> Undo
        </div>
      </div>

      <!-- 1. Invoice Header -->
      <div class="section-card">
        <div class="section-body" style="padding:24px 28px;">

          <!-- Invoice Title (centered) -->
          <div class="inv-title-wrap">
            <input class="inv-title-input field" data-path="invoiceTitle"
              value="${esc(d.invoiceTitle||"")}"
              placeholder="Invoice Title (e.g. Jan &amp; Feb Content Shooting)" />
            ${d.invoiceSubtitle !== undefined ? `
              <input class="inv-subtitle-input field" data-path="invoiceSubtitle"
                value="${esc(d.invoiceSubtitle||"")}"
                placeholder="Subtitle (optional)" />
            ` : `<button class="add-subtitle-btn" id="addSubtitleBtn" type="button">+ Add Subtitle</button>`}
          </div>

          <!-- Fields row + Logo -->
          <div class="header-with-logo" style="margin-top:20px;">
            <div class="header-fields">
              <div class="form-g3">
                <label>Invoice No *
                  <input class="field" data-path="invoiceNumber" value="${esc(d.invoiceNumber)}" />
                  ${(() => { const invs = getOrgInvoices().filter(i=>i.id!==d.id&&!i.deleted).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt||"")||0); const last=invs[0]; return last?`<span style="font-size:0.72rem;color:var(--muted);margin-top:2px;display:block;">Last No: ${esc(last.invoiceNumber)} (${fmtDate(last.issueDate)})</span>`:``; })()}
                </label>
                <label>Invoice Date *<input class="field" type="date" data-path="issueDate" value="${d.issueDate}" /></label>
                <label>Due Date
                  <div style="display:flex;align-items:center;gap:4px;">
                    <input class="field" type="date" data-path="dueDate" value="${d.dueDate}" style="flex:1;" />
                    <button class="icon-btn" id="clearDueDateBtn" title="Clear due date" type="button" style="padding:4px 7px;">×</button>
                  </div>
                </label>
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
                <label>Payment Terms
                  <select class="field" id="payTerms" data-path="paymentInfo.terms">
                    ${PAYMENT_TERMS.map(t=>`<option ${d.paymentInfo.terms===t?"selected":""}>${t}</option>`).join("")}
                  </select>
                </label>
                <label>Place of Supply
                  <select class="field" data-path="placeOfSupply" id="posSelect">
                    <option value="">Select State</option>${posOpts}
                  </select>
                </label>
                <label>PO / Reference<input class="field" data-path="reference" value="${esc(d.reference)}" /></label>
                ${d.paymentInfo.terms==="Custom"?`<label>Custom Days<input class="field" type="number" min="0" data-path="paymentInfo.customDays" value="${d.paymentInfo.customDays||0}" /></label>`:``}
              </div>
            </div>

            <!-- Right: logo zone -->
            <div class="logo-zone">
              ${d.businessDetails?.logo ? `
                <div class="logo-zone-preview">
                  <img src="${d.businessDetails.logo}" alt="Logo" class="logo-zone-img" />
                </div>
                <div class="logo-zone-actions">
                  <button class="logo-action-btn" id="removeLogoBtn" type="button">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Remove
                  </button>
                  <label class="logo-action-btn logo-change-btn" for="logoFileInput">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    change
                    <input type="file" id="logoFileInput" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" style="display:none" />
                  </label>
                </div>
              ` : `
                <label class="logo-zone-empty" for="logoFileInput" title="Upload business logo">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                  <span>Add Logo</span>
                  <input type="file" id="logoFileInput" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" style="display:none" />
                </label>
              `}
            </div>
          </div>

        </div>
      </div>

      <!-- 2+3. Billed By / Billed To -->
      <div class="section-card">
        <div class="section-body" style="padding:0;">
          <div class="billed-row">

            <!-- Billed By -->
            <div class="billed-col">
              <div class="billed-col-head">
                <strong>Billed By</strong>
                <span style="font-size:0.75rem;color:var(--muted);font-weight:400;">Your Details</span>
              </div>
              <div class="billed-col-body">
                <div class="biz-details-card">
                  <div class="biz-details-header">
                    <div style="display:flex;align-items:center;gap:8px;">
                      ${d.businessDetails?.logo ? `<img src="${d.businessDetails.logo}" style="width:22px;height:22px;border-radius:4px;object-fit:contain;" />` : `<div style="width:22px;height:22px;border-radius:4px;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;color:var(--primary);">${(d.businessDetails?.businessName||"?")[0]}</div>`}
                      <strong style="font-size:0.88rem;">${esc(d.businessDetails?.businessName||"—")}</strong>
                    </div>
                    <button class="ghost-btn" id="editBizBtn" type="button" style="padding:2px 8px;font-size:0.75rem;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                  </div>
                  <div id="bizDetailsExpand" style="display:${state.ui.bizExpanded?"block":"none"}">
                    <div class="form-g3" style="margin-top:10px;">
                      <label>Business Name<input class="field" data-path="businessDetails.businessName" value="${esc(d.businessDetails?.businessName)}" /></label>
                      <label>GSTIN<input class="field" data-path="businessDetails.gstin" value="${esc(d.businessDetails?.gstin)}" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase" /></label>
                      <label>PAN<input class="field" data-path="businessDetails.pan" value="${esc(d.businessDetails?.pan)}" placeholder="AAAAA0000A" style="text-transform:uppercase" /></label>
                      <label>Phone<input class="field" data-path="businessDetails.phone" value="${esc(d.businessDetails?.phone)}" /></label>
                      <label>Email<input class="field" type="email" data-path="businessDetails.email" value="${esc(d.businessDetails?.email)}" /></label>
                      <label>State<select class="field" data-path="businessDetails.state"><option value="">Select State</option>${stOpts}</select></label>
                      <label class="span3">Address<textarea class="field" rows="2" data-path="businessDetails.address">${esc(d.businessDetails?.address)}</textarea></label>
                    </div>
                    <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px;">
                      <div style="font-size:0.75rem;font-weight:600;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.04em;">Bank Details</div>
                      <div class="form-g2">
                        <label>Bank Name<input class="field" data-path="businessDetails.bankName" value="${esc(d.businessDetails?.bankName)}" /></label>
                        <label>Account No<input class="field" data-path="businessDetails.accountNumber" value="${esc(d.businessDetails?.accountNumber)}" /></label>
                        <label>IFSC Code<input class="field" data-path="businessDetails.ifscCode" value="${esc(d.businessDetails?.ifscCode)}" /></label>
                        <label>UPI ID<input class="field" data-path="businessDetails.upiId" value="${esc(d.businessDetails?.upiId)}" /></label>
                      </div>
                    </div>
                  </div>
                  ${!state.ui.bizExpanded ? `
                  <div class="biz-details-preview">
                    ${d.businessDetails?.address?`<div>${esc(d.businessDetails.address)}</div>`:""}
                    ${d.businessDetails?.email?`<div>${esc(d.businessDetails.email)}</div>`:""}
                    ${d.businessDetails?.phone?`<div>${esc(d.businessDetails.phone)}</div>`:""}
                  </div>` : ""}
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="billed-divider"></div>

            <!-- Billed To -->
            <div class="billed-col">
              <div class="billed-col-head">
                <strong>Billed To</strong>
                <span style="font-size:0.75rem;color:var(--muted);font-weight:400;">Client's Details</span>
              </div>
              <div class="billed-col-body">
                <select class="field" id="clientSelector" style="margin-bottom:10px;">
                  <option value="">Select a Client</option>
                  ${clients.map(c=>`<option value="${c.id}" ${d.clientId===c.id?"selected":""}>${esc(c.name)}${c.gstin?" · "+c.gstin:""}</option>`).join("")}
                </select>
                ${d.clientDetails?.name ? `
                <div class="biz-details-card">
                  <div class="biz-details-preview">
                    <strong style="font-size:0.88rem;">${esc(d.clientDetails.name)}</strong>
                    ${d.clientDetails.gstin?`<div style="font-size:0.78rem;color:var(--muted);">GSTIN: ${esc(d.clientDetails.gstin)}</div>`:""}
                    ${d.clientDetails.address?`<div>${esc(d.clientDetails.address)}</div>`:""}
                    ${d.clientDetails.email?`<div>${esc(d.clientDetails.email)}</div>`:""}
                    ${d.clientDetails.phone?`<div>${esc(d.clientDetails.phone)}</div>`:""}
                  </div>
                  <div class="form-g3" style="margin-top:10px;">
                    <label>Client Name<input class="field" data-path="clientDetails.name" value="${esc(d.clientDetails?.name)}" /></label>
                    <label>Client Type<select class="field" data-path="clientDetails.clientType"><option ${d.clientDetails?.clientType==="Company"?"selected":""}>Company</option><option ${d.clientDetails?.clientType==="Individual"?"selected":""}>Individual</option></select></label>
                    <label>Tax Treatment<select class="field" data-path="clientDetails.taxTreatment">${["Registered","Unregistered","Consumer","Overseas","SEZ"].map(v=>`<option ${d.clientDetails?.taxTreatment===v?"selected":""}>${v}</option>`).join("")}</select></label>
                    <label>GSTIN<input class="field" data-path="clientDetails.gstin" value="${esc(d.clientDetails?.gstin)}" placeholder="22AAAAA0000A1Z5" style="text-transform:uppercase" /></label>
                    <label>PAN<input class="field" data-path="clientDetails.pan" value="${esc(d.clientDetails?.pan)}" placeholder="AAAAA0000A" style="text-transform:uppercase" /></label>
                    <label>State<select class="field" data-path="clientDetails.state"><option value="">Select State</option>${cliStOpts}</select></label>
                    <label>Email<input class="field" type="email" data-path="clientDetails.email" value="${esc(d.clientDetails?.email)}" /></label>
                    <label>Phone<input class="field" data-path="clientDetails.phone" value="${esc(d.clientDetails?.phone)}" /></label>
                    <label class="span3">Address<textarea class="field" rows="2" data-path="clientDetails.address">${esc(d.clientDetails?.address)}</textarea></label>
                  </div>
                </div>
                ` : `
                <div class="client-empty-state">
                  <div style="color:var(--muted);font-size:0.82rem;margin-bottom:10px;">Select Client/Business from the list</div>
                  <div style="font-size:0.8rem;color:var(--muted2);margin-bottom:10px;">OR</div>
                  <button class="primary-btn" id="addClientBtn" type="button">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add New Client
                  </button>
                </div>
                `}
                ${d.clientDetails?.name ? `<button class="ghost-btn" id="addClientBtn" type="button" style="margin-top:6px;font-size:0.78rem;">+ Add New Client</button>` : ""}
              </div>
            </div>

          </div>

          <!-- Add Shipping Details checkbox -->
          <div style="padding:10px 20px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="shippingToggle" ${d.shipping?.enabled?"checked":""} />
            <label for="shippingToggle" style="font-size:0.84rem;cursor:pointer;">Add Shipping Details</label>
          </div>
          ${d.shipping?.enabled ? `
          <div style="padding:12px 20px 16px;border-top:1px solid var(--line2);">
            <div class="form-g3">
              <label>Recipient Name<input class="field" data-path="shipping.name" value="${esc(d.shipping?.name)}" placeholder="Ship to name" /></label>
              <label>Address<input class="field" data-path="shipping.address" value="${esc(d.shipping?.address)}" placeholder="Street address" /></label>
              <label>City<input class="field" data-path="shipping.city" value="${esc(d.shipping?.city)}" placeholder="City" /></label>
              <label>State<input class="field" data-path="shipping.state" value="${esc(d.shipping?.state)}" placeholder="State" /></label>
              <label>PIN Code<input class="field" data-path="shipping.pin" value="${esc(d.shipping?.pin)}" placeholder="PIN" /></label>
              <label>Country<input class="field" data-path="shipping.country" value="${esc(d.shipping?.country||"India")}" placeholder="Country" /></label>
            </div>
          </div>
          ` : ""}

        </div>
      </div>


      <!-- 4. Line Items -->
      <div class="section-card">
        <div class="section-body" style="padding:0;">

          <!-- Currency / GST toolbar -->
          <div class="li-toolbar">
            <button class="li-toolbar-btn" id="addGstBtn" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Add GST
            </button>
            <select class="field li-toolbar-select" data-path="currency" style="width:auto;padding:4px 8px;">
              ${["INR","USD","EUR","GBP","AED","SGD","CAD","AUD"].map(c=>`<option ${d.currency===c?"selected":""}>${c === "INR" ? "Indian Rupee (INR, ₹)" : c}</option>`).join("")}
            </select>
            <button class="li-toolbar-btn" type="button" id="editColumnsBtn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Edit Columns/Formulas
            </button>
          </div>

          <!-- Table -->
          <div style="overflow-x:auto;">
            <table class="items-table refrens-items">
              <thead>
                <tr class="items-head-row">
                  <th style="width:30px;"></th>
                  <th>Item</th>
                  <th style="width:90px;text-align:center;">Quantity</th>
                  <th style="width:110px;text-align:right;">Rate</th>
                  ${d.displayOptions?.showSku ? `<th style="width:80px;">SKU</th>` : ""}
                  <th style="width:90px;text-align:right;">Amount</th>
                  <th style="width:36px;"></th>
                </tr>
              </thead>
              <tbody>
                ${t.rows.map((row, i) => `
                  <tr class="li-row" draggable="true" data-row="${i}">
                    <td class="li-drag"><span class="drag-handle" title="Drag">⠿</span><span style="font-size:0.78rem;color:var(--muted);display:block;text-align:center;">${i+1}.</span></td>
                    <td class="li-item-cell">
                      <input class="li-name-input" data-item="${i}" data-field="itemName" value="${esc(row.itemName)}" placeholder="Item Name / SKU Id" />
                      <input class="li-desc-input" data-item="${i}" data-field="description" value="${esc(row.description)}" placeholder="Description (optional)" />
                      <div class="li-extras">
                        <label class="li-extra-link">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add Unit
                          <select class="li-unit-inline" data-item="${i}" data-field="unit">
                            ${UNITS.map(u=>`<option ${(row.unit||"pcs")===u?"selected":""}>${u}</option>`).join("")}
                          </select>
                        </label>
                        <span class="li-extra-sep">|</span>
                        <label class="li-extra-link">HSN/SAC
                          <input class="li-hsn-inline" data-item="${i}" data-field="hsn" value="${esc(row.hsn||"")}" placeholder="9983" style="width:60px;" />
                        </label>
                        <span class="li-extra-sep">|</span>
                        <label class="li-extra-link">Tax
                          <select class="li-unit-inline" data-item="${i}" data-field="taxPercent">
                            ${GST_RATES.map(r=>`<option value="${r}" ${row.taxRate===r?"selected":""}>${r}%</option>`).join("")}
                          </select>
                        </label>
                        <span class="li-extra-sep">|</span>
                        <label class="li-extra-link">Disc
                          <input class="li-hsn-inline" type="number" min="0" step="0.01" data-item="${i}" data-field="discount" value="${row.itemDisc}" style="width:54px;" />
                        </label>
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <input class="li-num-input" type="number" min="0" data-item="${i}" data-field="quantity" value="${row.qty}" />
                    </td>
                    <td style="text-align:right;">
                      <input class="li-num-input" type="number" min="0" step="0.01" data-item="${i}" data-field="unitPrice" value="${row.rate}" style="text-align:right;" />
                    </td>
                    ${d.displayOptions?.showSku ? `<td><input data-item="${i}" data-field="sku" value="${esc(row.sku||"")}" placeholder="SKU-001" style="width:70px;" /></td>` : ""}
                    <td class="item-amount" style="text-align:right;font-weight:600;">${fmt(row.lineTotal, cur)}</td>
                    <td>
                      <div style="display:flex;gap:2px;">
                        <button class="item-remove" data-duplicate-item="${i}" title="Duplicate" style="font-size:0.7rem;opacity:0.5;">⧉</button>
                        <button class="item-remove" data-remove="${i}" title="Remove">✕</button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Add New Line / Add New Group -->
          <div class="li-add-row">
            <button class="li-add-btn" id="addItemBtn" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Line
            </button>
            <button class="li-add-btn" type="button" id="addGroupBtn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Group
            </button>
          </div>

        </div>
      </div>

      <!-- 5. Totals area (Show Total in PDF, Discounts, Charges, Total in Words) -->
      <div class="section-card">
        <div class="section-body" style="padding:16px 20px;">

          <!-- Show Total in PDF toggle -->
          <div class="totals-toggle-row">
            <span style="font-weight:600;font-size:0.92rem;">Show Total in PDF</span>
            <button class="eye-toggle-btn" id="showTotalPdfToggle" type="button" title="Toggle total visibility">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <!-- Add Discounts (expandable) -->
          <div class="totals-expand-row" id="discountsToggleRow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Discounts
            <svg class="collapse-arrow ${state.ui.discExpanded?"open":""}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          ${state.ui.discExpanded ? `
          <div class="totals-expand-body">
            <div class="form-g3">
              <label>Discount Label<input class="field" data-path="invoiceDiscount.label" value="${esc(d.invoiceDiscount?.label||"Discount")}" /></label>
              <label>Type<select class="field" data-path="invoiceDiscount.type">
                <option value="percent" ${d.invoiceDiscount?.type==="percent"?"selected":""}>Percentage (%)</option>
                <option value="amount"  ${d.invoiceDiscount?.type==="amount" ?"selected":""}>Fixed Amount</option>
              </select></label>
              <label>Value<input class="field" type="number" min="0" step="0.01" data-path="invoiceDiscount.value" value="${d.invoiceDiscount?.value||0}" /></label>
            </div>
          </div>` : ""}

          <!-- Add Additional Charges (expandable) -->
          <div class="totals-expand-row" id="chargesToggleRow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Additional Charges
          </div>
          ${(d.charges||[]).length || state.ui.chargesExpanded ? `
          <div class="totals-expand-body" id="chargesContainer">
            ${(d.charges||[]).map((ch,i) => `
              <div class="charge-row">
                <input class="field" data-charge="${i}" data-cf="label" value="${esc(ch.label)}" placeholder="Label (e.g. Shipping)" />
                <input class="field" type="number" min="0" step="0.01" data-charge="${i}" data-cf="amount" value="${ch.amount||0}" style="max-width:110px;" />
                <label style="flex-direction:row;align-items:center;gap:5px;font-size:0.8rem;white-space:nowrap;">
                  <input type="checkbox" data-charge="${i}" data-cf="taxable" ${ch.taxable?"checked":""} /> Taxable
                </label>
                <button class="item-remove" data-rem-charge="${i}" title="Remove">✕</button>
              </div>`).join("")}
            <button class="li-add-btn" id="addChargeBtn" type="button" style="margin-top:6px;">+ Add Charge</button>
          </div>` : ""}

          <!-- Summarise Total Quantity -->
          <label class="check-opt" style="margin:8px 0;">
            <input type="checkbox" id="doSummariseTotalQty" ${d.displayOptions?.summariseTotalQty?"checked":""}> Summarise Total Quantity
          </label>

          <!-- GST info -->
          <div style="margin-top:8px;padding:8px 12px;background:var(--primary-soft);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--muted);">
            <strong>GST:</strong>
            ${d.businessDetails?.state && d.placeOfSupply
              ? (d.businessDetails.state === d.placeOfSupply
                  ? `<span style="color:var(--success);">Intra-state → CGST + SGST</span>`
                  : `<span style="color:var(--info);">Inter-state → IGST</span>`)
              : `<span>Set Business State &amp; Place of Supply to auto-determine.</span>`}
            ${d.invoiceType==="Export Invoice"?`<span style="color:var(--warning);"> (Export: 0%)</span>`:""}
            &nbsp;|&nbsp;
            <label style="display:inline-flex;align-items:center;gap:5px;">
              <input type="checkbox" id="tdsToggle" ${d.tds?.enabled?"checked":""} /> TDS
            </label>
            &nbsp;
            <label style="display:inline-flex;align-items:center;gap:5px;">
              <input type="checkbox" id="roundOffToggle" ${d.roundOff?"checked":""} /> Round Off
            </label>
          </div>
          ${d.tds?.enabled ? `
          <div class="form-g3" style="margin-top:10px;">
            <label>TDS Label<input class="field" data-path="tds.label" value="${esc(d.tds?.label||"TDS")}" /></label>
            <label>TDS Type<select class="field" data-path="tds.type">
              <option value="percent" ${d.tds?.type==="percent"?"selected":""}>Percentage (%)</option>
              <option value="amount"  ${d.tds?.type==="amount" ?"selected":""}>Fixed Amount</option>
            </select></label>
            <label>TDS Value<input class="field" type="number" min="0" step="0.01" data-path="tds.value" value="${d.tds?.value||2}" /></label>
          </div>` : ""}

          <!-- Total display -->
          <div class="inline-total-row">
            <strong>Total (${esc(cur)})</strong>
            <strong style="font-size:1.1rem;">${fmt(t.grandTotal, cur)}</strong>
          </div>

          <!-- Amount paid -->
          <div style="margin-top:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label style="display:flex;align-items:center;gap:6px;font-size:0.84rem;">
              Amount Paid:
              <input class="field" type="number" min="0" step="0.01" data-path="amountPaid" value="${d.amountPaid||0}" style="width:110px;" />
            </label>
            <label class="check-opt"><input type="checkbox" id="showBankToggle" ${d.paymentInfo?.showBank?"checked":""}> Show Bank Details</label>
            <label class="check-opt"><input type="checkbox" id="showUpiToggle"  ${d.paymentInfo?.showUpi ?"checked":""}> Show UPI</label>
          </div>

          <!-- Show Total In Words -->
          <div class="totals-toggle-row" style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;">
            <span style="font-weight:600;font-size:0.92rem;">Show Total In Words</span>
            <button class="eye-toggle-btn ${d.displayOptions?.showTotalInWords!==false?"":"eye-off"}" id="doShowTotalInWords" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          ${d.displayOptions?.showTotalInWords!==false ? `
          <div style="margin-top:8px;padding:10px;background:var(--bg);border:1px solid var(--line);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--muted);">
            <div style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">Total (in words)</div>
            <div style="color:var(--text2);">${amountInWords(t.grandTotal)}</div>
          </div>` : ""}

        </div>
      </div>

      <!-- 6. Signature -->
      <div class="section-card">
        <div class="section-body" style="padding:14px 20px;">
          <button class="li-add-btn" id="signatureToggleBtn" type="button" style="width:100%;justify-content:center;padding:10px 0;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            ${d.signature?.enabled ? "Edit Signature" : "Add Signature"}
          </button>
          ${d.signature?.enabled ? `
          <div style="margin-top:14px;">
            <label style="font-size:0.82rem;">Signatory Label<input class="field" data-path="signature.label" value="${esc(d.signature?.label||"Authorized Signatory")}" /></label>
            <div class="signature-box" style="margin-top:12px;">
              <div class="signature-line"></div>
              <div class="signature-caption">${esc(d.signature?.label||"Authorized Signatory")}</div>
            </div>
          </div>` : ""}
        </div>
      </div>

      <!-- 7. Notes / Attachments / Additional Info tabs -->
      <div class="section-card">
        <div class="section-body" style="padding:0;">
          <div class="notes-tab-bar">
            <button class="notes-tab-btn ${!state.ui.notesTab||state.ui.notesTab==="notes"?"active":""}" data-notes-tab="notes" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              Add Notes
            </button>
            <button class="notes-tab-btn ${state.ui.notesTab==="attach"?"active":""}" data-notes-tab="attach" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              Add Attachments
            </button>
            <button class="notes-tab-btn ${state.ui.notesTab==="info"?"active":""}" data-notes-tab="info" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Add Additional Info
            </button>
          </div>
          <div class="notes-tab-body">
            ${(!state.ui.notesTab||state.ui.notesTab==="notes") ? `
              <textarea class="field" rows="4" data-path="notes" placeholder="Notes to client…">${esc(d.notes)}</textarea>
            ` : state.ui.notesTab==="attach" ? `
              <div style="color:var(--muted);font-size:0.84rem;padding:8px 0;">
                <em>Attachment upload is not available in this version.</em>
              </div>
            ` : `
              <textarea class="field" rows="4" data-path="additionalInfo" placeholder="Additional info, PO number, etc…">${esc(d.additionalInfo||"")}</textarea>
            `}
          </div>
        </div>
      </div>

      <!-- 8. Terms & Conditions + Contact Details -->
      <div class="section-card">
        <div class="section-body" style="padding:16px 20px;">

          <!-- Terms & Conditions -->
          <div class="terms-section-head" style="margin-bottom:10px;">
            <span style="font-weight:600;font-size:0.92rem;">Terms and Conditions</span>
            <button class="icon-btn icon-btn-danger" id="clearTermsBtn" type="button" title="Remove all terms" style="font-size:1rem;">×</button>
          </div>
          <div id="termsContainer">
            ${(d.termsItems||[]).map((item, i) => `
              <div class="terms-row">
                <span class="terms-num">${String(i+1).padStart(2,"0")}</span>
                <input class="field" data-term="${i}" value="${esc(item.text)}" placeholder="Enter term or condition…" style="flex:1;" />
                <div class="terms-btns">
                  <button class="icon-btn icon-btn-danger" data-term-del="${i}" type="button" title="Remove">×</button>
                  ${i < (d.termsItems.length - 1) ? `<button class="icon-btn" data-term-down="${i}" type="button" title="Move down">↓</button>` : `<span class="icon-btn-placeholder"></span>`}
                  ${i > 0 ? `<button class="icon-btn" data-term-up="${i}" type="button" title="Move up">↑</button>` : `<span class="icon-btn-placeholder"></span>`}
                </div>
              </div>
            `).join("") || `<div class="terms-empty">No terms added yet.</div>`}
          </div>
          <div style="display:flex;gap:10px;margin-top:10px;">
            <button class="li-add-btn" id="addTermBtn" type="button">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Term
            </button>
          </div>

          <!-- Contact Details -->
          <div class="contact-details-row">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span class="contact-details-label">Your Contact Details</span>
              <button class="icon-btn icon-btn-danger" type="button" title="Hide">×</button>
            </div>
            <div class="contact-details-val">
              For any enquiry, reach out via <strong>email at</strong>
              <span style="color:var(--primary);">${esc(d.businessDetails?.email||"—")}</span>
              <strong>call on</strong>
              <span style="color:var(--primary);">${esc(d.businessDetails?.phone||"—")}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- 9. Recurring Invoice -->
      <div class="section-card">
        <div class="section-body" style="padding:16px 20px;">
          <label class="check-opt" style="align-items:flex-start;gap:10px;">
            <input type="checkbox" id="recurringToggle" ${d.recurring?.enabled?"checked":""} style="margin-top:3px;" />
            <div>
              <div style="font-weight:600;font-size:0.9rem;">This is a Recurring invoice</div>
              <div style="font-size:0.78rem;color:var(--muted);margin-top:2px;">A draft invoice will be created with the same details every next period.</div>
            </div>
          </label>
          ${d.recurring?.enabled ? `
          <div class="form-g3" style="margin-top:12px;">
            <label>Interval
              <select class="field" data-path="recurring.interval">
                ${["weekly","monthly","quarterly","half-yearly","yearly"].map(r=>`<option ${d.recurring?.interval===r?"selected":""}>${r}</option>`).join("")}
              </select>
            </label>
            <label>Next Run Date<input class="field" type="date" data-path="recurring.nextRun" value="${d.recurring?.nextRun||""}" /></label>
          </div>` : ""}
        </div>
      </div>

      <!-- 10. Advanced Options -->
      <div class="section-card">
        <div class="section-body" style="padding:16px 20px;">
          <div style="font-weight:600;font-size:0.92rem;margin-bottom:12px;">Advanced options</div>
          <div class="form-g2" style="margin-bottom:14px;">
            <label>Display unit as
              <select class="field" data-path="displayOptions.unitDisplay">
                <option value="merge"    ${(d.displayOptions?.unitDisplay||"merge")==="merge"?"selected":""}>Merge with quantity</option>
                <option value="separate" ${d.displayOptions?.unitDisplay==="separate"?"selected":""}>Show separately</option>
                <option value="hide"     ${d.displayOptions?.unitDisplay==="hide"?"selected":""}>Hide</option>
              </select>
            </label>
            <label>Show tax summary in invoice
              <select class="field" data-path="displayOptions.taxSummary">
                <option value="none"    ${(d.displayOptions?.taxSummary||"none")==="none"?"selected":""}>Do not show</option>
                <option value="summary" ${d.displayOptions?.taxSummary==="summary"?"selected":""}>Show tax summary</option>
                <option value="details" ${d.displayOptions?.taxSummary==="details"?"selected":""}>Show tax details</option>
              </select>
            </label>
          </div>
          <div class="display-opts-grid">
            <label class="check-opt"><input type="checkbox" id="doHidePlaceOfSupply" ${d.displayOptions?.hidePlaceOfSupply?"checked":""}> Hide place/country of supply</label>
            <label class="check-opt"><input type="checkbox" id="doAddImages" ${d.displayOptions?.addImages?"checked":""}> Add original images in line items</label>
            <label class="check-opt"><input type="checkbox" id="doShowThumbnails" ${d.displayOptions?.showThumbnails?"checked":""}> Show thumbnails in separate column</label>
            <label class="check-opt"><input type="checkbox" id="doDescFullWidth" ${d.displayOptions?.descriptionFullWidth?"checked":""}> Show description in full width</label>
            <label class="check-opt"><input type="checkbox" id="doHideSubtotal" ${d.displayOptions?.hideSubtotal?"checked":""}> Hide subtotal for group items</label>
            <label class="check-opt"><input type="checkbox" id="doShowSku" ${d.displayOptions?.showSku?"checked":""}> Show SKU in Invoice</label>
            <label class="check-opt"><input type="checkbox" id="doBatchDetails" ${d.displayOptions?.batchDetails?"checked":""}> Display Batch Details in columns</label>
            <label class="check-opt"><input type="checkbox" id="doPaymentLink" ${d.paymentInfo?.paymentLink?"checked":""}> Add Payment Link</label>
          </div>
          ${d.paymentInfo?.paymentLink !== undefined && state.ui.showPayLink ? `
          <label style="margin-top:10px;display:block;">Payment Link<input class="field" data-path="paymentInfo.paymentLink" value="${esc(d.paymentInfo?.paymentLink||"")}" placeholder="https://razorpay.com/..." /></label>` : ""}
        </div>
      </div>

      <!-- Bottom action buttons -->
      <div class="editor-bottom-actions">
        <button class="primary-btn" id="saveAndContinueBtn" type="button">Save &amp; Continue</button>
        <button class="secondary-btn" id="saveAndNewBtn" type="button">Save &amp; Create New</button>
        <button class="ghost-btn" id="saveDraftBtnBottom" type="button">Save As Draft</button>
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
        ${d.displayOptions?.showTotalInWords!==false?`
        <div class="summary-words">
          <span>Total in Words</span>
          <em>${amountInWords(t.grandTotal)}</em>
        </div>`:``}
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

  // Restore focus after re-render so typing/Space key isn't interrupted
  let restored = null;
  if (focusId)    restored = root.querySelector(`#${CSS.escape(focusId)}`);
  if (!restored && focusPath)  restored = root.querySelector(`[data-path="${focusPath}"]`);
  if (!restored && focusItem != null && focusField)
    restored = root.querySelector(`[data-item="${focusItem}"][data-field="${focusField}"]`);
  if (restored && typeof restored.focus === "function") {
    restored.focus({ preventScroll: true });
    if (focusSel && restored.setSelectionRange) {
      try { restored.setSelectionRange(focusSel.s, focusSel.e); } catch(_) {}
    }
  }
}

function bindEditorEvents() {
  const root = document.getElementById("screenRoot");
  const d    = state.editorDraft;

  // Fields that need a full re-render when changed (affect structure/calculations)
  const RERENDER_PATHS = new Set([
    "invoiceType","currency","paymentInfo.terms","paymentInfo.customDays",
    "issueDate","businessDetails.state","placeOfSupply",
    "invoiceDiscount.type","tds.type","recurring.interval",
    "displayOptions.unitDisplay","displayOptions.taxSummary",
  ]);

  // Generic path-bound fields — only re-render when structurally needed
  root.querySelectorAll("[data-path]").forEach(el => {
    el.addEventListener("input", () => {
      setPath(d, el.dataset.path, parseVal(el));
      if (["issueDate","paymentInfo.terms","paymentInfo.customDays"].includes(el.dataset.path)) syncDueDate();
      markDirty();
      if (RERENDER_PATHS.has(el.dataset.path)) renderEditor();
    });
  });

  // Line items — only re-render for numeric/calculated fields; text fields just save
  const LI_CALC_FIELDS = new Set(["quantity","unitPrice","discount","taxPercent","unit"]);
  root.querySelectorAll("[data-item][data-field]").forEach(el => {
    el.addEventListener("input", () => {
      const i    = +el.dataset.item;
      const field= el.dataset.field;
      const row  = d.lineItems[i]; if (!row) return;
      if (field === "taxPercent" && el.tagName === "SELECT" && el.value === "custom") return;
      row[field] = LI_CALC_FIELDS.has(field) ? +el.value || 0 : el.value;
      markDirty();
      if (LI_CALC_FIELDS.has(field) || el.tagName === "SELECT") renderEditor();
    });
  });

  // Charge fields — only re-render for amount/taxable (not label text)
  root.querySelectorAll("[data-charge][data-cf]").forEach(el => {
    el.addEventListener(el.type==="checkbox"?"change":"input", () => {
      const i  = +el.dataset.charge;
      const cf = el.dataset.cf;
      const ch = d.charges[i]; if (!ch) return;
      ch[cf] = el.type==="checkbox" ? el.checked : (cf==="amount" ? +el.value||0 : el.value);
      markDirty();
      if (cf !== "label") renderEditor();
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

  // Logo upload
  document.getElementById("logoFileInput")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Logo must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      d.businessDetails.logo = ev.target.result;
      getCurrentOrg().business.logo = ev.target.result;
      saveState(); markDirty(); renderEditor();
    };
    reader.readAsDataURL(file);
  });
  document.getElementById("removeLogoBtn")?.addEventListener("click", () => {
    d.businessDetails.logo = "";
    getCurrentOrg().business.logo = "";
    saveState(); markDirty(); renderEditor();
  });

  // Add client btn
  document.getElementById("addClientBtn")?.addEventListener("click", () => showModal("clientModal"));

  // Shipping toggle
  document.getElementById("shippingToggle")?.addEventListener("change", e => {
    if (!d.shipping) d.shipping = { enabled:false, name:"", address:"", city:"", state:"", pin:"", country:"India" };
    d.shipping.enabled = e.target.checked;
    markDirty(); renderEditor();
  });

  // Terms & Conditions
  document.getElementById("addTermBtn")?.addEventListener("click", () => {
    if (!d.termsItems) d.termsItems = [];
    d.termsItems.push({ id: uid("term"), text: "" });
    markDirty(); renderEditor();
  });
  root.querySelectorAll("[data-term]").forEach(el => {
    el.addEventListener("input", () => {
      const i = +el.dataset.term;
      if (d.termsItems && d.termsItems[i]) { d.termsItems[i].text = el.value; markDirty(); }
    });
  });
  root.querySelectorAll("[data-term-del]").forEach(btn => btn.addEventListener("click", () => {
    d.termsItems.splice(+btn.dataset.termDel, 1);
    markDirty(); renderEditor();
  }));
  root.querySelectorAll("[data-term-up]").forEach(btn => btn.addEventListener("click", () => {
    const i = +btn.dataset.termUp;
    if (i > 0) { [d.termsItems[i-1], d.termsItems[i]] = [d.termsItems[i], d.termsItems[i-1]]; markDirty(); renderEditor(); }
  }));
  root.querySelectorAll("[data-term-down]").forEach(btn => btn.addEventListener("click", () => {
    const i = +btn.dataset.termDown;
    if (i < d.termsItems.length - 1) { [d.termsItems[i+1], d.termsItems[i]] = [d.termsItems[i], d.termsItems[i+1]]; markDirty(); renderEditor(); }
  }));

  // Display options
  document.getElementById("doHidePlaceOfSupply")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.hidePlaceOfSupply = e.target.checked; markDirty();
  });
  document.getElementById("doShowSku")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.showSku = e.target.checked; markDirty(); renderEditor();
  });
  document.getElementById("doDescFullWidth")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.descriptionFullWidth = e.target.checked; markDirty();
  });
  document.getElementById("doSummariseTotalQty")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.summariseTotalQty = e.target.checked; markDirty();
  });
  document.getElementById("doShowTotalInWords")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.showTotalInWords = e.target.checked; markDirty(); renderEditor();
  });

  // Signature toggle
  document.getElementById("signatureToggle")?.addEventListener("change", e => {
    if (!d.signature) d.signature = { enabled:false, label:"Authorized Signatory" };
    d.signature.enabled = e.target.checked; markDirty(); renderEditor();
  });

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

  // Subtitle toggle
  document.getElementById("addSubtitleBtn")?.addEventListener("click", () => {
    d.invoiceSubtitle = ""; markDirty(); renderEditor();
  });

  // Clear due date
  document.getElementById("clearDueDateBtn")?.addEventListener("click", () => {
    d.dueDate = ""; markDirty(); renderEditor();
  });

  // Edit Biz toggle
  document.getElementById("editBizBtn")?.addEventListener("click", () => {
    state.ui.bizExpanded = !state.ui.bizExpanded; saveState(); renderEditor();
  });

  // Duplicate line item
  root.querySelectorAll("[data-duplicate-item]").forEach(btn => btn.addEventListener("click", () => {
    const i = +btn.dataset.duplicateItem;
    const copy = deepCopy(d.lineItems[i]); copy.id = uid("li");
    d.lineItems.splice(i + 1, 0, copy);
    markDirty(); renderEditor();
  }));

  // Add Group (stub — inserts a separator item)
  document.getElementById("addGroupBtn")?.addEventListener("click", () => {
    d.lineItems.push({ id:uid("li"), itemName:"", description:"", hsn:"", quantity:1, unit:"pcs", unitPrice:0, discount:0, taxPercent:0, isGroup:true });
    markDirty(); renderEditor();
  });

  // Discounts toggle
  document.getElementById("discountsToggleRow")?.addEventListener("click", () => {
    state.ui.discExpanded = !state.ui.discExpanded; saveState(); renderEditor();
  });

  // Charges toggle
  document.getElementById("chargesToggleRow")?.addEventListener("click", () => {
    state.ui.chargesExpanded = !state.ui.chargesExpanded; saveState(); renderEditor();
  });

  // Show Total In Words eye toggle
  document.getElementById("doShowTotalInWords")?.addEventListener("click", () => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.showTotalInWords = !(d.displayOptions.showTotalInWords !== false);
    markDirty(); renderEditor();
  });

  // Signature toggle btn
  document.getElementById("signatureToggleBtn")?.addEventListener("click", () => {
    if (!d.signature) d.signature = { enabled:false, label:"Authorized Signatory" };
    d.signature.enabled = !d.signature.enabled; markDirty(); renderEditor();
  });

  // Notes tabs
  root.querySelectorAll("[data-notes-tab]").forEach(btn => btn.addEventListener("click", () => {
    state.ui.notesTab = btn.dataset.notesTab; saveState(); renderEditor();
  }));

  // Clear all terms
  document.getElementById("clearTermsBtn")?.addEventListener("click", () => {
    if (confirm("Remove all terms?")) { d.termsItems = []; markDirty(); renderEditor(); }
  });

  // New advanced option checkboxes
  document.getElementById("doAddImages")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.addImages = e.target.checked; markDirty();
  });
  document.getElementById("doShowThumbnails")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.showThumbnails = e.target.checked; markDirty();
  });
  document.getElementById("doHideSubtotal")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.hideSubtotal = e.target.checked; markDirty();
  });
  document.getElementById("doBatchDetails")?.addEventListener("change", e => {
    if (!d.displayOptions) d.displayOptions = {};
    d.displayOptions.batchDetails = e.target.checked; markDirty();
  });

  // Bottom save buttons
  document.getElementById("saveAndContinueBtn")?.addEventListener("click", () => { saveDraft(); showToast("Invoice saved!"); });
  document.getElementById("saveAndNewBtn")?.addEventListener("click",      () => { saveDraft(); openEditor(); });
  document.getElementById("saveDraftBtnBottom")?.addEventListener("click", () => saveDraft());

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
  if (!state.ui.editorHistory) state.ui.editorHistory = [];
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
  saveState(); showToast("Draft saved.");
  // Update label without full re-render to preserve focus
  const lbl = document.querySelector(".autosave-bar span");
  if (lbl) lbl.textContent = state.ui.autosaveLabel;
  else renderEditor();
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
    saveState();
    // Update label in DOM without re-rendering (preserves focus/cursor)
    const lbl = document.querySelector(".autosave-bar span");
    if (lbl) lbl.textContent = state.ui.autosaveLabel;
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
        ${invoice.businessDetails?.logo ? `<img src="${invoice.businessDetails.logo}" style="max-height:48px;max-width:120px;object-fit:contain;display:block;margin-bottom:6px;" alt="Logo" />` : ""}
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
  const cur      = t.currency;
  const tmpl     = invoice.templateId    || "classic";
  const color    = invoice.templateColor || "#7c3aed";
  const biz      = invoice.businessDetails || {};
  const cli      = invoice.clientDetails   || {};
  const pay      = invoice.paymentInfo     || {};
  const ship     = invoice.shipping        || {};
  const dispOpts = invoice.displayOptions  || {};
  const sig      = invoice.signature       || {};
  const isIntra  = t.isIntraState;

  // ── Template colour helpers ──────────────────────────────────
  const isDark     = tmpl === "modern" || tmpl === "bold";
  const isElegant  = tmpl === "elegant";
  const accentBg   = isDark   ? color : isElegant ? "#fdf8f0" : "#fff";
  const headerBg   = isDark   ? color : isElegant ? "#fdf8f0" : `linear-gradient(135deg,${color}15,${color}05)`;
  const headerText = isDark   ? "#fff" : "#111827";
  const headerMeta = isDark   ? "rgba(255,255,255,0.75)" : "#6b7280";
  const headerAddr = isDark   ? "rgba(255,255,255,0.82)" : "#6b7280";
  const thBg       = isDark   ? color  : isElegant ? "#f5ede0" : `${color}15`;
  const thText     = isDark   ? "#fff" : color;
  const borderCol  = "#e5e7eb";

  // ── Reusable cell style ──────────────────────────────────────
  const th  = (extra="") => `border:1px solid ${borderCol};padding:7px 10px;background:${thBg};font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:0.04em;color:${thText};${extra}`;
  const td  = (extra="") => `border:1px solid ${borderCol};padding:7px 10px;font-size:11px;color:#374151;${extra}`;
  const lbl = `font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:5px;`;

  // ── Totals row helper ────────────────────────────────────────
  const trow = (label, value, bold=false, red=false) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px;${bold?"font-weight:700;":""}${red?"color:#dc2626;":"color:#374151;"}">
      <span>${label}</span><span>${value}</span>
    </div>`;

  // ── Terms list (new numbered) ────────────────────────────────
  const termsList = (invoice.termsItems||[]).filter(x=>x.text);
  const termsHtml = termsList.length
    ? termsList.map((item,i) =>
        `<div style="display:flex;gap:8px;margin-bottom:4px;font-size:10px;color:#6b7280;">
          <span style="font-weight:700;color:#9ca3af;min-width:18px;">${String(i+1).padStart(2,"0")}</span>
          <span>${esc(item.text)}</span>
        </div>`).join("")
    : (invoice.terms ? `<div style="font-size:10px;color:#6b7280;">${esc(invoice.terms)}</div>` : "");

  return `
  <div class="print-sheet print-${tmpl}">

  <!-- ═══ HEADER ═══ -->
  <div style="background:${isDark?color:isElegant?"#fdf8f0":"#fff"};${isDark?"color:#fff;":""}padding:24px 32px;margin:-32px -32px 20px;display:flex;justify-content:space-between;align-items:flex-start;${isDark?"":"border-bottom:3px solid "+color+";"}">

    <!-- Left: Business info -->
    <div style="flex:1;min-width:0;">
      <div style="font-size:17px;font-weight:800;color:${isDark?"#fff":color};letter-spacing:-0.01em;margin-bottom:5px;">${esc(biz.businessName||"Business Name")}</div>
      <div style="font-size:10px;color:${headerAddr};white-space:pre-wrap;max-width:260px;line-height:1.6;">${esc(biz.address||"")}</div>
      ${biz.gstin?`<div style="font-size:10px;color:${headerAddr};margin-top:3px;"><strong style="color:${isDark?"rgba(255,255,255,0.9)":"#374151"};">GSTIN:</strong> ${esc(biz.gstin)}</div>`:""}
      ${biz.pan?`<div style="font-size:10px;color:${headerAddr};"><strong style="color:${isDark?"rgba(255,255,255,0.9)":"#374151"};">PAN:</strong> ${esc(biz.pan)}</div>`:""}
      ${(biz.phone||biz.email)?`<div style="font-size:10px;color:${headerAddr};margin-top:3px;">${esc(biz.phone||"")}${biz.phone&&biz.email?" &nbsp;·&nbsp; ":""}${esc(biz.email||"")}</div>`:""}
    </div>

    <!-- Right: Logo + Invoice type + number + dates -->
    <div style="text-align:right;flex-shrink:0;margin-left:24px;">
      ${biz.logo ? `<img src="${biz.logo}" style="max-height:72px;max-width:160px;object-fit:contain;display:block;margin-left:auto;margin-bottom:10px;border-radius:6px;" alt="Logo" />` : ""}
      <div style="font-size:14px;font-weight:800;color:${isDark?"rgba(255,255,255,0.92)":color};letter-spacing:0.04em;text-transform:uppercase;">${esc(invoice.invoiceType||"Tax Invoice")}</div>
      <div style="font-size:13px;font-weight:700;color:${isDark?"#fff":"#111827"};margin-top:2px;">#${esc(invoice.invoiceNumber)}</div>
      <div style="font-size:10px;color:${headerMeta};margin-top:6px;line-height:1.8;">
        <div>Date: <strong style="color:${isDark?"#fff":"#374151"}">${fmtDate(invoice.issueDate)}</strong></div>
        <div>Due:&nbsp; <strong style="color:${isDark?"#fff":"#374151"}">${fmtDate(invoice.dueDate)}</strong></div>
        ${invoice.reference?`<div>PO: <strong style="color:${isDark?"#fff":"#374151"}">${esc(invoice.reference)}</strong></div>`:""}
      </div>
    </div>
  </div>

  <!-- ═══ BILL TO / SHIP TO ═══ -->
  <div style="display:grid;grid-template-columns:${ship.enabled?"1fr 1fr":"1fr 1fr"};gap:12px;margin-bottom:16px;">
    <div style="border:1px solid ${borderCol};border-radius:8px;padding:12px;font-size:11px;">
      <div style="${lbl}">Bill To</div>
      <div style="font-weight:700;font-size:12px;color:#111827;margin-bottom:4px;">${esc(cli.name||"—")}</div>
      ${cli.address?`<div style="color:#6b7280;white-space:pre-wrap;font-size:10.5px;line-height:1.5;">${esc(cli.address)}</div>`:""}
      ${cli.gstin?`<div style="margin-top:5px;font-size:10px;"><strong>GSTIN:</strong> ${esc(cli.gstin)}</div>`:""}
      ${cli.pan?`<div style="font-size:10px;"><strong>PAN:</strong> ${esc(cli.pan)}</div>`:""}
      ${(cli.phone||cli.email)?`<div style="font-size:10px;color:#6b7280;margin-top:4px;">${esc(cli.phone||"")}${cli.phone&&cli.email?" · ":""}${esc(cli.email||"")}</div>`:""}
      ${(!dispOpts.hidePlaceOfSupply && invoice.placeOfSupply)?`<div style="font-size:10px;color:#9ca3af;margin-top:4px;">Place of Supply: ${esc(invoice.placeOfSupply)}</div>`:""}
    </div>
    ${ship.enabled ? `
    <div style="border:1px solid ${borderCol};border-radius:8px;padding:12px;font-size:11px;">
      <div style="${lbl}">Ship To</div>
      <div style="font-weight:700;font-size:12px;color:#111827;margin-bottom:4px;">${esc(ship.name||"")}</div>
      <div style="color:#6b7280;font-size:10.5px;line-height:1.6;">${[ship.address,ship.city,ship.state,ship.pin,ship.country].filter(Boolean).map(esc).join(", ")}</div>
    </div>
    ` : `
    <div style="border:1px solid ${borderCol};border-radius:8px;padding:12px;font-size:11px;">
      <div style="${lbl}">Billed By</div>
      <div style="font-weight:700;font-size:12px;color:#111827;margin-bottom:4px;">${esc(biz.businessName||"")}</div>
      ${biz.address?`<div style="color:#6b7280;white-space:pre-wrap;font-size:10.5px;line-height:1.5;">${esc(biz.address)}</div>`:""}
      ${biz.gstin?`<div style="font-size:10px;margin-top:5px;"><strong>GSTIN:</strong> ${esc(biz.gstin)}</div>`:""}
    </div>
    `}
  </div>

  <!-- ═══ LINE ITEMS ═══ -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:11px;">
    <thead>
      <tr>
        <th style="${th("width:28px;text-align:center;")}">S#</th>
        <th style="${th()}">Item / Description</th>
        <th style="${th("width:72px;text-align:center;")}">HSN/SAC</th>
        ${dispOpts.showSku ? `<th style="${th("width:72px;text-align:center;")}">SKU</th>` : ""}
        <th style="${th("width:60px;text-align:center;")}">Qty</th>
        <th style="${th("width:88px;text-align:right;")}">Rate</th>
        ${t.totalItemDiscount>0 ? `<th style="${th("width:80px;text-align:right;")}">Disc.</th>` : ""}
        <th style="${th("width:60px;text-align:center;")}">Tax</th>
        <th style="${th("width:90px;text-align:right;")}">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${t.rows.map((r,i) => `
        <tr style="${i%2===1?"background:#f9fafb;":""}">
          <td style="${td("text-align:center;color:#9ca3af;")}">${i+1}</td>
          <td style="${td()}">
            <div style="font-weight:600;color:#111827;">${esc(r.itemName)}</div>
            ${r.description?`<div style="font-size:9.5px;color:#9ca3af;margin-top:2px;">${esc(r.description)}</div>`:""}
            ${dispOpts.showSku&&r.sku?`<div style="font-size:9px;color:#9ca3af;">SKU: ${esc(r.sku)}</div>`:""}
          </td>
          <td style="${td("text-align:center;color:#6b7280;")}">${esc(r.hsn||"—")}</td>
          ${dispOpts.showSku ? `<td style="${td("text-align:center;color:#6b7280;")}">${esc(r.sku||"—")}</td>` : ""}
          <td style="${td("text-align:center;")}">${r.qty}${dispOpts.unitDisplay!=="hide"?" "+esc(r.unit||""):""}</td>
          <td style="${td("text-align:right;")}">${fmt(r.rate,cur)}</td>
          ${t.totalItemDiscount>0 ? `<td style="${td("text-align:right;color:#6b7280;")}">${r.itemDisc?fmt(r.itemDisc,cur):"—"}</td>` : ""}
          <td style="${td("text-align:center;color:#6b7280;")}">${r.taxRate}%</td>
          <td style="${td("text-align:right;font-weight:600;")}">${fmt(r.lineTotal,cur)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- ═══ TOTALS PANEL ═══ -->
  <div style="display:flex;justify-content:flex-end;margin-top:0;border:1px solid ${borderCol};border-top:none;">
    <div style="width:280px;padding:12px 16px;border-left:1px solid ${borderCol};">
      ${trow("Subtotal", fmt(t.subtotal,cur))}
      ${t.totalItemDiscount>0 ? trow("Item Discounts", "−"+fmt(t.totalItemDiscount,cur)) : ""}
      ${t.invDiscAmt>0 ? trow(esc(invoice.invoiceDiscount?.label||"Discount"), "−"+fmt(t.invDiscAmt,cur)) : ""}
      ${(t.totalItemDiscount>0||t.invDiscAmt>0) ? trow("Taxable Amount", fmt(t.netTaxableBase,cur), true) : ""}
      ${t.cgstLines.length||t.sgstLines.length||t.igstLines.length ? `<div style="border-top:1px dashed ${borderCol};margin:5px 0;"></div>` : ""}
      ${t.cgstLines.map(l => trow(`CGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
      ${t.sgstLines.map(l => trow(`SGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
      ${t.igstLines.map(l => trow(`IGST (${l.rate}%)`, fmt(l.amount,cur))).join("")}
      ${t.totalCharges>0 ? trow("Additional Charges", fmt(t.totalCharges,cur)) : ""}
      ${t.roundOffAmt!==0 ? trow("Round Off", (t.roundOffAmt>0?"+":"")+fmt(t.roundOffAmt,cur)) : ""}
      <div style="border-top:2px solid ${color};margin:7px 0;"></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;color:${color};padding:2px 0;">
        <span>Grand Total</span><span>${fmt(t.grandTotal,cur)}</span>
      </div>
      ${t.tdsAmt>0 ? trow(esc(invoice.tds?.label||"TDS"), "−"+fmt(t.tdsAmt,cur)) : ""}
      ${t.amountPaid>0 ? trow("Amount Paid", "−"+fmt(t.amountPaid,cur)) : ""}
      ${t.balanceDue>0 ? trow("Balance Due", fmt(t.balanceDue,cur), true, true) : ""}
    </div>
  </div>

  <!-- ═══ AMOUNT IN WORDS ═══ -->
  ${dispOpts.showTotalInWords!==false ? `
  <div style="margin-top:12px;padding:10px 14px;background:${color}0d;border:1px solid ${color}30;border-radius:6px;font-size:10px;">
    <span style="font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.04em;">Amount in Words: </span>
    <span style="color:#374151;font-style:italic;">${amountInWords(t.grandTotal)}</span>
  </div>` : ""}

  <!-- ═══ BOTTOM: Bank + Notes / Terms / Signature ═══ -->
  <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-top:16px;font-size:11px;">

    <!-- Left: Bank + Notes -->
    <div>
      ${(pay.showBank && biz.bankName) ? `
        <div style="${lbl}">Bank Details</div>
        <div style="border:1px solid ${borderCol};border-radius:6px;padding:10px;font-size:10.5px;color:#374151;line-height:1.8;margin-bottom:10px;">
          <div><span style="color:#9ca3af;display:inline-block;min-width:72px;">Bank</span>${esc(biz.bankName)}</div>
          <div><span style="color:#9ca3af;display:inline-block;min-width:72px;">Account</span>${esc(biz.accountNumber||"")}</div>
          ${biz.ifscCode?`<div><span style="color:#9ca3af;display:inline-block;min-width:72px;">IFSC</span>${esc(biz.ifscCode)}</div>`:""}
          ${biz.accountHolder?`<div><span style="color:#9ca3af;display:inline-block;min-width:72px;">A/C Holder</span>${esc(biz.accountHolder)}</div>`:""}
          ${(pay.showUpi && biz.upiId)?`<div><span style="color:#9ca3af;display:inline-block;min-width:72px;">UPI</span>${esc(biz.upiId)}</div>`:""}
        </div>
      ` : ((pay.showUpi && biz.upiId) ? `
        <div style="${lbl}">Payment</div>
        <div style="font-size:10.5px;margin-bottom:10px;">UPI: <strong>${esc(biz.upiId)}</strong></div>
      ` : "")}

      ${invoice.notes ? `
        <div style="${lbl}">Notes</div>
        <div style="font-size:10.5px;color:#6b7280;line-height:1.6;margin-bottom:10px;">${esc(invoice.notes)}</div>
      ` : ""}

      ${invoice.additionalInfo ? `
        <div style="${lbl}">Additional Info</div>
        <div style="font-size:10.5px;color:#6b7280;line-height:1.6;">${esc(invoice.additionalInfo)}</div>
      ` : ""}
    </div>

    <!-- Right: GST note + Signature -->
    <div style="display:flex;flex-direction:column;justify-content:space-between;">
      <div style="font-size:9px;color:#9ca3af;text-align:right;">
        ${isIntra?"CGST + SGST applied (Intra-state)":t.isExport?"Zero-rated (Export)":"IGST applied (Inter-state)"}
        ${(!dispOpts.hidePlaceOfSupply && invoice.placeOfSupply) ? ` · ${esc(invoice.placeOfSupply)}` : ""}
      </div>
      <div style="text-align:right;margin-top:20px;">
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:6px;">For ${esc(biz.businessName||"")}</div>
        <div style="border-bottom:1px solid #d1d5db;width:160px;margin-left:auto;margin-bottom:6px;padding-bottom:28px;"></div>
        <div style="font-size:10px;color:#9ca3af;">${esc(sig.enabled && sig.label ? sig.label : "Authorized Signatory")}</div>
      </div>
    </div>
  </div>

  <!-- ═══ TERMS & CONDITIONS ═══ -->
  ${termsHtml ? `
  <div style="margin-top:16px;border-top:1px solid ${borderCol};padding-top:12px;">
    <div style="${lbl}">Terms &amp; Conditions</div>
    ${termsHtml}
  </div>` : ""}

  <!-- ═══ FOOTER ═══ -->
  <div style="margin-top:20px;padding-top:10px;border-top:1px solid #f3f4f6;text-align:center;font-size:8.5px;color:#9ca3af;">
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
