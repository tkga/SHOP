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

// ธีมสี "ใบเสนอราคา" ครีม-น้ำตาล ให้ตรงกับตัวที่วาดลง canvas ใน receipt.js
const THEME = {
  bg: "#FBF7EC",
  card: "#FFFFFF",
  border: "#E3D8C3",
  maroon: "#8B3E3E",
  textDark: "#3B2E28",
  textMuted: "#948573",
};

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
        background: THEME.bg,
        border: `1px solid ${THEME.border}`, borderRadius: 22, padding: 22, marginBottom: 14,
      }}>
        {/* โลโก้ซ้าย + หัวเรื่องใหญ่ขวา */}
        <div className="pgs-row" style={{ alignItems: "flex-start", marginBottom: 10 }}>
          <ShopLogo logoDataUrl={r.logoDataUrl} size={44} />
          <div className="pgs-display" style={{ fontSize: 24, fontWeight: 700, color: THEME.maroon, textAlign: "right", lineHeight: 1.15 }}>
            {r.cancelled ? "ใบเสร็จ (ยกเลิกแล้ว)" : "ใบเสร็จ"}
          </div>
        </div>

        {/* ชื่อร้าน (ซ้าย) + เลขที่/วันที่ (ขวา) เหนือเส้นแบ่ง */}
        <div className="pgs-row" style={{ alignItems: "flex-end", borderBottom: `1px solid ${THEME.border}`, paddingBottom: 14, marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: THEME.textDark }}>{r.shopName}</span>
          <div style={{ textAlign: "right" }}>
            <div className="pgs-mono" style={{ fontSize: 12, fontWeight: 700, color: THEME.textDark }}>เลขที่ {r.code}</div>
            <div className="pgs-mono" style={{ fontSize: 11, color: THEME.textMuted }}>{r.dateStr}</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="pgs-row" style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: THEME.textDark }}>{r.customerName}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: THEME.maroon }}>ครั้งที่ {r.orderNoForCustomer}</span>
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted }}>
            {r.serviceEmoji} {r.serviceLabel}{r.customerGameId ? ` · ไอดี ${r.customerGameId}` : ""}
          </div>
          {r.periodStr && <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>🗓️ {r.periodStr}</div>}
        </div>

        {/* ตารางรายการ */}
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: "14px 18px", marginBottom: 14 }}>
          <div className="pgs-row" style={{ fontSize: 11, fontWeight: 700, color: THEME.maroon, textTransform: "uppercase", letterSpacing: 0.4, paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${THEME.border}` }}>
            <span>รายละเอียด</span><span>รวม</span>
          </div>
          {r.items.map((it, i) => (
            <div key={i} className="pgs-row" style={{ alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: THEME.textDark }}>{it.label}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted }}>{it.sub}</div>
              </div>
              <span className="pgs-mono" style={{ fontWeight: 700, fontSize: 13, color: THEME.textDark }}>฿{fmtMoney(it.price)}</span>
            </div>
          ))}
          <div className="pgs-row" style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: THEME.maroon, fontWeight: 700 }}>รวมทั้งหมด</span>
            <span className="pgs-mono pgs-display" style={{ fontWeight: 700, fontSize: 20, color: THEME.maroon }}>฿{fmtMoney(r.total)}</span>
          </div>
        </div>

        {r.proofImageDataUrl && (
          <div style={{ marginBottom: 14 }}>
            <div className="pgs-label" style={{ marginBottom: 8, color: THEME.textMuted }}>รูปภาพกิจกรรม</div>
            <div style={{ display: "flex", justifyContent: "center", background: THEME.card, borderRadius: 12, border: `1px solid ${THEME.border}`, padding: 6 }}>
              <img
                src={r.proofImageDataUrl}
                alt="รูปภาพกิจกรรม"
                style={{ display: "block", width: "auto", height: "auto", maxWidth: "100%", maxHeight: 420 }}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: r.note ? 10 : 0 }}>
          <span className="pgs-badge" style={{ background: r.paymentColor + "1E", color: r.paymentColor }}>{r.paymentStatus}</span>
          {r.tradeStatus && <span className="pgs-badge" style={{ background: THEME.maroon + "1E", color: THEME.maroon }}>{r.tradeStatus}</span>}
        </div>
        {r.note && <div style={{ fontSize: 12, color: THEME.textMuted }}>หมายเหตุ: {r.note}</div>}
        {r.cancelled && <div className="pgs-cancelbanner" style={{ marginTop: 10, marginBottom: 0, background: "rgba(179,56,56,0.14)", color: "#B33838" }}><Ban size={13} /> ออเดอร์นี้ถูกยกเลิกแล้ว</div>}

        <div style={{ borderTop: `1px solid ${THEME.border}`, marginTop: 14, paddingTop: 12, fontSize: 11, color: THEME.textMuted, textAlign: "center" }}>
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
