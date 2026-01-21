const CONFIG = {
  API_URL:
  " https://script.google.com/macros/s/AKfycbyVPFZVrOlOUilnOMHigBA93vlrMIZq-kuuKw4LE7RyVVr_bDX5ICRgYs3OQJ319RVR/exec",
  // "https://script.google.com/macros/s/AKfycbwaXAA-wI-8h7iG29y5j31eYC1Xv_lDeCWl9FIkZDLP6ntCZfAgNhPDS_kkZXJIlVfQ/exec",
  ROLES: {
    ADMIN: "X9fK2pL5mQ8jR3t",
    USER: "B2vN9kM4lP7oJ5h",
    SUPER_ADMIN: "Z8xL1mP9qR4tK7w",
  },
  SUPER_ADMIN: "919893412481",
  PAGINATION: {
    USERS: 10,
    CLAIMS: 15,
  },
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

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