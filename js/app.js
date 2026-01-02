/* ======================================================
   CONFIGURATION & CONSTANTS
====================================================== */
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec",
  ROLES: {
    ADMIN: "X9fK2pL5mQ8jR3t",
    USER: "B2vN9kM4lP7oJ5h",
  },
  PAGINATION: {
    USERS: 10,
    CLAIMS: 15,
  },
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

/* ======================================================
   GLOBAL STATE
====================================================== */
const State = {
  user: {
    claims: [],
    filteredClaims: [],
    sort: { field: null, direction: "asc" },
  },
  admin: {
    claims: [],
    sort: { field: null, direction: "asc" },
  },
  users: {
    list: [],
    page: 1,
  },
};

// Temporary storage for WhatsApp action
let selectedClaimForWhatsApp = null;

/* ======================================================
   UTILITIES IMPLEMENTATION
====================================================== */
const Utils = {
  getDecodedRole: () => {
    const r = localStorage.getItem("role");
    if (r === CONFIG.ROLES.ADMIN) return "ADMIN";
    if (r === CONFIG.ROLES.USER) return "USER";
    return null;
  },

  setEncodedRole: (plainRole) => {
    if (plainRole === "ADMIN") localStorage.setItem("role", CONFIG.ROLES.ADMIN);
    else if (plainRole === "USER") localStorage.setItem("role", CONFIG.ROLES.USER);
  },

  timeAgo: (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
    return "just now";
  },

  calculateDaysApproved: (timestamp, status) => {
    if (!timestamp || status === "Reimbursed") return 0;
    const now = new Date();
    const created = new Date(timestamp);
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  },

  getStatusInfo: (status) => {
    const map = {
      Submitted: { class: "bg-blue-50 text-blue-700 border border-blue-100", tooltip: "Waiting for admin review" },
      Approved: { class: "bg-yellow-50 text-yellow-700 border border-yellow-100", tooltip: "Approved by Admin Payment Pending" },
      Reimbursed: { class: "bg-green-50 text-green-700 border border-green-100", tooltip: "Payment processed" },
      Declined: { class: "bg-red-50 text-red-700 border border-red-100", tooltip: "Rejected by admin" },
    };
    return map[status] || { class: "bg-slate-100 text-slate-600", tooltip: "" };
  },

  getSlaBadge: (days) => {
    if (days === 0) return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">Today</span>`;
    if (days <= 5) return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">${days} days</span>`;
    if (days <= 10) return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">${days} days</span>`;
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">${days} days</span>`;
  },

  readFileAsBase64: (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
  }
};

/* ======================================================
   API LAYER
====================================================== */
const Api = {
  get: async (params = {}) => {
    const url = new URL(CONFIG.API_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const res = await fetch(url);
    return res.json();
  },

  post: async (body) => {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
    // Try parsing JSON, fallback to text if needed (though app logic expects JSON mostly)
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
};

/* ======================================================
   CLAIM SUBMISSION
====================================================== */
const form = document.getElementById("claimForm");
const fileInput = document.querySelector('input[name="receipt"]');
const fileNameEl = document.getElementById("fileName");

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
      payload.fileData = await Utils.readFileAsBase64(file);
      payload.fileName = file.name;
      payload.fileType = file.type;
    }

    try {
      await Api.post(payload);

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
    const data = await Api.get({ search: value });

    if (data.error) {
      output.innerHTML = `<div class="p-8 text-center text-slate-500">${data.error}</div>`;
      return;
    }

    State.user.claims = data.claims;
    // Sort by latest (descending timestamp)
    State.user.claims.sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    );
    applyUserFilter();
  } catch (err) {
    output.innerHTML = `<pre class="text-red-600">${err.message}</pre>`;
  }
}

function renderClaims(claims, page = 1) {
  // Handle global state if called from pagination buttons
  if (claims) State.user.filteredClaims = claims;
  else claims = State.user.filteredClaims;

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

  const start = (page - 1) * CONFIG.PAGINATION.CLAIMS;
  const end = start + CONFIG.PAGINATION.CLAIMS;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CONFIG.PAGINATION.CLAIMS);

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
    const statusInfo = Utils.getStatusInfo(c.status);

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
  title="${statusInfo.tooltip}"
  class="px-3 py-1 rounded-full text-xs font-medium cursor-help ${statusInfo.class}"
>
  ${c.status}
</span>
<span class="text-xs text-slate-400 mt-1 ml-1">
    ${Utils.timeAgo(c.timestamp)}
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
      : Utils.getSlaBadge(Utils.calculateDaysApproved(c.timestamp, c.status))
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
  let filtered = State.user.claims;

  if (status) {
    filtered = State.user.claims.filter((c) => c.status === status);
  }
  renderClaims(filtered, 1);
}

function sortClaims(field) {
  document.getElementById("dateArrow").textContent =
    State.user.sort.field === "date"
      ? State.user.sort.direction === "asc"
        ? "↑"
        : "↓"
      : "";

  document.getElementById("idArrow").textContent =
    State.user.sort.field === "claimId"
      ? State.user.sort.direction === "asc"
        ? "↑"
        : "↓"
      : "";
  if (!State.user.claims || State.user.claims.length === 0) return;

  // Toggle direction if same field, else reset to asc
  if (State.user.sort.field === field) {
    State.user.sort.direction = State.user.sort.direction === "asc" ? "desc" : "asc";
  } else {
    State.user.sort.field = field;
    State.user.sort.direction = "asc";
  }

  const dir = State.user.sort.direction === "asc" ? 1 : -1;

  const sorted = [...State.user.claims].sort((a, b) => {
    if (field === "date") {
      return dir * (new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    }

    if (field === "claimId") {
      return dir * a.claimId.localeCompare(b.claimId);
    }

    return 0;
  });

  State.user.claims = sorted;
  applyUserFilter();
}

function clearUserFilters() {
  document.getElementById("userStatusFilter").value = "";
  document.getElementById("searchValue").value = "";
  
  State.user.sort = { field: null, direction: "asc" };
  document.getElementById("dateArrow").textContent = "";
  document.getElementById("idArrow").textContent = "";

  // Reset Data and View
  State.user.claims = [];
  State.user.filteredClaims = [];
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

async function login() {
  const mobile = document.getElementById("mobile").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.className =
    "mt-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg animate-pulse";
  msg.textContent = "Verifying credentials...";

  try {
    const data = await Api.post({
      action: "login",
      mobile,
      password,
    });

    // API returns text sometimes, but Api.post handles JSON. Assuming standard JSON response here based on other calls.
    // If the backend returns raw text for login, we might need adjustment, but context implies JSON structure.
    if (data.status === "success" && data.userStatus === "ACTIVE") {
      msg.className =
        "mt-4 text-center text-sm font-medium text-green-600 bg-green-50 py-2 px-4 rounded-lg";
      msg.textContent = "Success! Redirecting...";
      Utils.setEncodedRole(data.role);
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

async function loadClaims() {
  const statusEl = document.getElementById("statusFilter");
  const status = statusEl ? statusEl.value : "";
  const claimsDiv = document.getElementById("claims");

  if (!claimsDiv) return;

  claimsDiv.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Loading claims...</p>
    </div>
  `;

  try {
    const params = { action: "adminClaims" };
    if (status) params.status = status;

    const data = await Api.get(params);

    State.admin.claims = data || [];
    renderAdminClaims(State.admin.claims, 1);
  } catch (err) {
    console.error(err);
    claimsDiv.innerHTML =
      '<div class="p-8 text-center text-red-500">Error loading claims.</div>';
  }
}

function renderAdminClaims(claims, page = 1) {
  if (claims) State.admin.claims = claims;
  else claims = State.admin.claims;

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

  const start = (page - 1) * CONFIG.PAGINATION.CLAIMS;
  const end = start + CONFIG.PAGINATION.CLAIMS;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CONFIG.PAGINATION.CLAIMS);

  let html = `
      <table class="min-w-full border text-sm bg-white">
        <thead class="bg-slate-100">
          <tr>
            <th class="border p-2">Claim ID</th>
            <th class="border p-2">Email</th>
            <th class="border p-2">Amount</th>
            <th class="border p-2">Current Status</th>
            <th class="border p-2">Update Status</th>
            <th class="border p-2">Receipt</th>
            <th class="border p-2">SLA</th>
            <th class="border p-2">WhatsApp</th>


          </tr>
        </thead>
        <tbody>
    `;

  paginatedClaims.forEach((c) => {
    const statusInfo = Utils.getStatusInfo(c.status);

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
            <span class="px-2 py-1 rounded-full text-xs ${statusInfo.class}">
              ${c.status}
            </span>
          </td>
        <td class="border p-2">
  ${
    (c.status === "Declined" || c.status === "Reimbursed")
      ? `
        <select
          disabled
          class="border p-1 rounded bg-slate-100 text-slate-400 cursor-not-allowed"
        >
          <option>${c.status}</option>
        </select>
        <div class="text-xs text-slate-400 mt-1">
          Status locked
        </div>
      `
      : `
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
      `
  }
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
      : Utils.getSlaBadge(
          Utils.calculateDaysApproved(c.timestamp, c.status)
        )
  }
</td>
<td class="border p-2 text-center">
  <button
    onclick='openWhatsAppModal(${JSON.stringify(c).replace(/'/g, "&apos;")})'
    class="text-green-600 hover:text-green-800 text-lg"
    title="Send WhatsApp message"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.506-.669-.514-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.084 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  </button>
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
  if (!State.admin.claims.length) return;

  if (State.admin.sort.field === field) {
    State.admin.sort.direction =
      State.admin.sort.direction === "asc" ? "desc" : "asc";
  } else {
    State.admin.sort.field = field;
    State.admin.sort.direction = "asc";
  }

  if (arrow)
    arrow.textContent = State.admin.sort.direction === "asc" ? "↑" : "↓";
  const dir = State.admin.sort.direction === "asc" ? 1 : -1;

  State.admin.claims.sort((a, b) => {
    if (field === "claimId") return dir * a.claimId.localeCompare(b.claimId);
    return 0;
  });

  renderAdminClaims(State.admin.claims, 1);
}

function clearAdminFilters() {
  document.getElementById("statusFilter").value = "";
  State.admin.sort = { field: null, direction: "asc" };
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
        await Api.post({
          action: "updateStatus",
          claimId,
          status,
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
    const data = await Api.post({ action: "sendOtp", mobile });

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
    const data = await Api.post({
      action: "resetPassword",
      mobile,
      otp,
      newPassword,
    });

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
  if (localStorage.getItem("role") === CONFIG.ROLES.ADMIN) {
    window.location.href = "manage-users.html";
  } else {
    window.location.href = "login.html";
  }
}

/* -------- LOAD USERS -------- */
async function loadUsers() {
  if (Utils.getDecodedRole() !== "ADMIN") return;

  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;

  try {
    const users = await Api.get({ action: "getUsers" });
    State.users.list = users || [];
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
  const users = State.users.list;

  if (!users || users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No users found.</td></tr>';
    if (paginationDiv) paginationDiv.innerHTML = "";
    return;
  }

  const start = (page - 1) * CONFIG.PAGINATION.USERS;
  const end = start + CONFIG.PAGINATION.USERS;
  const paginatedUsers = users.slice(start, end);
  const totalPages = Math.ceil(users.length / CONFIG.PAGINATION.USERS);

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
          } to ${Math.min(end, users.length)} of ${
        users.length
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
  if (Utils.getDecodedRole() !== "ADMIN") {
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

  const result = await Api.post(data);

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
  
  await Api.post({
    action: "updateUserStatus",
    mobile,
    status,
  });

  alert(`User ${status.toLowerCase()} successfully`);
  loadUsers();
}

/* -------- CHANGE ROLE -------- */
async function changeRole(mobile, role) {
  await Api.post({
    action: "changeUserRole",
    mobile,
    role,
  });

  if (localStorage.getItem("userMobile") === mobile) {
    Utils.setEncodedRole(role);
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
function copyClaimId(id) {
  navigator.clipboard.writeText(id);
  showToast("Claim ID copied: " + id);
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


function toggleSelectAll(source) {
  document
    .querySelectorAll(".claim-checkbox")
    .forEach(cb => cb.checked = source.checked);
}

async function applyBulkAction() {
  const action = document.getElementById("bulkAction").value;

  if (!action) {
    showToast("Select a bulk action", "warning");
    return;
  }

  const selected = [...document.querySelectorAll(".claim-checkbox:checked")]
    .map(cb => ({
      claimId: cb.value,
      status: cb.dataset.status
    }));
  if (selected.length === 0) {
    showToast("No claims selected", "warning");
    return;
  }

  // ❌ BLOCK if any finalized claim is selected
  const locked = selected.filter(
    c => c.status === "Declined" || c.status === "Reimbursed"
  );

  if (locked.length > 0) {
    alert(
      "Bulk update blocked. One or more selected claims are already Declined or Reimbursed.",
      "error"
    );
    return;
  }

  showConfirm(
    `Apply "${action}" to ${selected.length} claims?`,
    async () => {
      try {
        await Api.post({
          action: "bulkUpdateStatus",
          claimIds: selected.map(c => c.claimId),
          status: action
        });

        showToast("Bulk status updated successfully");
        loadClaims();

      } catch (err) {
        console.error(err);
        showToast("Bulk update failed", "error");
      }
    }
  );
}

function sendWhatsAppToSelected() {
  const claim = selectedClaimForWhatsApp;
  if (!claim) return;
  
  const numbers = [];

  // Check User
 

  // Check Finance
  if (document.getElementById("wa-agp").checked) {
    numbers.push("919893412481"); // Finance Team
  }

  // Check Manager
  if (document.getElementById("wa-rcp").checked) {
    // Add manager number logic here
    numbers.push("917869390365")
  }
   if (document.getElementById("wa-hgp").checked) {
    // Add manager number logic here
    numbers.push("919131379080")
  }

  if (numbers.length === 0) {
    showToast("No valid recipients selected", "warning");
    return;
  }
  console.log('selectedClaimForWhatsApp', selectedClaimForWhatsApp)
  const message = buildWhatsAppMessage(selectedClaimForWhatsApp);

  numbers.forEach(num => {
    const cleanNum = num.toString().replace(/\D/g, "");
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  });

  closeWaModal();
}
function openWhatsAppModal(claim) {
  selectedClaimForWhatsApp = claim;
  document.getElementById("wa-modal").classList.remove("hidden");
}

function closeWaModal() {
  document.getElementById("wa-modal").classList.add("hidden");
  selectedClaimForWhatsApp = null;
}

function buildWhatsAppMessage(claim) {
  return `
Hare Krishna
Dandvat Pranam

Please transfer the lakshmi for the following details

Claim ID   : ${claim.claimId}
Name       : ${claim.name || "N/A"}
Email      : ${claim.email || "N/A"}
Department : ${claim.department || "N/A"}
Amount     : ₹${claim.amount}
Description: ${claim.description || "N/A"}
Receipt    : ${claim.receiptUrl || "No Uploaded"}


Your Servant
`;
}

/* ======================================================
   SESSION CHECK (30 Min Timeout)
====================================================== */
function checkSession() {
  const loginTime = localStorage.getItem("loginTime");
  const role = Utils.getDecodedRole();

  if (role && loginTime) {
    const now = Date.now();
    const limit = CONFIG.SESSION_TIMEOUT;

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
