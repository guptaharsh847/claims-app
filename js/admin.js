const Layout = {
  render: () => {
    const path = window.location.pathname;
    const page = path.split("/").pop() || "index.html";
    
    // Inject Sidebar
    const sidebarPlaceholder = document.getElementById("sidebar-placeholder");
    if (sidebarPlaceholder) {
      sidebarPlaceholder.outerHTML = Layout.getSidebarHtml(page);
    }

    // Inject Header
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
      const title = Layout.getPageTitle(page);
      headerPlaceholder.outerHTML = Layout.getHeaderHtml(title);
    }

    // Inject Overlay
    if (!document.getElementById("sidebar-overlay")) {
      const overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.className = "fixed inset-0 bg-slate-900/50 z-40 hidden backdrop-blur-sm transition-opacity opacity-0";
      overlay.onclick = toggleSidebar;
      document.body.prepend(overlay);
    }
  },

  getSidebarHtml: (currentPage) => {
    const links = [
      { href: "admin.html", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", label: "Dashboard" },
      { href: "analytics.html", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Analytics" },
      { href: "manage-users.html", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", label: "Manage Users" },
      { href: "add-user.html", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", label: "Add User" }
    ];

    const navLinks = links.map(link => {
      const isActive = currentPage === link.href;
      const activeClass = isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600";
      return `
        <a href="${link.href}" class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeClass} overflow-hidden whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${link.icon}" /></svg>
          <span class="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">${link.label}</span>
        </a>`;
    }).join("");

    return `
      <aside id="sidebar" class="fixed md:relative z-50 w-64 md:w-20 md:hover:w-64 h-full bg-white border-r border-slate-200 transform -translate-x-full md:translate-x-0 transition-all duration-300 flex flex-col shadow-2xl md:shadow-none group">
        <div class="h-16 flex items-center px-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm overflow-hidden whitespace-nowrap">
           <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm shadow-indigo-200 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </div>
           <span class="font-bold text-lg text-slate-800 tracking-tight ml-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">Admin Portal</span>
        </div>
        <nav class="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
           ${navLinks}
        </nav>
        <div class="p-3 border-t border-slate-100 bg-slate-50/50 overflow-hidden whitespace-nowrap">
           <a href="index.html" class="flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors mb-1 rounded-lg hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span class="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">Home Page</span>
           </a>
           <button onclick="localStorage.removeItem('role'); localStorage.removeItem('userMobile'); localStorage.removeItem('loginTime'); window.location.href='index.html'" class="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              <span class="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">Logout</span>
           </button>
        </div>
      </aside>`;
  },

  getHeaderHtml: (title) => {
    return `
     <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-30 flex-none">
        <div class="flex items-center gap-3">
           <button onclick="toggleSidebar()" class="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
           </button>
           <h1 class="text-xl font-bold text-slate-800">${title}</h1>
        </div>
        <div class="flex items-center gap-2">
           <button onclick="window.location.reload()" class="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Refresh Data">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
           </button>
        </div>
     </header>`;
  },
  
  getPageTitle: (page) => {
    if (page.includes("admin")) return "Dashboard";
    if (page.includes("analytics")) return "Analytics";
    if (page.includes("manage-users")) return "Manage Users";
    if (page.includes("add-user")) return "Add User";
    return "Portal";
  }
};

// Initialize Layout
Layout.render();

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  
  if (sidebar.classList.contains("-translate-x-full")) {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden", "opacity-0");
  } else {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden", "opacity-0");
  }
}

async function loadClaims() {
  const statusEl = document.getElementById("statusFilter");
  const status = statusEl ? statusEl.value : "";
  const claimsDiv = document.getElementById("claims");
  if (!claimsDiv) return;

  claimsDiv.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Loading claims...</p>
    </div>`;

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
  const statsDiv = document.getElementById("admin-stats");
  const paginationDiv = document.getElementById("admin-pagination");

  if (!claims || claims.length === 0) {
    claimsDiv.innerHTML = `
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg></div>
    <h3 class="text-lg font-semibold text-slate-800 mb-2">No claims found</h3>
    <p class="text-slate-500 mb-6 max-w-sm">You haven’t submitted any claims yet. Start by raising a new claim.</p>
    <a href="claim.html" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium transition shadow">+ Raise a Claim</a>
  </div>`;
    if (statsDiv) statsDiv.innerHTML = "";
    if (paginationDiv) paginationDiv.innerHTML = "";
    return;
  }

  const start = (page - 1) * CONFIG.PAGINATION.CLAIMS;
  const end = start + CONFIG.PAGINATION.CLAIMS;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CONFIG.PAGINATION.CLAIMS);

  const totalPending = claims.filter(
    (c) => c.status === "Submitted" || c.status === "Approved"
  ).length;
  const totalAmountPending = claims
    .filter((c) => c.status === "Submitted" || c.status === "Approved")
    .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const totalReimbursedAmount = claims
    .filter((c) => {
      if (c.status !== "Reimbursed") return false;
      const parts = c.claimId ? c.claimId.split("-") : [];
      if (parts.length < 2) return false;
      const dateStr = parts[1];
      if (!dateStr || dateStr.length !== 8) return false;
      const year = parseInt(dateStr.substring(0, 4), 10);
      const month = parseInt(dateStr.substring(4, 6), 10) - 1;
      return month === now.getMonth() && year === now.getFullYear();
    })
    .reduce(
      (sum, c) => sum + (parseFloat(String(c.amount).replace(/,/g, "")) || 0),
      0
    );

  if (statsDiv) {
    statsDiv.innerHTML = `
      <!-- Mobile: Compact Single Row -->
      <div class="md:hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div class="grid grid-cols-3 divide-x divide-slate-100">
          <div class="text-center px-1">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</div>
            <div class="text-lg font-bold text-slate-800">${totalPending}</div>
          </div>
          <div class="text-center px-1">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</div>
            <div class="text-lg font-bold text-indigo-600">₹${totalAmountPending.toLocaleString()}</div>
          </div>
          <div class="text-center px-1">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid</div>
            <div class="text-lg font-bold text-green-600">₹${totalReimbursedAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <!-- Desktop: 3 Cards Grid -->
      <div class="hidden md:grid grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending</p><h3 class="text-2xl font-bold text-slate-800">${totalPending}</h3></div><div class="p-3 bg-indigo-50 rounded-xl text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div></div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Amt</p><h3 class="text-2xl font-bold text-slate-800">₹${totalAmountPending.toLocaleString()}</h3></div><div class="p-3 bg-orange-50 rounded-xl text-orange-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div></div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reimbursed</p><h3 class="text-2xl font-bold text-slate-800">₹${totalReimbursedAmount.toLocaleString()}</h3></div><div class="p-3 bg-green-50 rounded-xl text-green-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div></div>
      </div>`;
  }

  let desktopHtml = `<div class="hidden md:block overflow-x-auto"><table class="min-w-full text-sm text-left"><thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200"><tr>
            <th class="px-4 py-3 font-semibold w-12"><input type="checkbox" id="selectAll" onclick="toggleSelectAll(this)" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"></th>
            <th class="px-4 py-3 font-semibold cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap" onclick="sortAdminClaims('claimId')">Claim ID <span class="text-xs ml-1">${
              State.admin.sort.field === "claimId"
                ? State.admin.sort.direction === "asc"
                  ? "↑"
                  : "↓"
                : ""
            }</span></th>
            <th class="px-4 py-3 font-semibold whitespace-nowrap">Email</th><th class="px-4 py-3 font-semibold whitespace-nowrap">Amount</th><th class="px-4 py-3 font-semibold whitespace-nowrap">Current Status</th><th class="px-4 py-3 font-semibold whitespace-nowrap">Update Status</th><th class="px-4 py-3 font-semibold text-center whitespace-nowrap">Receipt</th><th class="px-4 py-3 font-semibold text-center whitespace-nowrap">SLA</th><th class="px-4 py-3 font-semibold text-center whitespace-nowrap">WhatsApp</th></tr></thead><tbody class="divide-y divide-slate-100">`;

  let mobileHtml = `<div class="md:hidden space-y-4 p-4 bg-slate-50">`;

  paginatedClaims.forEach((c) => {
    const statusInfo = Utils.getStatusInfo(c.status);
    // Desktop Row
    desktopHtml += `<tr class="hover:bg-slate-50 transition-colors">
          <td class="px-4 py-3 text-center"><input type="checkbox" class="claim-checkbox rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" value="${
            c.claimId
          }" data-status="${c.status}"></td>
          <td class="px-4 py-3 whitespace-nowrap"><div class="flex items-center gap-2">${
            c.claimId
          }<button onclick="copyClaimId('${
      c.claimId
    }')" title="Copy Claim ID" class="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div></td>
          <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
            <div>${c.email}</div>
            ${c.upiId ? `<div class="text-xs text-slate-400 mt-0.5">UPI: ${c.upiId}</div>` : ''}
          </td><td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">₹${
      c.amount
    }</td>
          <td class="px-4 py-3 font-medium whitespace-nowrap"><span class="px-2 py-1 rounded-full text-xs ${
            statusInfo.class
          }">${c.status}</span></td>
          <td class="px-4 py-3 whitespace-nowrap">${
            c.status === "Declined" || c.status === "Reimbursed"
              ? `<select disabled class="border border-slate-200 p-1.5 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed text-sm w-full"><option>${c.status}</option></select><div class="text-xs text-slate-400 mt-1">Status locked</div>`
              : `<select class="border border-slate-300 p-1.5 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full" onchange="updateStatus('${c.claimId}', this.value)"><option value="">Select</option><option value="Submitted">Submitted</option><option value="Approved">Approved</option><option value="Declined">Declined</option><option value="Reimbursed">Reimbursed</option></select>`
          }</td>
          <td class="px-4 py-3 text-center whitespace-nowrap">${
            c.receiptUrl
              ? `<button onclick="openReceiptModal('${c.receiptUrl}')" class="text-indigo-600 hover:text-indigo-800 transition p-1 rounded-full hover:bg-indigo-50" title="View Receipt"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>`
              : `<span class="text-slate-400 italic">No receipt</span>`
          }</td>
          <td class="px-4 py-3 text-center whitespace-nowrap">${
            c.status === "Submitted" || c.status === "Approved"
              ? Utils.getSlaBadge(
                  Utils.calculateDaysApproved(c.timestamp, c.status)
                )
              : "Done"
          }</td>
          <td class="px-4 py-3 text-center whitespace-nowrap"><button ${
            c.status === "Reimbursed" || c.status === "Declined"
              ? "disabled"
              : `onclick='openWhatsAppModal(${JSON.stringify(c).replace(
                  /'/g,
                  "&apos;"
                )})'`
          } class="${
      c.status === "Reimbursed" || c.status === "Declined"
        ? "text-slate-300 cursor-not-allowed"
        : "text-green-600 hover:text-green-800"
    } text-lg"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.506-.669-.514-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.084 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></button></td></tr>`;

    // Mobile Card
    mobileHtml += `
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-2">
             <input type="checkbox" class="claim-checkbox rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5" value="${
               c.claimId
             }" data-status="${c.status}">
             <div>
                <div class="font-bold text-slate-800 text-sm flex items-center gap-2">${
                  c.claimId
                } <button onclick="copyClaimId('${
      c.claimId
    }')" class="text-slate-400 active:text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div>
                <div class="text-xs text-slate-500">${c.email}</div>
                ${c.upiId ? `<div class="text-xs text-slate-400">UPI: ${c.upiId}</div>` : ''}
             </div>
          </div>
          <span class="${
            statusInfo.class
          } px-2 py-1 rounded-full text-xs font-medium">${c.status}</span>
        </div>
        
        <div class="grid grid-cols-2 gap-2 mt-1">
           <div>
             <div class="text-xs text-slate-400">Amount</div>
             <div class="text-lg font-bold text-slate-900">₹${c.amount}</div>
           </div>
           <div class="flex justify-end items-center gap-2">
              ${
                c.receiptUrl
                  ? `<button onclick="openReceiptModal('${c.receiptUrl}')" class="text-indigo-600 bg-indigo-50 p-2 rounded-lg"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>`
                  : ""
              }
              <button ${
                c.status === "Reimbursed" || c.status === "Declined"
                  ? "disabled"
                  : `onclick='openWhatsAppModal(${JSON.stringify(c).replace(
                      /'/g,
                      "&apos;"
                    )})'`
              } class="${
      c.status === "Reimbursed" || c.status === "Declined"
        ? "text-slate-300 bg-slate-100"
        : "text-green-600 bg-green-50"
    } p-2 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.506-.669-.514-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.084 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></button>
           </div>
        </div>
        
        <div class="mt-2">
           ${
             c.status === "Declined" || c.status === "Reimbursed"
               ? `<div class="text-xs text-slate-400 text-center bg-slate-50 p-2 rounded">Status locked</div>`
               : `<select class="w-full border border-slate-300 p-2 rounded-lg text-slate-700 text-sm bg-white" onchange="updateStatus('${c.claimId}', this.value)"><option value="">Update Status...</option><option value="Submitted">Submitted</option><option value="Approved">Approved</option><option value="Declined">Declined</option><option value="Reimbursed">Reimbursed</option></select>`
           }
        </div>
      </div>
    `;
  });
  desktopHtml += "</tbody></table></div>";
  mobileHtml += "</div>";
  claimsDiv.innerHTML = desktopHtml + mobileHtml;

  if (paginationDiv) {
    if (totalPages > 1) {
      paginationDiv.innerHTML = `<div class="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <span class="text-xs md:text-sm text-slate-500">Page ${page} of ${totalPages}</span>
            <div class="flex gap-2">
              <button onclick="renderAdminClaims(null, ${page - 1})" ${
        page === 1
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"'
          : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'
      } >Previous</button>
              <button onclick="renderAdminClaims(null, ${page + 1})" ${
        page === totalPages
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"'
          : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'
      } >Next</button>
            </div></div>`;
    } else {
      paginationDiv.innerHTML = "";
    }
  }
}

function sortAdminClaims(field) {
  if (!State.admin.claims.length) return;
  if (State.admin.sort.field === field)
    State.admin.sort.direction =
      State.admin.sort.direction === "asc" ? "desc" : "asc";
  else {
    State.admin.sort.field = field;
    State.admin.sort.direction = "desc";
  }
  const dir = State.admin.sort.direction === "asc" ? 1 : -1;
  State.admin.claims.sort((a, b) =>
    field === "claimId" ? dir * a.claimId.localeCompare(b.claimId) : 0
  );
  renderAdminClaims(State.admin.claims, 1);
}

function clearAdminFilters() {
  document.getElementById("statusFilter").value = "";
  State.admin.sort = { field: null, direction: "asc" };
  loadClaims();
}

async function updateStatus(claimId, status) {
  if (!status) return;
  showConfirm(
    `Change status to "${status}"?`,
    async () => {
      try {
        await Api.post({ action: "updateStatus", claimId, status });
        showToast("Status updated successfully");
        loadClaims();
      } catch (err) {
        console.error(err);
        alert("Failed to update status", "error");
      }
    },
    () => loadClaims()
  );
}

function toggleSelectAll(source) {
  document
    .querySelectorAll(".claim-checkbox")
    .forEach((cb) => (cb.checked = source.checked));
}

async function applyBulkAction() {
  const action = document.getElementById("bulkAction").value;
  if (!action) {
    showToast("Select a bulk action", "warning");
    return;
  }
  const selected = [
    ...document.querySelectorAll(".claim-checkbox:checked"),
  ].map((cb) => ({ claimId: cb.value, status: cb.dataset.status }));
  if (selected.length === 0) {
    showToast("No claims selected", "warning");
    return;
  }
  const locked = selected.filter(
    (c) => c.status === "Declined" || c.status === "Reimbursed"
  );
  if (locked.length > 0) {
    alert(
      "Bulk update blocked. One or more selected claims are already Declined or Reimbursed.",
      "error"
    );
    return;
  }
  showConfirm(`Apply "${action}" to ${selected.length} claims?`, async () => {
    try {
      await Api.post({
        action: "bulkUpdateStatus",
        claimIds: selected.map((c) => c.claimId),
        status: action,
      });
      showToast("Bulk status updated successfully");
      loadClaims();
    } catch (err) {
      console.error(err);
      showToast("Bulk update failed", "error");
    }
  });
}

function sendWhatsAppToSelected() {
  const claim = selectedClaimForWhatsApp;
  if (!claim) return;
  const numbers = [];
  if (document.getElementById("wa-agp").checked) numbers.push("919893412481");
  if (document.getElementById("wa-rcp").checked) numbers.push("917869390365");
  if (document.getElementById("wa-hgp").checked) numbers.push("919131379080");
  if (numbers.length === 0) {
    showToast("No valid recipients selected", "warning");
    return;
  }
  const message = buildWhatsAppMessage(selectedClaimForWhatsApp);
  numbers.forEach((num) => {
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
  return `Hare Krishna\nDandvat Pranam\n\nPlease transfer the lakshmi for the following details\n\nClaim ID   : ${
    claim.claimId
  }\nName       : ${claim.name || "N/A"}\nEmail      : ${
    claim.email || "N/A"
  }\nDepartment : ${claim.department || "N/A"}\nAmount     : ₹${
    claim.amount
  }\nUPI ID: ${claim.upiId || "N/A"}\nDescription: ${claim.description || "N/A"}\nReceipt    : ${
    claim.receiptUrl || "Not Uploaded"
  }\n\nYour Servant`;
}

function openManageUsers() {
  if (localStorage.getItem("role") === CONFIG.ROLES.ADMIN)
    window.location.href = "manage-users.html";
  else window.location.href = "login.html";
}

function filterUsers() {
  const term = document.getElementById("userSearch").value.toLowerCase();
  renderUsers(1, term);
}

async function loadUsers() {
  if (Utils.getDecodedRole() !== "ADMIN") return;
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;
  try {
    const response = await Api.get({ action: "getUsers" });
    // Handle if response is array or object wrapper
    State.users.list = Array.isArray(response)
      ? response
      : response.users || [];
    renderUsers(1);
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="px-6 py-8 text-center text-red-500">Error loading users.</td></tr>';
  }
}

function renderUsers(page = 1, searchTerm = "") {
  const tbody = document.getElementById("users-table-body");
  const paginationDiv = document.getElementById("users-pagination");
  let users = State.users.list;

  // Filter out current logged-in user to prevent self-management
  const currentUserMobile = localStorage.getItem("userMobile");
  if (currentUserMobile) {
    users = users.filter((u) => String(u.mobile) !== String(currentUserMobile));
  }

  if (searchTerm) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        String(u.mobile).includes(searchTerm)
    );
  }

  if (!users || users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="px-6 py-8 text-center text-slate-500">No users found.</td></tr>';
    if (paginationDiv) paginationDiv.innerHTML = "";
    return;
  }
  const start = (page - 1) * CONFIG.PAGINATION.USERS;
  const end = start + CONFIG.PAGINATION.USERS;
  const paginatedUsers = users.slice(start, end);
  const totalPages = Math.ceil(users.length / CONFIG.PAGINATION.USERS);

  let desktopHtml = "";
  let mobileHtml = `<div class="md:hidden space-y-4 p-4 bg-slate-50">`;

  paginatedUsers.forEach((u) => {
    const statusClass =
      u.status === "ACTIVE"
        ? "bg-green-50 text-green-700 border border-green-100"
        : "bg-red-50 text-red-700 border border-red-100";

    // Permissions Logic
    // Robust check: handles if permissions are in a nested object OR flat properties
    const p = u.permissions || u;
    const canAdd =
      p.canAddUser === true || p.canAddUser === "TRUE" ? "checked" : "";
    const canManage =
      p.canManageUser === true || p.canManageUser === "TRUE" ? "checked" : "";
    const canAnalytics =
      p.canViewAnalytics === true || p.canViewAnalytics === "TRUE"
        ? "checked"
        : "";

    // Desktop Row
    desktopHtml += `<tr class="hover:bg-slate-50 transition-colors user-row">
          <td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">${
            u.name
          }</td>
          <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${
            u.mobile
          }</td>
          <td class="px-4 py-3 text-slate-600 whitespace-nowrap">${u.email}</td>
          <td class="px-4 py-3 whitespace-nowrap"><select onchange="changeRole('${
            u.mobile
          }', this.value)" class="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"><option value="USER" ${
      u.role === "USER" ? "selected" : ""
    }>USER</option><option value="ADMIN" ${
      u.role === "ADMIN" ? "selected" : ""
    }>ADMIN</option></select></td>
          <td class="px-4 py-3 whitespace-nowrap"><span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">${
      u.status
    }</span></td>
          <td class="px-4 py-3 text-center"><input type="checkbox" class="perm-check w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" data-email="${
            u.mobile
          }" data-type="canAddUser" ${canAdd}></td>
          <td class="px-4 py-3 text-center"><input type="checkbox" class="perm-check w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" data-email="${
            u.mobile
          }" data-type="canManageUser" ${canManage}></td>
          <td class="px-4 py-3 text-center"><input type="checkbox" class="perm-check w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" data-email="${
            u.mobile
          }" data-type="canViewAnalytics" ${canAnalytics}></td>
          <td class="px-4 py-3 whitespace-nowrap flex items-center gap-2">
            <button onclick="saveUserPermissions('${
              u.mobile
            }', this)" class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium text-xs px-3 py-1 rounded transition shadow-sm">Save</button>
            <button onclick="toggleUser('${u.mobile}', '${
      u.status
    }')" class="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-1 rounded transition">${
      u.status === "ACTIVE" ? "Disable" : "Enable"
    }</button>
          </td></tr>`;

    // Mobile Card
    mobileHtml += `
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 user-card">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-bold text-slate-800">${u.name}</div>
            <div class="text-xs text-slate-500">${u.mobile}</div>
            <div class="text-xs text-slate-500">${u.email}</div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${
      u.status
    }</span>
        </div>
        
        <div class="grid grid-cols-2 gap-3 items-center border-t border-slate-50 pt-3">
           <select onchange="changeRole('${
             u.mobile
           }', this.value)" class="bg-white border border-slate-300 text-slate-700 text-xs rounded p-2 w-full"><option value="USER" ${
      u.role === "USER" ? "selected" : ""
    }>USER</option><option value="ADMIN" ${
      u.role === "ADMIN" ? "selected" : ""
    }>ADMIN</option></select>
           <button onclick="toggleUser('${u.mobile}', '${
      u.status
    }')" class="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded transition w-full text-center">${
      u.status === "ACTIVE" ? "Disable Account" : "Enable Account"
    }</button>
        </div>

        <div class="bg-slate-50 p-3 rounded-lg">
           <div class="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Permissions</div>
           <div class="flex flex-wrap gap-4">
             <label class="flex items-center gap-2 text-xs"><input type="checkbox" class="perm-check rounded border-slate-300 text-indigo-600" data-email="${
               u.mobile
             }" data-type="canAddUser" ${canAdd}> Add User</label>
             <label class="flex items-center gap-2 text-xs"><input type="checkbox" class="perm-check rounded border-slate-300 text-indigo-600" data-email="${
               u.mobile
             }" data-type="canManageUser" ${canManage}> Manage</label>
             <label class="flex items-center gap-2 text-xs"><input type="checkbox" class="perm-check rounded border-slate-300 text-indigo-600" data-email="${
               u.mobile
             }" data-type="canViewAnalytics" ${canAnalytics}> Analytics</label>
           </div>
           <button onclick="saveUserPermissions('${
             u.mobile
           }', this)" class="mt-3 w-full text-white bg-indigo-600 hover:bg-indigo-700 font-medium text-xs px-3 py-2 rounded transition shadow-sm">Save Permissions</button>
        </div>
      </div>
    `;
  });
  tbody.innerHTML = desktopHtml;
  const mobileContainer = document.getElementById("users-mobile-view");
  if (mobileContainer) mobileContainer.innerHTML = mobileHtml + "</div>";

  if (paginationDiv) {
    if (totalPages > 1) {
      paginationDiv.innerHTML = `<div class="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <span class="text-xs md:text-sm text-slate-500">Page ${page} of ${totalPages}</span>
          <div class="flex gap-2">
            <button onclick="renderUsers(${page - 1}, '${searchTerm}')" ${
        page === 1
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"'
          : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'
      } >Previous</button>
            <button onclick="renderUsers(${page + 1}, '${searchTerm}')" ${
        page === totalPages
          ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"'
          : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'
      } >Next</button>
          </div></div>`;
    } else {
      paginationDiv.innerHTML = "";
    }
  }
}

async function addUser() {
  if (Utils.getDecodedRole() !== "ADMIN") {
    alert("Unauthorized action", "error");
    return;
  }

  const btn = document.getElementById("btn-add-user");
  const originalText = btn ? btn.textContent : "";

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating...";
    btn.classList.add("opacity-70", "cursor-not-allowed");
  }

  try {
    const data = {
      action: "addUser",
      name: document.getElementById("u-name").value,
      mobile: document.getElementById("u-mobile").value,
      email: document.getElementById("u-email").value,
      password: document.getElementById("u-password").value,
      role: document.getElementById("u-role").value,
      canAddUser: document.getElementById("u-canAddUser")?.checked || false,
      canViewAnalytics:
        document.getElementById("u-canViewAnalytics")?.checked || false,
      canManageUser:
        document.getElementById("u-canManageUser")?.checked || false,
    };
    const result = await Api.post(data);
    if (result.status === "success") {
      alert("User added successfully");
      setTimeout(() => (window.location.href = "manage-users.html"), 1000);
    } else {
      alert(result.message || "Error adding user", "error");
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
      btn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  }
}

async function toggleUser(mobile, currentStatus) {
  const status = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
  await Api.post({ action: "updateUserStatus", mobile, status });
  alert(`User ${status.toLowerCase()} successfully`);
  loadUsers();
}

async function changeRole(mobile, role) {
  await Api.post({ action: "changeUserRole", mobile, role });
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

function exportToCSV() {
  const claims = State.admin.claims;
  if (!claims || !claims.length) {
    showToast("No data to export", "warning");
    return;
  }

  // Define headers
  const headers = [
    "Claim ID",
    "Email",
    "Amount",
    "Status",
    "Date",
    "Receipt URL",
  ];

  // Create CSV content
  const csvRows = [headers.join(",")];

  claims.forEach((c) => {
    const row = [
      c.claimId,
      c.email,
      c.amount,
      c.status,
      c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "",
      c.receiptUrl || "",
    ];
    // Escape quotes and join
    csvRows.push(
      row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
    );
  });

  // Download
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `claims_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

async function saveUserPermissions(mobile, btn) {
  const originalText = btn.innerText;
  btn.innerText = "Saving...";
  btn.disabled = true;

  const container = btn.closest(".user-row") || btn.closest(".user-card");
  const checkboxes = container
    ? container.querySelectorAll(`.perm-check[data-email="${mobile}"]`)
    : [];
  const perms = {
    canAddUser: false,
    canManageUser: false,
    canViewAnalytics: false,
  };
  checkboxes.forEach((cb) => {
    perms[cb.dataset.type] = cb.checked;
  });
  console.log("...perms", perms);
  try {
    const res = await Api.post({
      action: "updatePermissions",
      targetMobile: mobile,
      perms:perms,
    });
    if (res.result === "success") {
      btn.innerText = "Saved!";
      btn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
      btn.classList.add("bg-green-600", "hover:bg-green-700");
      setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.classList.add("bg-indigo-600", "hover:bg-indigo-700");
        btn.classList.remove("bg-green-600", "hover:bg-green-700");
      }, 2000);
    } else {
      throw new Error(res.message || "Failed");
    }
  } catch (err) {
    console.error(err);
    btn.innerText = "Error";
    btn.classList.add("bg-red-600");
    setTimeout(() => {
      btn.innerText = originalText;
      btn.disabled = false;
      btn.classList.remove("bg-red-600");
    }, 2000);
  }
}

async function applyDashboardPermissions() {
  const userMobile = localStorage.getItem("userMobile");
  if (!userMobile) return;

  const analyticsLink = document.querySelector('a[href="analytics.html"]');
  const manageLink = document.querySelector('a[href="manage-users.html"]');
  const addUserLink = document.querySelector('a[href="add-user.html"]');
  const statsDiv = document.getElementById("admin-stats");

  // Hide immediately to prevent flickering (Flash of Unauthorized Content)
  if (manageLink) manageLink.style.display = "none";
  if (analyticsLink) analyticsLink.style.display = "none";
  if (addUserLink) addUserLink.style.display = "none";
  if (statsDiv) statsDiv.style.display = "none";

  if (!analyticsLink && !manageLink && !statsDiv && !addUserLink) return;

  try {
    const response = await Api.get({ action: "getUsers" });
    const users = Array.isArray(response) ? response : response.users || [];
    const currentUser = users.find((u) => u.mobile === userMobile);

    if (currentUser) {
      const p = currentUser.permissions || currentUser;
      const canManage = p.canManageUser === true || p.canManageUser === "TRUE";
      const canAnalytics =
        p.canViewAnalytics === true || p.canViewAnalytics === "TRUE";
      const canAdd = p.canAddUser === true || p.canAddUser === "TRUE";

      if (manageLink) manageLink.style.display = canManage ? "flex" : "none";
      if (analyticsLink) analyticsLink.style.display = canAnalytics ? "flex" : "none";
      if (addUserLink) addUserLink.style.display = canAdd ? "flex" : "none";
      if (statsDiv) statsDiv.style.display = canAnalytics ? "" : "none";
    }
  } catch (err) {
    console.error("Error applying permissions", err);
  }
}

if (document.getElementById("claims")) {
  applyDashboardPermissions();
  loadClaims();
}

if (document.getElementById("users-table-body")) {
  loadUsers();
  applyDashboardPermissions();
}

async function verifyPageAccess() {
  const path = window.location.pathname;
  let requiredPerm = null;

  if (path.includes("add-user")) requiredPerm = "canAddUser";
  else if (path.includes("manage-users")) requiredPerm = "canManageUser";
  else if (path.includes("analytics")) requiredPerm = "canViewAnalytics";

  const revealPage = () => {
    const hider = document.getElementById("page-hider");
    if (hider) hider.remove();
  };

  if (!requiredPerm) {
    revealPage();
    return;
  }

  const userMobile = localStorage.getItem("userMobile");
  if (!userMobile) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await Api.get({ action: "getUsers" });
    const users = Array.isArray(response) ? response : response.users || [];
    const currentUser = users.find((u) => u.mobile === userMobile);

    if (!currentUser) {
      window.location.href = "404.html";
      return;
    }

    const p = currentUser.permissions || currentUser;
    const hasAccess = p[requiredPerm] === true || p[requiredPerm] === "TRUE";

    if (!hasAccess) {
      window.location.href = "404.html";
    } else {
      revealPage();
    }
  } catch (err) {
    console.error("Access verification failed", err);
    window.location.href = "404.html";
  }
}

verifyPageAccess();
