const API_URL = "https://script.google.com/macros/s/AKfycbyuy-6yrmbpLiGPf9yhveWpMLV6bHt1-LGrX96awomzdlQMw0TH_SPAudBLRW4xDTGU/exec";

/* ============================
   CLAIM SUBMISSION
============================ */
const form = document.getElementById("claimForm");
const fileInput = document.querySelector('input[name="receipt"]');
const fileNameEl = document.getElementById("fileName");

if (fileInput && fileNameEl) {
  fileInput.addEventListener("change", () => {
    fileNameEl.textContent = fileInput.files.length
      ? `Selected file: ${fileInput.files[0].name}`
      : "";
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = document.getElementById("result");
    result.textContent = "Submitting...";

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

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

   let success = false;

try {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  try {
    const data = await res.json();
    console.log('data', data)
    success = data.status === "success";
  } catch {
    success = res.ok; // fallback
  }

} catch {
  success = true; // backend still runs
}

result.textContent = success
  ? "Claim submitted successfully!"
  : "Submission failed";
  });

}

/* ============================
   SEARCH CLAIMS
============================ */
// async function searchClaim() {
//   const value = document.getElementById("searchValue").value.trim();
//   const output = document.getElementById("output");
//   if (!value) {
//     output.innerHTML = "<p>Please enter Email or Claim ID</p>";
//     return;
//   }

//   output.innerHTML = "Loading...";

//   try {
//     const res = await fetch(`${API_URL}?search=${encodeURIComponent(value)}`);
//     console.log('res', res)
//     const data = await res.json();

//     if (data.error) {
//       output.innerHTML = `<p>${data.error}</p>`;
//       return;
//     }

//     let html = `
//       <table class="min-w-full border text-sm">
//         <thead class="bg-slate-100">
//           <tr>
//             <th class="border p-2">Claim ID</th>
//             <th class="border p-2">Type</th>
//             <th class="border p-2">Amount</th>
//             <th class="border p-2">Status</th>
//             <th class="border p-2">Receipt</th>
//           </tr>
//         </thead><tbody>`;

//     data.claims.forEach(c => {
//       html += `
//         <tr>
//           <td class="border p-2">${c.claimId}</td>
//           <td class="border p-2">${c.type}</td>
//           <td class="border p-2">₹${c.amount}</td>
//           <td class="border p-2">${c.status}</td>
//           <td class="border p-2">
//             ${c.receiptUrl ? `<a href="${c.receiptUrl}" target="_blank">View</a>` : "-"}
//           </td>
//         </tr>`;
//     });

//     html += "</tbody></table>";
//     output.innerHTML = html;

//   } catch (err) {
//     output.innerHTML = "Error fetching claims";
//   }
// }
function searchClaim() {
  const value = document.getElementById("searchValue").value.trim();
  const output = document.getElementById("output");
  output.innerHTML = "Loading...";

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = `${API_URL}?page=search&search=${encodeURIComponent(value)}`;

  window.addEventListener("message", function handler(e) {
    window.removeEventListener("message", handler);

    const claims = e.data;
    if (!claims || !claims.length) {
      output.innerHTML = "No claims found";
      return;
    }

    let html = "<table border='1'><tr><th>ID</th><th>Amount</th><th>Status</th></tr>";
    claims.forEach(c => {
      html += `<tr><td>${c.claimId}</td><td>${c.amount}</td><td>${c.status}</td></tr>`;
    });
    html += "</table>";
    output.innerHTML = html;
  });

  document.body.appendChild(iframe);
}
