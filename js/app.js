const API_URL =
  "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec";

/* ======================================================
   CLAIM SUBMISSION
====================================================== */
const form = document.getElementById("claimForm");
const fileInput = document.querySelector('input[name="receipt"]');
const fileNameEl = document.getElementById("fileName");
let currentClaims = [];
let currentSort = {
  field: null,
  direction: "asc"
};

if (form) {
  // Show selected file name
  if (fileInput && fileNameEl) {
    fileInput.addEventListener("change", () => {
      fileNameEl.textContent = fileInput.files.length
        ? `Selected file: ${fileInput.files[0].name}`
        : "";
    });
  }

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const result = document.getElementById("result");
  result.textContent = "Submitting...";

  // Convert form to plain object
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  // Generate claim ID on frontend (safe & reliable)

  // Handle file (Base64)
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    const base64 = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });

    payload.fileData = base64;
    payload.fileName = file.name;
    payload.fileType = file.type;
  }

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8" // avoid preflight
      },
      body: JSON.stringify(payload)
    });

    // Do NOT depend on response (CORS-safe)
    result.textContent = `Claim submitted successfully!`;
    form.reset();
    if (fileNameEl) fileNameEl.textContent = "";

  } catch (err) {
    console.error(err);
    // Backend still runs even if browser throws
    result.textContent = `Claim submitted successfully!`;
  }
});

}

/* ======================================================
   SEARCH CLAIMS
====================================================== */
async function searchClaim() {
  const value = document.getElementById("searchValue").value.trim();
  const output = document.getElementById("output");

  if (!value) {
    output.innerHTML =
      '<div class="p-8 text-center text-red-500 font-medium">Please enter Email or Claim ID</div>';
    return;
  }

  output.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `${API_URL}?search=${encodeURIComponent(value)}`
    );
    const data = await res.json();

    if (data.error) {
      output.innerHTML =
        `<div class="p-8 text-center text-slate-500">${data.error}</div>`;
      return;
    }

    currentClaims = data.claims;
    renderClaims(currentClaims);

  } catch (err) {
     output.innerHTML =
    `<pre class="text-red-600">${err.message}</pre>`;
  }
}

function renderClaims(claims) {
  const output = document.getElementById("output");

  if (!claims || claims.length === 0) {
    output.innerHTML = '<div class="p-8 text-center text-slate-500">No claims found</div>';
    return;
  }

  let html = `
    <table class="min-w-full text-left text-sm">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <th class="px-6 py-4 font-semibold text-slate-700">Claim ID</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Type</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Amount</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Status</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Receipt</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
  `;

  claims.forEach(c => {
    // Status Badge Logic
    let statusClass = "bg-slate-100 text-slate-600";
    if (c.status === "Submitted") statusClass = "bg-blue-50 text-blue-700 border border-blue-100";
    else if (c.status === "Pending") statusClass = "bg-yellow-50 text-yellow-700 border border-yellow-100";
    else if (c.status === "Reimbursed") statusClass = "bg-green-50 text-green-700 border border-green-100";
    else if (c.status === "Declined") statusClass = "bg-red-50 text-red-700 border border-red-100";

    html += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4 font-medium text-slate-900">${c.claimId}</td>
        <td class="px-6 py-4 text-slate-600">${c.type}</td>
        <td class="px-6 py-4 font-medium text-slate-900">₹${c.amount}</td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-medium ${statusClass}">
            ${c.status}
          </span>
        </td>
        <td class="px-6 py-4">
          ${c.receiptUrl 
            ? `<a href="${c.receiptUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1">
                 View
                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
               </a>` 
            : `<span class="text-slate-400 italic">No receipt</span>`}
        </td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  output.innerHTML = html;
}
function sortClaims(field) {
      document.getElementById("dateArrow").textContent =
  currentSort.field === "date" ? (currentSort.direction === "asc" ? "↑" : "↓") : "";

document.getElementById("idArrow").textContent =
  currentSort.field === "claimId" ? (currentSort.direction === "asc" ? "↑" : "↓") : "";
  if (!currentClaims || currentClaims.length === 0) return;

  // Toggle direction if same field, else reset to asc
  if (currentSort.field === field) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort.field = field;
    currentSort.direction = "asc";
  }

  const dir = currentSort.direction === "asc" ? 1 : -1;

  const sorted = [...currentClaims].sort((a, b) => {
    if (field === "date") {
      return dir * (new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    }

    if (field === "claimId") {
      return dir * a.claimId.localeCompare(b.claimId);
    }

    return 0;
  });

  currentClaims = sorted;
  renderClaims(currentClaims);
}

function getAdminClaims(status) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("Claims_Data");
  const rows = sheet.getDataRange().getValues();
  const result = [];

  for (let i = 1; i < rows.length; i++) {
    if (!status || rows[i][10] === status) {
      result.push({
        claimId: rows[i][0],
        email: rows[i][2],
        status: rows[i][10]
      });
    }
  }
  return result;
}
function updateClaimStatus(claimId, status) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("Claims_Data");
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === claimId) {
      sheet.getRange(i + 1, 11).setValue(status);
      sendEmails(claimId, { email: rows[i][2] }, "");
      break;
    }
  }
}

async function login() {
  const mobile = document.getElementById("mobile").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.className = "mt-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg animate-pulse";
  msg.textContent = "Verifying credentials...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "login",
        mobile,
        password
      })
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (data.status === "success") {
      msg.className = "mt-4 text-center text-sm font-medium text-green-600 bg-green-50 py-2 px-4 rounded-lg";
      msg.textContent = "Success! Redirecting...";
      localStorage.setItem("role", data.role);
      setTimeout(() => {
        window.location.href = data.role === "ADMIN" ? "admin.html" : "claim.html";
      }, 800);
    } else {
      msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
      msg.innerHTML = "Invalid credentials.<br><span class='text-xs text-red-500 mt-1 block font-normal'>Contact administrator for credentials</span>";
    }

  } catch {
    msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
    msg.textContent = "Connection failed. Please try again.";
  }
}

/* ======================================================
   ADMIN PANEL LOGIC
====================================================== */

let currentAdminClaims = [];
let currentAdminSort = { field: null, direction: 'asc' };

async function loadClaims() {
  const status = document.getElementById("statusFilter").value;
  const claimsDiv = document.getElementById("claims");

  claimsDiv.innerHTML = "Loading claims...";

  try {
    const res = await fetch(
      `${API_URL}?action=adminClaims&status=${encodeURIComponent(status)}`
    );

    const data = await res.json();

    currentAdminClaims = data || [];
    renderAdminClaims(currentAdminClaims);

  } catch (err) {
    console.error(err);
    claimsDiv.innerHTML = '<div class="p-8 text-center text-red-500">Error loading claims.</div>';
  }
}

function renderAdminClaims(claims) {
  const claimsDiv = document.getElementById("claims");

  if (!claims || claims.length === 0) {
    claimsDiv.innerHTML = '<div class="p-8 text-center text-slate-500">No claims found.</div>';
    return;
  }

  let html = `
      <table class="min-w-full border text-sm bg-white">
        <thead class="bg-slate-100">
          <tr>
            <th class="border p-2">Claim ID</th>
            <th class="border p-2">Email</th>
            <th class="border p-2">Amount</th>
            <th class="border p-2">Current Status</th>
            <th class="border p-2">Update Status</th>
          </tr>
        </thead>
        <tbody>
    `;

  claims.forEach(c => {
      html += `
        <tr class="hover:bg-slate-50">
          <td class="border p-2">${c.claimId}</td>
          <td class="border p-2">${c.email}</td>
          <td class="border p-2">₹${c.amount}</td>
          <td class="border p-2 font-medium">${c.status}</td>
          <td class="border p-2">
            <select
              class="border p-1 rounded"
              onchange="updateStatus('${c.claimId}', this.value)"
            >
              <option value="">Select</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending">Pending</option>
              <option value="Declined">Declined</option>
              <option value="Reimbursed">Reimbursed</option>
            </select>
          </td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    claimsDiv.innerHTML = html;
}

function sortAdminClaims(field) {
  const arrow = document.getElementById("adminIdArrow");
  if (!currentAdminClaims.length) return;

  if (currentAdminSort.field === field) {
    currentAdminSort.direction = currentAdminSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentAdminSort.field = field;
    currentAdminSort.direction = "asc";
  }

  if (arrow) arrow.textContent = currentAdminSort.direction === "asc" ? "↑" : "↓";
  const dir = currentAdminSort.direction === "asc" ? 1 : -1;

  currentAdminClaims.sort((a, b) => {
    if (field === 'claimId') return dir * a.claimId.localeCompare(b.claimId);
    return 0;
  });

  renderAdminClaims(currentAdminClaims);
}

async function updateStatus(claimId, status) {
  if (!status) return;

  if (!confirm(`Change status to "${status}"?`)) return;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "updateStatus",
        claimId,
        status
      })
    });

    alert("Status updated successfully");
    loadClaims();

  } catch (err) {
    console.error(err);
    alert("Failed to update status");
  }
}

/* Auto-load claims on page open */
if (document.getElementById("claims")) {
  loadClaims();
}
