/**
 * End-to-end API test: health → login → user-data
 * Usage: node scripts/test-api.mjs https://your-app.vercel.app
 */
const base = (process.argv[2] || "").replace(/\/$/, "");
const mobile = process.argv[3] || "8290656032";

if (!base) {
  console.error("Usage: node scripts/test-api.mjs <BASE_URL> [mobile]");
  process.exit(1);
}

async function req(path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  let body;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { _raw: text.slice(0, 200) };
  }
  return { url, status: res.status, ok: res.ok, body };
}

function pass(label, detail = "") {
  console.log(`✓ ${label}${detail ? `: ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.log(`✗ ${label}${detail ? `: ${detail}` : ""}`);
}

console.log(`\nTesting ${base} (mobile ${mobile})\n`);

// 1. Health
const health = await req("/api/health");
if (health.ok) {
  const h = health.body;
  pass("GET /api/health", JSON.stringify(h));
  if (h.mongoConfigured && !h.mongoConnected) {
    fail("MongoDB ping", h.mongoError || "mongoConnected is false");
  }
  if (!h.jwtConfigured) {
    fail("JWT_SECRET", "missing or shorter than 16 characters");
  }
} else {
  fail("GET /api/health", `${health.status} ${JSON.stringify(health.body)}`);
}

// 2. Login
const login = await req("/api/login", {
  method: "POST",
  body: JSON.stringify({ mobile }),
});
let token = null;
if (login.ok && login.body.token) {
  token = login.body.token;
  pass("POST /api/login", `token length ${token.length}`);
} else {
  fail("POST /api/login", `${login.status} ${JSON.stringify(login.body)}`);
  console.log("\nDone (login blocked further steps).\n");
  process.exit(1);
}

// 3. Fetch user data
const data = await req("/api/user-data", {
  headers: { Authorization: `Bearer ${token}` },
});
if (data.ok && Array.isArray(data.body.connections)) {
  pass(
    "GET /api/user-data",
    `${data.body.connections.length} connections`
  );
} else {
  fail("GET /api/user-data", `${data.status} ${JSON.stringify(data.body)}`);
}

// 4. Save user data (minimal)
const save = await req("/api/user-data", {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    profile: data.body.profile || { name: "Test" },
    connections: data.body.connections || [],
    lastImportedAt: data.body.lastImportedAt ?? null,
  }),
});
if (save.ok) {
  pass("PUT /api/user-data", JSON.stringify(save.body));
} else {
  fail("PUT /api/user-data", `${save.status} ${JSON.stringify(save.body)}`);
}

console.log("\nDone.\n");
