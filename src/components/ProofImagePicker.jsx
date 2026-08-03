import { useState, useRef } from "react";
import {
  Upload,
  Trash2,
} from "lucide-react";
import { fileToJpegDataUrl } from "../utils.js";

export default function ProofImagePicker({ value, onChange, alt = "รูปภาพกิจกรรม", addLabel = "แนบรูปภาพ" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const dataUrl = await fileToJpegDataUrl(file, 900, 0.72);
      onChange(dataUrl);
    } catch {
      // ignore — leave value unchanged on failure
    } finally {
      setBusy(false);
    }
  }
  if (value) {
    return (
      <div>
        <img src={value} alt={alt} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={() => ref.current?.click()}><Upload size={14} /> เปลี่ยนรูป</button>
          <button type="button" className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={() => onChange("")}><Trash2 size={14} /> ลบรูป</button>
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
    );
  }
  return (
    <div>
      <button type="button" className="pgs-btn pgs-btn-outline" style={{ width: "100%" }} disabled={busy} onClick={() => ref.current?.click()}>
        <Upload size={14} /> {busy ? "กำลังอัปโหลด..." : addLabel}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
