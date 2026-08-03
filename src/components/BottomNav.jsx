import {
  Home,
  Package,
  Repeat,
  MoreHorizontal,
  Target,
} from "lucide-react";

export default function BottomNav({ tab, setTab, onMore }) {
  const items = [
    { id: "dashboard", label: "หน้าแรก", icon: Home },
    { id: "orders", label: "ออเดอร์", icon: Package },
    { id: "trade", label: "เทรด", icon: Repeat },
    { id: "hire", label: "ตีบอส/เชิญตี", icon: Target },
  ];
  return (
    <div className="pgs-bottomnav">
      {items.map(it => (
        <button key={it.id} className={"pgs-navitem" + (tab === it.id ? " active" : "")} onClick={() => setTab(it.id)}>
          <it.icon size={19} />
          {it.label}
        </button>
      ))}
      <button className={"pgs-navitem" + (["accounts", "finance", "reports", "settings", "customers"].includes(tab) ? " active" : "")} onClick={onMore}>
        <MoreHorizontal size={19} />
        เพิ่มเติม
      </button>
    </div>
  );
}
