const Api = {
  get: async (params = {}) => {
    const url = new URL(CONFIG.API_URL);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );
    const res = await fetch(url);
    return res.json();
  },

  post: async (body) => {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return JSON.parse(text); } 
    catch { return text; }
  },
};