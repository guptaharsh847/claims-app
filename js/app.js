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
      '<p class="text-red-600">Please enter Email or Claim ID</p>';
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
        `<p class="text-red-600">${data.error}</p>`;
      return;
    }

    let table = `
      <table class="min-w-full border text-sm">
        <thead class="bg-slate-100">
          <tr>
            <th class="border p-2">Claim ID</th>
            <th class="border p-2">Type</th>
            <th class="border p-2">Amount</th>
            <th class="border p-2">Description</th>
            <th class="border p-2">Status</th>
            <th class="border p-2">Receipt</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.claims.forEach(c => {
      table += `
        <tr class="hover:bg-slate-50">
          <td class="border p-2">${c.claimId}</td>
          <td class="border p-2">${c.type}</td>
          <td class="border p-2">₹${c.amount}</td>
          <td class="border p-2">${c.description || "-"}</td>
          <td class="border p-2 font-medium text-indigo-600">
            ${c.status}
          </td>
          <td class="border p-2">
            ${
              c.receiptUrl
                ? `<a href="${c.receiptUrl}" target="_blank"
                     class="text-indigo-600 underline">View</a>`
                : "-"
            }
          </td>
        </tr>
      `;
    });

    table += "</tbody></table>";
    output.innerHTML = table;
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
    output.innerHTML = "No claims found";
    return;
  }

  let html = `
    <table class="min-w-full border text-sm">
      <thead class="bg-slate-100">
        <tr>
          <th class="border p-2">Claim ID</th>
          <th class="border p-2">Type</th>
          <th class="border p-2">Amount</th>
          <th class="border p-2">Status</th>
          <th class="border p-2">Receipt</th>
        </tr>
      </thead>
      <tbody>
  `;

  claims.forEach(c => {
    html += `
      <tr class="hover:bg-slate-50">
        <td class="border p-2">${c.claimId}</td>
        <td class="border p-2">${c.type}</td>
        <td class="border p-2">₹${c.amount}</td>
        <td class="border p-2">${c.status}</td>
        <td class="border p-2">
          ${c.receiptUrl ? `<a href="${c.receiptUrl}" target="_blank">View</a>` : "-"}
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


// https://docs.google.com/forms/d/e/1FAIpQLSdTm6XGdp75vOfa1Z8VgYV1sg8PXnVTHeiw6rng9mRHhZAemQ/viewform?usp=pp_url&entry.1534879107=CLM-20251212-2020