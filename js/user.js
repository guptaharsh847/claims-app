/* ======================================================
   CLAIM SUBMISSION
====================================================== */
const form = document.getElementById("claimForm");
const fileInput = document.querySelector('input[name="receipt"]');
const fileNameEl = document.getElementById("fileName");

if (form) {
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
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
    submitBtn.classList.add("opacity-70", "cursor-not-allowed");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const file = fileInput.files[0];
    if (file) {
      payload.fileData = await Utils.readFileAsBase64(file);
      payload.fileName = file.name;
      payload.fileType = file.type;
    }

    try {
      await Api.post(payload);
      result.textContent = `Claim submitted successfully!`;
      form.reset();
      if (fileNameEl) fileNameEl.textContent = "";
    } catch (err) {
      console.error(err);
      result.textContent = `Claim submitted successfully!`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.classList.remove("opacity-70", "cursor-not-allowed");
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
    output.innerHTML = '<div class="p-8 text-center text-red-500 font-medium">Please enter Email or Claim ID</div>';
    return;
  }

  output.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Searching records...</p>
    </div>`;

  try {
    const data = await Api.get({ search: value });
    if (data.error) {
      output.innerHTML = `<div class="p-8 text-center text-slate-500">${data.error}</div>`;
      return;
    }
    State.user.claims = data.claims;
    State.user.claims.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    applyUserFilter();
  } catch (err) {
    output.innerHTML = `<pre class="text-red-600">${err.message}</pre>`;
  }
}

function renderClaims(claims, page = 1) {
  if (claims) State.user.filteredClaims = claims;
  else claims = State.user.filteredClaims;
  const output = document.getElementById("output");

  if (!claims || claims.length === 0) {
    output.innerHTML = `
  <div class="flex flex-col items-center justify-center py-8 text-center">
    <div class="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    </div>
    <h3 class="text-base font-semibold text-slate-800 mb-1">No claims found</h3>
    <p class="text-slate-500 mb-4 max-w-xs text-sm">Please verify your Email or Claim ID, or raise a new claim.</p>
    <a href="claim.html" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow">+ Raise a Claim</a>
  </div>`;
    return;
  }

  const start = (page - 1) * CONFIG.PAGINATION.CLAIMS;
  const end = start + CONFIG.PAGINATION.CLAIMS;
  const paginatedClaims = claims.slice(start, end);
  const totalPages = Math.ceil(claims.length / CONFIG.PAGINATION.CLAIMS);

  let desktopHtml = `<div class="hidden md:block overflow-x-auto"><table class="min-w-full border text-sm bg-white"><thead class="bg-slate-100"><tr>
          <th class="border p-2 cursor-pointer hover:bg-slate-200 transition-colors" onclick="sortClaims('claimId')">Claim ID <span class="text-xs ml-1">${State.user.sort.field === "claimId" ? (State.user.sort.direction === "asc" ? "↑" : "↓") : ""}</span></th>
          <th class="border p-2 cursor-pointer hover:bg-slate-200 transition-colors" onclick="sortClaims('date')">Date <span class="text-xs ml-1">${State.user.sort.field === "date" ? (State.user.sort.direction === "asc" ? "↑" : "↓") : ""}</span></th>
          <th class="border p-2">Email</th><th class="border p-2">Amount</th><th class="border p-2">Status</th><th class="border p-2">Receipt</th><th class="border p-2">SLA</th></tr></thead><tbody>`;

  let mobileHtml = `<div class="md:hidden space-y-4">`;

  paginatedClaims.forEach((c) => {
    const statusInfo = Utils.getStatusInfo(c.status);
    // Desktop Row
    desktopHtml += `<tr class="hover:bg-slate-50">
        <td class="border p-2"><div class="flex items-center gap-2">${c.claimId}<button onclick="copyClaimId('${c.claimId}')" title="Copy Claim ID" class="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button></div></td>
        <td class="border p-2 text-slate-600">${new Date(c.timestamp).toLocaleDateString()}</td>
        <td class="border p-2 text-slate-600">${c.email}</td>
        <td class="border p-2 font-medium">₹${c.amount}</td>
        <td class="border p-2"><span title="${statusInfo.tooltip}" class="px-2 py-1 rounded-full text-xs font-medium cursor-help ${statusInfo.class}">${c.status}</span></td>
        <td class="border p-2 text-center">${c.receiptUrl ? `<button onclick="openReceiptModal('${c.receiptUrl}')" class="text-indigo-600 hover:text-indigo-800 transition p-1 rounded-full hover:bg-indigo-50" title="View Receipt"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>` : `<span class="text-slate-400 italic">No receipt</span>`}</td>
        <td class="border p-2 text-center">${c.status === "Submitted" || c.status === "Approved" ? Utils.getSlaBadge(Utils.calculateDaysApproved(c.timestamp, c.status)) : "-"}</td></tr>`;

    // Mobile Card
    mobileHtml += `
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-3 flex items-center justify-between cursor-pointer bg-slate-50/50" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <div class="flex items-center gap-3">
             <div class="font-bold text-slate-800 text-sm">${c.claimId}</div>
             <div class="text-xs text-slate-500">${new Date(c.timestamp).toLocaleDateString()}</div>
          </div>
          <div class="flex items-center gap-2">
             <span class="${statusInfo.class} px-2 py-0.5 rounded-full text-[10px] font-medium">${c.status}</span>
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
        
        <div class="hidden p-3 border-t border-slate-100 space-y-3">
          <div class="flex justify-between items-center">
             <div class="text-xs text-slate-400">Amount</div>
             <div class="text-lg font-bold text-slate-900">₹${c.amount}</div>
          </div>
          <div class="flex justify-between items-center">
             <div class="text-xs text-slate-400">Actions</div>
             <div class="flex gap-3 items-center">
             ${c.status === "Submitted" || c.status === "Approved" ? Utils.getSlaBadge(Utils.calculateDaysApproved(c.timestamp, c.status)) : ''}
             ${c.receiptUrl ? `<button onclick="openReceiptModal('${c.receiptUrl}')" class="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Receipt</button>` : ''}
             </div>
          </div>
        </div>
      </div>
    `;
  });
  desktopHtml += "</tbody></table></div>";
  mobileHtml += "</div>";

  output.innerHTML = desktopHtml + mobileHtml;

  if (totalPages > 1) {
    const paginationHtml = `<div class="flex justify-between items-center p-4 border-t border-slate-100 bg-slate-50 mt-4 rounded-b-xl">
        <span class="text-xs md:text-sm text-slate-500">Page ${page} of ${totalPages}</span>
        <div class="flex gap-2">
          <button onclick="renderClaims(null, ${page - 1})" ${page === 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"' : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'} >Previous</button>
          <button onclick="renderClaims(null, ${page + 1})" ${page === totalPages ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs md:text-sm"' : 'class="px-3 py-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-indigo-600 text-xs md:text-sm transition active:scale-95"'} >Next</button>
        </div></div>`;
    output.insertAdjacentHTML('beforeend', paginationHtml);
  }
  output.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyUserFilter() {
  const status = document.getElementById("userStatusFilter").value;
  let filtered = State.user.claims;
  if (status) filtered = State.user.claims.filter((c) => c.status === status);
  renderClaims(filtered, 1);
}

function sortClaims(field) {
  if (!State.user.claims || State.user.claims.length === 0) return;
  if (State.user.sort.field === field) State.user.sort.direction = State.user.sort.direction === "asc" ? "desc" : "asc";
  else { State.user.sort.field = field; State.user.sort.direction = "desc"; }
  const dir = State.user.sort.direction === "asc" ? 1 : -1;
  State.user.claims.sort((a, b) => field === "date" ? dir * (new Date(a.timestamp || 0) - new Date(b.timestamp || 0)) : field === "claimId" ? dir * a.claimId.localeCompare(b.claimId) : 0);
  applyUserFilter();
}

function clearUserFilters() {
  document.getElementById("userStatusFilter").value = "";
  document.getElementById("searchValue").value = "";
  State.user.sort = { field: null, direction: "asc" };
  State.user.claims = [];
  State.user.filteredClaims = [];
  document.getElementById("output").innerHTML = `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
      <h3 class="text-lg font-semibold text-slate-800 mb-2">Ready to Search</h3>
      <p class="text-slate-500 mb-6 max-w-sm">Enter your email address or claim ID above to view the status of your reimbursement requests.</p>
    </div>`;
}