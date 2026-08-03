// ฟังก์ชันสร้าง/วาดใบเสร็จ (ทั้งข้อความสำหรับแชร์ และรูปภาพผ่าน canvas)

import { HIRE_MODES, ORDER_TYPES, PAYMENT_STATUS, POKEMON_VARIANTS, TRADE_STATUS } from "./constants.js";
import { clamp0, fmtDate, fmtMoney, orderBalance } from "./utils.js";

export function buildReceiptLines(order, data, custName, accName) {
  const lines = [];
  lines.push(`🧾 ${data.settings.shopName}`);
  lines.push(`เลขที่: ${order.code || "-"}`);
  lines.push(`วันที่: ${fmtDate(order.createdAt)}`);
  lines.push(`--------------------------------`);
  lines.push(`ลูกค้า: ${custName(order.customerId)}`);
  if (order.customerGameId) lines.push(`ไอดีเกม: ${order.customerGameId}`);
  lines.push(`บริการ: ${ORDER_TYPES[order.type]?.label || "-"}`);
  if (order.type === "sell_pokemon") {
    const variants = (order.pokemonVariants || []).filter(v => v !== "normal").map(v => POKEMON_VARIANTS[v]?.label).filter(Boolean).join(", ");
    lines.push(`Pokémon: ${order.pokemonName || "-"}${variants ? " (" + variants + ")" : ""} x${order.quantity || 1}`);
    if (order.sourceAccountId) lines.push(`ไอดีต้นทาง: ${accName(order.sourceAccountId)}`);
  } else {
    lines.push(`โหมด: ${HIRE_MODES[order.hireMode]?.label || "-"}`);
    lines.push(`จำนวนที่ซื้อทั้งหมด: ${order.hireTotal || 0} ตัว/รอบ (ใช้ไปแล้ว ${order.hireUsed || 0})`);
    (order.rounds || []).forEach((r, i) => {
      lines.push(`  รอบ ${i + 1}: ${r.date ? fmtDate(r.date) : "ไม่ระบุวัน"} x${r.count} ${r.done ? "(เสร็จแล้ว)" : ""}`);
    });
  }
  lines.push(`--------------------------------`);
  lines.push(`ราคารวม: ฿${fmtMoney(order.price)}`);
  if (order.paymentStatus === "partial") {
    lines.push(`ชำระแล้ว: ฿${fmtMoney(order.paidAmount)}`);
    lines.push(`คงเหลือ: ฿${fmtMoney(orderBalance(order))}`);
  }
  lines.push(`สถานะชำระ: ${PAYMENT_STATUS[order.paymentStatus]?.label || "-"}`);
  if (order.type === "sell_pokemon") lines.push(`สถานะเทรด: ${TRADE_STATUS[order.tradeStatus]?.label || "-"}`);
  if (order.note) lines.push(`หมายเหตุ: ${order.note}`);
  if (order.proofImageDataUrl) lines.push(`📷 แนบรูปภาพกิจกรรม (ดูในแอป)`);
  if (order.cancelled) lines.push(`⚠️ ออเดอร์นี้ถูกยกเลิก`);
  return lines;
}

export function buildReceiptData(order, data, custName, accName) {
  const orderNoForCustomer = data.orders
    .filter(o => o.customerId === order.customerId)
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
    .findIndex(o => o.id === order.id) + 1;

  const items = [];
  if (order.type === "sell_pokemon") {
    const variants = (order.pokemonVariants || []).filter(v => v !== "normal").map(v => POKEMON_VARIANTS[v]?.label).filter(Boolean).join(", ");
    items.push({
      label: `${order.pokemonName || "Pokémon"}${variants ? " (" + variants + ")" : ""}`,
      sub: `x${order.quantity || 1}${order.sourceAccountId ? " · " + accName(order.sourceAccountId) : ""}`,
      price: order.price,
    });
  } else {
    items.push({
      label: ORDER_TYPES[order.type]?.label || "-",
      sub: `${HIRE_MODES[order.hireMode]?.label || ""} · ใช้ไป ${order.hireUsed || 0}/${order.hireTotal || 0}`,
      price: order.price,
    });
  }

  return {
    shopName: data.settings.shopName,
    logoDataUrl: data.settings.logoDataUrl || "",
    receiptBgDataUrl: data.settings.receiptBgDataUrl || "",
    code: order.code || "-",
    dateStr: fmtDate(order.createdAt),
    customerName: custName(order.customerId),
    customerGameId: order.customerGameId || "",
    orderNoForCustomer,
    serviceEmoji: ORDER_TYPES[order.type]?.emoji || "🧾",
    serviceLabel: ORDER_TYPES[order.type]?.label || "-",
    periodStr: order.type !== "sell_pokemon" && order.rounds && order.rounds.length
      ? `${fmtDate(order.rounds[0]?.date || order.createdAt)} — ${fmtDate(order.rounds[order.rounds.length - 1]?.date || order.createdAt)}`
      : (order.appointmentDate ? `นัด ${fmtDate(order.appointmentDate)}` : null),
    items,
    total: Number(order.price) || 0,
    paidAmount: order.paymentStatus === "paid" ? Number(order.price) || 0 : Number(order.paidAmount) || 0,
    balance: orderBalance(order),
    paymentStatus: PAYMENT_STATUS[order.paymentStatus]?.label || "-",
    paymentColor: PAYMENT_STATUS[order.paymentStatus]?.color || "#8b8da6",
    tradeStatus: order.type === "sell_pokemon" ? (TRADE_STATUS[order.tradeStatus]?.label || null) : null,
    note: order.note || "",
    proofImageDataUrl: order.proofImageDataUrl || "",
    cancelled: !!order.cancelled,
  };
}

export function loadImageAsync(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function downloadReceiptImage(order, data, custName, accName) {
  const r = buildReceiptData(order, data, custName, accName);
  const [logoImg, proofImg, bgImg] = await Promise.all([loadImageAsync(r.logoDataUrl), loadImageAsync(r.proofImageDataUrl), loadImageAsync(r.receiptBgDataUrl)]);

  // Make sure the custom webfonts are actually loaded before we draw text with them —
  // otherwise the canvas silently falls back to a generic system font and the exported
  // image looks noticeably plainer than the in-app preview.
  try {
    if (document.fonts) {
      await Promise.all([
        document.fonts.load("700 26px 'Baloo 2'"),
        document.fonts.load("700 15px 'Inter'"),
        document.fonts.load("600 12px 'Inter'"),
        document.fonts.load("500 13px 'JetBrains Mono'"),
        document.fonts.load("700 20px 'JetBrains Mono'"),
      ]);
      await document.fonts.ready;
    }
  } catch { /* best-effort — fall through and draw anyway */ }

  const width = 640;
  const pad = 28;
  let y = 0; // running cursor, computed as we lay things out top-to-bottom

  // Fixed display height for the attached proof photo — matches the on-screen preview's
  // maxHeight so the downloaded image looks the same as what the shop owner already sees.
  // The image is "cover"-fit (cropped, not squished) into this box, exactly like the
  // objectFit:"cover" <img> used in the in-app preview.
  const PROOF_H = 220;
  const proofH = proofImg ? PROOF_H : 0;
  const itemsH = 46 + r.items.length * 40 + 46; // header + rows + total row
  const noteH = r.note ? 40 : 0;
  const height = pad + 96 + 70 + (r.periodStr ? 26 : 0) + 16 + itemsH + 16 + (proofImg ? 30 + proofH + 16 : 0) + 40 + noteH + (r.cancelled ? 40 : 0) + 60 + pad;

  // Export at a higher pixel density so the PNG stays crisp on modern phone screens
  // instead of looking soft/blurry next to the in-app preview.
  const EXPORT_SCALE = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * EXPORT_SCALE);
  canvas.height = Math.round(height * EXPORT_SCALE);
  const ctx = canvas.getContext("2d");
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // background — either the user's uploaded photo (cover-fit, with a dark overlay so text stays
  // readable), or the plain gradient fallback
  roundRectPath(ctx, 0, 0, width, height, 22);
  if (bgImg) {
    ctx.save();
    ctx.clip();
    const s = Math.max(width / bgImg.width, height / bgImg.height);
    const dw = bgImg.width * s, dh = bgImg.height * s;
    ctx.drawImage(bgImg, (width - dw) / 2, (height - dh) / 2, dw, dh);
    const overlay = ctx.createLinearGradient(0, 0, width, height);
    overlay.addColorStop(0, "rgba(12,13,21,0.55)");
    overlay.addColorStop(1, "rgba(12,13,21,0.82)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#14151f");
    bgGrad.addColorStop(1, "#0c0d15");
    ctx.fillStyle = bgGrad;
    ctx.fill();
  }
  ctx.strokeStyle = "#2c2f46";
  ctx.lineWidth = 1;
  roundRectPath(ctx, 0.5, 0.5, width - 1, height - 1, 22);
  ctx.stroke();

  y = pad;

  // top pill badge
  ctx.font = "700 12px Inter, sans-serif";
  const pillText = `${r.shopName.toUpperCase()} · RECEIPT`;
  const pillW = ctx.measureText(pillText).width + 28;
  ctx.fillStyle = "rgba(255,203,5,0.14)";
  roundRectPath(ctx, pad, y, pillW, 26, 13);
  ctx.fill();
  ctx.fillStyle = "#ffcb05";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, pad + 14, y + 14);

  // logo circle top-right
  if (logoImg) {
    const s = 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - pad - s / 2, y + 13, s / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, width - pad - s, y - 7, s, s);
    ctx.restore();
  }

  y += 46;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f2f3f8";
  ctx.font = "700 26px 'Baloo 2', Inter, sans-serif";
  ctx.fillText(r.cancelled ? "ใบเสร็จ (ยกเลิกแล้ว)" : "ใบเสร็จ / สรุปออเดอร์", pad, y);

  y += 26;
  ctx.font = "500 13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#8b8da6";
  ctx.fillText(`เลขที่ ${r.code}  ·  ${r.dateStr}`, pad, y);

  y += 30;
  ctx.strokeStyle = "#2c2f46";
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(width - pad, y); ctx.stroke();
  y += 26;

  // customer row
  ctx.font = "700 15px Inter, sans-serif";
  ctx.fillStyle = "#f2f3f8";
  ctx.fillText(`${r.customerName}`, pad, y);
  ctx.font = "600 11px Inter, sans-serif";
  ctx.fillStyle = "#ffcb05";
  ctx.textAlign = "right";
  ctx.fillText(`ครั้งที่ ${r.orderNoForCustomer}`, width - pad, y);
  ctx.textAlign = "left";

  y += 22;
  ctx.font = "500 12px Inter, sans-serif";
  ctx.fillStyle = "#8b8da6";
  ctx.fillText(`${r.serviceEmoji} ${r.serviceLabel}${r.customerGameId ? "  ·  ไอดี " + r.customerGameId : ""}`, pad, y);

  if (r.periodStr) {
    y += 22;
    ctx.fillText(`🗓️ ${r.periodStr}`, pad, y);
  }

  y += 24;

  // items card
  const cardTop = y;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  roundRectPath(ctx, pad, cardTop, width - pad * 2, itemsH, 14);
  ctx.fill();
  ctx.strokeStyle = "#2c2f46";
  roundRectPath(ctx, pad, cardTop, width - pad * 2, itemsH, 14);
  ctx.stroke();

  let iy = cardTop + 26;
  r.items.forEach(it => {
    ctx.font = "700 13px Inter, sans-serif";
    ctx.fillStyle = "#f2f3f8";
    ctx.fillText(it.label, pad + 16, iy);
    ctx.textAlign = "right";
    ctx.font = "700 13px 'JetBrains Mono', monospace";
    ctx.fillText(`฿${fmtMoney(it.price)}`, width - pad - 16, iy);
    ctx.textAlign = "left";
    iy += 16;
    ctx.font = "500 11px Inter, sans-serif";
    ctx.fillStyle = "#8b8da6";
    ctx.fillText(it.sub, pad + 16, iy);
    iy += 24;
  });
  ctx.strokeStyle = "#2c2f46";
  ctx.beginPath(); ctx.moveTo(pad + 16, iy - 4); ctx.lineTo(width - pad - 16, iy - 4); ctx.stroke();
  iy += 20;
  ctx.font = "600 13px Inter, sans-serif";
  ctx.fillStyle = "#8b8da6";
  ctx.fillText("รวมเงิน", pad + 16, iy);
  ctx.textAlign = "right";
  ctx.font = "700 20px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffcb05";
  ctx.fillText(`฿${fmtMoney(r.total)}`, width - pad - 16, iy);
  ctx.textAlign = "left";

  y = cardTop + itemsH + 16;

  // activity image
  if (proofImg) {
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillStyle = "#8b8da6";
    ctx.fillText("รูปภาพกิจกรรม", pad, y);
    y += 16;
    const dw = width - pad * 2;
    const dh = proofH;
    // cover-fit: scale to fill the box completely and crop the overflow, so the photo
    // never gets stretched/squished — same visual result as the in-app objectFit:"cover" preview
    const s = Math.max(dw / proofImg.width, dh / proofImg.height);
    const sw = dw / s, sh = dh / s;
    const sx = (proofImg.width - sw) / 2, sy = (proofImg.height - sh) / 2;
    roundRectPath(ctx, pad, y, dw, dh, 12);
    ctx.save();
    ctx.clip();
    ctx.drawImage(proofImg, sx, sy, sw, sh, pad, y, dw, dh);
    ctx.restore();
    ctx.strokeStyle = "#2c2f46";
    roundRectPath(ctx, pad, y, dw, dh, 12);
    ctx.stroke();
    y += dh + 16;
  }

  // status badges
  ctx.font = "700 11px Inter, sans-serif";
  const badge = (text, color, x) => {
    const w = ctx.measureText(text).width + 22;
    ctx.fillStyle = color + "22";
    roundRectPath(ctx, x, y, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 11, y + 12);
    ctx.textBaseline = "alphabetic";
    return x + w + 8;
  };
  let bx = pad;
  bx = badge(r.paymentStatus, r.paymentColor, bx);
  if (r.tradeStatus) badge(r.tradeStatus, "#ffcb05", bx);
  y += 40;

  if (r.note) {
    ctx.font = "500 12px Inter, sans-serif";
    ctx.fillStyle = "#8b8da6";
    ctx.fillText(`หมายเหตุ: ${r.note}`, pad, y);
    y += 26;
  }

  if (r.cancelled) {
    ctx.fillStyle = "rgba(255,84,112,0.15)";
    roundRectPath(ctx, pad, y - 18, width - pad * 2, 32, 10);
    ctx.fill();
    ctx.fillStyle = "#ff5470";
    ctx.font = "700 12px Inter, sans-serif";
    ctx.fillText("⚠️ ออเดอร์นี้ถูกยกเลิกแล้ว", pad + 12, y + 3);
    y += 40;
  }

  // footer
  ctx.strokeStyle = "#2c2f46";
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(width - pad, y); ctx.stroke();
  y += 26;
  ctx.font = "600 12px Inter, sans-serif";
  ctx.fillStyle = "#8b8da6";
  ctx.fillText(`ขอบคุณที่ใช้บริการ ${r.shopName} 🐾`, pad, y);

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `receipt-${order.code || "order"}.png`; a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
  });
}

export function trashItemTitle(entry) {
  const p = entry.payload;
  if (entry.type === "order") return `ออเดอร์ ${p.code || ""} — ${ORDER_TYPES[p.type]?.label || p.type}`;
  return p.name || "(ไม่มีชื่อ)";
}

export function trashItemSub(entry) {
  const p = entry.payload;
  if (entry.type === "customer") return p.facebook ? `Facebook: ${p.facebook}` : "-";
  if (entry.type === "account") return `${(p.stock || []).length} รายการสต๊อกในไอดีนี้`;
  if (entry.type === "stock") return `จากไอดี: ${entry.meta?.accountName || "-"} · คงเหลือตอนลบ: ${clamp0(p.quantity)}`;
  if (entry.type === "order") return `฿${fmtMoney(p.price)}${p.cancelled ? " · (ยกเลิกอยู่แล้วตอนลบ)" : ""}`;
  return "";
}
