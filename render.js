// ===========================
// GlowUp Digital - Invoice System
// ===========================

// LocalStorage key
const STORAGE_KEY = "invoices";
const NUMBER_KEY = "invoiceNumberCounter";

// Load saved invoices or initialize empty
let invoices = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let invoiceCounter = parseInt(localStorage.getItem(NUMBER_KEY)) || 1;

// DOM Elements
const invoiceForm = document.getElementById("invoiceForm");
const tableBody = document.getElementById("invoiceTableBody");
const totalRevenueEl = document.getElementById("totalRevenue");
const paidCountEl = document.getElementById("paidCount");
const pendingCountEl = document.getElementById("pendingCount");
const overdueCountEl = document.getElementById("overdueCount");
const ctx = document.getElementById("invoiceChart").getContext("2d");

// ===========================
// Utility Functions
// ===========================

// Generate invoice number like INV-001
function generateInvoiceNumber() {
  const number = invoiceCounter.toString().padStart(3, "0");
  invoiceCounter++;
  localStorage.setItem(NUMBER_KEY, invoiceCounter);
  return `INV-${number}`;
}

// Save to LocalStorage
function saveInvoices() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

// Format currency
function formatCurrency(amount) {
  return `R${parseFloat(amount).toFixed(2)}`;
}

// ===========================
// Invoice CRUD
// ===========================
function addInvoice(date, client, status, amount) {
  const newInvoice = {
    number: generateInvoiceNumber(),
    date,
    client,
    status,
    amount: parseFloat(amount),
  };
  invoices.push(newInvoice);
  saveInvoices();
  renderTable();
  updateChart();
}

function deleteInvoice(number) {
  invoices = invoices.filter(inv => inv.number !== number);
  saveInvoices();
  renderTable();
  updateChart();
}

// ===========================
// Rendering
// ===========================
function renderTable() {
  tableBody.innerHTML = "";

  invoices.forEach(inv => {
    const row = document.createElement("tr");

    // Status color
    let colorClass = "";
    if (inv.status.toLowerCase() === "paid") colorClass = "status-paid";
    else if (inv.status.toLowerCase() === "pending") colorClass = "status-pending";
    else colorClass = "status-overdue";

    row.innerHTML = `
      <td>${inv.number}</td>
      <td>${inv.date}</td>
      <td>${inv.client}</td>
      <td><span class="${colorClass}">${inv.status}</span></td>
      <td>${formatCurrency(inv.amount)}</td>
      <td>
        <button class="print-btn" data-number="${inv.number}">🖨 Print</button>
        <button class="email-btn" data-number="${inv.number}">✉ Email</button>
        <button class="delete-btn" data-number="${inv.number}">🗑 Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Update totals
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidCount = invoices.filter(i => i.status.toLowerCase() === "paid").length;
  const pendingCount = invoices.filter(i => i.status.toLowerCase() === "pending").length;
  const overdueCount = invoices.filter(i => i.status.toLowerCase() === "overdue").length;

  totalRevenueEl.textContent = formatCurrency(totalRevenue);
  paidCountEl.textContent = paidCount;
  pendingCountEl.textContent = pendingCount;
  overdueCountEl.textContent = overdueCount;
}

// ===========================
// Chart.js Setup
// ===========================
let invoiceChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Paid", "Pending", "Overdue"],
    datasets: [{
      label: "Invoices Count",
      data: [0, 0, 0],
      backgroundColor: ["#28a745", "#fd7e14", "#dc3545"],
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  }
});

function updateChart() {
  const paid = invoices.filter(i => i.status.toLowerCase() === "paid").length;
  const pending = invoices.filter(i => i.status.toLowerCase() === "pending").length;
  const overdue = invoices.filter(i => i.status.toLowerCase() === "overdue").length;

  invoiceChart.data.datasets[0].data = [paid, pending, overdue];
  invoiceChart.update();
}

// ===========================
// Print & Email
// ===========================
function openPrintView(inv) {
  const popup = window.open("", "_blank", "width=600,height=700");
  popup.document.write(`
    <html>
      <head>
        <title>${inv.number} - GlowUp Digital Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .invoice-box { border: 1px solid #ddd; padding: 20px; margin-top: 20px; }
          .invoice-box h2 { margin-bottom: 10px; }
          .info { margin-bottom: 20px; }
          .info p { margin: 4px 0; }
          .amount { font-size: 1.2em; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #888; margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>GlowUp Digital Invoice</h1>
        <div class="invoice-box">
          <h2>${inv.number}</h2>
          <div class="info">
            <p><strong>Date:</strong> ${inv.date}</p>
            <p><strong>Client:</strong> ${inv.client}</p>
            <p><strong>Status:</strong> ${inv.status}</p>
            <p class="amount"><strong>Amount:</strong> ${formatCurrency(inv.amount)}</p>
          </div>
        </div>
        <div class="footer">Generated by GlowUp Digital Invoice System</div>
        <script>
          window.print();
        </script>
      </body>
    </html>
  `);
}

function openEmail(inv) {
  const subject = `Invoice ${inv.number} from GlowUp Digital`;
  const body = `Hi ${inv.client},%0D%0A%0D%0APlease find your invoice ${inv.number} amounting to ${formatCurrency(inv.amount)}.%0D%0A%0D%0AThank you,%0D%0AGlowUp Digital`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

// ===========================
// Event Listeners
// ===========================

// Handle Add Invoice Form
invoiceForm.addEventListener("submit", e => {
  e.preventDefault();
  const date = invoiceForm.date.value;
  const client = invoiceForm.client.value;
  const status = invoiceForm.status.value;
  const amount = invoiceForm.amount.value;

  if (date && client && status && amount) {
    addInvoice(date, client, status, amount);
    invoiceForm.reset();
  }
});

// Handle Buttons
tableBody.addEventListener("click", e => {
  const target = e.target;
  const number = target.dataset.number;
  const invoice = invoices.find(i => i.number === number);

  if (target.classList.contains("delete-btn")) {
    if (confirm(`Delete ${number}?`)) deleteInvoice(number);
  }

  if (target.classList.contains("print-btn")) {
    openPrintView(invoice);
  }

  if (target.classList.contains("email-btn")) {
    openEmail(invoice);
  }
});

// ===========================
// Initialize
// ===========================
renderTable();
updateChart();
