# Jonglock Management Frontend Agent Guide

## Context

Frontend นี้พัฒนาขึ้นใหม่จาก legacy CodeIgniter views ใน `/Users/zone-idea/Desktop/scmarket/application/views`.

หน้าจอเดิมที่ใช้เป็น reference:

- `Login.php`: หน้า login ระบบจัดการ
- `Sidebar.php`: โครงเมนูหลักและสิทธิ์เดิม
- `Dashboard.php`: dashboard template เดิม
- `Market/*`: รายชื่อตลาด, ข้อมูลทั่วไป, แบบบูธ, จัดการบูธ, วันหยุด, banner, gallery, บริการเสริม
- `Product/*`: ประเภทสินค้า, หมวดหมู่สินค้า, รายการสินค้า
- `Coupon/*`: สร้างโค้ดส่วนลด, รายการแจกโค้ด
- `Booking/*`: จองแทนสมาชิก, แก้ไขการจอง
- `Report/*` และ `Reports/*`: รายงานการจอง, บูธว่าง, การชำระเงิน, รายวัน, รายบุคคล, รายการหลุดจอง
- `Check/*`: ตรวจสอบตลาด, ค่าปรับ, สินค้าชำรุด
- `Member/*`, `Partners/*`, `Announce/*`: legacy references only; new membership/profile flows are split between public mobile APIs and management tenant pages.

ระบบใหม่ใช้ React + Vite + Tailwind CSS และเชื่อมกับ backend Node API.

## Route/API Rules

- Management API base URL อยู่ใน `VITE_API_BASE_URL`
- ค่า UAT คือ `https://jonglockapi.zonedevnode.com/management`
- ค่า Production คือ `https://api.jonglock.com/management`
- Market deep link base URL อยู่ใน `VITE_MARKET_DEEP_LINK_BASE_URL` เช่น `https://jonglock.com/market`
- Login ใช้ `POST /auth/login`
- หลัง login ให้เก็บ token ใน localStorage key `jonglock.management.session`
- ทุก request หลัง login ต้องส่ง `Authorization: Bearer <token>`

## Role Rules

ใช้ role และ menus ที่ backend ส่งกลับมา:

- `supervisor`: เห็นทุกเมนูใน organization
- `admin`: เห็นเมนูตลาด, สินค้า, โค้ดส่วนลด, การจอง, Report, ตรวจสอบตลาด เฉพาะตลาดที่มอบหมาย
- `accounting`: เห็นเฉพาะบัญชี และ dashboard ที่ไม่เรียก market/report endpoint
- `audit`: ไม่ควรเข้า frontend management นี้ ใช้ mobile audit app เท่านั้น

ห้าม hardcode สิทธิ์ข้ามจาก backend ยกเว้นเพื่อซ่อนเมนูตาม `user.menus`.

## Current Pages

- `/login`: login
- `/`: dashboard
- `/markets`: list/create markets
- `/market-info`: market profile, opening hours, contact, VAT/payment settings, and deep-link QR
- `/booth-types`: floor plan/booth type management
- `/booths`: booth management
- `/holiday-calendar`: market holiday management
- `/market-images`: market image gallery
- `/accessories`: accessory management
- `/product-categories`, `/product-groups`, `/products`: product master data
- `/coupons`, `/coupon-assignments`: coupon creation and assignment views
- `/bookings`, `/booking-edit`, `/booking-edits`: booking creation, edit, and edit history
- `/booking-payment-proofs`: manual payment proof review
- `/reports`, `/report-booths`, `/report-payments`, `/report-daily`, `/report-person`: booking/report views
- `/audit`, `/audit-fines`, `/audit-fines-paid`, `/audit-defective`: audit checks and fine reports
- `/announcements/news`: news announcement management
- `/tenant-types`, `/tenants`, `/tenants/pending`: tenant master data and approval
- `/accounting`, `/accounting-payments`, `/accounting-summary`, `/accounting-documents`, `/accounting-tax-sales`, `/accounting-receivables`, `/accounting-reconciliation`, `/accounting-refunds`, `/accounting-product-types`: accounting reports and documents
- `/organization-settings`: organization profile, VAT, and payment settings
- `/pdpa`: PDPA content/assets
- `/admins`: create admin users and role reference
- `/support/tickets`: ticket สำหรับแจ้งปัญหา ข้อเสนอแนะ และขอฟีเจอร์เพิ่มเติม พร้อมแนบรูปและผูก event log
- `/support/chat`: สอบถามทั่วไปแบบ chat thread กับเจ้าหน้าที่ โดยใช้ `support_chats` แยกจาก ticket

## Frontend Structure

โครงสร้างใหม่ต้องไม่เพิ่ม logic ทั้งหมดลง `src/App.jsx` อีกต่อไป:

- `src/App.jsx`: route composition และ legacy pages ที่ยังรอแยก
- `src/app/`: app-level config เช่น menu/navigation และ shell-level helpers
- `src/components/`: shared UI components เช่น Card, DataTable, EmptyState, LoadingBlock, PageHeader, StatusBadge
- `src/pages/<Feature>/`: page-level component ของแต่ละเมนูหรือ feature
- `src/features/<feature>/`: business helpers เฉพาะ feature เช่น import/export หรือ mapper
- `src/utils/`: formatter, className helper, report/file helpers ที่ไม่มี React state

เมื่อแก้หน้าเดิม ให้ทยอยย้ายเฉพาะ feature นั้นออกจาก `App.jsx` ไปที่ `src/pages/<Feature>/` พร้อม import shared component จาก `src/components/` เพื่อให้ maintenance ง่ายและลดความเสี่ยงจากไฟล์ใหญ่ไฟล์เดียว

## Design Direction

- เป็น operational tool ไม่ใช่ landing page
- UI ต้องหนาแน่นพอสำหรับงานซ้ำ ๆ: table, filter, form panel, status badge
- ใช้สีพื้นฐานแบบ restrained: slate/white พร้อมสถานะ emerald, amber, blue, red
- ห้ามซ่อน state สำคัญ เช่น loading, empty, error
- ใช้ `lucide-react` สำหรับ icon
- Tailwind class ควรอยู่ใน component โดยตรง เว้นแต่ style global จำเป็น

## Development

```bash
npm install
npm run dev
npm run build
```

หลังแก้ไข frontend ทุกครั้งต้องรัน `npm run build` ให้ผ่านก่อนส่งงานหรือ push เสมอ แม้เป็นการแก้ข้อความหรือ layout เล็กน้อย เพื่อยืนยันว่า production bundle ยัง build ได้จริง

ถ้าต้องทดสอบกับ backend local:

```bash
cd ../backend
npm run migrate
npm run seed:demo
npm start
```

บัญชี seed:

```text
admin / Admin@123456
marketadmin / Admin@123456
accounting / Admin@123456
vendor001 / Vendor@123456
```

## Important Constraints

- `.env`, `dist`, `node_modules` ต้องไม่ commit
- อย่าใส่ DB password หรือ JWT secret ใน frontend
- หน้า frontend ต้องไม่รับ `organization_id` จากผู้ใช้หลัง login; backend เป็นผู้ตัดสิน scope จาก token
- ถ้าเพิ่มหน้าใหม่ ให้เพิ่มเมนูโดยผูกกับ `menuKey` ที่ backend ส่งใน `user.menus`
