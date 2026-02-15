const lineItems = document.getElementById("lineItems");
const itemRowTemplate = document.getElementById("itemRowTemplate");
const addItemBtn = document.getElementById("addItem");
const gstToggle = document.getElementById("gstEnabled");
const currencySelect = document.getElementById("currency");
const discountInput = document.getElementById("discount");
const additionalChargesInput = document.getElementById("additionalCharges");
const subtotalValue = document.getElementById("subtotalValue");
const gstValue = document.getElementById("gstValue");
const qtyValue = document.getElementById("qtyValue");
const grandValue = document.getElementById("grandValue");
const totalWords = document.getElementById("totalWords");
const printInvoiceBtn = document.getElementById("printInvoice");
const invoiceDateInput = document.getElementById("invoiceDate");
const paymentTermsSelect = document.getElementById("paymentTerms");
const dueDateInput = document.getElementById("dueDate");

function setDefaultDates() {
  const today = new Date();
  invoiceDateInput.value = toDateInput(today);
  applyPaymentTerms();
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function applyPaymentTerms() {
  if (!invoiceDateInput.value) {
    return;
  }
  const base = new Date(invoiceDateInput.value);
  const days = Number(paymentTermsSelect.value || 0);
  base.setDate(base.getDate() + days);
  dueDateInput.value = toDateInput(base);
}

function addRow(defaults = {}) {
  const fragment = itemRowTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  row.querySelector(".item-name").value = defaults.name || "";
  row.querySelector(".item-qty").value = defaults.qty ?? 1;
  row.querySelector(".item-rate").value = defaults.rate ?? 0;
  row.querySelector(".item-gst").value = defaults.gst ?? 18;
  lineItems.appendChild(fragment);
  updateTotals();
}

function formatCurrency(value) {
  const currency = currencySelect.value || "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function computeRow(row) {
  const qty = Number(row.querySelector(".item-qty").value || 0);
  const rate = Number(row.querySelector(".item-rate").value || 0);
  const gstPercent = gstToggle.checked
    ? Number(row.querySelector(".item-gst").value || 0)
    : 0;

  const base = qty * rate;
  const gstAmount = (base * gstPercent) / 100;
  const total = base + gstAmount;

  row.querySelector(".item-amount").textContent = formatCurrency(total);

  return { qty, base, gstAmount, total };
}

function updateTotals() {
  const rows = [...lineItems.querySelectorAll("tr")];
  let subtotal = 0;
  let gstTotal = 0;
  let totalQty = 0;

  rows.forEach((row) => {
    const { qty, base, gstAmount } = computeRow(row);
    subtotal += base;
    gstTotal += gstAmount;
    totalQty += qty;
  });

  const discount = Number(discountInput.value || 0);
  const additionalCharges = Number(additionalChargesInput.value || 0);
  const grand = Math.max(0, subtotal + gstTotal - discount + additionalCharges);

  subtotalValue.textContent = formatCurrency(subtotal);
  gstValue.textContent = formatCurrency(gstTotal);
  qtyValue.textContent = totalQty.toFixed(2).replace(/\.00$/, "");
  grandValue.textContent = formatCurrency(grand);
  totalWords.textContent = `${numberToWords(Math.round(grand))} only`;
}

function numberToWords(num) {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function underThousand(n) {
    let str = "";
    if (n >= 100) {
      str += `${ones[Math.floor(n / 100)]} Hundred `;
      n %= 100;
    }
    if (n >= 20) {
      str += `${tens[Math.floor(n / 10)]} `;
      n %= 10;
    }
    if (n > 0) {
      str += `${ones[n]} `;
    }
    return str.trim();
  }

  const parts = [
    { value: 1_000_000_000, name: "Billion" },
    { value: 1_000_000, name: "Million" },
    { value: 1_000, name: "Thousand" },
    { value: 1, name: "" },
  ];

  let out = "";
  let remaining = num;

  parts.forEach((part) => {
    if (remaining >= part.value) {
      const chunk = Math.floor(remaining / part.value);
      remaining %= part.value;
      const words = underThousand(chunk);
      if (words) {
        out += `${words}${part.name ? ` ${part.name}` : ""} `;
      }
    }
  });

  return out.trim();
}

function toggleOptionalFields() {
  document.querySelectorAll(".inline-btn[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const wrap = document.getElementById(`${targetId}Wrap`);
      if (wrap) {
        wrap.classList.toggle("hidden");
      }
    });
  });
}

function syncGstColumn() {
  document.querySelectorAll(".gst-col").forEach((cell) => {
    cell.style.display = gstToggle.checked ? "table-cell" : "none";
  });
}

addItemBtn.addEventListener("click", () => addRow());

lineItems.addEventListener("input", (event) => {
  if (event.target.matches("input")) {
    updateTotals();
  }
});

lineItems.addEventListener("click", (event) => {
  if (event.target.matches(".remove-btn")) {
    event.target.closest("tr").remove();
    if (!lineItems.querySelector("tr")) {
      addRow();
    }
    updateTotals();
  }
});

[gstToggle, currencySelect, discountInput, additionalChargesInput].forEach((el) => {
  el.addEventListener("input", () => {
    syncGstColumn();
    updateTotals();
  });
});

invoiceDateInput.addEventListener("input", applyPaymentTerms);
paymentTermsSelect.addEventListener("input", applyPaymentTerms);

printInvoiceBtn.addEventListener("click", () => window.print());

setDefaultDates();
toggleOptionalFields();
addRow({ name: "Website Design", qty: 1, rate: 5000, gst: 18 });
syncGstColumn();
updateTotals();
