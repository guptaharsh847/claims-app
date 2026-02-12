/* ======================================================
   PATH VALIDATION
====================================================== */
(function validatePath() {
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1);

  const allowedPages = [
    "",
    "index.html",
    "login.html",
    "admin.html",
    "manage-users.html",
    "add-user.html",
    "analytics.html",
    "claim.html",
    "status.html",
    "404.html"
  ];

  if (!allowedPages.includes(page)) {
    window.location.replace("404.html");
  }
})();

const Utils = {
  getDecodedRole: () => {
    const r = localStorage.getItem("role");
    if (r === CONFIG.ROLES.ADMIN) return "ADMIN";
    if (r === CONFIG.ROLES.USER) return "USER";
    if (r === CONFIG.ROLES.SUPER_ADMIN) return "SUPER_ADMIN";
    return null;
  },

  setEncodedRole: (plainRole) => {
    if (plainRole === "ADMIN") localStorage.setItem("role", CONFIG.ROLES.ADMIN);
    else if (plainRole === "USER")
      localStorage.setItem("role", CONFIG.ROLES.USER);
    else if (plainRole === "SUPER_ADMIN")
      localStorage.setItem("role", CONFIG.ROLES.SUPER_ADMIN);
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
      Submitted: {
        class: "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm",
        tooltip: "Waiting for admin review",
      },
      Approved: {
        class: "bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm",
        tooltip: "Approved by Admin Payment Pending",
      },
      Reimbursed: {
        class: "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm",
        tooltip: "Payment processed",
      },
      Declined: {
        class: "bg-red-50 text-red-700 border border-red-200 shadow-sm",
        tooltip: "Rejected by admin",
      },
    };
    return map[status] || { class: "bg-slate-100 text-slate-600", tooltip: "" };
  },

  getSlaBadge: (days) => {
    if (days === 0)
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">Today</span>`;
    if (days <= 5)
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">${days} days</span>`;
    if (days <= 10)
      return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">${days} days</span>`;
    return `<span class="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">${days} days</span>`;
  },

  readFileAsBase64: (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
  },

  parseClaimDate: (claimId) => {
    if (!claimId) return null;
    const parts = claimId.split("-");
    if (parts.length < 2) return null;
    const dateStr = parts[1];
    if (!dateStr || dateStr.length !== 8) return null;
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  },

  installPWA: async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    const btn = document.getElementById("btn-install");
    if (btn) btn.classList.add("hidden");
  },
};

/* UI Helpers */
window.alert = function (message, type = "success") {
  const existing = document.getElementById("custom-alert");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "custom-alert";
  overlay.className =
    "fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300 opacity-0";

  const isError = type === "error";
  const iconColor = isError ? "text-red-500 bg-red-50" : "text-emerald-500 bg-emerald-50";
  const btnColor = isError ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200";
  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
  const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;

  overlay.innerHTML = `
    <div class="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-all duration-300 border border-white/50 ring-1 ring-slate-900/5 text-center">
      <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl ${iconColor} mb-6 shadow-sm">
        ${isError ? errorIcon : checkIcon}
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2 tracking-tight">${isError ? "Error" : "Success"}</h3>
      <p class="text-slate-600 mb-8 leading-relaxed font-medium">${message}</p>
      <button onclick="document.getElementById('custom-alert').classList.add('opacity-0'); setTimeout(() => document.getElementById('custom-alert').remove(), 300);"
        class="w-full ${btnColor} text-white font-bold py-3.5 rounded-xl transition shadow-lg active:scale-95">Okay, Got it</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.classList.remove("opacity-0"); overlay.querySelector("div").classList.remove("scale-95"); overlay.querySelector("div").classList.add("scale-100"); });
};

function showConfirm(message, onConfirm, onCancel) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300 opacity-0";
  overlay.innerHTML = `
    <div class="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-all duration-300 border border-white/50 ring-1 ring-slate-900/5">
      <h3 class="text-lg font-bold text-slate-800 mb-2 tracking-tight">Confirm Action</h3>
      <p class="text-slate-600 mb-6 font-medium">${message}</p>
      <div class="flex justify-end gap-3">
        <button id="confirm-cancel" class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition active:scale-95">Cancel</button>
        <button id="confirm-yes" class="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition shadow-lg shadow-indigo-200 active:scale-95">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.classList.remove("opacity-0"); overlay.querySelector("div").classList.remove("scale-95"); overlay.querySelector("div").classList.add("scale-100"); });
  const close = () => { overlay.classList.add("opacity-0"); overlay.querySelector("div").classList.remove("scale-100"); overlay.querySelector("div").classList.add("scale-95"); setTimeout(() => overlay.remove(), 300); };
  overlay.querySelector("#confirm-cancel").onclick = () => { close(); if (onCancel) onCancel(); };
  overlay.querySelector("#confirm-yes").onclick = () => { close(); if (onConfirm) onConfirm(); };
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  const color = type === "error" ? "bg-red-600 shadow-red-200" : type === "warning" ? "bg-orange-500 shadow-orange-200" : "bg-slate-800 shadow-slate-300";
  toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] ${color} text-white px-6 py-3.5 rounded-2xl shadow-xl opacity-0 translate-y-4 transition-all duration-300 text-sm font-bold tracking-wide`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.remove("opacity-0", "translate-y-4"));
  setTimeout(() => { toast.classList.add("opacity-0", "translate-y-4"); setTimeout(() => toast.remove(), 300); }, 2500);
}

function copyClaimId(id) {
  navigator.clipboard.writeText(id);
  showToast("Claim ID copied: " + id);
}

function openReceiptModal(url) {
  let embedUrl = url;
  if (url.includes("drive.google.com") && url.includes("/view")) embedUrl = url.replace(/\/view.*/, "/preview");
  const overlay = document.createElement("div");
  overlay.id = "receipt-modal";
  overlay.className = "fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300 opacity-0";
  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col transform scale-95 transition-all duration-300 overflow-hidden">
      <div class="flex justify-between items-center p-4 border-b border-slate-100 bg-white z-20">
        <h3 class="text-lg font-bold text-slate-800">Receipt Preview</h3>
        <div class="flex gap-3">
            <a href="${url}" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-1 hover:underline">Open in New Tab <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
            <button onclick="closeReceiptModal()" class="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>
      <div class="flex-1 bg-slate-50 relative"><div class="absolute inset-0 flex items-center justify-center z-0"><div class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div></div><iframe src="${embedUrl}" class="w-full h-full relative z-10 bg-white" allow="autoplay"></iframe></div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.classList.remove("opacity-0"); overlay.querySelector("div").classList.remove("scale-95"); overlay.querySelector("div").classList.add("scale-100"); });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeReceiptModal(); });
}

function closeReceiptModal() {
  const overlay = document.getElementById("receipt-modal");
  if (overlay) { overlay.classList.add("opacity-0"); overlay.querySelector("div").classList.remove("scale-100"); overlay.querySelector("div").classList.add("scale-95"); setTimeout(() => overlay.remove(), 200); }
}

/* PWA Service Worker Registration */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

/* PWA Install Prompt Listener */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("btn-install");
  if (btn) btn.classList.remove("hidden");
});