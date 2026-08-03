import { useState, useMemo } from "react";
import {
  Download,
  Ban,
  Copy,
} from "lucide-react";
import { fmtMoney } from "../utils.js";
import { buildReceiptLines, buildReceiptData, downloadReceiptImage } from "../receipt.js";
import Modal from "./Modal.jsx";
import ShopLogo from "./ShopLogo.jsx";

export default function ReceiptModal({ order, data, custName, accName, onClose, onToast }) {
  const lines = buildReceiptLines(order, data, custName, accName);
  const text = lines.join("\n");
  const r = useMemo(() => buildReceiptData(order, data, custName, accName), [order, data]);
  const [downloading, setDownloading] = useState(false);
  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      onToast("คัดลอกใบเสร็จแล้ว");
    } catch {
      onToast("คัดลอกไม่สำเร็จ");
    }
  }
  async function download() {
    setDownloading(true);
    try {
      await downloadReceiptImage(order, data, custName, accName);
    } finally {
      setDownloading(false);
    }
  }
  return (
    <Modal title="ใบเสร็จ / สรุปออเดอร์" onClose={onClose}>
      <div style={{
        background: r.receiptBgDataUrl
          ? `linear-gradient(165deg, rgba(12,13,21,0.55) 0%, rgba(12,13,21,0.82) 100%), url(${r.receiptBgDataUrl})`
          : "linear-gradient(165deg, #1b1d2a 0%, rgba(20,21,31,0.9) 100%)",
        backgroundSize: r.receiptBgDataUrl ? "cover" : undefined,
        backgroundPosition: r.receiptBgDataUrl ? "center" : undefined,
        border: "1px solid var(--border)", borderRadius: 18, padding: 18, marginBottom: 14,
      }}>
        <div className="pgs-row" style={{ marginBottom: 14 }}>
          <span className="pgs-badge" style={{ background: "rgba(255,203,5,0.14)", color: "var(--yellow)", fontSize: 10, letterSpacing: 0.5 }}>
            {r.shopName.toUpperCase()} · RECEIPT
          </span>
          <ShopLogo logoDataUrl={r.logoDataUrl} size={34} />
        </div>
        <div className="pgs-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          {r.cancelled ? "ใบเสร็จ (ยกเลิกแล้ว)" : "ใบเสร็จ / สรุปออเดอร์"}
        </div>
        <div className="pgs-mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>เลขที่ {r.code} · {r.dateStr}</div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 14 }}>
          <div className="pgs-row" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{r.customerName}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--yellow)" }}>ครั้งที่ {r.orderNoForCustomer}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {r.serviceEmoji} {r.serviceLabel}{r.customerGameId ? ` · ไอดี ${r.customerGameId}` : ""}
          </div>
          {r.periodStr && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>🗓️ {r.periodStr}</div>}
        </div>

        <div className="pgs-card" style={{ marginBottom: 14 }}>
          {r.items.map((it, i) => (
            <div key={i} className="pgs-row" style={{ alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{it.label}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{it.sub}</div>
              </div>
              <span className="pgs-mono" style={{ fontWeight: 700, fontSize: 13 }}>฿{fmtMoney(it.price)}</span>
            </div>
          ))}
          <div className="pgs-row" style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>รวมเงิน</span>
            <span className="pgs-mono pgs-display" style={{ fontWeight: 700, fontSize: 20, color: "var(--yellow)" }}>฿{fmtMoney(r.total)}</span>
          </div>
        </div>

        {r.proofImageDataUrl && (
          <div style={{ marginBottom: 14 }}>
            <div className="pgs-label" style={{ marginBottom: 8 }}>รูปภาพกิจกรรม</div>
            <img src={r.proofImageDataUrl} alt="รูปภาพกิจกรรม" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)" }} />
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: r.note ? 10 : 0 }}>
          <span className="pgs-badge" style={{ background: r.paymentColor + "22", color: r.paymentColor }}>{r.paymentStatus}</span>
          {r.tradeStatus && <span className="pgs-badge" style={{ background: "rgba(255,203,5,0.15)", color: "var(--yellow)" }}>{r.tradeStatus}</span>}
        </div>
        {r.note && <div style={{ fontSize: 12, color: "var(--muted)" }}>หมายเหตุ: {r.note}</div>}
        {r.cancelled && <div className="pgs-cancelbanner" style={{ marginTop: 10, marginBottom: 0 }}><Ban size={13} /> ออเดอร์นี้ถูกยกเลิกแล้ว</div>}

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 12, fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
          ขอบคุณที่ใช้บริการ {r.shopName} 🐾
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={copyText}><Copy size={14} /> คัดลอกข้อความ</button>
        <button className="pgs-btn pgs-btn-primary" style={{ flex: 1 }} disabled={downloading} onClick={download}><Download size={14} /> {downloading ? "กำลังสร้างรูป..." : "ดาวน์โหลดรูป"}</button>
      </div>
    </Modal>
  );
}
