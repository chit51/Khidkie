require("dotenv").config();
const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname)));

const upload = multer({ dest: "uploads/" });

const {
  MONGO_URI,
  PORT = 5000,
  ADMIN_PASSWORD,
  ADMIN_TOKEN_SECRET
} = process.env;

if (!MONGO_URI) throw new Error("Missing MONGO_URI in environment.");
if (!ADMIN_PASSWORD) throw new Error("Missing ADMIN_PASSWORD in environment.");
if (!ADMIN_TOKEN_SECRET) throw new Error("Missing ADMIN_TOKEN_SECRET in environment.");

mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const stringId = () => crypto.randomBytes(12).toString("hex");

function cleanString(value, max = 300) {
  const raw = String(value || "");
  const noControl = raw.replace(/[\u0000-\u001F\u007F]/g, "");
  const noTags = noControl.replace(/[<>]/g, "");
  return noTags.trim().slice(0, max);
}
function cleanNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}
function cleanBoolean(value, defaultValue = false) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return defaultValue;
}
function isSafeId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || ""));
}

const JobSchema = new mongoose.Schema(
  {
    _id: { type: String, default: stringId },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    department: { type: String, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 5000 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

const ApplicationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: stringId },
    name: { type: String, trim: true, maxlength: 180 },
    email: { type: String, trim: true, lowercase: true, maxlength: 180 },
    phone: { type: String, trim: true, maxlength: 40 },
    jobId: { type: String, trim: true, maxlength: 120 },
    status: { type: String, default: "Applied", maxlength: 60 },
    resume: { type: String, default: "", maxlength: 500 },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, versionKey: false }
);

const ProductSchema = new mongoose.Schema(
  {
    _id: { type: String, default: stringId },
    name: { type: String, required: true, trim: true, maxlength: 220 },
    price: { type: Number, default: 0, min: 0, max: 99999999 },
    size: { type: String, trim: true, maxlength: 100 },
    weight: { type: Number, default: 0, min: 0, max: 99999 },
    die: { type: String, trim: true, maxlength: 100 },
    series: { type: String, trim: true, maxlength: 100 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

const HardwareSchema = new mongoose.Schema(
  {
    _id: { type: String, default: stringId },
    name: { type: String, required: true, trim: true, maxlength: 220 },
    rate: { type: Number, default: 0, min: 0, max: 99999999 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

const QuoteSchema = new mongoose.Schema(
  {
    _id: { type: String, default: stringId },
    quoteId: { type: String, required: true, unique: true, index: true, maxlength: 40 },
    clientName: { type: String, required: true, trim: true, maxlength: 220 },
    quotationName: { type: String, required: true, trim: true, maxlength: 220 },
    cart: { type: Array, default: [] },
    hwCart: { type: Array, default: [] },
    otherCharges: { type: mongoose.Schema.Types.Mixed, default: {} },
    totals: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: {
      ip: { type: String, default: "", maxlength: 200 },
      userAgent: { type: String, default: "", maxlength: 500 },
      referrer: { type: String, default: "", maxlength: 500 }
    }
  },
  { timestamps: true, versionKey: false }
);

const Job = mongoose.model("Job", JobSchema);
const Application = mongoose.model("Application", ApplicationSchema);
const Product = mongoose.model("Product", ProductSchema);
const Hardware = mongoose.model("Hardware", HardwareSchema);
const Quote = mongoose.model("Quote", QuoteSchema);

async function generateQuoteId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  for (let i = 0; i < 12; i += 1) {
    const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
    const quoteId = `Q-${y}${m}${d}-${rand}`;
    const exists = await Quote.exists({ quoteId });
    if (!exists) return quoteId;
  }
  throw new Error("Unable to generate unique quote ID.");
}

function base64urlEncode(buf) {
  return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function base64urlDecodeToString(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}
function signAdminToken(payload) {
  const jsonB64 = base64urlEncode(JSON.stringify(payload));
  const sig = base64urlEncode(crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(jsonB64).digest());
  return `${jsonB64}.${sig}`;
}
function verifyAdminToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) return { ok: false, error: "Invalid token" };
  const [jsonB64, sig] = parts;
  const expected = base64urlEncode(crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(jsonB64).digest());
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { ok: false, error: "Invalid token" };
  let payload;
  try {
    payload = JSON.parse(base64urlDecodeToString(jsonB64));
  } catch {
    return { ok: false, error: "Invalid token" };
  }
  if (payload?.exp && Date.now() > payload.exp) return { ok: false, error: "Token expired" };
  return { ok: true, payload };
}
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: "Missing admin token" });
  const v = verifyAdminToken(m[1]);
  if (!v.ok) return res.status(401).json({ error: v.error || "Unauthorized" });
  req.admin = v.payload;
  next();
}

function sanitizeQuotePayload(body) {
  const clientName = cleanString(body.clientName, 220);
  const quotationName = cleanString(body.quotationName, 220);
  if (!clientName) return { error: "clientName is required" };
  if (!quotationName) return { error: "quotationName is required" };

  const rawCart = Array.isArray(body.cart) ? body.cart : [];
  const rawHw = Array.isArray(body.hwCart) ? body.hwCart : [];
  const cart = rawCart.slice(0, 1000).map((i) => ({
    cartItemId: cleanString(i?.cartItemId, 120),
    name: cleanString(i?.name, 220),
    dieNo: cleanString(i?.dieNo, 120),
    length: cleanString(i?.length, 80),
    qty: cleanNumber(i?.qty, 0, 100000) || 0,
    weightPerPiece: cleanNumber(i?.weightPerPiece, 0, 100000) || 0,
    totalWeight: cleanNumber(i?.totalWeight, 0, 100000000) || 0
  }));
  const hwCart = rawHw.slice(0, 1000).map((i) => ({
    name: cleanString(i?.name, 220),
    qty: cleanNumber(i?.qty, 0, 100000) || 0,
    price: cleanNumber(i?.price, 0, 100000000) || 0
  }));

  const surfaceType = cleanString(body?.otherCharges?.surfaceType, 80);
  const otherCharges = {
    surfaceType: surfaceType || "Powder Coating",
    surfaceAmount: cleanNumber(body?.otherCharges?.surfaceAmount, 0, 100000000) || 0,
    packaging: cleanNumber(body?.otherCharges?.packaging, 0, 100000000) || 0,
    transport: cleanNumber(body?.otherCharges?.transport, 0, 100000000) || 0
  };

  const totals = {
    totalWeight: cleanNumber(body?.totals?.totalWeight, 0, 100000000) || 0,
    pricePerKg: cleanNumber(body?.totals?.pricePerKg, 0, 100000000) || 0,
    priceWithGST: cleanNumber(body?.totals?.priceWithGST, 0, 100000000) || 0,
    profileCost: cleanNumber(body?.totals?.profileCost, 0, 100000000000) || 0,
    hwTotalCost: cleanNumber(body?.totals?.hwTotalCost, 0, 100000000000) || 0,
    totalOtherCharges: cleanNumber(body?.totals?.totalOtherCharges, 0, 100000000000) || 0,
    grandTotal: cleanNumber(body?.totals?.grandTotal, 0, 100000000000) || 0
  };

  return { value: { clientName, quotationName, cart, hwCart, otherCharges, totals } };
}

app.get("/jobs", async (req, res) => {
  const jobs = await Job.find({ enabled: true }).sort({ createdAt: -1 }).lean();
  res.json(jobs);
});

app.post("/apply", upload.single("resume"), async (req, res) => {
  const payload = {
    name: cleanString(req.body?.name, 180),
    email: cleanString(req.body?.email, 180).toLowerCase(),
    phone: cleanString(req.body?.phone, 40),
    jobId: cleanString(req.body?.jobId, 120),
    resume: req.file ? cleanString(req.file.path, 500) : "",
    status: "Applied",
    extra: {}
  };
  if (!payload.name || !payload.email) return res.status(400).json({ error: "name and email are required" });

  const safeBody = { ...req.body };
  delete safeBody.resume;
  payload.extra = safeBody;

  await Application.create(payload);
  res.json({ message: "Success" });
});

app.get("/api/products", async (req, res) => {
  const items = await Product.find({ enabled: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post("/api/quotes", async (req, res) => {
  const parsed = sanitizeQuotePayload(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const quoteId = await generateQuoteId();
  const quote = await Quote.create({
    _id: stringId(),
    quoteId,
    ...parsed.value,
    meta: {
      ip: cleanString(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "", 200),
      userAgent: cleanString(req.headers["user-agent"] || "", 500),
      referrer: cleanString(req.headers.referer || "", 500)
    }
  });

  res.json({ ok: true, id: quote._id, quoteId: quote.quoteId });
});

app.post("/api/admin/login", (req, res) => {
  const password = cleanString(req.body?.password, 200);
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid password" });
  const token = signAdminToken({ role: "admin", exp: Date.now() + 12 * 60 * 60 * 1000 });
  res.json({ token });
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  const items = await Product.find({}).sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const name = cleanString(req.body?.name, 220);
  const price = cleanNumber(req.body?.price, 0, 99999999);
  const size = cleanString(req.body?.size, 100);
  const weight = cleanNumber(req.body?.weight, 0, 99999);
  const die = cleanString(req.body?.die, 100);
  const series = cleanString(req.body?.series, 100);
  const enabled = cleanBoolean(req.body?.enabled, true);
  if (!name) return res.status(400).json({ error: "name is required" });

  const product = await Product.create({
    _id: stringId(),
    name,
    price: price ?? 0,
    size,
    weight: weight ?? 0,
    die,
    series,
    enabled
  });
  res.json(product);
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });
  const update = {};
  if (req.body?.name !== undefined) update.name = cleanString(req.body.name, 220);
  if (req.body?.price !== undefined) {
    const n = cleanNumber(req.body.price, 0, 99999999);
    if (n === null) return res.status(400).json({ error: "Invalid price" });
    update.price = n;
  }
  if (req.body?.size !== undefined) update.size = cleanString(req.body.size, 100);
  if (req.body?.weight !== undefined) {
    const n = cleanNumber(req.body.weight, 0, 99999);
    if (n === null) return res.status(400).json({ error: "Invalid weight" });
    update.weight = n;
  }
  if (req.body?.die !== undefined) update.die = cleanString(req.body.die, 100);
  if (req.body?.series !== undefined) update.series = cleanString(req.body.series, 100);
  if (req.body?.enabled !== undefined) update.enabled = cleanBoolean(req.body.enabled, true);

  const updated = await Product.findOneAndUpdate({ _id: id }, update, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });
  const out = await Product.deleteOne({ _id: id });
  if (!out.deletedCount) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.get("/api/hardware", async (req, res) => {
  const items = await Hardware.find({ enabled: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.get("/api/admin/hardware", requireAdmin, async (req, res) => {
  const items = await Hardware.find({}).sort({ createdAt: -1 }).lean();
  res.json(items);
});

app.post("/api/admin/hardware", requireAdmin, async (req, res) => {
  const name = cleanString(req.body?.name, 220);
  const rate = cleanNumber(req.body?.rate, 0, 99999999);
  const enabled = cleanBoolean(req.body?.enabled, true);
  if (!name) return res.status(400).json({ error: "name is required" });

  const h = await Hardware.create({
    _id: stringId(),
    name,
    rate: rate ?? 0,
    enabled
  });
  res.json(h);
});

app.patch("/api/admin/hardware/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });

  const update = {};
  if (req.body?.name !== undefined) update.name = cleanString(req.body.name, 220);
  if (req.body?.rate !== undefined) {
    const n = cleanNumber(req.body.rate, 0, 99999999);
    if (n === null) return res.status(400).json({ error: "Invalid rate" });
    update.rate = n;
  }
  if (req.body?.enabled !== undefined) update.enabled = cleanBoolean(req.body.enabled, true);

  const updated = await Hardware.findOneAndUpdate({ _id: id }, update, { new: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

app.delete("/api/admin/hardware/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });
  const out = await Hardware.deleteOne({ _id: id });
  if (!out.deletedCount) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.get("/api/admin/quotes", requireAdmin, async (req, res) => {
  const limitRaw = cleanNumber(req.query.limit, 1, 200);
  const limit = limitRaw || 50;
  const items = await Quote.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("_id quoteId clientName quotationName totals createdAt meta")
    .lean();
  res.json(items);
});

app.get("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });
  const q = await Quote.findOne({ _id: id }).lean();
  if (!q) return res.status(404).json({ error: "Not found" });
  res.json(q);
});

app.delete("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
  const id = cleanString(req.params.id, 40);
  if (!isSafeId(id)) return res.status(400).json({ error: "Invalid id" });
  const out = await Quote.deleteOne({ _id: id });
  if (!out.deletedCount) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON payload" });
  return res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
