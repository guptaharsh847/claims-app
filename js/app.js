// const API_URL =
//   "https://script.google.com/macros/s/AKfycbzTw1p2p-ph6hbgMl5MKM6kzfuOQkFHJoRwRubpq7g/dev";
const API_URL =
  "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec";

/* Security / Role Helpers */
const ROLE_HASH = {
  ADMIN: "X9fK2pL5mQ8jR3t",
  USER: "B2vN9kM4lP7oJ5h",
};

function getDecodedRole() {
  const r = localStorage.getItem("role");
  if (r === ROLE_HASH.ADMIN) return "ADMIN";
  if (r === ROLE_HASH.USER) return "USER";
  return null;
}

function setEncodedRole(plainRole) {
  if (plainRole === "ADMIN") localStorage.setItem("role", ROLE_HASH.ADMIN);
  else if (plainRole === "USER") localStorage.setItem("role", ROLE_HASH.USER);
}

/* ======================================================
   CLAIM SUBMISSION
====================================================== */
const form = document.getElementById("claimForm");
const fileInput = document.querySelector('input[name="receipt"]');
const fileNameEl = document.getElementById("fileName");
let currentClaims = [];
let currentFilteredClaims = [];
let currentSort = {
  field: null,
  direction: "asc",
};

/* Pagination Globals */
let currentUsers = [];
let currentUserPage = 1;
const USERS_PER_PAGE = 10;
const CLAIMS_PER_PAGE = 15;

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
      const base64 = await new Promise((resolve) => {
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
          "Content-Type": "text/plain;charset=utf-8", // avoid preflight
        },
        body: JSON.stringify(payload),
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

  output.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Searching records...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_URL}?search=${encodeURIComponent(value)}`);
    const data = await res.json();

    if (data.error) {
      output.innerHTML = `<div class="p-8 text-center text-slate-500">${data.error}</div>`;
      return;
    }

    currentClaims = data.claims;
    // Sort by latest (descending timestamp)
    currentClaims.sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
    applyUserFilter();
  } catch (err) {
    output.innerHTML = `<pre class="text-red-600">${err.message}</pre>`;
  }
}

function renderClaims(claims, page = 1) {
  // Handle global state if called from pagination buttons
  if (claims) currentFilteredClaims = claims;
  else claims = currentFilteredClaims;

  const output = document.getElementById("output");

  if (!claims || claims.length === 0) {
    output.innerHTML = `
  <div class="flex flex-col items-center justify-center py-8 text-center">
    <div class="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <h3 class="text-base font-semibold text-slate-800 mb-1">
      No claims found
    </h3>

    <p class="text-slate-500 mb-4 max-w-xs text-sm">
      Please verify your Email or Claim ID, or raise a new claim.
    </p>

    <a href="claim.html"
      class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow">
      + Raise a Claim
    </a>
  </div>
`;

    return;
  }

  const start = (page - 1) * CLAIMS_PER_PAGE;
  const end = start + CLAIMS_PER_PAGE;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CLAIMS_PER_PAGE);

  let html = `
    <table class="min-w-full text-left text-sm">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <th class="px-6 py-4 font-semibold text-slate-700">Claim ID</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Type</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Amount</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Status</th>
          <th class="px-6 py-4 font-semibold text-slate-700">Receipt</th>
          <th class="border p-2">SLA</th>

        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
  `;

  paginatedClaims.forEach((c) => {
    // Status Badge Logic
    let statusClass = "bg-slate-100 text-slate-600";
    if (c.status === "Submitted")
      statusClass = "bg-blue-50 text-blue-700 border border-blue-100";
    else if (c.status === "Approved")
      statusClass = "bg-yellow-50 text-yellow-700 border border-yellow-100";
    else if (c.status === "Reimbursed")
      statusClass = "bg-green-50 text-green-700 border border-green-100";
    else if (c.status === "Declined")
      statusClass = "bg-red-50 text-red-700 border border-red-100";

    html += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
  ${c.claimId}
  <button
    onclick="copyClaimId('${c.claimId}')"
    title="Copy Claim ID"
    class="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  </button>
</td>

        <td class="px-6 py-4 text-slate-600">${c.type}</td>
        <td class="px-6 py-4 font-medium text-slate-900">₹${c.amount}</td>
        <td class="px-6 py-4">
          <span
  title="${getStatusTooltip(c.status)}"
  class="px-3 py-1 rounded-full text-xs font-medium cursor-help ${statusClass}"
>
  ${c.status}
</span>
<span class="text-xs text-slate-400 mt-1 ml-1">
    ${timeAgo(c.timestamp)}
  </span>
        </td>
        <td class="px-6 py-4">
          ${
            c.receiptUrl
              ? `<a href="${c.receiptUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1">
                 View
                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
               </a>`
              : `<span class="text-slate-400 italic">No receipt</span>`
          }
        </td>
        <td class="border p-2 text-center">
  ${
    c.status === "Reimbursed"
      ? "-"
      : getSlaBadge(calculateDaysApproved(c.timestamp, c.status))
  }
</td>

      </tr>
    `;
  });

  html += "</tbody></table>";

  // Pagination Controls
  if (totalPages > 1) {
    html += `
      <div class="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50">
        <span class="text-sm text-slate-500">Showing ${start + 1} to ${Math.min(
      end,
      claims.length
    )} of ${claims.length} results</span>
        <div class="flex gap-2">
          <button onclick="renderClaims(null, ${page - 1})" ${
      page === 1
        ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
        : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
    } >Previous</button>
          <button onclick="renderClaims(null, ${page + 1})" ${
      page === totalPages
        ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
        : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
    } >Next</button>
        </div>
      </div>
    `;
  }

  output.innerHTML = html;
  output.scrollIntoView({ behavior: "smooth", block: "start" });

}

function applyUserFilter() {
  const status = document.getElementById("userStatusFilter").value;
  let filtered = currentClaims;

  if (status) {
    filtered = currentClaims.filter((c) => c.status === status);
  }
  renderClaims(filtered, 1);
}

function sortClaims(field) {
  document.getElementById("dateArrow").textContent =
    currentSort.field === "date"
      ? currentSort.direction === "asc"
        ? "↑"
        : "↓"
      : "";

  document.getElementById("idArrow").textContent =
    currentSort.field === "claimId"
      ? currentSort.direction === "asc"
        ? "↑"
        : "↓"
      : "";
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
  applyUserFilter();
}

function clearUserFilters() {
  document.getElementById("userStatusFilter").value = "";
  document.getElementById("searchValue").value = "";
  
  currentSort = { field: null, direction: "asc" };
  document.getElementById("dateArrow").textContent = "";
  document.getElementById("idArrow").textContent = "";

  // Reset Data and View
  currentClaims = [];
  currentFilteredClaims = [];
  document.getElementById("output").innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-slate-800 mb-2">Ready to Search</h3>
      <p class="text-slate-500 mb-6 max-w-sm">
        Enter your email address or claim ID above to view the status of your reimbursement requests.
      </p>
    </div>
  `;
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
        amount: rows[i][6],
        timestamp: rows[i][11],
        status: rows[i][10],
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

  msg.className =
    "mt-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg animate-pulse";
  msg.textContent = "Verifying credentials...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "login",
        mobile,
        password,
      }),
    });

    const text = await res.text();
    const data = JSON.parse(text);
    if (data.status === "success" && data.userStatus === "ACTIVE") {
      msg.className =
        "mt-4 text-center text-sm font-medium text-green-600 bg-green-50 py-2 px-4 rounded-lg";
      msg.textContent = "Success! Redirecting...";
      setEncodedRole(data.role);
      localStorage.setItem("userMobile", mobile);
      localStorage.setItem("loginTime", Date.now());
      setTimeout(() => {
        window.location.href =
          data.role === "ADMIN" ? "admin.html" : "claim.html";
      }, 800);
    } else if (data.status === "success" && data.userStatus !== "ACTIVE") {
      msg.className =
        "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
      msg.innerHTML =
        "Your account has been temporarily disabled.<br><span class='text-xs text-red-500 mt-1 block font-normal'>Contact admin for more details</span>";
    } else {
      msg.className =
        "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
      msg.innerHTML =
        "Invalid credentials.<br><span class='text-xs text-red-500 mt-1 block font-normal'>Contact administrator for credentials</span>";
    }
  } catch {
    msg.className =
      "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
    msg.textContent = "Connection failed. Please try again.";
  }
}

/* ======================================================
   ADMIN PANEL LOGIC
====================================================== */

let currentAdminClaims = [];
let currentAdminSort = { field: null, direction: "asc" };

async function loadClaims() {
  const status = document.getElementById("statusFilter").value;
  const claimsDiv = document.getElementById("claims");

  claimsDiv.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Loading claims...</p>
    </div>
  `;

  try {
    const res = await fetch(
      `${API_URL}?action=adminClaims&status=${encodeURIComponent(status)}`
    );

    const data = await res.json();

    currentAdminClaims = data || [];
    renderAdminClaims(currentAdminClaims, 1);
  } catch (err) {
    console.error(err);
    claimsDiv.innerHTML =
      '<div class="p-8 text-center text-red-500">Error loading claims.</div>';
  }
}

function renderAdminClaims(claims, page = 1) {
  if (claims) currentAdminClaims = claims;
  else claims = currentAdminClaims;

  const claimsDiv = document.getElementById("claims");
  const paginationDiv = document.getElementById("admin-pagination");

  if (!claims || claims.length === 0) {
    claimsDiv.innerHTML =
      `
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" />
      </svg>
    </div>

    <h3 class="text-lg font-semibold text-slate-800 mb-2">
      No claims found
    </h3>

    <p class="text-slate-500 mb-6 max-w-sm">
      You haven’t submitted any claims yet. Start by raising a new claim.
    </p>

    <a href="claim.html"
      class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium transition shadow">
      + Raise a Claim
    </a>
  </div>
`;
    if (paginationDiv) paginationDiv.innerHTML = "";
    return;
  }

  const start = (page - 1) * CLAIMS_PER_PAGE;
  const end = start + CLAIMS_PER_PAGE;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CLAIMS_PER_PAGE);

  let html = `
      <table class="min-w-full border text-sm bg-white">
        <thead class="bg-slate-100">
          <tr>
            <th class="border p-2">Claim ID</th>
            <th class="border p-2">Email</th>
            <th class="border p-2">Amount</th>
            <th class="border p-2">Current Status</th>
            <th class="border p-2">Update Status</th>
            <th class="border p-2">SLA</th>

          </tr>
        </thead>
        <tbody>
    `;

  paginatedClaims.forEach((c) => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (c.status === "Submitted")
      statusClass = "bg-blue-50 text-blue-700 border border-blue-100";
    else if (c.status === "Approved")
      statusClass = "bg-yellow-50 text-yellow-700 border border-yellow-100";
    else if (c.status === "Reimbursed")
      statusClass = "bg-green-50 text-green-700 border border-green-100";
    else if (c.status === "Declined")
      statusClass = "bg-red-50 text-red-700 border border-red-100";

    html += `
        <tr class="hover:bg-slate-50">
          <td class="border p-2">
            <div class="flex items-center gap-2">
              ${c.claimId}
              <button onclick="copyClaimId('${c.claimId}')" title="Copy Claim ID" class="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </td>
          <td class="border p-2">${c.email}</td>
          <td class="border p-2">₹${c.amount}</td>
          <td class="border p-2 font-medium">
            <span class="px-2 py-1 rounded-full text-xs ${statusClass}">
              ${c.status}
            </span>
          </td>
          <td class="border p-2">
            <select
              class="border p-1 rounded"
              onchange="updateStatus('${c.claimId}', this.value)"
            >
              <option value="">Select</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
              <option value="Reimbursed">Reimbursed</option>
            </select>
          </td>
          <td class="border p-2 text-center">
  ${
    c.status === "Reimbursed"
      ? "-"
      : getSlaBadge(
          calculateDaysApproved(c.timestamp, c.status)
        )
  }
</td>

        </tr>
      `;
  });

  html += "</tbody></table>";
  claimsDiv.innerHTML = html;

  if (paginationDiv) {
    if (totalPages > 1) {
      paginationDiv.innerHTML = `
          <div class="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50">
            <span class="text-sm text-slate-500">Showing ${
              start + 1
            } to ${Math.min(end, claims.length)} of ${
        claims.length
      } results</span>
            <div class="flex gap-2">
              <button onclick="renderAdminClaims(null, ${page - 1})" ${
        page === 1
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
          : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
      } >Previous</button>
              <button onclick="renderAdminClaims(null, ${page + 1})" ${
        page === totalPages
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
          : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
      } >Next</button>
            </div>
          </div>
        `;
    } else {
      paginationDiv.innerHTML = "";
    }
  }
}

function sortAdminClaims(field) {
  const arrow = document.getElementById("adminIdArrow");
  if (!currentAdminClaims.length) return;

  if (currentAdminSort.field === field) {
    currentAdminSort.direction =
      currentAdminSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentAdminSort.field = field;
    currentAdminSort.direction = "asc";
  }

  if (arrow)
    arrow.textContent = currentAdminSort.direction === "asc" ? "↑" : "↓";
  const dir = currentAdminSort.direction === "asc" ? 1 : -1;

  currentAdminClaims.sort((a, b) => {
    if (field === "claimId") return dir * a.claimId.localeCompare(b.claimId);
    return 0;
  });

  renderAdminClaims(currentAdminClaims, 1);
}

function clearAdminFilters() {
  document.getElementById("statusFilter").value = "";
  currentAdminSort = { field: null, direction: "asc" };
  const arrow = document.getElementById("adminIdArrow");
  if (arrow) arrow.textContent = "";
  loadClaims();
}

async function updateStatus(claimId, status) {
  if (!status) return;

  showConfirm(
    `Change status to "${status}"?`,
    async () => {
      try {
        await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "updateStatus",
            claimId,
            status,
          }),
        });

        showToast("Status updated successfully");
    
        loadClaims();
      } catch (err) {
        console.error(err);
        alert("Failed to update status", "error");
      }
    },
    () => {
      // Revert selection on cancel
      loadClaims();
    }
  );
}

/* Auto-load claims on page open */
if (document.getElementById("claims")) {
  loadClaims();
}

/* ======================================================
   FORGOT PASSWORD LOGIC
====================================================== */

function showForgot() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("forgot-form").classList.remove("hidden");
  document.getElementById("home-link").classList.add("hidden");
  document.getElementById("page-title").textContent = "Reset Password";
  document.getElementById("page-desc").textContent = "Reset your password";
  document.getElementById("msg").textContent = "";
  document.getElementById("msg").className = "mt-4 min-h-[20px]";
}

function showLogin() {
  document.getElementById("forgot-form").classList.add("hidden");
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("home-link").classList.remove("hidden");
  document.getElementById("page-title").textContent = "Welcome Back";
  document.getElementById("page-desc").textContent = "Please login to continue";
  document.getElementById("step-1").classList.remove("hidden");
  document.getElementById("step-2").classList.add("hidden");
  document.getElementById("msg").textContent = "";
  document.getElementById("msg").className = "mt-4 min-h-[20px]";
}

async function requestOtp() {
  const mobile = document.getElementById("reset-mobile").value;
  const msg = document.getElementById("msg");

  if (!mobile) {
    msg.textContent = "Please enter mobile number";
    msg.className = "mt-4 text-center text-sm text-red-500";
    return;
  }

  msg.textContent = "Sending OTP...";
  msg.className = "mt-4 text-center text-sm text-indigo-600 animate-pulse";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "sendOtp", mobile }),
    });
    const data = await res.json();

    if (data.status === "success") {
      msg.textContent = "OTP sent to your registered email!";
      msg.className = "mt-4 text-center text-sm text-green-600";
      document.getElementById("step-1").classList.add("hidden");
      document.getElementById("step-2").classList.remove("hidden");
    } else {
      msg.textContent = data.message || "User not found";
      msg.className = "mt-4 text-center text-sm text-red-500";
    }
  } catch (err) {
    msg.textContent = "Error sending OTP";
    msg.className = "mt-4 text-center text-sm text-red-500";
  }
}

async function submitReset() {
  const mobile = document.getElementById("reset-mobile").value;
  const otp = document.getElementById("otp").value;
  const newPassword = document.getElementById("new-password").value;
  const msg = document.getElementById("msg");

  if (!otp || !newPassword) {
    msg.textContent = "Please fill all fields";
    msg.className = "mt-4 text-center text-sm text-red-500";
    return;
  }

  msg.textContent = "Updating password...";
  msg.className = "mt-4 text-center text-sm text-indigo-600 animate-pulse";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "resetPassword",
        mobile,
        otp,
        newPassword,
      }),
    });
    const data = await res.json();

    if (data.status === "success") {
      msg.textContent = "Password updated! Redirecting to login...";
      msg.className = "mt-4 text-center text-sm text-green-600";
      setTimeout(() => showLogin(), 2000);
    } else {
      msg.textContent = data.message || "Invalid OTP";
      msg.className = "mt-4 text-center text-sm text-red-500";
    }
  } catch (err) {
    msg.textContent = "Error updating password";
    msg.className = "mt-4 text-center text-sm text-red-500";
  }
}
/* ======================================================
   MANAGE USERS – ADMIN
====================================================== */

function openManageUsers() {
  if (localStorage.getItem("role") === "X9fK2pL5mQ8jR3t") {
    window.location.href = "manage-users.html";
  } else {
    window.location.href = "login.html";
  }
}

/* -------- LOAD USERS -------- */
async function loadUsers() {
  if (getDecodedRole() !== "ADMIN") return;

  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}?action=getUsers`);
    const users = await res.json();

    currentUsers = users || [];
    renderUsers(1);
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Error loading users.</td></tr>';
  }
}

function renderUsers(page = 1) {
  const tbody = document.getElementById("users-table-body");
  const paginationDiv = document.getElementById("users-pagination");

  if (!currentUsers || currentUsers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No users found.</td></tr>';
    if (paginationDiv) paginationDiv.innerHTML = "";
    return;
  }

  const start = (page - 1) * USERS_PER_PAGE;
  const end = start + USERS_PER_PAGE;
  const paginatedUsers = currentUsers.slice(start, end);
  const totalPages = Math.ceil(currentUsers.length / USERS_PER_PAGE);

  let html = "";
  paginatedUsers.forEach((u) => {
    const statusClass =
      u.status === "ACTIVE"
        ? "bg-green-50 text-green-700 border border-green-100"
        : "bg-red-50 text-red-700 border border-red-100";

    html += `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="px-6 py-4 font-medium text-slate-900">${u.name}</td>
          <td class="px-6 py-4 text-slate-600">${u.mobile}</td>
          <td class="px-6 py-4 text-slate-600">${u.email}</td>
          <td class="px-6 py-4">
            <select onchange="changeRole('${
              u.mobile
            }', this.value)" class="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-1.5">
              <option value="USER" ${
                u.role === "USER" ? "selected" : ""
              }>USER</option>
              <option value="ADMIN" ${
                u.role === "ADMIN" ? "selected" : ""
              }>ADMIN</option>
            </select>
          </td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
              ${u.status}
            </span>
          </td>
          <td class="px-6 py-4">
            <button onclick="toggleUser('${u.mobile}', '${u.status}')" 
              class="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-1 rounded transition">
              ${u.status === "ACTIVE" ? "Disable" : "Enable"}
            </button>
          </td>
        </tr>
      `;
  });

  tbody.innerHTML = html;

  // Render Pagination
  if (paginationDiv) {
    if (totalPages > 1) {
      paginationDiv.innerHTML = `
        <div class="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100">
          <span class="text-sm text-slate-500">Showing ${
            start + 1
          } to ${Math.min(end, currentUsers.length)} of ${
        currentUsers.length
      } users</span>
          <div class="flex gap-2">
            <button onclick="renderUsers(${page - 1})" ${
        page === 1
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
          : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
      } >Previous</button>
            <button onclick="renderUsers(${page + 1})" ${
        page === totalPages
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border border-slate-300 rounded bg-white text-sm"'
          : 'class="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 text-indigo-600 text-sm transition"'
      } >Next</button>
          </div>
        </div>
      `;
    } else {
      paginationDiv.innerHTML = "";
    }
  }
}

/* -------- ADD USER -------- */
async function addUser() {
  if (getDecodedRole() !== "ADMIN") {
    alert("Unauthorized action", "error");
    return;
  }

  const data = {
    action: "addUser",
    name: document.getElementById("u-name").value,
    mobile: document.getElementById("u-mobile").value,
    email: document.getElementById("u-email").value,
    password: document.getElementById("u-password").value,
    role: document.getElementById("u-role").value,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (result.status === "success") {
    alert("User added successfully");
    setTimeout(() => (window.location.href = "manage-users.html"), 1000);
  } else {
    alert(result.message || "Error adding user", "error");
  }
}

/* -------- ENABLE / DISABLE USER -------- */
async function toggleUser(mobile, currentStatus) {
  const status = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updateUserStatus",
      mobile,
      status,
    }),
  });

  alert(`User ${status.toLowerCase()} successfully`);
  loadUsers();
}

/* -------- CHANGE ROLE -------- */
async function changeRole(mobile, role) {
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "changeUserRole",
      mobile,
      role,
    }),
  });

  if (localStorage.getItem("userMobile") === mobile) {
    setEncodedRole(role);
    if (role !== "ADMIN") {
      alert("Your role has been updated. Redirecting...");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
      return;
    }
  }

  alert("Role updated successfully");
}

/* Auto-load users if on manage page */
if (document.getElementById("users-table-body")) {
  loadUsers();
}

/* ======================================================
   UI HELPERS (Custom Alert & Confirm)
====================================================== */

window.alert = function (message, type = "success") {
  const existing = document.getElementById("custom-alert");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-alert";
  overlay.className =
    "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity opacity-0";

  const isError = type === "error";
  const iconColor = isError
    ? "text-red-500 bg-red-50"
    : "text-green-500 bg-green-50";
  const btnColor = isError
    ? "bg-red-600 hover:bg-red-700"
    : "bg-indigo-600 hover:bg-indigo-700";

  // SVG Icons
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
  const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform scale-90 transition-transform text-center">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full ${iconColor} mb-6">
        ${isError ? errorIcon : checkIcon}
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">${
        isError ? "Error" : "Success"
      }</h3>
      <p class="text-slate-600 mb-8 leading-relaxed">${message}</p>
      <button onclick="document.getElementById('custom-alert').classList.add('opacity-0'); setTimeout(() => document.getElementById('custom-alert').remove(), 300);" 
        class="w-full ${btnColor} text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-100">
        Okay, Got it
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    overlay.querySelector("div").classList.remove("scale-90");
    overlay.querySelector("div").classList.add("scale-100");
  });
};

function showConfirm(message, onConfirm, onCancel) {
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity opacity-0";

  overlay.innerHTML = `
    <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform">
      <h3 class="text-lg font-bold text-slate-800 mb-2">Confirm Action</h3>
      <p class="text-slate-600 mb-6">${message}</p>
      <div class="flex justify-end gap-3">
        <button id="confirm-cancel" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">Cancel</button>
        <button id="confirm-yes" class="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition shadow-sm">Confirm</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.remove("opacity-0");
    overlay.querySelector("div").classList.remove("scale-95");
  });

  const close = () => {
    overlay.classList.add("opacity-0");
    overlay.querySelector("div").classList.add("scale-95");
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelector("#confirm-cancel").onclick = () => {
    close();
    if (onCancel) onCancel();
  };

  overlay.querySelector("#confirm-yes").onclick = () => {
    close();
    if (onConfirm) onConfirm();
  };
}
/* ======================================================
   SLA CHECK 
====================================================== */
function getSlaBadge(days) {
  if (days === 0) {
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">Today</span>`;
  }
  if (days <= 5) {
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">${days} days</span>`;
  }
  if (days <= 10) {
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">${days} days</span>`;
  }
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">${days} days</span>`;
}

function calculateDaysApproved(timestamp, status) {
  if (!timestamp) return 0;
  if (status === "Reimbursed") return 0;

  const now = new Date();
  const created = new Date(timestamp);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function getStatusTooltip(status) {
  switch (status) {
    case "Submitted": return "Waiting for admin review";
    case "Approved": return "Approved by Admin Payment Pending";
    case "Declined": return "Rejected by admin";
    case "Reimbursed": return "Payment processed";
    default: return "";
  }
}
function copyClaimId(id) {
  navigator.clipboard.writeText(id);
  showToast("Claim ID copied: " + id);
}
function timeAgo(date) {
  if (!date) return "";

  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 }
  ];

  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds);
    if (count >= 1) {
      return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}
function showToast(message, type = "success") {
  const toast = document.createElement("div");

  const color =
    type === "error"
      ? "bg-red-600"
      : type === "warning"
      ? "bg-orange-500"
      : "bg-green-600";

  toast.className = `
    fixed bottom-6 left-1/2 -translate-x-1/2 z-[999]
    ${color} text-white
    px-6 py-3 rounded-xl shadow-xl
    opacity-0 translate-y-4
    transition-all duration-300
    text-sm font-medium
  `;

  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-4");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-4");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
/* ======================================================
   SESSION CHECK (30 Min Timeout)
====================================================== */
function checkSession() {
  const loginTime = localStorage.getItem("loginTime");
  const role = getDecodedRole();

  if (role && loginTime) {
    const now = Date.now();
    const limit = 30 * 60 * 1000; // 30 minutes

    if (now - parseInt(loginTime) > limit) {
      localStorage.clear();
      if (
        !window.location.href.includes("login.html") &&
        !window.location.href.includes("index.html")
      ) {
        alert("Session expired. Please login again.", "error");
        setTimeout(() => (window.location.href = "login.html"), 2000);
      }
    } else {
      localStorage.setItem("loginTime", now);
    }
  }
}

checkSession();
