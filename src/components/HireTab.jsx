import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Ban,
  Minus,
} from "lucide-react";
import { ORDER_TYPES, HIRE_STATUS, HIRE_MODES } from "../constants.js";
import { clamp0 } from "../utils.js";
import EmptyState from "./EmptyState.jsx";

export default function HireTab({ data, custName, accName, openEdit, onQuickUse, onQuickHireStatus, onQuickCancel }) {
  const [filter, setFilter] = useState("ongoing");
  const orders = data.orders
    .filter(o => (o.type === "hire_boss" || o.type === "hire_invite") && !o.cancelled)
    .filter(o => filter === "ongoing" ? o.hireStatus !== "done" : o.hireStatus === "done")
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));

  return (
    <div>
      <h2 className="pgs-display" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px 0" }}>ตีบอส / เชิญตี</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button className={"pgs-chip" + (filter === "ongoing" ? " active" : "")} onClick={() => setFilter("ongoing")}>ค้างอยู่</button>
        <button className={"pgs-chip" + (filter === "done" ? " active" : "")} onClick={() => setFilter("done")}>เสร็จสิ้น</button>
      </div>
      {orders.length === 0 ? <EmptyState text="ไม่มีรายการในสถานะนี้" /> : orders.map(o => {
        const total = clamp0(o.hireTotal);
        const used = clamp0(o.hireUsed);
        const isFull = total > 0 && used >= total;
        return (
          <div key={o.id} className="pgs-card" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => openEdit(o)}>
            <div className="pgs-row" style={{ marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{custName(o.customerId)}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {ORDER_TYPES[o.type].emoji} {ORDER_TYPES[o.type].label} · {HIRE_MODES[o.hireMode]?.label || ""}
                  {o.sourceAccountId ? ` · ${accName(o.sourceAccountId)}` : ""}
                </div>
              </div>
              <span className="pgs-badge" style={{ background: HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].color + "22", color: HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].color }}>
                {HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].label}
              </span>
            </div>
            <div className="pgs-row" style={{ marginTop: 4, background: "var(--surface2)", borderRadius: 10, padding: "6px 8px" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>ใช้ไปแล้ว <span className="pgs-mono" style={{ color: "var(--text)", fontWeight: 700 }}>{used}</span> / {total} ตัว</span>
              {filter === "ongoing" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="pgs-iconbtn" style={{ padding: 5 }}
                    disabled={used <= 0}
                    onClick={(e) => { e.stopPropagation(); onQuickUse(o, -1); }}
                    title="ลดจำนวนที่ใช้ (แก้ไข)"
                  ><Minus size={12} /></button>
                  <button
                    className="pgs-iconbtn" style={{ padding: 5, borderColor: "rgba(255,203,5,0.4)" }}
                    disabled={total > 0 && used >= total}
                    onClick={(e) => { e.stopPropagation(); onQuickUse(o, 1); }}
                    title="ใช้ไปวันนี้ +1"
                  ><Plus size={12} /></button>
                </div>
              )}
            </div>
            {filter === "ongoing" && isFull && (
              <button
                className="pgs-btn pgs-btn-outline" style={{ width: "100%", marginTop: 8, fontSize: 12, padding: "6px 10px" }}
                onClick={(e) => { e.stopPropagation(); onQuickHireStatus(o.id, "done"); }}
              ><CheckCircle2 size={13} /> เสร็จสิ้น (ครบจำนวนแล้ว)</button>
            )}
            {filter === "ongoing" && (
              <button
                className="pgs-btn pgs-btn-danger" style={{ width: "100%", marginTop: 8, fontSize: 12, padding: "6px 10px" }}
                onClick={(e) => { e.stopPropagation(); onQuickCancel(o.id); }}
              ><Ban size={13} /> ยกเลิกออเดอร์</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
