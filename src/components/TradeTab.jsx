import { useState } from "react";
import {
  Heart,
  Clock,
  CheckCircle2,
  ListFilter,
} from "lucide-react";
import { todayStr, fmtDate, daysBetween } from "../utils.js";
import StatusDot from "./StatusDot.jsx";
import EmptyState from "./EmptyState.jsx";

export default function TradeTab({ data, custName, accName, openEdit, onQuickTrade }) {
  const [filter, setFilter] = useState("waiting");
  const [sortDir, setSortDir] = useState("asc"); // asc = เก่าสุดอยู่บน (มาก่อนได้ก่อน)
  const orders = data.orders
    .filter(o => o.type === "sell_pokemon" && !o.cancelled && o.tradeStatus === filter)
    .slice()
    .sort((a, b) => {
      const diff = (a.createdAt || "").localeCompare(b.createdAt || "");
      return sortDir === "asc" ? diff : -diff;
    });
  return (
    <div>
      <h2 className="pgs-display" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px 0" }}>ระบบเทรด</h2>
      <div className="pgs-row" style={{ marginBottom: 12, gap: 6 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className={"pgs-chip" + (filter === "waiting" ? " active" : "")} onClick={() => setFilter("waiting")}>รอเทรด</button>
          <button className={"pgs-chip" + (filter === "three_hearts" ? " active" : "")} onClick={() => setFilter("three_hearts")}>ทำ 3 ใจ</button>
          <button className={"pgs-chip" + (filter === "traded" ? " active" : "")} onClick={() => setFilter("traded")}>เทรดแล้ว</button>
        </div>
      </div>
      {(filter === "waiting" || filter === "three_hearts") && orders.length > 0 && (
        <button
          className="pgs-btn pgs-btn-outline"
          style={{ marginBottom: 10, fontSize: 12, padding: "6px 12px" }}
          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
        >
          <ListFilter size={13} /> {sortDir === "asc" ? "มาก่อน อยู่บนสุด" : "มาใหม่ อยู่บนสุด"}
        </button>
      )}
      {orders.length === 0 ? <EmptyState text="ไม่มีรายการในสถานะนี้" /> : orders.map((o, i) => {
        const remain = o.appointmentDate ? daysBetween(todayStr(), o.appointmentDate) : null;
        return (
          <div key={o.id} className="pgs-card" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => openEdit(o)}>
            <div className="pgs-row" style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {(filter === "waiting" || filter === "three_hearts") && (
                  <span className="pgs-mono" style={{ fontSize: 11, color: "var(--muted)", width: 18, textAlign: "center" }}>#{i + 1}</span>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{custName(o.customerId)}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{o.pokemonName} x{o.quantity} · {accName(o.sourceAccountId)}</div>
                </div>
              </div>
              <StatusDot trade={o.tradeStatus} />
            </div>
            {o.appointmentDate && (
              <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> นัด {fmtDate(o.appointmentDate)}
                {remain !== null && remain >= 0 && ` · เหลืออีก ${remain} วัน`}
                {remain !== null && remain < 0 && ` · เลยกำหนด ${Math.abs(remain)} วัน`}
              </div>
            )}
            {filter === "waiting" && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  className="pgs-btn pgs-btn-outline" style={{ padding: "6px 10px", fontSize: 11 }}
                  onClick={(e) => { e.stopPropagation(); onQuickTrade(o.id, "traded"); }}
                ><CheckCircle2 size={12} /> เทรดแล้ว</button>
              </div>
            )}
            {filter === "three_hearts" && (
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <button
                  className="pgs-btn pgs-btn-outline" style={{ padding: "6px 10px", fontSize: 11 }}
                  onClick={(e) => { e.stopPropagation(); onQuickTrade(o.id, "traded"); }}
                ><CheckCircle2 size={12} /> เทรดแล้ว</button>
                <button
                  className="pgs-btn pgs-btn-outline" style={{ padding: "6px 10px", fontSize: 11, borderColor: "rgba(255,203,5,0.4)" }}
                  onClick={(e) => { e.stopPropagation(); onQuickTrade(o.id, "waiting"); }}
                ><Heart size={12} /> ทำ 3 ใจครบ</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
