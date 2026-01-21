let allClaims = [];
let statusChartInstance = null;
let trendChartInstance = null;

async function initAnalytics() {
  const loading = document.getElementById("loading");
  const content = document.getElementById("analytics-content");

  try {
    const data = await Api.get({ action: "adminClaims" });
    allClaims = data || [];

    loading.classList.add("hidden");
    content.classList.remove("hidden");

    updateAnalytics();
  } catch (err) {
    loading.innerHTML = '<p class="text-red-500">Failed to load analytics data.</p>';
  }
}

function filterClaimsByDate(claims, range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return claims.filter(c => {
    const date = Utils.parseClaimDate(c.claimId);
    if (!date) return false; // Exclude claims with invalid ID formats

    switch (range) {
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return date >= sevenDaysAgo;

      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return date >= thirtyDaysAgo;

      case "thisMonth":
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return date >= lastMonth && date <= endLastMonth;

      case "thisYear":
        return date.getFullYear() === today.getFullYear();

      case "lastYear":
        return date.getFullYear() === today.getFullYear() - 1;

      case "all":
      default:
        return true;
    }
  });
}

function updateAnalytics() {
  const range = document.getElementById("dateRange").value;
  const filtered = filterClaimsByDate(allClaims, range);

  updateKPIs(filtered);
  renderStatusChart(filtered);
  renderTrendChart(filtered, range);
}

function updateKPIs(claims) {
  const total = claims.length;
  const amount = claims.reduce((sum, c) => sum + (parseFloat(String(c.amount).replace(/,/g, '')) || 0), 0);

  const approved = claims.filter(c => c.status === "Approved" || c.status === "Reimbursed").length;
  const pending = claims.filter(c => c.status === "Submitted").length;

  const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-amount").textContent = "₹" + amount.toLocaleString();
  document.getElementById("kpi-rate").textContent = rate + "%";
  document.getElementById("kpi-pending").textContent = pending;
}

function renderStatusChart(claims) {
  const ctx = document.getElementById("statusChart");
  const counts = { Submitted: 0, Approved: 0, Declined: 0, Reimbursed: 0 };

  claims.forEach(c => {
    if (counts[c.status] !== undefined) counts[c.status]++;
  });

  if (statusChartInstance) statusChartInstance.destroy();

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#3b82f6', '#eab308', '#ef4444', '#22c55e'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function renderTrendChart(claims, range) {
  const ctx = document.getElementById("trendChart");

  // Group by date
  const grouped = {};
  claims.forEach(c => {
    const date = Utils.parseClaimDate(c.claimId);
    if (!date) return;
    // Format: MMM DD for short ranges, MMM YYYY for long ranges
    const key = range === 'thisYear' || range === 'lastYear' || range === 'all'
      ? date.toLocaleString('default', { month: 'short', year: 'numeric' })
      : date.toLocaleString('default', { month: 'short', day: 'numeric' });

    grouped[key] = (grouped[key] || 0) + 1;
  });

  // Sort keys chronologically (simple approach for this context)
  // For robust sorting, we'd map keys back to timestamps, but object keys order is insertion-based mostly.
  // Let's rely on the fact that we process filtered claims. Ideally, sort claims by date first.
  claims.sort((a, b) => {
    const dA = Utils.parseClaimDate(a.claimId) || new Date(0);
    const dB = Utils.parseClaimDate(b.claimId) || new Date(0);
    return dA - dB;
  });

  // Re-group sorted
  const sortedGrouped = {};
  claims.forEach(c => {
    const date = Utils.parseClaimDate(c.claimId);
    if (!date) return;
    const key = range === 'thisYear' || range === 'lastYear' || range === 'all'
      ? date.toLocaleString('default', { month: 'short', year: 'numeric' })
      : date.toLocaleString('default', { month: 'short', day: 'numeric' });
    sortedGrouped[key] = (sortedGrouped[key] || 0) + 1;
  });

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Object.keys(sortedGrouped),
      datasets: [{
        label: 'Claims Submitted',
        data: Object.values(sortedGrouped),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// Initialize on load
initAnalytics();