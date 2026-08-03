import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Search,
  Ban,
  ListFilter,
  Receipt,
} from "lucide-react";
import { ORDER_TYPES, PAYMENT_STATUS, TRADE_STATUS, HIRE_STATUS, POKEMON_VARIANTS, HIRE_MODES } from "../constants.js";
import { fmtMoney, fmtDate, orderBalance } from "../utils.js";
import StatusDot from "./StatusDot.jsx";
import EmptyState from "./EmptyState.jsx";

export default function OrdersTab({ data, custName, accName, openNew, openEdit, openReceipt, onQuickComplete, onQuickCancel }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [showAdv, setShowAdv] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [tradeFilter, setTradeFilter] = useState("all");
  const [cancelFilter, setCancelFilter] = useState("active");
  const [sortBy, setSortBy] = useState("date_desc");

  const filtered = data.orders.filter(o => {
    if (cancelFilter === "active" && o.cancelled) return false;
    if (cancelFilter === "cancelled" && !o.cancelled) return false;
    if (filter !== "all" && o.type !== filter) return false;
    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
    if (tradeFilter !== "all" && o.tradeStatus !== tradeFilter) return false;
    if (q && !(custName(o.customerId).toLowerCase().includes(q.toLowerCase()) || (o.pokemonName || "").toLowerCase().includes(q.toLowerCase()) || o.code.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "date_asc") return (a.createdAt || "").localeCompare(b.createdAt || "");
    if (sortBy === "amount_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
    if (sortBy === "amount_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
    return (b.createdAt || "").localeCompare(a.createdAt || ""); // date_desc (default)
  });

  return (
    <div>
      <div className="pgs-row" style={{ marginBottom: 12 }}>
        <h2 className="pgs-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>ออเดอร์</h2>
        <button className="pgs-btn pgs-btn-primary" onClick={openNew}><Plus size={15} /> เพิ่ม</button>
      </div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search size={14} color="var(--muted)" style={{ position: "absolute", left: 12, top: 12 }} />
        <input className="pgs-input" style={{ paddingLeft: 32 }} placeholder="ค้นหาลูกค้า, Pokémon, รหัส..." value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <select className="pgs-select" style={{ marginBottom: 8, fontSize: 12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="date_desc">เรียง: ใหม่สุดก่อน</option>
        <option value="date_asc">เรียง: เก่าสุดก่อน</option>
        <option value="amount_desc">เรียง: ราคามาก-น้อย</option>
        <option value="amount_asc">เรียง: ราคาน้อย-มาก</option>
      </select>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 8, paddingBottom: 2 }}>
        <button className={"pgs-chip" + (filter === "all" ? " active" : "")} onClick={() => setFilter("all")}>ทั้งหมด</button>
        {Object.entries(ORDER_TYPES).map(([k, v]) => (
          <button key={k} className={"pgs-chip" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{v.emoji} {v.short}</button>
        ))}
        <button className={"pgs-chip" + (showAdv ? " active" : "")} onClick={() => setShowAdv(s => !s)}><ListFilter size={12} style={{ verticalAlign: -2 }} /> ตัวกรอง</button>
      </div>
      {showAdv && (
        <div className="pgs-card" style={{ marginBottom: 12 }}>
          <div className="pgs-field" style={{ marginBottom: 10 }}>
            <label className="pgs-label">สถานะชำระ</label>
            <select className="pgs-select" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="pgs-field" style={{ marginBottom: 10 }}>
            <label className="pgs-label">สถานะเทรด</label>
            <select className="pgs-select" value={tradeFilter} onChange={e => setTradeFilter(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {Object.entries(TRADE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="pgs-field" style={{ marginBottom: 0 }}>
            <label className="pgs-label">สถานะออเดอร์</label>
            <div style={{ display: "flex", gap: 6 }}>
              <button className={"pgs-chip" + (cancelFilter === "active" ? " active" : "")} style={{ flex: 1, textAlign: "center" }} onClick={() => setCancelFilter("active")}>ปกติ</button>
              <button className={"pgs-chip" + (cancelFilter === "cancelled" ? " active" : "")} style={{ flex: 1, textAlign: "center" }} onClick={() => setCancelFilter("cancelled")}>ยกเลิกแล้ว</button>
              <button className={"pgs-chip" + (cancelFilter === "all" ? " active" : "")} style={{ flex: 1, textAlign: "center" }} onClick={() => setCancelFilter("all")}>ทั้งหมด</button>
            </div>
          </div>
        </div>
      )}
      {filtered.length === 0 ? <EmptyState text="ไม่พบออเดอร์" /> : filtered.map(o => {
        const balance = orderBalance(o);
        return (
          <div key={o.id} className="pgs-card" style={{ marginBottom: 8, opacity: o.cancelled ? 0.7 : 1 }} onClick={() => openEdit(o)}>
            <div className="pgs-row" style={{ alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{ORDER_TYPES[o.type].emoji}</span>
                <div>
                  <div className={"pgs-row" + (o.cancelled ? " pgs-strike" : "")} style={{ gap: 6, justifyContent: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{custName(o.customerId)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>
                    {o.type === "sell_pokemon"
                      ? `${o.pokemonName || ""}${(o.pokemonVariants || []).filter(v => v !== "normal").length ? " (" + o.pokemonVariants.filter(v => v !== "normal").map(v => POKEMON_VARIANTS[v]?.label).join(", ") + ")" : ""} x${o.quantity || 1}`
                      : `${ORDER_TYPES[o.type].label} · ${HIRE_MODES[o.hireMode]?.label || ""}`}
                    {o.sourceAccountId ? ` · ${accName(o.sourceAccountId)}` : ""}
                  </div>
                  <div className="pgs-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{o.code} · {fmtDate(o.createdAt)}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pgs-mono" style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>฿{fmtMoney(o.price)}</div>
                <StatusDot payment={o.paymentStatus} trade={o.type === "sell_pokemon" ? o.tradeStatus : null} cancelled={o.cancelled} />
              </div>
            </div>
            {!o.cancelled && o.paymentStatus === "partial" && (
              <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>ค้างชำระ ฿{fmtMoney(balance)}</div>
            )}
            {!o.cancelled && o.type !== "sell_pokemon" && (
              <div className="pgs-row" style={{ marginTop: 8, background: "var(--surface2)", borderRadius: 10, padding: "6px 8px" }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>ใช้ไปแล้ว <span className="pgs-mono" style={{ color: "var(--text)", fontWeight: 700 }}>{o.hireUsed || 0}</span> / {o.hireTotal || 0} ตัว</span>
                <span className="pgs-badge" style={{ background: HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].color + "22", color: HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].color }}>
                  {HIRE_STATUS[o.hireStatus === "done" ? "done" : "ongoing"].label}
                </span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 6 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {!o.cancelled && o.type === "sell_pokemon" && o.paymentStatus !== "paid" && (
                  <button
                    className="pgs-btn pgs-btn-outline" style={{ padding: "6px 10px", fontSize: 11 }}
                    onClick={(e) => { e.stopPropagation(); onQuickComplete(o); }}
                  ><CheckCircle2 size={12} /> เสร็จสิ้น</button>
                )}
                {!o.cancelled && (
                  <button
                    className="pgs-btn pgs-btn-danger" style={{ padding: "6px 10px", fontSize: 11 }}
                    onClick={(e) => { e.stopPropagation(); onQuickCancel(o.id); }}
                  ><Ban size={12} /> ยกเลิก</button>
                )}
              </div>
              <button className="pgs-iconbtn" onClick={(e) => { e.stopPropagation(); openReceipt(o); }} title="ใบเสร็จ"><Receipt size={13} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
