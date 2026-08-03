import { useState } from "react";
import {
  Plus,
  Gamepad2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { fmtMoney, clamp0 } from "../utils.js";
import EmptyState from "./EmptyState.jsx";
import SubHeader from "./SubHeader.jsx";

export default function AccountsTab({ data, stats, openNew, openDetail, back }) {
  const [q, setQ] = useState("");
  const accounts = data.gameAccounts.filter(a => !q || a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SubHeader title="ไอดีเกม" back={back} />
      <button className="pgs-btn pgs-btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={openNew}><Plus size={15} /> เพิ่มไอดีใหม่</button>
      {data.gameAccounts.length > 0 && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={14} color="var(--muted)" style={{ position: "absolute", left: 12, top: 12 }} />
          <input className="pgs-input" style={{ paddingLeft: 32 }} placeholder="ค้นหาไอดีเกม..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
      )}
      {accounts.length === 0 ? <EmptyState text={data.gameAccounts.length === 0 ? "ยังไม่มีไอดีเกม" : "ไม่พบไอดีที่ค้นหา"} /> : accounts.map(a => {
        const invested = stats.investByAccount[a.id] || 0;
        const income = data.orders.filter(o => o.sourceAccountId === a.id && !o.cancelled && o.paymentStatus === "paid").reduce((s, o) => s + Number(o.price || 0), 0);
        const profit = income - invested;
        const pokemonCount = data.orders.filter(o => o.sourceAccountId === a.id && o.type === "sell_pokemon" && !o.cancelled).length;
        const lowStock = (a.stock || []).filter(s => clamp0(s.quantity) <= (s.lowStockThreshold ?? 2));
        return (
          <div key={a.id} className="pgs-card" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => openDetail(a)}>
            <div className="pgs-row" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Gamepad2 size={16} color="var(--yellow)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</span>
              </div>
              <span className="pgs-mono" style={{ fontWeight: 700, fontSize: 13, color: profit >= 0 ? "var(--green)" : "var(--red)" }}>฿{fmtMoney(profit)}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 10, color: "var(--muted)" }}>
              <div>ลงทุน<br /><span className="pgs-mono" style={{ color: "var(--text)", fontSize: 12 }}>฿{fmtMoney(invested)}</span></div>
              <div>รายรับ<br /><span className="pgs-mono" style={{ color: "var(--text)", fontSize: 12 }}>฿{fmtMoney(income)}</span></div>
              <div>Pokémon<br /><span className="pgs-mono" style={{ color: "var(--text)", fontSize: 12 }}>{pokemonCount}</span></div>
            </div>
            {lowStock.length > 0 && (
              <div className="pgs-badge" style={{ marginTop: 8, background: "rgba(255,84,112,0.15)", color: "var(--red)" }}>
                <AlertTriangle size={10} /> สต๊อกใกล้หมด {lowStock.length} รายการ
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
