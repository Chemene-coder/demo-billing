// Select DOM elements
const invoiceList = document.getElementById("invoiceList");
const saveBtn = document.getElementById("saveInvoice");
const clientNameInput = document.getElementById("clientName");
const invoiceDateInput = document.getElementById("invoiceDate");
const itemsInput = document.getElementById("items");
const amountInput = document.getElementById("amount");
const statusInput = document.getElementById("status");
const invoiceIdInput = document.getElementById("invoiceId");

let invoices = JSON.parse(localStorage.getItem("invoices")) || [];

// Save / Add Invoice
saveBtn.addEventListener("click", () => {
  const invoiceData = {
    id: invoiceIdInput.value || Date.now().toString(),
    client: clientNameInput.value,
    date: invoiceDateInput.value,
    items: itemsInput.value,
    amount: parseFloat(amountInput.value),
    status: statusInput.value
  };

  if (!invoiceData.client || !invoiceData.date || !invoiceData.amount) {
    alert("Please fill all fields");
    return;
  }

  if (invoiceIdInput.value) {
    invoices = invoices.map(inv => inv.id === invoiceData.id ? invoiceData : inv);
  } else {
    invoices.push(invoiceData);
  }

  localStorage.setItem("invoices", JSON.stringify(invoices));
  resetForm();
  renderInvoices();
  updateDashboard();
});

// Render Invoice Table
function renderInvoices() {
  invoiceList.innerHTML = "";
  invoices.forEach(inv => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inv.client}</td>
      <td>${inv.date}</td>
      <td>${inv.items}</td>
      <td>R${inv.amount.toFixed(2)}</td>
      <td class="status-${inv.status}">${inv.status}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editInvoice('${inv.id}')">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteInvoice('${inv.id}')">Delete</button>
        <button class="action-btn print-btn" onclick="printInvoice('${inv.id}')">Print</button>
        <button class="action-btn email-btn" onclick="emailInvoice('${inv.id}')">Email</button>
      </td>
    `;
    invoiceList.appendChild(row);
  });
}

// Edit Invoice
function editInvoice(id) {
  const inv = invoices.find(i => i.id === id);
  clientNameInput.value = inv.client;
  invoiceDateInput.value = inv.date;
  itemsInput.value = inv.items;
  amountInput.value = inv.amount;
  statusInput.value = inv.status;
  invoiceIdInput.value = inv.id;
}

// Delete Invoice
function deleteInvoice(id) {
  if (confirm("Are you sure you want to delete this invoice?")) {
    invoices = invoices.filter(i => i.id !== id);
    localStorage.setItem("invoices", JSON.stringify(invoices));
    renderInvoices();
    updateDashboard();
  }
}

// Reset Form
function resetForm() {
  invoiceIdInput.value = "";
  clientNameInput.value = "";
  invoiceDateInput.value = "";
  itemsInput.value = "";
  amountInput.value = "";
  statusInput.value = "Pending";
}

// Dashboard & Chart
const revenueCtx = document.getElementById('revenueChart').getContext('2d');
let revenueChart = new Chart(revenueCtx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Invoice Amount (R)',
      data: [],
      backgroundColor: []
    }]
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } }
  }
});

function updateDashboard() {
  const labels = invoices.map(inv => inv.client);
  const data = invoices.map(inv => inv.amount);
  const bgColors = invoices.map(inv => {
    if (inv.status === "Paid") return "#4CAF50";     // Green
    if (inv.status === "Overdue") return "#f44336"; // Red
    if (inv.status === "Pending") return "#FF9800"; // Orange
    return "#999";
  });

  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = data;
  revenueChart.data.datasets[0].backgroundColor = bgColors;
  revenueChart.update();

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  document.getElementById("totalRevenue").textContent = `R${totalRevenue.toFixed(2)}`;

  const overdueCount = invoices.filter(inv => inv.status === "Overdue").length;
  document.getElementById("overdueCount").textContent = overdueCount;
}

// Print Invoice
function printInvoice(id) {
  const inv = invoices.find(i => i.id === id);
  const invoiceContent = `
    <h2>Invoice for ${inv.client}</h2>
    <p><strong>Date:</strong> ${inv.date}</p>
    <p><strong>Items:</strong> ${inv.items}</p>
    <p><strong>Amount:</strong> R${inv.amount.toFixed(2)}</p>
    <p><strong>Status:</strong> ${inv.status}</p>
  `;

  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(`<html><head><title>Invoice</title></head><body>${invoiceContent}</body></html>`);
  printWindow.document.close();
  printWindow.print();
}

// Email Invoice (opens mail client)
function emailInvoice(id) {
  const inv = invoices.find(i => i.id === id);
  const subject = encodeURIComponent(`Invoice for ${inv.client} - ${inv.date}`);
  const body = encodeURIComponent(
    `Hello ${inv.client},\n\nHere is your invoice:\n\nItems: ${inv.items}\nAmount: R${inv.amount.toFixed(2)}\nStatus: ${inv.status}\n\nBest regards,\nStartup Billing Demo`
  );

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// Initial render
renderInvoices();
updateDashboard();
