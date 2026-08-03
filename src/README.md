# โครงสร้างไฟล์หลังแตก component

ไฟล์เดิม `PokemonGoShop.jsx` (4,079 บรรทัด) ถูกแตกออกเป็นไฟล์ย่อยตาม logical unit เดิมที่มีอยู่แล้วในไฟล์
(component/ฟังก์ชันแต่ละตัวถูกย้ายไปอยู่ไฟล์ของตัวเอง โค้ดข้างในไม่ถูกแก้ไข มีแค่เพิ่ม import/export)

```
src/
├── App.jsx              # component หลัก (state, effects, ตัวเชื่อมทุกอย่างเข้าด้วยกัน) — default export
├── constants.js          # ORDER_TYPES, PAYMENT_STATUS, TRADE_STATUS, HIRE_STATUS, INVEST_TYPES,
│                          # POKEMON_VARIANTS, HIRE_MODES, STORAGE_KEY
├── utils.js               # ฟังก์ชันช่วยเหลือทั่วไป (fmtMoney, fmtDate, genId, migrateData, adjustStock ฯลฯ)
├── receipt.js             # สร้าง/วาดใบเสร็จ (buildReceiptLines, buildReceiptData, downloadReceiptImage ฯลฯ)
├── GlobalStyle.jsx        # CSS ทั้งหมดของแอป
├── idb.js, googleSync.js  # ไฟล์เดิมที่คุณมีอยู่แล้ว (import path เดิม ไม่ต้องแก้)
└── components/
    ├── StatusDot.jsx, StatCard.jsx, Modal.jsx, EmptyState.jsx, ShopLogo.jsx, SubHeader.jsx
    ├── LockScreen.jsx, ImageCropModal.jsx
    ├── Header.jsx, BottomNav.jsx, MoreSheet.jsx
    ├── Dashboard.jsx
    ├── OrdersTab.jsx, VariantChips.jsx, RoundsEditor.jsx, OrderModal.jsx, ProofImagePicker.jsx, ReceiptModal.jsx
    ├── CustomersTab.jsx, CustomerModal.jsx, DueSoonModal.jsx, DebtModal.jsx, CustomerDetail.jsx
    ├── AccountsTab.jsx, AccountModal.jsx, AccountDetail.jsx, StockModal.jsx, StockMovementHistory.jsx
    ├── TradeTab.jsx, HireTab.jsx
    ├── FinanceTab.jsx, TxModal.jsx, TrashModal.jsx
    ├── ReportsTab.jsx
    └── SettingsTab.jsx
```

## สิ่งที่ต้องทำต่อ

1. เอาโฟลเดอร์ `src/` นี้ไปวางแทนที่ตำแหน่งเดิมของ `PokemonGoShop.jsx` ในโปรเจกต์ (หรือ merge เข้ากับโฟลเดอร์ `src` ที่มีอยู่)
2. ก็อปวาง `idb.js` และ `googleSync.js` ของคุณเข้าไปในโฟลเดอร์ `src/` เดียวกัน (ไฟล์นี้ผมไม่มีต้นฉบับ เพราะมีแค่ `PokemonGoShop.jsx` ถูกอัปโหลดมา)
3. ที่ไหนก็ตามที่เดิม `import App from "./PokemonGoShop"` (หรือชื่อไฟล์เดิม) ให้แก้เป็น `import App from "./src/App"` (หรือ path ที่ตรงกับที่คุณวางไฟล์จริง)

## หลักการแตกไฟล์

- ทุก component/ฟังก์ชันถูกย้าย "ตามตัว" ไม่มีการเปลี่ยน logic ใด ๆ ข้างใน
- import ของแต่ละไฟล์ถูกคำนวณอัตโนมัติจากการใช้งานจริงในไฟล์นั้น ๆ (icon จาก lucide-react, hook จาก react, ฟังก์ชันจาก utils/constants/receipt, และ component ย่อยที่เรียกใช้กัน)
- ตรวจสอบ syntax ผ่าน TypeScript compiler แบบ parse-only แล้วว่าไม่มี syntax error และไม่มีชื่อตัวแปร/ฟังก์ชันที่ import ขาดหายไปในทุกไฟล์
