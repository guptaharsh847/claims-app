const API_URL =
  "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec";

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

    const formData = new FormData(form);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      result.textContent = await res.text();

      form.reset();
      if (fileNameEl) fileNameEl.textContent = "";

    } catch {
      result.textContent = "Submission failed";
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

  } catch (err) {
     output.innerHTML =
    `<pre class="text-red-600">${err.message}</pre>`;
  }
}
// https://docs.google.com/forms/d/e/1FAIpQLSdTm6XGdp75vOfa1Z8VgYV1sg8PXnVTHeiw6rng9mRHhZAemQ/viewform?usp=pp_url&entry.1534879107=CLM-20251212-2020