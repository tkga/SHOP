import { useState, useRef } from "react";
import {
  Upload,
  Trash2,
} from "lucide-react";
import { fileToJpegDataUrl, fileToOriginalDataUrl } from "../utils.js";

// `sizeChoices` (optional) turns on a "ขนาดรูป" dropdown before upload — pass
// an array of { key, label, maxDim, quality } (maxDim/quality null = original,
// no resize/recompression at all). See utils.js STOCK_PHOTO_SIZE_CHOICES for
// the preset used by product photos. When omitted, behavior is unchanged
// from before: every photo is resized via fileToJpegDataUrl(file, maxDim, quality)
// using the maxDim/quality props (defaulting to the original 900px/0.72 —
// fine for slip/proof photos that are just for record-keeping).
export default function ProofImagePicker({
  value,
  onChange,
  alt = "รูปภาพกิจกรรม",
  addLabel = "แนบรูปภาพ",
  maxDim = 900,
  quality = 0.72,
  sizeChoices = null,
}) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [sizeKey, setSizeKey] = useState(sizeChoices?.[0]?.key || null);

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      let dataUrl;
      const choice = sizeChoices ? sizeChoices.find(c => c.key === sizeKey) || sizeChoices[0] : null;
      if (choice) {
        dataUrl = choice.maxDim ? await fileToJpegDataUrl(file, choice.maxDim, choice.quality) : await fileToOriginalDataUrl(file);
      } else {
        dataUrl = await fileToJpegDataUrl(file, maxDim, quality);
      }
      onChange(dataUrl);
    } catch {
      // ignore — leave value unchanged on failure
    } finally {
      setBusy(false);
    }
  }

  const sizePicker = sizeChoices && (
    <select
      className="pgs-input"
      value={sizeKey || ""}
      onChange={e => setSizeKey(e.target.value)}
      style={{ marginBottom: 8 }}
    >
      {sizeChoices.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
    </select>
  );

  if (value) {
    return (
      <div>
        <img src={value} alt={alt} style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 8 }} />
        {sizePicker}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} disabled={busy} onClick={() => ref.current?.click()}><Upload size={14} /> {busy ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}</button>
          <button type="button" className="pgs-btn pgs-btn-outline" style={{ flex: 1 }} onClick={() => onChange("")}><Trash2 size={14} /> ลบรูป</button>
        </div>
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
      </div>
    );
  }
  return (
    <div>
      {sizePicker}
      <button type="button" className="pgs-btn pgs-btn-outline" style={{ width: "100%" }} disabled={busy} onClick={() => ref.current?.click()}>
        <Upload size={14} /> {busy ? "กำลังอัปโหลด..." : addLabel}
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
