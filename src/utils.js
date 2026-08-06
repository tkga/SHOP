// ฟังก์ชันช่วยเหลือทั่วไป (format, generate id, จัดการ data/stock/trash ฯลฯ)

import { POKEMON_VARIANTS } from "./constants.js";

// รายการเริ่มต้นของ "ประเภท Pokémon" — ใช้ตอนสร้างร้านใหม่เท่านั้น หลังจากนี้ผู้ใช้
// แก้ไข/เพิ่ม/ลบเองได้ผ่าน data.pokemonVariants (ดู SettingsTab.jsx)
function defaultPokemonVariants() {
  return Object.entries(POKEMON_VARIANTS).map(([key, v]) => ({ key, label: v.label, emoji: v.emoji }));
}

export function emptyData() {
  return {
    settings: {
      shopName: "Pokémon GO Shop", createdAt: Date.now(), lastBackupAt: null, pin: "", pinQuestion: "", pinAnswer: "", logoDataUrl: "", receiptBgDataUrl: "",
      google: { clientId: "", email: "", spreadsheetId: "", folderId: "", autoSync: true, lastSyncAt: null },
    },
    customers: [],
    gameAccounts: [],
    orders: [],
    investmentHistory: [],
    manualTx: [],
    counters: { order: 0 },
    // ถังขยะ: ลูกค้า/ไอดี/สต๊อก/ออเดอร์ที่ "ลบ" จะมาพักที่นี่ก่อน (กู้คืนได้) แทนที่จะหายถาวรทันที
    trash: [],
    // ประวัติการเปลี่ยนแปลงจำนวนสต๊อกทุกครั้ง (ขาย/ยกเลิก/กู้คืน/แก้มือ) เรียงใหม่สุดก่อน
    stockMovements: [],
    // ประเภท Pokémon (ปกติ/Shiny/Shadow ฯลฯ) — แก้ไข/เพิ่ม/ลบเองได้จากหน้าตั้งค่า
    pokemonVariants: defaultPokemonVariants(),
  };
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function orderCodeFromCounter(n) {
  const letterIndex = Math.floor((n - 1) / 9999);
  const num = ((n - 1) % 9999) + 1;
  const letter = String.fromCharCode(97 + (letterIndex % 26)); // a-z, then wraps (practically never reached)
  return `${letter}${String(num).padStart(4, "0")}`;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  } catch { return d; }
}

export function daysBetween(a, b) {
  const A = new Date(a); const B = new Date(b);
  return Math.round((B - A) / 86400000);
}

export function clamp0(n) { return Math.max(0, Number(n) || 0); }

export function uniquePokemonNames(data) {
  const seen = new Map(); // lowercase -> first-seen original casing
  (data.gameAccounts || []).forEach(a => (a.stock || []).forEach(s => {
    const n = (s.name || "").trim();
    if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  }));
  (data.orders || []).forEach(o => {
    const n = (o.pokemonName || "").trim();
    if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "th"));
}

export function existingAccountNames(data) {
  const seen = new Map();
  (data.gameAccounts || []).forEach(a => {
    const n = (a.name || "").trim();
    if (n && !seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  });
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, "th"));
}

export function fileToLogoDataUrl(file, maxDim = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function fileToJpegDataUrl(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        // JPEG has no alpha channel — fill white first so transparent PNG/HEIC
        // screenshots don't turn black.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function applyAppIcon(logoDataUrl, shopName) {
  try {
    const setLink = (rel, href, extra = {}) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      Object.entries(extra).forEach(([k, v]) => link.setAttribute(k, v));
    };
    if (logoDataUrl) {
      setLink("icon", logoDataUrl);
      setLink("apple-touch-icon", logoDataUrl);
      const manifest = {
        name: shopName || "Pokémon GO Shop",
        short_name: (shopName || "PGS Shop").slice(0, 12),
        start_url: "./",
        display: "standalone",
        background_color: "#12131c",
        theme_color: "#12131c",
        icons: [
          { src: logoDataUrl, sizes: "192x192", type: "image/png" },
          { src: logoDataUrl, sizes: "512x512", type: "image/png" },
        ],
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
      setLink("manifest", URL.createObjectURL(blob));
    } else {
      setLink("manifest", "./manifest.json");
    }
  } catch (e) {
    console.error("applyAppIcon failed", e);
  }
}

export function orderBalance(o) {
  const price = Number(o.price) || 0;
  if (o.paymentStatus === "paid") return 0;
  if (o.paymentStatus === "partial") return clamp0(price - (Number(o.paidAmount) || 0));
  return price;
}

export function migrateData(parsed) {
  const d = { ...emptyData(), ...parsed };
  d.settings = { ...emptyData().settings, logoDataUrl: "", receiptBgDataUrl: "", ...(parsed.settings || {}) };
  d.settings.google = { ...emptyData().settings.google, ...(parsed.settings?.google || {}) };
  if (!Array.isArray(d.customers)) d.customers = [];
  d.customers = (d.customers || []).map(c => ({
    ...c,
    gameIds: c.gameIds && c.gameIds.length ? c.gameIds : [{ id: genId(), value: c.name || "" }],
  }));
  d.gameAccounts = (d.gameAccounts || []).map(a => ({
    ...a,
    stock: (a.stock || []).map(s => ({ lowStockThreshold: 2, variants: ["normal"], photoDataUrl: "", price: 0, ...s })),
  }));
  d.manualTx = (d.manualTx || []).map(t => ({
    ...t,
    accountId: t.accountId || "",
  }));
  d.orders = (d.orders || []).map(o => {
    const price = Number(o.price) || 0;
    return {
      ...o,
      paymentStatus: o.paymentStatus === "partial" || o.paymentStatus === "paid" ? o.paymentStatus : "pending",
      paidAmount: o.paymentStatus === "paid" ? price : clamp0(o.paidAmount),
      cancelled: !!o.cancelled,
      cancelledAt: o.cancelledAt || null,
      pokemonVariants: o.pokemonVariants || (o.type === "sell_pokemon" ? ["normal"] : []),
      stockItemId: o.stockItemId || null,
      // ราคาต่อตัวของสินค้าที่ขาย (แยกจาก "ราคารวม" ของทั้งออเดอร์) — ใช้อัปเดตราคาสินค้าในสต๊อก
      // เพื่อไปแสดงในหน้า catalog ของลูกค้า บันทึกไว้ในออเดอร์ด้วยเผื่อย้อนดูภายหลัง
      unitPrice: o.unitPrice != null ? clamp0(o.unitPrice) : 0,
      customerGameId: o.customerGameId || "",
      proofImageDataUrl: o.proofImageDataUrl || "",
      driveFileId: o.driveFileId || null,
      hireMode: o.hireMode || "anytime",
      rounds: o.rounds || [],
      hireTotal: o.hireTotal != null ? clamp0(o.hireTotal) : (o.type !== "sell_pokemon" ? (clamp0(o.quantity) || 1) : 0),
      hireUsed: clamp0(o.hireUsed) || 0,
      hireStatus: o.hireStatus === "done" ? "done" : "ongoing",
      cancelHistory: Array.isArray(o.cancelHistory) ? o.cancelHistory : [],
      // สำหรับออเดอร์ "จ้างฟามทั่วไป" — รายการที่ต้องฟาม และวันที่นัดฟาม (ไม่มีระบบนับจำนวน/รอบเหมือนตีบอส/เชิญตี)
      farmItems: o.farmItems || "",
      farmDate: o.farmDate || "",
    };
  });
  if (!Array.isArray(d.trash)) d.trash = [];
  if (!Array.isArray(d.stockMovements)) d.stockMovements = [];
  if (!Array.isArray(d.pokemonVariants) || d.pokemonVariants.length === 0) d.pokemonVariants = defaultPokemonVariants();
  return d;
}

// คืน "รายการ key ของประเภท Pokémon" ที่มีอยู่จริงในสต๊อกสำหรับชื่อนี้ (เทียบชื่อแบบไม่สนตัวพิมพ์เล็ก-ใหญ่/เว้นวรรค)
// ใช้กรองตัวเลือก "ประเภท Pokémon" ในฟอร์มออเดอร์ ไม่ให้เลือกประเภทที่ไม่มีของจริงในสต๊อก
// ถ้าไม่พบชื่อนี้ในสต๊อกเลย (เช่น ชื่อใหม่ที่ยังไม่เคยลงสต๊อก) จะคืน [] — ผู้เรียกควรจัดการโดยโชว์ทุกประเภทแทน
export function variantKeysForPokemonName(data, name) {
  const n = (name || "").trim().toLowerCase();
  if (!n) return [];
  const keys = new Set();
  (data.gameAccounts || []).forEach(a => (a.stock || []).forEach(s => {
    if ((s.name || "").trim().toLowerCase() === n) {
      (s.variants && s.variants.length ? s.variants : ["normal"]).forEach(v => keys.add(v));
    }
  }));
  return Array.from(keys);
}

// หา label ของประเภท Pokémon จาก key (เผื่อกรณีหาไม่เจอ เช่นถูกลบไปแล้ว จะโชว์ key แทน)
export function variantLabel(data, key) {
  const v = (data.pokemonVariants || []).find(x => x.key === key);
  return v ? v.label : key;
}

export function variantEmoji(data, key) {
  const v = (data.pokemonVariants || []).find(x => x.key === key);
  return v ? v.emoji : "";
}

// เช็คว่าประเภทนี้ถูกใช้อยู่ในออเดอร์ (ที่ไม่ถูกยกเลิก) หรือรายการสต๊อกอยู่หรือไม่ — ใช้กันการลบประเภทที่ยังมีของอยู่
export function isVariantInUse(data, key) {
  const inOrders = (data.orders || []).some(o => !o.cancelled && (o.pokemonVariants || []).includes(key));
  if (inOrders) return true;
  const inStock = (data.gameAccounts || []).some(a => (a.stock || []).some(s => (s.variants || []).includes(key)));
  return inStock;
}

// สร้าง key ใหม่จากชื่อที่กรอก (ตัวพิมพ์เล็ก, แทนที่อักขระพิเศษ, กันชนกับของเดิม)
export function genVariantKey(label, existingKeys) {
  const base = (label || "").trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "_").replace(/^_+|_+$/g, "") || "variant";
  let key = base;
  let i = 2;
  while ((existingKeys || []).includes(key)) key = `${base}_${i++}`;
  return key;
}

export function adjustStock(gameAccounts, accountId, stockItemId, delta) {
  if (!accountId || !stockItemId || !delta) return gameAccounts;
  return gameAccounts.map(a => {
    if (a.id !== accountId) return a;
    return {
      ...a,
      stock: (a.stock || []).map(s => s.id === stockItemId ? { ...s, quantity: clamp0((Number(s.quantity) || 0) + delta) } : s),
    };
  });
}

// อัปเดตราคาต่อตัวของ stock item ชิ้นหนึ่ง (เรียกตอนบันทึกออเดอร์ขายที่ล็อกสต๊อกไว้ + กรอกราคาต่อตัวมา)
// เพื่อให้หน้า catalog ของลูกค้า (อ่านจากชีต Stock) เห็นราคาล่าสุดที่เพิ่งขายจริง
export function updateStockPrice(gameAccounts, accountId, stockItemId, price) {
  if (!accountId || !stockItemId) return gameAccounts;
  return gameAccounts.map(a => {
    if (a.id !== accountId) return a;
    return {
      ...a,
      stock: (a.stock || []).map(s => s.id === stockItemId ? { ...s, price: clamp0(price) } : s),
    };
  });
}

export function pushTrash(trash, type, payload, meta = {}) {
  const entry = { id: genId(), type, deletedAt: new Date().toISOString(), payload, meta };
  return [entry, ...(trash || [])].slice(0, 500); // cap so it can't grow forever
}

export function pushStockMovement(stockMovements, entry) {
  const row = { id: genId(), date: new Date().toISOString(), ...entry };
  return [row, ...(stockMovements || [])].slice(0, 3000); // cap so it can't grow forever
}
