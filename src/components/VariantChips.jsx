import { POKEMON_VARIANTS } from "../constants.js";

export default function VariantChips({ value, onChange, disabled, multi = true }) {
  const toggle = (k) => {
    if (disabled) return;
    if (!multi) { onChange([k]); return; }
    const has = value.includes(k);
    if (k === "normal") { onChange(["normal"]); return; }
    let next = has ? value.filter(v => v !== k) : [...value.filter(v => v !== "normal"), k];
    if (next.length === 0) next = ["normal"];
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, opacity: disabled ? 0.55 : 1 }}>
      {Object.entries(POKEMON_VARIANTS).map(([k, v]) => (
        <button
          key={k}
          type="button"
          className={"pgs-chip" + (value.includes(k) ? " active" : "")}
          style={disabled ? { cursor: "not-allowed" } : undefined}
          disabled={disabled}
          onClick={() => toggle(k)}
        >
          {v.emoji} {v.label}
        </button>
      ))}
    </div>
  );
}
