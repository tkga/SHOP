import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Ban,
  RotateCcw,
  Receipt,
  Minus,
} from "lucide-react";
import { ORDER_TYPES, PAYMENT_STATUS, TRADE_STATUS, HIRE_MODES } from "../constants.js";
import { genId, fmtMoney, fmtDate, clamp0, uniquePokemonNames, variantKeysForPokemonName } from "../utils.js";
import Modal from "./Modal.jsx";
import EmptyState from "./EmptyState.jsx";
import VariantChips from "./VariantChips.jsx";
import RoundsEditor from "./RoundsEditor.jsx";
import ProofImagePicker from "./ProofImagePicker.jsx";

// รวมยอด "จำนวนที่ต้องซื้อทั้งหมด" ให้อัตโนมัติ แทนที่จะให้กรอกยอดรวมเอง:
// - โหมด "ไม่ระบุรอบ" (anytime): จำนวนที่ซื้อต่อรอบ × จำนวนรอบที่ต้องตี
// - โหมด "ตั้งรอบ" (scheduled): รวมจำนวนที่ตั้งไว้ในแต่ละรอบ
function computeHireTotal(form) {
  if (form.hireMode === "scheduled") {
    const sum = (form.rounds || []).reduce((s, r) => s + (clamp0(r.count) || 0), 0);
    return sum || 1;
  }
  const perRound = clamp0(form.hireTotal) || 1;
  const roundsNeeded = clamp0(form.rounds?.[0]?.count) || 1;
  return perRound * roundsNeeded;
}

export default function OrderModal({ data, mode, item, onClose, onSave, onCancel, onRestore, onDelete, onReceipt }) {
  const [form, setForm] = useState(item || {
    id: genId(), customerId: data.customers[0]?.id || "", customerGameId: data.customers[0]?.gameIds?.[0]?.value || "",
    type: "sell_pokemon", pokemonName: "", pokemonVariants: ["normal"], quantity: 1, stockItemId: null,
    price: "", sourceAccountId: data.gameAccounts[0]?.id || "",
    paymentStatus: "pending", paidAmount: 0, tradeStatus: "waiting",
    hireMode: "anytime", rounds: [], hireTotal: 1, hireUsed: 0, hireStatus: "ongoing",
    appointmentDate: "", note: "", proofImageDataUrl: "",
    createdAt: new Date().toISOString(), paidDate: "", cancelled: false, cancelledAt: null, cancelHistory: [],
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isSell = form.type === "sell_pokemon";
  const isHire = !isSell;

  const selectedCustomer = data.customers.find(c => c.id === form.customerId);
  const selectedAccount = data.gameAccounts.find(a => a.id === form.sourceAccountId);
  const stockOptions = selectedAccount?.stock || [];

  // เช็คว่า Pokémon ชื่อนี้ (ที่พิมพ์/เลือกไว้) มีของในสต๊อกจริงกี่ประเภท เพื่อจำกัดตัวเลือก "ประเภท Pokémon"
  // ให้เหลือแค่ประเภทที่มีของจริง — ถ้าไม่เจอชื่อนี้ในสต๊อกเลย (ชื่อใหม่/ยังไม่เคยลง) จะโชว์ครบทุกประเภทไว้ก่อน
  const matchedVariantKeys = variantKeysForPokemonName(data, form.pokemonName);
  const variantOptionsForForm = matchedVariantKeys.length
    ? data.pokemonVariants.filter(v => matchedVariantKeys.includes(v.key))
    : data.pokemonVariants;

  // ถ้าเปลี่ยนชื่อ Pokémon แล้วประเภทที่เลือกไว้เดิมไม่มีอยู่ในของที่มีจริง ให้สลับไปประเภทแรกที่มีให้อัตโนมัติ
  // (ไม่ทำตอนล็อกจากสต๊อก เพราะตอนนั้นประเภทถูกกำหนดมาจาก pickStock() อยู่แล้ว)
  useEffect(() => {
    if (!isSell || form.stockItemId || matchedVariantKeys.length === 0) return;
    if (!(form.pokemonVariants || []).every(v => matchedVariantKeys.includes(v))) {
      set("pokemonVariants", [matchedVariantKeys[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.pokemonName]);

  function pickCustomer(id) {
    const c = data.customers.find(x => x.id === id);
    setForm(f => ({ ...f, customerId: id, customerGameId: c?.gameIds?.[0]?.value || "" }));
  }
  function pickStock(stockId) {
    if (!stockId) { set("stockItemId", null); return; }
    const s = stockOptions.find(x => x.id === stockId);
    if (!s) return;
    setForm(f => ({ ...f, stockItemId: stockId, pokemonName: s.name, pokemonVariants: s.variants && s.variants.length ? s.variants : ["normal"] }));
  }

  function submit() {
    if (!form.customerId) return;
    const price = Number(form.price) || 0;
    let paidAmount = 0;
    if (form.paymentStatus === "paid") paidAmount = price;
    else if (form.paymentStatus === "partial") paidAmount = clamp0(Math.min(Number(form.paidAmount) || 0, price));
    const payload = { ...form, price, paidAmount, quantity: Number(form.quantity) || 1 };
    if ((form.paymentStatus === "paid" || form.paymentStatus === "partial") && !payload.paidDate) payload.paidDate = new Date().toISOString();
    if (isHire) {
      payload.rounds = form.rounds;
      payload.appointmentDate = "";
      payload.hireTotal = computeHireTotal(form);
      payload.hireUsed = Math.min(clamp0(form.hireUsed), payload.hireTotal);
    }
    onSave(payload);
  }

  if (data.customers.length === 0) {
    return (
      <Modal title="เพิ่มออเดอร์" onClose={onClose}>
        <EmptyState text="กรุณาเพิ่มลูกค้าก่อนสร้างออเดอร์" />
      </Modal>
    );
  }

  return (
    <Modal title={mode === "add" ? "เพิ่มออเดอร์" : `แก้ไขออเดอร์ ${form.code || ""}`} onClose={onClose}>
      {form.cancelled && (
        <div className="pgs-cancelbanner"><Ban size={13} /> ออเดอร์นี้ถูกยกเลิกแล้ว {form.cancelledAt ? `(${fmtDate(form.cancelledAt)})` : ""}</div>
      )}
      {(form.cancelHistory || []).length > 0 && (
        <div className="pgs-card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>ประวัติการยกเลิก</div>
          {form.cancelHistory.map(h => (
            <div key={h.id || h.date} style={{ fontSize: 11, marginBottom: 4 }}>
              <span className="pgs-mono" style={{ color: "var(--muted)" }}>{fmtDate(h.date)}</span> — {h.reason}
            </div>
          ))}
        </div>
      )}
      <div className="pgs-field">
        <label className="pgs-label">ประเภทบริการ</label>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(ORDER_TYPES).map(([k, v]) => (
            <button key={k} className={"pgs-chip" + (form.type === k ? " active" : "")} style={{ flex: 1, textAlign: "center" }} onClick={() => set("type", k)}>{v.emoji} {v.short}</button>
          ))}
        </div>
      </div>
      <div className="pgs-field">
        <label className="pgs-label">ลูกค้า</label>
        <select className="pgs-select" value={form.customerId} onChange={e => pickCustomer(e.target.value)}>
          {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {selectedCustomer && (selectedCustomer.gameIds || []).length > 0 && (
        <div className="pgs-field">
          <label className="pgs-label">ไอดีของลูกค้าที่ใช้ในออเดอร์นี้</label>
          <select className="pgs-select" value={form.customerGameId} onChange={e => set("customerGameId", e.target.value)}>
            {selectedCustomer.gameIds.map(g => <option key={g.id} value={g.value}>{g.value || "(ไม่มีชื่อ)"}</option>)}
            <option value="">- ไม่ระบุ -</option>
          </select>
        </div>
      )}
      {isSell && (
        <>
          <div className="pgs-field">
            <label className="pgs-label">ไอดีต้นทาง</label>
            <select className="pgs-select" value={form.sourceAccountId} onChange={e => { set("sourceAccountId", e.target.value); set("stockItemId", null); }}>
              <option value="">- ไม่ระบุ -</option>
              {data.gameAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {stockOptions.length > 0 && (
            <div className="pgs-field">
              <label className="pgs-label">เลือกจากสต๊อก (ตัดสต๊อกอัตโนมัติ)</label>
              <select className="pgs-select" value={form.stockItemId || ""} onChange={e => pickStock(e.target.value)}>
                <option value="">- กรอกเอง (ไม่ตัดสต๊อก) -</option>
                {stockOptions.map(s => <option key={s.id} value={s.id}>{s.name} · เหลือ {s.quantity}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <div className="pgs-field" style={{ flex: 2 }}>
              <label className="pgs-label">ชื่อ Pokémon</label>
              <input className="pgs-input" list="pgs-pokemon-names" value={form.pokemonName} onChange={e => set("pokemonName", e.target.value)} placeholder="เช่น Rayquaza" />
              <datalist id="pgs-pokemon-names">
                {uniquePokemonNames(data).map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div className="pgs-field" style={{ flex: 1 }}>
              <label className="pgs-label">จำนวน</label>
              <input className="pgs-input" type="number" min="1" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
            </div>
          </div>
          <div className="pgs-field">
            <label className="pgs-label">ประเภท Pokémon</label>
            <VariantChips value={form.pokemonVariants} onChange={(v) => set("pokemonVariants", v)} variants={variantOptionsForForm} disabled={!!form.stockItemId} />
            {form.stockItemId ? (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                ล็อกตามรายการสต๊อกที่เลือก — ถ้าต้องการชนิดอื่น ให้เปลี่ยนตัวเลือก "เลือกจากสต๊อก" ด้านบน หรือเลือก "กรอกเอง (ไม่ตัดสต๊อก)" ก่อน
              </div>
            ) : matchedVariantKeys.length > 0 ? (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                {form.pokemonName} มีในสต๊อก {matchedVariantKeys.length} ประเภท จึงเลือกได้เฉพาะประเภทเหล่านี้
              </div>
            ) : form.pokemonName ? (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
                ยังไม่มี "{form.pokemonName}" ในสต๊อก — เลือกประเภทได้ครบทุกแบบไปก่อน (ถ้าต้องการจำกัดประเภท ให้เพิ่มสต๊อกก่อน)
              </div>
            ) : null}
          </div>
        </>
      )}
      {isHire && (
        <>
          <div className="pgs-field">
            <label className="pgs-label">โหมดนัดตี</label>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(HIRE_MODES).map(([k, v]) => (
                <button key={k} className={"pgs-chip" + (form.hireMode === k ? " active" : "")} style={{ flex: 1, textAlign: "center" }} onClick={() => set("hireMode", k)}>{v.label}</button>
              ))}
            </div>
          </div>
          <RoundsEditor mode={form.hireMode} rounds={form.rounds} onChange={(r) => set("rounds", r)} />
          <div style={{ display: "flex", gap: 10 }}>
            {form.hireMode === "anytime" && (
              <div className="pgs-field" style={{ flex: 1 }}>
                <label className="pgs-label">จำนวนที่ซื้อต่อรอบ (ตัว)</label>
                <input className="pgs-input pgs-mono" type="number" min="1" value={form.hireTotal} onChange={e => set("hireTotal", e.target.value)} />
              </div>
            )}
            <div className="pgs-field" style={{ flex: 1 }}>
              <label className="pgs-label">ใช้ไปแล้ว</label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button type="button" className="pgs-iconbtn" onClick={() => set("hireUsed", clamp0((Number(form.hireUsed) || 0) - 1))}><Minus size={13} /></button>
                <input className="pgs-input pgs-mono" style={{ textAlign: "center" }} type="number" min="0" value={form.hireUsed} onChange={e => set("hireUsed", e.target.value)} />
                <button type="button" className="pgs-iconbtn" onClick={() => set("hireUsed", clamp0(Math.min((Number(form.hireUsed) || 0) + 1, computeHireTotal(form))))}><Plus size={13} /></button>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: -6, marginBottom: 14 }}>
            รวมทั้งหมด <b className="pgs-mono" style={{ color: "var(--text)" }}>{computeHireTotal(form)}</b> ตัว/รอบ — เหลืออีก {clamp0(computeHireTotal(form) - (Number(form.hireUsed) || 0))} ตัว
            {form.hireMode === "anytime"
              ? " (คำนวณอัตโนมัติจาก จำนวนที่ซื้อต่อรอบ × จำนวนรอบที่ต้องตี)"
              : " (รวมจากจำนวนที่ตั้งไว้ในแต่ละรอบด้านบน)"}
          </div>
        </>
      )}
      <div className="pgs-field">
        <label className="pgs-label">ราคารวม (บาท)</label>
        <input className="pgs-input pgs-mono" type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" />
      </div>
      <div className="pgs-field">
        <label className="pgs-label">สถานะชำระ</label>
        <select className="pgs-select" value={form.paymentStatus} onChange={e => set("paymentStatus", e.target.value)}>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {form.paymentStatus === "partial" && (
        <div className="pgs-field">
          <label className="pgs-label">จำนวนที่ชำระแล้ว (บาท)</label>
          <input className="pgs-input pgs-mono" type="number" value={form.paidAmount} onChange={e => set("paidAmount", e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>คงค้าง ฿{fmtMoney(clamp0((Number(form.price) || 0) - (Number(form.paidAmount) || 0)))}</div>
        </div>
      )}
      {isSell && (
        <div className="pgs-field">
          <label className="pgs-label">สถานะเทรด</label>
          <select
            className="pgs-select" value={form.tradeStatus}
            onChange={e => {
              const v = e.target.value;
              set("tradeStatus", v);
              if (v === "three_hearts") {
                const d = new Date();
                d.setDate(d.getDate() + 30);
                set("appointmentDate", d.toISOString().slice(0, 10));
              }
            }}
          >
            {Object.entries(TRADE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}
      {isSell && (
        <div className="pgs-field">
          <label className="pgs-label">วันนัด (สำหรับนัดเทรด)</label>
          <input className="pgs-input" type="date" value={form.appointmentDate} onChange={e => set("appointmentDate", e.target.value)} />
        </div>
      )}
      <div className="pgs-field">
        <label className="pgs-label">รูปภาพกิจกรรม / หลักฐาน (ถ้ามี — จะแสดงในใบเสร็จ)</label>
        <ProofImagePicker value={form.proofImageDataUrl} onChange={(v) => setForm(f => ({ ...f, proofImageDataUrl: v, driveFileId: null }))} />
      </div>
      <div className="pgs-field">
        <label className="pgs-label">หมายเหตุ</label>
        <textarea className="pgs-textarea" rows={2} value={form.note} onChange={e => set("note", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button className="pgs-btn pgs-btn-primary" style={{ flex: 1 }} onClick={submit}>บันทึก</button>
        {mode === "edit" && (
          <button className="pgs-btn pgs-btn-outline" onClick={() => onReceipt(form)}><Receipt size={14} /></button>
        )}
      </div>
      {mode === "edit" && (
        <div>
          {!form.cancelled && showCancelReason && (
            <div className="pgs-field">
              <label className="pgs-label">ยกเลิกเพราะอะไร?</label>
              <textarea
                className="pgs-textarea" rows={2} autoFocus
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ยกเลิกออเดอร์นี้..."
              />
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {form.cancelled ? (
              <button className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={() => onRestore(form.id)}><RotateCcw size={14} /> กู้คืนออเดอร์</button>
            ) : !showCancelReason ? (
              <button className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={() => setShowCancelReason(true)}><Ban size={14} /> ยกเลิกออเดอร์</button>
            ) : (
              <button
                className="pgs-btn pgs-btn-danger" style={{ flex: 1 }}
                disabled={!cancelReason.trim()}
                onClick={() => onCancel(form.id, cancelReason)}
              >ยืนยันยกเลิก (ระบุเหตุผลก่อน)</button>
            )}
            {!confirmDelete ? (
              <button className="pgs-btn pgs-btn-danger" style={{ flex: 1 }} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> ลบถาวร</button>
            ) : (
              <button className="pgs-btn pgs-btn-danger" style={{ flex: 1 }} onClick={() => onDelete(form.id)}>ยืนยันลบถาวร?</button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
