
const STORAGE_KEY = "pro_invoice_suite_v1";
const AUTOSAVE_MS = 4000;
let autosaveTimer = null;
let dragItemIndex = null;
let toastTimer = null;

const TEMPLATE_OPTIONS = [
  { id: "classic", name: "Classic", desc: "Balanced business layout" },
  { id: "minimal", name: "Minimal", desc: "Clean no-frills document" },
  { id: "bold", name: "Bold", desc: "Stronger headline style" },
];

const state = loadState();
init();

function init() {
  applyTheme();
  bindGlobalEvents();
  syncOrgSwitcher();
  renderTemplateGallery();
  render();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch (error) {
    console.error(error);
  }
  return createInitialState();
}

function createInitialState() {
  const orgs = [
    {
      id: "org_1",
      name: "Grofast Digital",
      currency: "INR",
      business: {
        businessName: "Grofast Digital",
        address: "4/188 C, Poomalai Nagar, Kaveripattinam, Tamil Nadu",
        phone: "+91 91591 24541",
        email: "grofastdigital@gmail.com",
        taxNumber: "33ABCDE1234F1Z5",
        logoName: "logo-gd.png",
      },
    },
    {
      id: "org_2",
      name: "GD Commerce LLP",
      currency: "USD",
      business: {
        businessName: "GD Commerce LLP",
        address: "2900 Market Street, San Francisco, CA",
        phone: "+1 415 555 0192",
        email: "finance@gdcommerce.com",
        taxNumber: "US-TAX-9921",
        logoName: "logo-llp.png",
      },
    },
  ];

  const clients = [
    { id: "cli_1", orgId: "org_1", name: "MR FITNESS", companyName: "MR FITNESS", phone: "+91 90036 39222", email: "owner@mrfitness.in", address: "No 5/8, Teachers Colony, Hosur, Tamil Nadu", taxNumber: "33AAACM8812J1Z2" },
    { id: "cli_2", orgId: "org_1", name: "S7 Cars India Pvt.", companyName: "S7 Cars India Pvt.", phone: "+91 81223 11118", email: "accounts@s7cars.in", address: "Bangalore Road, Hosur, Tamil Nadu", taxNumber: "33AAKCS9123Q1ZG" },
  ];

  const base = new Date().toISOString();
  const invoices = [
    {
      id: "inv_1", orgId: "org_1", invoiceNumber: "2025/95", issueDate: "2026-02-14", dueDate: "2026-02-20", currency: "INR", reference: "PO-MR-95", taxType: "GST",
      businessDetails: { ...orgs[0].business }, clientId: "cli_1", clientDetails: { ...clients[0] },
      lineItems: [
        { id: "li_1", itemName: "Meta Ad Campaign Development & Management", description: "Service Charges for 30 days", quantity: 12, unitPrice: 20000, discount: 0, taxPercent: 18 },
        { id: "li_2", itemName: "All-in-One Business Automation System", description: "CRM and workflow setup", quantity: 12, unitPrice: 5000, discount: 0, taxPercent: 18 },
      ],
      paymentInfo: { terms: "Net 7", customDays: 7, bankDetails: "ICICI Bank, A/C 720201508823", upiId: "sajethasiva6@okicici", onlinePayment: true },
      notes: "Thank you for your trust.", terms: "50% advance required.", attachments: ["proposal.pdf"], amountPaid: 0,
      status: "Sent", deleted: false, recurring: { enabled: true, interval: "monthly", nextRun: "2026-03-14" },
      timeline: [{ status: "Created", at: `${base}` }, { status: "Sent", at: `${base}` }, { status: "Viewed", at: `${base}` }],
      activity: [{ at: `${base}`, text: "Invoice created" }, { at: `${base}`, text: "Invoice sent" }], createdAt: base, updatedAt: base, templateId: "classic",
    },
    {
      id: "inv_2", orgId: "org_1", invoiceNumber: "2025/94", issueDate: "2026-02-10", dueDate: "2026-02-15", currency: "INR", reference: "PO-S7-94", taxType: "GST",
      businessDetails: { ...orgs[0].business }, clientId: "cli_2", clientDetails: { ...clients[1] },
      lineItems: [{ id: "li_3", itemName: "Automation Maintenance Retainer", description: "Monthly servicing and integrations", quantity: 1, unitPrice: 30000, discount: 0, taxPercent: 18 }],
      paymentInfo: { terms: "Net 5", customDays: 5, bankDetails: "ICICI Bank", upiId: "grofast@okicici", onlinePayment: false },
      notes: "Please clear pending dues.", terms: "Payment due in 5 days.", attachments: [], amountPaid: 0,
      status: "Sent", deleted: false, recurring: { enabled: false, interval: "monthly", nextRun: "" },
      timeline: [{ status: "Created", at: `${base}` }, { status: "Sent", at: `${base}` }],
      activity: [{ at: `${base}`, text: "Invoice created" }], createdAt: base, updatedAt: base, templateId: "classic",
    },
  ];

  return {
    version: 1,
    theme: "light",
    template: "classic",
    currentOrgId: "org_1",
    orgs,
    clients,
    invoices,
    notifications: [{ id: uid("note"), at: base, text: "Ctrl+S save draft, Ctrl+Enter send, Ctrl+P preview", read: false }],
    editorDraft: null,
    ui: {
      route: "dashboard",
      dashboardTab: "active",
      viewingId: "inv_1",
      selectedIds: [],
      filters: { status: "all", client: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "", search: "" },
      editorDirty: false,
      autosaveLabel: "",
      editorHistory: [],
    },
  };
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }
function todayIso() { return new Date().toISOString().slice(0, 10); }
function toDate(value) { return value ? new Date(value) : null; }
function addDaysISO(baseDate, days) { const date = new Date(baseDate); date.setDate(date.getDate() + Number(days || 0)); return date.toISOString().slice(0, 10); }

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function formatMoney(amount, currency) {
  const safe = Number(amount || 0);
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(safe); }
  catch (_) { return `${currency} ${safe.toFixed(2)}`; }
}

function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function getCurrentOrg() { return state.orgs.find((org) => org.id === state.currentOrgId) || state.orgs[0]; }
function getOrgClients() { return state.clients.filter((client) => client.orgId === state.currentOrgId); }
function getOrgInvoices() { return state.invoices.filter((invoice) => invoice.orgId === state.currentOrgId); }
function getInvoiceById(id) { return state.invoices.find((invoice) => invoice.id === id); }
function upsertInvoice(invoice) { const i = state.invoices.findIndex((item) => item.id === invoice.id); if (i === -1) state.invoices.unshift(invoice); else state.invoices[i] = invoice; }
function removeFromSelection(id) { state.ui.selectedIds = state.ui.selectedIds.filter((value) => value !== id); }

function calculateInvoiceTotals(invoice) {
  let subtotal = 0; let totalDiscount = 0; let taxTotal = 0;
  const rows = (invoice.lineItems || []).map((row) => {
    const quantity = Number(row.quantity || 0);
    const unitPrice = Number(row.unitPrice || 0);
    const discount = Number(row.discount || 0);
    const taxPercent = Number(row.taxPercent || 0);
    const base = quantity * unitPrice;
    const discounted = Math.max(0, base - discount);
    const taxAmount = (discounted * taxPercent) / 100;
    subtotal += base; totalDiscount += discount; taxTotal += taxAmount;
    return { ...row, quantity, unitPrice, discount, taxPercent, total: discounted + taxAmount };
  });
  const total = Math.max(0, subtotal - totalDiscount + taxTotal);
  const paid = Number(invoice.amountPaid || 0);
  return { rows, subtotal, totalDiscount, taxTotal, total, paid, balanceDue: Math.max(0, total - paid) };
}

function isOverdue(invoice) {
  const totals = calculateInvoiceTotals(invoice);
  if (invoice.status === "Paid" || invoice.deleted) return false;
  const due = toDate(invoice.dueDate); const today = toDate(todayIso());
  return Boolean(due && due < today && totals.balanceDue > 0 && invoice.status !== "Draft");
}

function resolveStatus(invoice) {
  if (invoice.deleted) return "Deleted";
  if (invoice.status === "Paid") return "Paid";
  if (invoice.status === "Draft") return "Draft";
  if (isOverdue(invoice)) return "Overdue";
  if ((invoice.timeline || []).some((entry) => entry.status === "Viewed")) return "Viewed";
  return invoice.status || "Draft";
}
function bindGlobalEvents() {
  document.getElementById("createInvoiceTop").addEventListener("click", () => openEditor());

  document.getElementById("toggleTheme").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    saveState();
  });

  document.getElementById("orgSwitcher").addEventListener("change", (event) => {
    state.currentOrgId = event.target.value;
    state.ui.selectedIds = [];
    state.ui.filters.client = "all";
    state.ui.route = "dashboard";
    saveState();
    render();
  });

  document.getElementById("globalSearch").addEventListener("input", (event) => {
    state.ui.filters.search = event.target.value;
    if (state.ui.route === "dashboard") render();
  });

  document.getElementById("openTemplates").addEventListener("click", () => showModal("templateModal"));

  document.getElementById("openNotifications").addEventListener("click", () => {
    const unread = state.notifications.filter((item) => !item.read);
    if (!unread.length) return showToast("No new notifications");
    unread.forEach((item) => { item.read = true; });
    saveState(); renderNotifCount(); showToast(unread.map((item) => item.text).join("\n"));
  });

  document.getElementById("runAutomation").addEventListener("click", () => {
    const result = runAutomation();
    showToast(`Automation complete: ${result.created} recurring, ${result.reminders} reminders.`);
    saveState();
    if (state.ui.route === "dashboard") render();
  });

  document.getElementById("exportCsv").addEventListener("click", () => {
    downloadInvoicesCsv(applyDashboardFilters(getOrgInvoices()));
  });

  document.querySelectorAll(".nav-btn[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = button.dataset.nav;
      if (nav === "editor") return openEditor();
      if (nav === "view") {
        const fallback = getOrgInvoices()[0];
        if (!fallback) return;
        state.ui.viewingId = fallback.id;
        markViewed(fallback.id);
        state.ui.route = "view";
        saveState();
        return render();
      }
      state.ui.route = "dashboard";
      stopAutosave();
      render();
    });
  });

  document.getElementById("closeClientModal").addEventListener("click", () => hideModal("clientModal"));
  document.getElementById("closeTemplateModal").addEventListener("click", () => hideModal("templateModal"));

  document.getElementById("clientForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const client = {
      id: uid("cli"), orgId: state.currentOrgId,
      name: String(formData.get("name") || "").trim(),
      companyName: String(formData.get("company") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      taxNumber: String(formData.get("taxNumber") || "").trim(),
    };
    if (!client.name) return showToast("Client name is required.");
    state.clients.push(client);
    if (state.editorDraft) {
      state.editorDraft.clientId = client.id;
      state.editorDraft.clientDetails = { ...client };
      markEditorDirty();
    }
    event.target.reset();
    hideModal("clientModal");
    saveState();
    if (state.ui.route === "editor") renderEditor();
    showToast("Client added.");
  });

  document.addEventListener("keydown", (event) => {
    if (state.ui.route !== "editor") return;
    if (event.ctrlKey && event.key.toLowerCase() === "s") { event.preventDefault(); saveDraftFromEditor(); }
    if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); sendFromEditor(); }
    if (event.ctrlKey && event.key.toLowerCase() === "p") { event.preventDefault(); previewPdfFromEditor(); }
    if (event.ctrlKey && event.key.toLowerCase() === "z") { event.preventDefault(); undoEditorChange(); }
  });
}

function applyTheme() { document.body.classList.toggle("dark", state.theme === "dark"); }
function syncOrgSwitcher() { document.getElementById("orgSwitcher").value = state.currentOrgId; }
function renderNotifCount() { document.getElementById("notifCount").textContent = String(state.notifications.filter((n) => !n.read).length); }

function render() {
  renderNotifCount();
  updateNavState();
  if (state.ui.route === "editor") { renderEditor(); startAutosave(); return; }
  stopAutosave();
  if (state.ui.route === "view") return renderView();
  renderDashboard();
}

function updateNavState() {
  document.querySelectorAll(".nav-btn[data-nav]").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === state.ui.route);
  });
}

function renderDashboard() {
  const root = document.getElementById("screenRoot");
  const invoices = applyDashboardFilters(getOrgInvoices());
  const clients = getOrgClients();

  const totals = invoices.reduce((acc, invoice) => {
    const calc = calculateInvoiceTotals(invoice);
    acc.total += calc.total; acc.balance += calc.balanceDue;
    if (resolveStatus(invoice) === "Overdue") acc.overdue += 1;
    if (resolveStatus(invoice) === "Paid") acc.paid += 1;
    return acc;
  }, { total: 0, balance: 0, overdue: 0, paid: 0 });

  root.innerHTML = `
    <section class="grid-cards">
      <article class="metric card"><div class="label">Invoices (${escapeHtml(state.ui.dashboardTab)})</div><div class="value">${invoices.length}</div></article>
      <article class="metric card"><div class="label">Total Billed</div><div class="value">${formatMoney(totals.total, getCurrentOrg().currency)}</div></article>
      <article class="metric card"><div class="label">Balance Due</div><div class="value">${formatMoney(totals.balance, getCurrentOrg().currency)}</div></article>
      <article class="metric card"><div class="label">Overdue / Paid</div><div class="value">${totals.overdue} / ${totals.paid}</div></article>
    </section>

    <section class="card">
      <div class="dashboard-toolbar">
        <div class="filter-grid">
          <label>Status<select id="filterStatus"><option value="all">All</option><option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Viewed">Viewed</option><option value="Paid">Paid</option><option value="Overdue">Overdue</option></select></label>
          <label>Client<select id="filterClient"><option value="all">All Clients</option>${clients.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></label>
          <label>Start Date<input id="filterStart" type="date" value="${escapeHtml(state.ui.filters.startDate)}" /></label>
          <label>End Date<input id="filterEnd" type="date" value="${escapeHtml(state.ui.filters.endDate)}" /></label>
          <label>Min Amount<input id="filterMin" type="number" min="0" value="${escapeHtml(state.ui.filters.minAmount)}" /></label>
          <label>Max Amount<input id="filterMax" type="number" min="0" value="${escapeHtml(state.ui.filters.maxAmount)}" /></label>
        </div>
        <div class="action-row"><button class="secondary-btn" id="applyFiltersBtn" type="button">Apply Filters</button><button class="ghost-btn" id="clearFiltersBtn" type="button">Clear</button></div>
      </div>

      <div class="action-row" style="margin-bottom:10px;">
        <button class="tab-filter ${state.ui.dashboardTab === "active" ? "primary-btn" : "secondary-btn"}" data-tab="active" type="button">Active</button>
        <button class="tab-filter ${state.ui.dashboardTab === "recurring" ? "primary-btn" : "secondary-btn"}" data-tab="recurring" type="button">Recurring</button>
        <button class="tab-filter ${state.ui.dashboardTab === "deleted" ? "primary-btn" : "secondary-btn"}" data-tab="deleted" type="button">Deleted</button>
      </div>

      ${state.ui.selectedIds.length ? `<div class="bulk-bar"><strong>${state.ui.selectedIds.length} selected</strong><div class="bulk-actions"><button class="secondary-btn" data-bulk="send" type="button">Send</button><button class="secondary-btn" data-bulk="download" type="button">Download PDFs</button><button class="secondary-btn" data-bulk="paid" type="button">Mark Paid</button><button class="secondary-btn" data-bulk="delete" type="button">Delete</button></div></div>` : ""}

      <div class="table-wrap"><table><thead><tr><th><input type="checkbox" id="selectAllRows" ${invoices.length && state.ui.selectedIds.length === invoices.length ? "checked" : ""} /></th><th>Invoice Number</th><th>Client Name</th><th>Issue Date</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${invoices.length ? invoices.map((invoice) => {
          const status = resolveStatus(invoice);
          const calc = calculateInvoiceTotals(invoice);
          return `<tr><td><input type="checkbox" data-select-id="${invoice.id}" ${state.ui.selectedIds.includes(invoice.id) ? "checked" : ""} /></td><td>${escapeHtml(invoice.invoiceNumber)}</td><td>${escapeHtml(invoice.clientDetails.name || "-")}</td><td>${fmtDate(invoice.issueDate)}</td><td>${fmtDate(invoice.dueDate)}</td><td>${formatMoney(calc.total, invoice.currency)}</td><td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td><td><div class="action-row"><button data-action="view" data-id="${invoice.id}" type="button">View</button><button data-action="edit" data-id="${invoice.id}" type="button">Edit</button><button data-action="download" data-id="${invoice.id}" type="button">Download</button><button data-action="send" data-id="${invoice.id}" type="button">Send</button><button data-action="delete" data-id="${invoice.id}" type="button">Delete</button></div></td></tr>`;
        }).join("") : `<tr><td colspan="8">No invoices found.</td></tr>`}
      </tbody></table></div>
    </section>
  `;

  document.getElementById("filterStatus").value = state.ui.filters.status;
  document.getElementById("filterClient").value = state.ui.filters.client;
  bindDashboardEvents();
}

function applyDashboardFilters(invoices) {
  const f = state.ui.filters;
  const search = (f.search || "").trim().toLowerCase();
  return invoices.filter((invoice) => {
    const status = resolveStatus(invoice);
    if (state.ui.dashboardTab === "active" && (invoice.deleted || (invoice.recurring && invoice.recurring.enabled))) return false;
    if (state.ui.dashboardTab === "recurring" && !(invoice.recurring && invoice.recurring.enabled && !invoice.deleted)) return false;
    if (state.ui.dashboardTab === "deleted" && !invoice.deleted) return false;
    if (f.status !== "all" && status !== f.status) return false;
    if (f.client !== "all" && invoice.clientId !== f.client) return false;
    const issue = toDate(invoice.issueDate);
    if (f.startDate && issue && issue < toDate(f.startDate)) return false;
    if (f.endDate && issue && issue > toDate(f.endDate)) return false;
    const totals = calculateInvoiceTotals(invoice);
    if (f.minAmount && totals.total < Number(f.minAmount)) return false;
    if (f.maxAmount && totals.total > Number(f.maxAmount)) return false;
    if (search) {
      const hay = `${invoice.invoiceNumber} ${invoice.clientDetails.name} ${totals.total}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}
function bindDashboardEvents() {
  const setFilter = () => {
    state.ui.filters.status = document.getElementById("filterStatus").value;
    state.ui.filters.client = document.getElementById("filterClient").value;
    state.ui.filters.startDate = document.getElementById("filterStart").value;
    state.ui.filters.endDate = document.getElementById("filterEnd").value;
    state.ui.filters.minAmount = document.getElementById("filterMin").value;
    state.ui.filters.maxAmount = document.getElementById("filterMax").value;
  };

  document.getElementById("applyFiltersBtn").addEventListener("click", () => { setFilter(); saveState(); renderDashboard(); });
  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    state.ui.filters = { status: "all", client: "all", startDate: "", endDate: "", minAmount: "", maxAmount: "", search: state.ui.filters.search };
    saveState();
    renderDashboard();
  });

  document.querySelectorAll(".tab-filter").forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.dashboardTab = button.dataset.tab;
      state.ui.selectedIds = [];
      saveState();
      renderDashboard();
    });
  });

  const selectAll = document.getElementById("selectAllRows");
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      const ids = applyDashboardFilters(getOrgInvoices()).map((i) => i.id);
      state.ui.selectedIds = selectAll.checked ? ids : [];
      saveState();
      renderDashboard();
    });
  }

  document.querySelectorAll("input[data-select-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.selectId;
      if (!id) return;
      if (checkbox.checked && !state.ui.selectedIds.includes(id)) state.ui.selectedIds.push(id);
      if (!checkbox.checked) removeFromSelection(id);
      saveState();
      renderDashboard();
    });
  });

  document.querySelectorAll("button[data-action]").forEach((button) => button.addEventListener("click", () => handleInvoiceAction(button.dataset.action, button.dataset.id)));
  document.querySelectorAll("button[data-bulk]").forEach((button) => button.addEventListener("click", () => handleBulkAction(button.dataset.bulk)));
}

function handleInvoiceAction(action, invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  if (action === "view") {
    state.ui.viewingId = invoice.id;
    state.ui.route = "view";
    markViewed(invoice.id);
    saveState();
    return render();
  }
  if (action === "edit") return openEditor(invoice.id);
  if (action === "download") return downloadInvoicePdf(invoice);
  if (action === "send") {
    markSent(invoice.id);
    saveState();
    showToast(`Invoice ${invoice.invoiceNumber} sent.`);
    return renderDashboard();
  }
  if (action === "delete") {
    invoice.deleted = true;
    appendActivity(invoice, "Invoice moved to deleted invoices.");
    removeFromSelection(invoice.id);
    saveState();
    return renderDashboard();
  }
}

function handleBulkAction(action) {
  if (!state.ui.selectedIds.length) return;
  const selected = state.ui.selectedIds.map((id) => getInvoiceById(id)).filter(Boolean);
  if (action === "send") { selected.forEach((invoice) => markSent(invoice.id)); showToast(`${selected.length} invoice(s) sent.`); }
  if (action === "download") { selected.slice(0, 3).forEach((invoice) => downloadInvoicePdf(invoice)); showToast(`Downloading ${Math.min(3, selected.length)} PDFs.`); }
  if (action === "paid") { selected.forEach((invoice) => markPaid(invoice.id, "Bulk action")); showToast(`${selected.length} invoice(s) marked paid.`); }
  if (action === "delete") { selected.forEach((invoice) => { invoice.deleted = true; appendActivity(invoice, "Invoice deleted via bulk action."); }); showToast(`${selected.length} invoice(s) deleted.`); }
  state.ui.selectedIds = [];
  saveState();
  renderDashboard();
}

function nextInvoiceNumber() {
  const nums = getOrgInvoices().map((invoice) => invoice.invoiceNumber.match(/(\d+)$/)).filter(Boolean).map((match) => Number(match[1]));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-${String(next).padStart(3, "0")}`;
}

function openEditor(invoiceId = null, duplicate = false) {
  const org = getCurrentOrg();
  if (invoiceId) {
    const source = getInvoiceById(invoiceId);
    if (!source) return;
    const draft = deepCopy(source);
    if (duplicate) {
      draft.id = uid("inv");
      draft.invoiceNumber = nextInvoiceNumber();
      draft.status = "Draft";
      draft.timeline = [{ status: "Created", at: new Date().toISOString() }];
      draft.activity = [{ at: new Date().toISOString(), text: "Invoice duplicated and opened in editor." }];
    }
    state.editorDraft = draft;
  } else {
    state.editorDraft = {
      id: uid("inv"), orgId: state.currentOrgId, invoiceNumber: nextInvoiceNumber(), issueDate: todayIso(), dueDate: addDaysISO(todayIso(), 30), currency: org.currency, reference: "", taxType: "GST",
      businessDetails: { ...org.business }, clientId: "", clientDetails: { id: "", name: "", companyName: "", phone: "", email: "", address: "", taxNumber: "" },
      lineItems: [{ id: uid("li"), itemName: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxPercent: 18 }],
      paymentInfo: { terms: "Net 30", customDays: 30, bankDetails: org.business.businessName, upiId: "", onlinePayment: false },
      notes: "", terms: "", attachments: [], amountPaid: 0, status: "Draft", deleted: false,
      recurring: { enabled: false, interval: "monthly", nextRun: "" },
      timeline: [{ status: "Created", at: new Date().toISOString() }], activity: [{ at: new Date().toISOString(), text: "Draft invoice initiated." }],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), templateId: state.template,
    };
  }
  state.ui.route = "editor";
  state.ui.editorDirty = false;
  state.ui.autosaveLabel = "";
  state.ui.editorHistory = [deepCopy(state.editorDraft)];
  saveState();
  render();
}

function renderEditor() {
  const root = document.getElementById("screenRoot");
  if (!state.editorDraft) return openEditor();
  const draft = state.editorDraft;
  const clients = getOrgClients();
  const totals = calculateInvoiceTotals(draft);

  root.innerHTML = `
    <section class="editor-layout">
      <div class="editor-main">
        <article class="card"><div class="action-row" style="justify-content:space-between;align-items:center;"><h2 style="margin:0;">Create / Edit Invoice</h2><button class="secondary-btn" id="backToDashboard" type="button">Back to Dashboard</button></div><p class="small-note">Autosave: ${escapeHtml(state.ui.autosaveLabel || "Pending")} | Shortcuts: <kbd>Ctrl+S</kbd> <kbd>Ctrl+Enter</kbd> <kbd>Ctrl+P</kbd> <kbd>Ctrl+Z</kbd></p></article>

        <article class="card"><h3 class="section-title">1. Header Info</h3><div class="form-grid">
          <label>Invoice Number<input class="field" data-path="invoiceNumber" value="${escapeHtml(draft.invoiceNumber)}" /></label>
          <label>Issue Date<input class="field" data-path="issueDate" type="date" value="${escapeHtml(draft.issueDate)}" /></label>
          <label>Due Date<input class="field" data-path="dueDate" type="date" value="${escapeHtml(draft.dueDate)}" /></label>
          <label>Currency<select class="field" data-path="currency">${["INR", "USD", "EUR", "GBP", "AED", "SGD"].map((cur) => `<option value="${cur}" ${draft.currency === cur ? "selected" : ""}>${cur}</option>`).join("")}</select></label>
          <label>Reference / PO<input class="field" data-path="reference" value="${escapeHtml(draft.reference)}" /></label>
          <label>Tax Type<select class="field" data-path="taxType">${["GST", "VAT", "Sales Tax", "None"].map((type) => `<option value="${type}" ${draft.taxType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
        </div></article>

        <article class="card"><h3 class="section-title">2. Your Business Details</h3><div class="form-grid">
          <label>Business Name<input class="field" data-path="businessDetails.businessName" value="${escapeHtml(draft.businessDetails.businessName)}" /></label>
          <label>Phone<input class="field" data-path="businessDetails.phone" value="${escapeHtml(draft.businessDetails.phone)}" /></label>
          <label>Email<input class="field" type="email" data-path="businessDetails.email" value="${escapeHtml(draft.businessDetails.email)}" /></label>
          <label>Tax Number<input class="field" data-path="businessDetails.taxNumber" value="${escapeHtml(draft.businessDetails.taxNumber)}" /></label>
          <label>Logo Upload<input class="field" id="logoUpload" type="file" accept="image/*" /></label>
          <label class="wide">Address<textarea class="field" rows="2" data-path="businessDetails.address">${escapeHtml(draft.businessDetails.address)}</textarea></label>
        </div></article>

        <article class="card"><h3 class="section-title">3. Client Details</h3><div class="form-grid">
          <label>Select Existing Client<select class="field" id="clientSelector"><option value="">Select client</option>${clients.map((c) => `<option value="${c.id}" ${draft.clientId === c.id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></label>
          <label><span>&nbsp;</span><button class="secondary-btn" id="addClientBtn" type="button">+ Add New Client</button></label><div></div>
          <label>Client Name<input class="field" data-path="clientDetails.name" value="${escapeHtml(draft.clientDetails.name)}" /></label>
          <label>Company Name<input class="field" data-path="clientDetails.companyName" value="${escapeHtml(draft.clientDetails.companyName)}" /></label>
          <label>Phone<input class="field" data-path="clientDetails.phone" value="${escapeHtml(draft.clientDetails.phone)}" /></label>
          <label>Email<input class="field" type="email" data-path="clientDetails.email" value="${escapeHtml(draft.clientDetails.email)}" /></label>
          <label>Tax Number<input class="field" data-path="clientDetails.taxNumber" value="${escapeHtml(draft.clientDetails.taxNumber)}" /></label>
          <label class="wide">Address<textarea class="field" rows="2" data-path="clientDetails.address">${escapeHtml(draft.clientDetails.address)}</textarea></label>
        </div></article>

        <article class="card"><div class="item-controls"><h3 class="section-title" style="margin:0;">4. Line Items</h3><button class="secondary-btn" id="addItemBtn" type="button">+ Add New Row</button></div><div class="table-wrap item-table"><table><thead><tr><th></th><th>Item / description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax %</th><th>Amount</th><th></th></tr></thead><tbody>
          ${totals.rows.map((row, i) => `<tr draggable="true" data-row-index="${i}"><td><span class="drag-handle">::</span></td><td><input class="field" data-item-index="${i}" data-item-field="itemName" value="${escapeHtml(row.itemName)}" placeholder="Item" /><input class="field" data-item-index="${i}" data-item-field="description" value="${escapeHtml(row.description)}" placeholder="Description" style="margin-top:6px;" /></td><td><input class="field" type="number" min="0" data-item-index="${i}" data-item-field="quantity" value="${row.quantity}" /></td><td><input class="field" type="number" min="0" data-item-index="${i}" data-item-field="unitPrice" value="${row.unitPrice}" /></td><td><input class="field" type="number" min="0" data-item-index="${i}" data-item-field="discount" value="${row.discount}" /></td><td><input class="field" type="number" min="0" data-item-index="${i}" data-item-field="taxPercent" value="${row.taxPercent}" /></td><td>${formatMoney(row.total, draft.currency)}</td><td><div class="action-row"><button type="button" data-item-move="up" data-item-index="${i}">Up</button><button type="button" data-item-move="down" data-item-index="${i}">Down</button><button type="button" data-item-remove="${i}">Remove</button></div></td></tr>`).join("")}
        </tbody></table></div></article>

        <article class="card"><h3 class="section-title">5. Payment Information</h3><div class="form-grid">
          <label>Payment Terms<select class="field" data-path="paymentInfo.terms" id="paymentTermsSelect">${["Due on Receipt", "Net 7", "Net 15", "Net 30", "Custom"].map((t) => `<option value="${t}" ${draft.paymentInfo.terms === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label>Custom Days<input class="field" type="number" min="0" data-path="paymentInfo.customDays" value="${draft.paymentInfo.customDays || 0}" /></label>
          <label>UPI / Payment ID<input class="field" data-path="paymentInfo.upiId" value="${escapeHtml(draft.paymentInfo.upiId)}" /></label>
          <label class="wide">Bank Details<textarea class="field" rows="2" data-path="paymentInfo.bankDetails">${escapeHtml(draft.paymentInfo.bankDetails)}</textarea></label>
          <label><span>Enable online payment</span><input type="checkbox" id="onlinePaymentToggle" ${draft.paymentInfo.onlinePayment ? "checked" : ""} /></label>
          <label><span>Recurring invoice</span><input type="checkbox" id="recurringToggle" ${draft.recurring.enabled ? "checked" : ""} /></label>
          <label>Recurring Interval<select class="field" data-path="recurring.interval">${["weekly", "monthly", "quarterly"].map((r) => `<option value="${r}" ${draft.recurring.interval === r ? "selected" : ""}>${r}</option>`).join("")}</select></label>
          <label>Next Recurring Date<input class="field" type="date" data-path="recurring.nextRun" value="${escapeHtml(draft.recurring.nextRun || "")}" /></label>
        </div></article>

        <article class="card"><h3 class="section-title">6. Notes & Attachments</h3><div class="form-grid">
          <label class="wide">Notes to Client<textarea class="field" rows="3" data-path="notes">${escapeHtml(draft.notes)}</textarea></label>
          <label class="wide">Terms & Conditions<textarea class="field" rows="3" data-path="terms">${escapeHtml(draft.terms)}</textarea></label>
          <label class="wide">Attachments<input class="field" id="attachmentsInput" type="file" multiple /></label>
          <div class="wide small-note">${draft.attachments.length ? `Attached: ${draft.attachments.map(escapeHtml).join(", ")}` : "No attachments"}</div>
        </div></article>
      </div>

      <aside class="summary-sidebar card"><h3 class="section-title">7. Invoice Summary</h3><div class="summary-list">
        <div><span>Subtotal</span><strong>${formatMoney(totals.subtotal, draft.currency)}</strong></div>
        <div><span>Discount</span><strong>${formatMoney(totals.totalDiscount, draft.currency)}</strong></div>
        <div><span>Tax</span><strong>${formatMoney(totals.taxTotal, draft.currency)}</strong></div>
        <div><span>Total</span><strong>${formatMoney(totals.total, draft.currency)}</strong></div>
        <div><span>Amount Paid</span><strong>${formatMoney(totals.paid, draft.currency)}</strong></div>
        <div class="grand"><span>Balance Due</span><strong>${formatMoney(totals.balanceDue, draft.currency)}</strong></div>
      </div>
      <label style="margin-top:10px;display:block;color:var(--muted);">Amount Paid<input class="field" type="number" min="0" data-path="amountPaid" value="${draft.amountPaid || 0}" /></label>
      <div class="sticky-actions"><button class="secondary-btn" id="undoBtn" type="button">Undo Changes</button><button class="secondary-btn" id="saveDraftBtn" type="button">Save Draft</button><button class="secondary-btn" id="previewPdfBtn" type="button">Preview PDF</button><button class="secondary-btn" id="downloadPdfBtn" type="button">Download PDF</button><button class="primary-btn" id="sendInvoiceBtn" type="button">Send Invoice</button></div>
      </aside>
    </section>
  `;

  bindEditorEvents();
}
function bindEditorEvents() {
  const root = document.getElementById("screenRoot");

  root.querySelectorAll("[data-path]").forEach((input) => {
    input.addEventListener("input", () => {
      setByPath(state.editorDraft, input.dataset.path, parseInputValue(input));
      if (input.dataset.path === "issueDate" || input.dataset.path === "paymentInfo.customDays") syncDueDateFromTerms();
      markEditorDirty();
    });
  });

  const terms = document.getElementById("paymentTermsSelect");
  if (terms) terms.addEventListener("change", () => { syncDueDateFromTerms(); markEditorDirty(); renderEditor(); });

  document.getElementById("onlinePaymentToggle").addEventListener("change", (event) => { state.editorDraft.paymentInfo.onlinePayment = event.target.checked; markEditorDirty(); });
  document.getElementById("recurringToggle").addEventListener("change", (event) => {
    state.editorDraft.recurring.enabled = event.target.checked;
    if (event.target.checked && !state.editorDraft.recurring.nextRun) state.editorDraft.recurring.nextRun = addDaysISO(state.editorDraft.issueDate || todayIso(), 30);
    markEditorDirty();
    renderEditor();
  });

  document.getElementById("clientSelector").addEventListener("change", (event) => {
    const clientId = event.target.value;
    state.editorDraft.clientId = clientId;
    if (clientId) {
      const client = state.clients.find((entry) => entry.id === clientId);
      if (client) state.editorDraft.clientDetails = deepCopy(client);
    }
    markEditorDirty();
    renderEditor();
  });

  document.getElementById("addClientBtn").addEventListener("click", () => showModal("clientModal"));

  document.getElementById("logoUpload").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    state.editorDraft.businessDetails.logoName = file.name;
    markEditorDirty();
    showToast(`Logo attached: ${file.name}`);
  });

  document.getElementById("attachmentsInput").addEventListener("change", (event) => {
    const files = [...(event.target.files || [])].map((file) => file.name);
    if (!files.length) return;
    state.editorDraft.attachments = [...new Set([...state.editorDraft.attachments, ...files])];
    markEditorDirty();
    renderEditor();
  });

  document.getElementById("addItemBtn").addEventListener("click", () => {
    state.editorDraft.lineItems.push({ id: uid("li"), itemName: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxPercent: 18 });
    markEditorDirty();
    renderEditor();
  });

  root.querySelectorAll("[data-item-field]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.itemIndex);
      const field = input.dataset.itemField;
      const row = state.editorDraft.lineItems[index];
      if (!row) return;
      row[field] = ["quantity", "unitPrice", "discount", "taxPercent"].includes(field) ? Number(input.value || 0) : input.value;
      markEditorDirty();
      renderEditor();
    });
  });

  root.querySelectorAll("button[data-item-remove]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.itemRemove);
    state.editorDraft.lineItems.splice(index, 1);
    if (!state.editorDraft.lineItems.length) state.editorDraft.lineItems.push({ id: uid("li"), itemName: "", description: "", quantity: 1, unitPrice: 0, discount: 0, taxPercent: 18 });
    markEditorDirty();
    renderEditor();
  }));

  root.querySelectorAll("button[data-item-move]").forEach((button) => button.addEventListener("click", () => {
    const i = Number(button.dataset.itemIndex);
    reorderItem(i, button.dataset.itemMove === "up" ? i - 1 : i + 1);
  }));

  root.querySelectorAll("tr[data-row-index]").forEach((row) => {
    row.addEventListener("dragstart", () => { dragItemIndex = Number(row.dataset.rowIndex); });
    row.addEventListener("dragover", (event) => event.preventDefault());
    row.addEventListener("drop", () => {
      const target = Number(row.dataset.rowIndex);
      if (Number.isInteger(dragItemIndex)) reorderItem(dragItemIndex, target);
      dragItemIndex = null;
    });
  });

  document.getElementById("backToDashboard").addEventListener("click", () => { state.ui.route = "dashboard"; saveState(); render(); });
  document.getElementById("undoBtn").addEventListener("click", undoEditorChange);
  document.getElementById("saveDraftBtn").addEventListener("click", saveDraftFromEditor);
  document.getElementById("previewPdfBtn").addEventListener("click", previewPdfFromEditor);
  document.getElementById("downloadPdfBtn").addEventListener("click", () => downloadInvoicePdf(state.editorDraft));
  document.getElementById("sendInvoiceBtn").addEventListener("click", sendFromEditor);
}

function parseInputValue(input) { return input.type === "number" ? Number(input.value || 0) : input.value; }

function setByPath(target, path, value) {
  const keys = path.split("."); let ref = target;
  for (let i = 0; i < keys.length - 1; i += 1) { if (!ref[keys[i]] || typeof ref[keys[i]] !== "object") ref[keys[i]] = {}; ref = ref[keys[i]]; }
  ref[keys[keys.length - 1]] = value;
}

function syncDueDateFromTerms() {
  const draft = state.editorDraft; if (!draft) return;
  const issue = draft.issueDate || todayIso();
  let days = Number(draft.paymentInfo.customDays || 0);
  if (draft.paymentInfo.terms === "Net 7") days = 7;
  if (draft.paymentInfo.terms === "Net 15") days = 15;
  if (draft.paymentInfo.terms === "Net 30") days = 30;
  if (draft.paymentInfo.terms === "Due on Receipt") days = 0;
  draft.paymentInfo.customDays = days;
  draft.dueDate = addDaysISO(issue, days);
}

function reorderItem(fromIndex, toIndex) {
  const rows = state.editorDraft.lineItems;
  if (toIndex < 0 || toIndex >= rows.length || fromIndex === toIndex) return;
  const picked = rows.splice(fromIndex, 1)[0];
  rows.splice(toIndex, 0, picked);
  markEditorDirty();
  renderEditor();
}

function markEditorDirty() {
  state.ui.editorDirty = true;
  state.editorDraft.updatedAt = new Date().toISOString();
  const h = state.ui.editorHistory;
  const snap = deepCopy(state.editorDraft);
  if (!h.length || JSON.stringify(h[h.length - 1]) !== JSON.stringify(snap)) {
    h.push(snap);
    if (h.length > 40) h.shift();
  }
}

function undoEditorChange() {
  const h = state.ui.editorHistory;
  if (h.length <= 1) return showToast("Nothing to undo.");
  h.pop();
  state.editorDraft = deepCopy(h[h.length - 1]);
  state.ui.editorDirty = true;
  renderEditor();
  showToast("Last change undone.");
}

function saveDraftFromEditor() {
  if (!state.editorDraft) return;
  const invoice = deepCopy(state.editorDraft);
  invoice.status = "Draft";
  if (!invoice.timeline.some((entry) => entry.status === "Created")) invoice.timeline.unshift({ status: "Created", at: new Date().toISOString() });
  appendActivity(invoice, "Draft saved.");
  upsertInvoice(invoice);
  state.editorDraft = invoice;
  state.ui.editorDirty = false;
  state.ui.autosaveLabel = `Saved at ${new Date().toLocaleTimeString()}`;
  saveState();
  showToast("Draft saved.");
  renderEditor();
}

function sendFromEditor() {
  if (!state.editorDraft) return;
  const invoice = deepCopy(state.editorDraft);
  invoice.status = "Sent"; invoice.deleted = false;
  ensureTimeline(invoice, "Created"); ensureTimeline(invoice, "Sent");
  appendActivity(invoice, "Invoice sent to client by email/WhatsApp.");
  upsertInvoice(invoice);
  state.editorDraft = invoice; state.ui.editorDirty = false;
  state.ui.route = "view"; state.ui.viewingId = invoice.id;
  state.notifications.unshift({ id: uid("note"), at: new Date().toISOString(), text: `Invoice ${invoice.invoiceNumber} sent successfully.`, read: false });
  saveState();
  render();
}
function markSent(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  invoice.status = "Sent";
  invoice.deleted = false;
  ensureTimeline(invoice, "Created");
  ensureTimeline(invoice, "Sent");
  appendActivity(invoice, "Invoice sent.");
}

function markViewed(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  ensureTimeline(invoice, "Viewed");
  appendActivity(invoice, "Invoice viewed in portal.");
}

function markPaid(invoiceId, reason = "Invoice marked as paid.") {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) return;
  const totals = calculateInvoiceTotals(invoice);
  invoice.amountPaid = totals.total;
  invoice.status = "Paid";
  ensureTimeline(invoice, "Paid");
  appendActivity(invoice, reason);
  state.notifications.unshift({ id: uid("note"), at: new Date().toISOString(), text: `Payment receipt emailed for ${invoice.invoiceNumber}.`, read: false });
}

function ensureTimeline(invoice, status) { if (!invoice.timeline.some((entry) => entry.status === status)) invoice.timeline.push({ status, at: new Date().toISOString() }); }
function appendActivity(invoice, text) { invoice.activity = invoice.activity || []; invoice.activity.unshift({ at: new Date().toISOString(), text }); invoice.updatedAt = new Date().toISOString(); }

function renderView() {
  const root = document.getElementById("screenRoot");
  const invoice = getInvoiceById(state.ui.viewingId);
  if (!invoice) { state.ui.route = "dashboard"; return render(); }
  const totals = calculateInvoiceTotals(invoice);
  const steps = ["Created", "Sent", "Viewed", "Paid"];

  root.innerHTML = `
    <section class="card">
      <div class="action-row" style="justify-content:space-between;align-items:center;margin-bottom:10px;"><h2 style="margin:0;">Invoice View - ${escapeHtml(invoice.invoiceNumber)}</h2><button class="secondary-btn" id="backDashboardFromView" type="button">Back to Dashboard</button></div>
      <div class="timeline">${steps.map((s) => { const f = (invoice.timeline || []).find((x) => x.status === s); return `<div class="timeline-step ${f ? "done" : ""}"><strong>${s}</strong><div class="small-note">${f ? fmtDate(f.at) : "Pending"}</div></div>`; }).join("")}</div>
      <div class="view-actions"><button class="secondary-btn" data-view-action="edit" type="button">Edit</button><button class="secondary-btn" data-view-action="duplicate" type="button">Duplicate</button><button class="secondary-btn" data-view-action="download" type="button">Download PDF</button><button class="secondary-btn" data-view-action="remind" type="button">Send Reminder</button><button class="secondary-btn" data-view-action="paid" type="button">Mark as Paid</button><button class="secondary-btn" data-view-action="delete" type="button">Delete</button></div>
      <div class="invoice-preview">${buildPreviewHtml(invoice, totals)}</div>
      <article class="card" style="margin-top:12px;"><h3 style="margin-top:0;">Activity History Log</h3><div class="activity-log">${(invoice.activity || []).map((log) => `<div class="log-item">${fmtDate(log.at)} - ${escapeHtml(log.text)}</div>`).join("") || "<div class=\"log-item\">No history yet.</div>"}</div></article>
    </section>
  `;

  document.getElementById("backDashboardFromView").addEventListener("click", () => { state.ui.route = "dashboard"; saveState(); render(); });
  document.querySelectorAll("[data-view-action]").forEach((button) => button.addEventListener("click", () => handleViewAction(button.dataset.viewAction, invoice.id)));
}

function handleViewAction(action, invoiceId) {
  if (action === "edit") return openEditor(invoiceId);
  if (action === "duplicate") { openEditor(invoiceId, true); return showToast("Duplicate opened in editor."); }
  if (action === "download") { const inv = getInvoiceById(invoiceId); if (inv) downloadInvoicePdf(inv); return; }
  if (action === "remind") {
    const inv = getInvoiceById(invoiceId);
    if (!inv) return;
    appendActivity(inv, "Payment reminder sent via email and WhatsApp.");
    state.notifications.unshift({ id: uid("note"), at: new Date().toISOString(), text: `Reminder sent for ${inv.invoiceNumber}.`, read: false });
    saveState(); showToast("Reminder sent."); return renderView();
  }
  if (action === "paid") { markPaid(invoiceId, "Paid from invoice view quick action."); saveState(); showToast("Invoice marked as paid."); return renderView(); }
  if (action === "delete") {
    const inv = getInvoiceById(invoiceId);
    if (!inv) return;
    inv.deleted = true;
    appendActivity(inv, "Invoice deleted from view page.");
    state.ui.route = "dashboard";
    saveState();
    render();
  }
}

function runAutomation() {
  const today = todayIso();
  const invoices = getOrgInvoices();
  let created = 0; let reminders = 0;
  invoices.forEach((invoice) => {
    if (invoice.deleted) return;
    if (invoice.recurring && invoice.recurring.enabled && invoice.recurring.nextRun && invoice.recurring.nextRun <= today) {
      const duplicate = deepCopy(invoice);
      duplicate.id = uid("inv"); duplicate.invoiceNumber = nextInvoiceNumber(); duplicate.issueDate = invoice.recurring.nextRun;
      duplicate.dueDate = addDaysISO(duplicate.issueDate, duplicate.paymentInfo.customDays || 30); duplicate.status = "Draft"; duplicate.amountPaid = 0; duplicate.deleted = false;
      duplicate.timeline = [{ status: "Created", at: new Date().toISOString() }];
      duplicate.activity = [{ at: new Date().toISOString(), text: "Auto-created from recurring schedule." }];
      const stepMap = { weekly: 7, monthly: 30, quarterly: 90 };
      invoice.recurring.nextRun = addDaysISO(invoice.recurring.nextRun, stepMap[invoice.recurring.interval] || 30);
      appendActivity(invoice, `Recurring run executed. Next run on ${invoice.recurring.nextRun}.`);
      state.invoices.unshift(duplicate); created += 1;
    }
    if (isOverdue(invoice)) { appendActivity(invoice, "Automated overdue reminder sent."); reminders += 1; }
  });
  if (created || reminders) state.notifications.unshift({ id: uid("note"), at: new Date().toISOString(), text: `Automation: ${created} recurring, ${reminders} reminders.`, read: false });
  return { created, reminders };
}

function startAutosave() {
  if (autosaveTimer) return;
  autosaveTimer = setInterval(() => {
    if (state.ui.route !== "editor" || !state.editorDraft || !state.ui.editorDirty) return;
    const invoice = deepCopy(state.editorDraft);
    invoice.status = invoice.status || "Draft";
    appendActivity(invoice, "Autosaved draft.");
    upsertInvoice(invoice);
    state.editorDraft = invoice;
    state.ui.editorDirty = false;
    state.ui.autosaveLabel = `Autosaved at ${new Date().toLocaleTimeString()}`;
    saveState();
    renderEditor();
  }, AUTOSAVE_MS);
}

function stopAutosave() { if (autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null; } }
function previewPdfFromEditor() { if (!state.editorDraft) return; openPrintPreview(state.editorDraft, calculateInvoiceTotals(state.editorDraft), true); }
function downloadInvoicePdf(invoice) { openPrintPreview(invoice, calculateInvoiceTotals(invoice), false); }

function openPrintPreview(invoice, totals, previewOnly) {
  const stage = document.createElement("div");
  stage.className = "print-stage";
  stage.innerHTML = buildPrintHtml(invoice, totals);
  document.body.appendChild(stage);
  const sheet = stage.querySelector(".print-sheet");
  const fileName = `${(invoice.invoiceNumber || "invoice").replace(/[^a-z0-9-_]/gi, "-")}.pdf`;
  if (typeof window.html2pdf !== "function") { window.print(); stage.remove(); return; }
  if (previewOnly) {
    window.html2pdf().set({ margin: [5, 5, 5, 5], filename: fileName, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, backgroundColor: "#ffffff" }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(sheet).toPdf().get("pdf").then((pdf) => {
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 12000);
    }).finally(() => stage.remove());
    return;
  }
  window.html2pdf().set({ margin: [5, 5, 5, 5], filename: fileName, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, backgroundColor: "#ffffff" }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } }).from(sheet).save().finally(() => stage.remove());
}

function buildPreviewHtml(invoice, totals) {
  return `<div class="print-head"><div><h2 class="print-title">Invoice ${escapeHtml(invoice.invoiceNumber)}</h2><div class="print-meta">Issue: ${fmtDate(invoice.issueDate)} | Due: ${fmtDate(invoice.dueDate)} | Currency: ${escapeHtml(invoice.currency)}</div></div><div class="print-meta">Status: ${escapeHtml(resolveStatus(invoice))}</div></div>
  <div class="preview-grid"><article class="preview-box"><h4>Billed By</h4><div>${escapeHtml(invoice.businessDetails.businessName)}</div><div>${escapeHtml(invoice.businessDetails.address)}</div><div>${escapeHtml(invoice.businessDetails.phone)}</div><div>${escapeHtml(invoice.businessDetails.email)}</div></article><article class="preview-box"><h4>Billed To</h4><div>${escapeHtml(invoice.clientDetails.name)}</div><div>${escapeHtml(invoice.clientDetails.companyName)}</div><div>${escapeHtml(invoice.clientDetails.address)}</div><div>${escapeHtml(invoice.clientDetails.phone)}</div><div>${escapeHtml(invoice.clientDetails.email)}</div></article></div>
  <div class="table-wrap" style="margin-top:12px;"><table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax %</th><th>Amount</th></tr></thead><tbody>${totals.rows.map((row) => `<tr><td>${escapeHtml(row.itemName)}<div class="small-note">${escapeHtml(row.description)}</div></td><td>${row.quantity}</td><td>${formatMoney(row.unitPrice, invoice.currency)}</td><td>${formatMoney(row.discount, invoice.currency)}</td><td>${row.taxPercent}%</td><td>${formatMoney(row.total, invoice.currency)}</td></tr>`).join("")}</tbody></table></div>
  <div class="preview-grid" style="margin-top:12px;"><article class="preview-box"><h4>Notes</h4><div>${escapeHtml(invoice.notes || "-")}</div><h4 style="margin-top:10px;">Terms</h4><div>${escapeHtml(invoice.terms || "-")}</div></article><article class="preview-box"><h4>Summary</h4><div>Subtotal: ${formatMoney(totals.subtotal, invoice.currency)}</div><div>Discount: ${formatMoney(totals.totalDiscount, invoice.currency)}</div><div>Tax: ${formatMoney(totals.taxTotal, invoice.currency)}</div><div><strong>Total: ${formatMoney(totals.total, invoice.currency)}</strong></div><div>Amount Paid: ${formatMoney(totals.paid, invoice.currency)}</div><div><strong>Balance Due: ${formatMoney(totals.balanceDue, invoice.currency)}</strong></div></article></div>`;
}

function buildPrintHtml(invoice, totals) {
  const template = invoice.templateId || state.template || "classic";
  return `<section class="print-sheet template-${template}"><div class="print-head"><div><h1 class="print-title">Tax Invoice</h1><div class="print-meta">Invoice #: ${escapeHtml(invoice.invoiceNumber)}</div><div class="print-meta">Issue Date: ${fmtDate(invoice.issueDate)}</div><div class="print-meta">Due Date: ${fmtDate(invoice.dueDate)}</div></div><div class="print-meta"><div>Status: ${escapeHtml(resolveStatus(invoice))}</div><div>Currency: ${escapeHtml(invoice.currency)}</div><div>Reference: ${escapeHtml(invoice.reference || "-")}</div></div></div>
  <div class="print-row"><article class="print-box"><strong>Billed By</strong><div>${escapeHtml(invoice.businessDetails.businessName)}</div><div>${escapeHtml(invoice.businessDetails.address)}</div><div>${escapeHtml(invoice.businessDetails.phone)}</div><div>${escapeHtml(invoice.businessDetails.email)}</div><div>${escapeHtml(invoice.businessDetails.taxNumber || "")}</div></article><article class="print-box"><strong>Billed To</strong><div>${escapeHtml(invoice.clientDetails.name)}</div><div>${escapeHtml(invoice.clientDetails.companyName)}</div><div>${escapeHtml(invoice.clientDetails.address)}</div><div>${escapeHtml(invoice.clientDetails.phone)}</div><div>${escapeHtml(invoice.clientDetails.email)}</div><div>${escapeHtml(invoice.clientDetails.taxNumber || "")}</div></article></div>
  <table class="print-table"><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Tax %</th><th>Amount</th></tr></thead><tbody>${totals.rows.map((row) => `<tr><td>${escapeHtml(row.itemName)}<br /><small>${escapeHtml(row.description)}</small></td><td>${row.quantity}</td><td>${formatMoney(row.unitPrice, invoice.currency)}</td><td>${formatMoney(row.discount, invoice.currency)}</td><td>${row.taxPercent}%</td><td>${formatMoney(row.total, invoice.currency)}</td></tr>`).join("")}</tbody></table>
  <div class="print-bottom"><article class="print-box"><strong>Payment Info</strong><div>Terms: ${escapeHtml(invoice.paymentInfo.terms)}</div><div>Bank: ${escapeHtml(invoice.paymentInfo.bankDetails || "-")}</div><div>UPI: ${escapeHtml(invoice.paymentInfo.upiId || "-")}</div><div>Online Payment: ${invoice.paymentInfo.onlinePayment ? "Enabled" : "Disabled"}</div><div style="margin-top:8px;"><strong>Notes:</strong> ${escapeHtml(invoice.notes || "-")}</div><div><strong>Terms:</strong> ${escapeHtml(invoice.terms || "-")}</div></article><article class="print-box print-totals"><div><span>Subtotal</span><span>${formatMoney(totals.subtotal, invoice.currency)}</span></div><div><span>Discount</span><span>${formatMoney(totals.totalDiscount, invoice.currency)}</span></div><div><span>Tax</span><span>${formatMoney(totals.taxTotal, invoice.currency)}</span></div><div><span>Amount Paid</span><span>${formatMoney(totals.paid, invoice.currency)}</span></div><div class="print-grand"><span>Balance Due</span><span>${formatMoney(totals.balanceDue, invoice.currency)}</span></div></article></div></section>`;
}

function renderTemplateGallery() {
  const grid = document.getElementById("templateGrid");
  grid.innerHTML = TEMPLATE_OPTIONS.map((template) => `<article class="template-card ${state.template === template.id ? "active" : ""}" data-template="${template.id}"><div class="template-preview preview-${template.id}"></div><strong>${template.name}</strong><p class="small-note" style="margin:4px 0 0;">${template.desc}</p><button class="secondary-btn" type="button" style="margin-top:8px;" data-template-select="${template.id}">Use Template</button></article>`).join("");
  grid.querySelectorAll("[data-template-select]").forEach((button) => button.addEventListener("click", () => {
    const selected = button.dataset.templateSelect;
    state.template = selected;
    if (state.editorDraft) { state.editorDraft.templateId = selected; markEditorDirty(); }
    saveState();
    renderTemplateGallery();
    if (state.ui.route === "editor") renderEditor();
    showToast(`Template switched to ${selected}.`);
  }));
}

function showModal(id) { document.getElementById(id).classList.remove("hidden"); }
function hideModal(id) { document.getElementById(id).classList.add("hidden"); }

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2500);
}

function downloadInvoicesCsv(invoices) {
  if (!invoices.length) return showToast("No invoices to export.");
  const headers = ["Invoice Number", "Client", "Issue Date", "Due Date", "Amount", "Status", "Currency"];
  const rows = invoices.map((invoice) => {
    const totals = calculateInvoiceTotals(invoice);
    return [invoice.invoiceNumber, invoice.clientDetails.name, invoice.issueDate, invoice.dueDate, totals.total.toFixed(2), resolveStatus(invoice), invoice.currency];
  });
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `invoices-${todayIso()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast("CSV export downloaded.");
}
