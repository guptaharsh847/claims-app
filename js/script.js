// const API_URL = "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec";
const API_URL =
  "https://script.google.com/macros/s/AKfycbzfpp0Eim_0fJEFXT5oTdyQilQfaNPH3QjxCQK852yePJKqII0fVsBvkE54dfLf2A0u/exec";

document.getElementById("claimForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  fetch(API_URL, {
    method: "POST",
    body: form,
  })
    .then((res) => res.text())
    .then((msg) => (document.getElementById("result").innerText = msg));
});

function searchClaim() {
  const value = document.getElementById("searchValue").value;
  fetch(`${API_URL}?search=${value}`)
    .then((res) => res.text())
    .then((data) => (document.getElementById("output").innerText = data));
}
