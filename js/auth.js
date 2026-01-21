async function login() {
  const mobile = document.getElementById("mobile").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  if (!/^\d{10}$/.test(mobile)) {
    msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
    msg.textContent = "Please enter a valid 10-digit mobile number";
    return;
  }

  msg.className = "mt-4 text-center text-sm font-medium text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg animate-pulse";
  msg.textContent = "Verifying credentials...";

  try {
    const data = await Api.post({ action: "login", mobile, password });

    if (data.status === "success" && data.userStatus === "ACTIVE") {
      msg.className = "mt-4 text-center text-sm font-medium text-green-600 bg-green-50 py-2 px-4 rounded-lg";
      msg.textContent = "Success! Redirecting...";
      Utils.setEncodedRole(data.role);
      localStorage.setItem("userMobile", mobile);
      localStorage.setItem("loginTime", Date.now());
      setTimeout(() => {
        window.location.href = (data.role === "ADMIN" || data.role === "SUPER_ADMIN") ? "admin.html" : "claim.html";
      }, 800);
    } else if (data.status === "success" && data.userStatus !== "ACTIVE") {
      msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
      msg.innerHTML = "Your account has been temporarily disabled.<br><span class='text-xs text-red-500 mt-1 block font-normal'>Contact admin for more details</span>";
    } else {
      msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
      msg.innerHTML = "Invalid credentials.<br><span class='text-xs text-red-500 mt-1 block font-normal'>Contact administrator for credentials</span>";
    }
  } catch {
    msg.className = "mt-4 text-center text-sm font-medium text-red-600 bg-red-50 py-2 px-4 rounded-lg border border-red-100";
    msg.textContent = "Connection failed. Please try again.";
  }
}

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

  if (!/^\d{10}$/.test(mobile)) {
    msg.textContent = "Please enter a valid 10-digit mobile number";
    msg.className = "mt-4 text-center text-sm text-red-500";
    return;
  }

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
    const data = await Api.post({ action: "resetPassword", mobile, otp, newPassword });
    if (data.status === "success") {
      msg.textContent = "Password updated! Redirecting to login...";
      msg.className = "mt-4 text-center text-sm text-green-600";
      setTimeout(() => showLogin(), 2000);
    } else {
      msg.textContent = data.message || "Invalid OTP";
      msg.className = "mt-4 text-center text-sm text-red-500";
    }
  } catch (err) { msg.textContent = "Error updating password"; msg.className = "mt-4 text-center text-sm text-red-500"; }
}

function checkSession() {
  const loginTime = localStorage.getItem("loginTime");
  const role = Utils.getDecodedRole();
  if (role && loginTime) {
    if (Date.now() - parseInt(loginTime) > CONFIG.SESSION_TIMEOUT) {
      localStorage.clear();
      if (!window.location.href.includes("login.html") && !window.location.href.includes("index.html")) {
        alert("Session expired. Please login again.", "error");
        
        // Determine correct path to login based on current location
        setTimeout(() => (window.location.href = "login.html"), 2000);
      }
    } else { localStorage.setItem("loginTime", Date.now()); }
  }
}
checkSession();