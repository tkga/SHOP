import { useState } from "react";
import {
  Trash2,
} from "lucide-react";
import { genId, clamp0, uniquePokemonNames } from "../utils.js";
import Modal from "./Modal.jsx";
import VariantChips from "./VariantChips.jsx";
import ProofImagePicker from "./ProofImagePicker.jsx";
import StockMovementHistory from "./StockMovementHistory.jsx";

export default function StockModal({ mode, item, data, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(item || { id: genId(), name: "", variants: ["normal"], quantity: 1, lowStockThreshold: 2, photoDataUrl: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pokemonNames = uniquePokemonNames(data);
  return (
    <Modal title={mode === "add" ? "เพิ่มสต๊อก Pokémon" : "แก้ไขสต๊อก"} onClose={onClose}>
      <div className="pgs-field">
        <label className="pgs-label">รูปสินค้า (ไม่บังคับ — ไว้ให้ลูกค้าดูสินค้าในอนาคต)</label>
        <ProofImagePicker
          value={form.photoDataUrl}
          onChange={(v) => setForm(f => ({ ...f, photoDataUrl: v, photoDriveFileId: null }))}
          alt={form.name || "รูปสินค้า"}
          addLabel="แนบรูปสินค้า"
        />
      </div>
      <div className="pgs-field">
        <label className="pgs-label">ชื่อ Pokémon</label>
        <input className="pgs-input" list="pgs-pokemon-names" value={form.name} onChange={e => set("name", e.target.value)} placeholder="เช่น Rayquaza" />
        <datalist id="pgs-pokemon-names">
          {pokemonNames.map(n => <option key={n} value={n} />)}
        </datalist>
      </div>
      <div className="pgs-field">
        <label className="pgs-label">ประเภท (เลือกได้ 1 ชนิดต่อรายการ)</label>
        <VariantChips value={form.variants} onChange={(v) => set("variants", v)} variants={data.pokemonVariants} multi={false} />
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
          Pokémon ตัวเดียวกันแต่คนละชนิด (เช่น ปกติ กับ Shiny) จำนวนคงเหลือมักไม่เท่ากัน — ให้เพิ่มเป็นรายการสต๊อกแยกกันสำหรับแต่ละชนิด
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="pgs-field" style={{ flex: 1 }}>
          <label className="pgs-label">จำนวนคงเหลือ</label>
          <input className="pgs-input pgs-mono" type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
        </div>
        <div className="pgs-field" style={{ flex: 1 }}>
          <label className="pgs-label">แจ้งเตือนเมื่อเหลือ ≤</label>
          <input className="pgs-input pgs-mono" type="number" min="0" value={form.lowStockThreshold} onChange={e => set("lowStockThreshold", e.target.value)} />
        </div>
      </div>
      <button
        className="pgs-btn pgs-btn-primary" style={{ width: "100%", marginBottom: onDelete ? 8 : 0 }}
        disabled={!form.name}
        onClick={() => form.name && onSave({ ...form, quantity: clamp0(form.quantity), lowStockThreshold: clamp0(form.lowStockThreshold) })}
      >บันทึก</button>
      {onDelete && (
        !confirmDelete ? (
          <button className="pgs-btn pgs-btn-danger" style={{ width: "100%" }} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> ลบสต๊อกนี้</button>
        ) : (
          <button className="pgs-btn pgs-btn-danger" style={{ width: "100%" }} onClick={onDelete}>ยืนยันลบ?</button>
        )
      )}
      {mode === "edit" && item?.id && <StockMovementHistory data={data} stockItemId={item.id} />}
    </Modal>
  );
}
