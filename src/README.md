# โครงสร้างไฟล์หลังแตก component

ไฟล์เดิม `PokemonGoShop.jsx` ถูกแตกเป็นไฟล์ย่อยตาม component/ฟังก์ชัน โดยไม่แก้ logic ข้างใน มีแค่เพิ่ม import/export

**สถานะ: ครบและ build ผ่านแล้ว ✅**

```
(root)
├── index.html
├── package.json
├── vite.config.js        # อัปโหลดมาเป็น vite_config.js — เปลี่ยนชื่อกลับก่อนใช้
├── deploy.yml             # วางที่ .github/workflows/deploy.yml
├── manifest.json
├── sw.js
├── catalog.html           # หน้าสต๊อกสแตนด์อโลน ไม่ผ่าน Vite — วางที่ root หรือย้ายเข้า public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── constants.js
    ├── utils.js
    ├── receipt.js
    ├── GlobalStyle.jsx
    ├── idb.js
    ├── googleSync.js
    └── components/        # ครบ 32 ไฟล์ (ตัด TradeTab.jsx, HireTab.jsx ออกแล้ว — ฟังก์ชันถูกรวมเข้า OrdersTab.jsx ไปแล้ว ไม่ได้ใช้แยก)
        ├── AccountDetail.jsx
        ├── AccountModal.jsx
        ├── AccountsTab.jsx
        ├── BottomNav.jsx
        ├── CustomerDetail.jsx
        ├── CustomerModal.jsx
        ├── CustomersTab.jsx
        ├── Dashboard.jsx
        ├── DebtModal.jsx
        ├── DueSoonModal.jsx
        ├── EmptyState.jsx
        ├── FinanceTab.jsx
        ├── Header.jsx
        ├── ImageCropModal.jsx
        ├── LockScreen.jsx
        ├── Modal.jsx
        ├── MoreSheet.jsx
        ├── OrderModal.jsx
        ├── OrdersTab.jsx
        ├── ProofImagePicker.jsx
        ├── ReceiptModal.jsx
        ├── ReportsTab.jsx
        ├── RoundsEditor.jsx
        ├── SettingsTab.jsx
        ├── ShopLogo.jsx
        ├── StatCard.jsx
        ├── StatusDot.jsx
        ├── StockModal.jsx
        ├── StockMovementHistory.jsx
        ├── SubHeader.jsx
        ├── TrashModal.jsx
        ├── TxModal.jsx
        └── VariantChips.jsx
```

## สิ่งที่ต้องทำ

1. เอาโฟลเดอร์ `src/` ไปวางแทนตำแหน่งเดิมของ `PokemonGoShop.jsx`
2. เปลี่ยนชื่อ `vite_config.js` → `vite.config.js`
3. แก้ `import App from "./PokemonGoShop"` → `import App from "./src/App"`
4. ตัดสินใจตำแหน่ง `catalog.html` (root หรือ `public/`)

## ตรวจสอบแล้ว

รัน `npm install && npm run build` (Vite) กับไฟล์ทั้งหมดจริง — ผ่านไม่มี error
