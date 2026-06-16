# Frontend Rules

ใช้กับโปรเจกต์ `frontend/` เท่านั้น

## 1. Stack และขอบเขต

- React + Vite + Tailwind
- operational management UI ไม่ใช่ marketing site
- ใช้ SweetAlert2 สำหรับ alert/confirm ของระบบจัดการ
- Firebase client ไม่ใช่ dependency หลักของโปรเจกต์นี้ในสภาพปัจจุบัน

## 2. โครงสร้างที่ต้องรักษา

- `src/App.jsx` ใช้สำหรับ route composition และจุดรวมที่ยังจำเป็นเท่านั้น
- shared UI อยู่ใน `src/components/*`
- app-level state/config อยู่ใน `src/app/*`, `src/state/*`
- utility/shared formatter อยู่ใน `src/utils/*`
- เมื่อแก้ feature เดิม ให้พยายามวาง logic ใหม่ไว้ใน file/component ที่อยู่ใกล้ feature นั้น ไม่กองเพิ่มใน `App.jsx`

## 3. API และ Session

- ใช้ `VITE_API_BASE_URL`
- ส่ง `Authorization: Bearer <token>` หลัง login
- session storage key หลักต้องสอดคล้องกับระบบเดิม
- อย่ารับ `organization_id` จาก UI เพื่อใช้เป็น source of truth หลัง login

## 4. Design Rules

- หน้าจอเป็น work-focused console
- ต้องเน้น:
  - table/filter/form ที่อ่านเร็ว
  - loading/empty/error state ชัด
  - layout สมมาตร
  - spacing สม่ำเสมอ
- อย่าทำให้หน้ารายงานหรือหน้าจัดการกลายเป็น landing-style layout

## 5. Token Efficiency สำหรับ Frontend

- เริ่มอ่านจาก:
  - `AGENT.md`
  - `README.md`
  - `package.json`
  - `src/App.jsx`
  - component/shared file ที่เกี่ยวข้อง
- ใช้ `rg` หา page, menu key, route path, API path ก่อนเปิดไฟล์ใหญ่
- ถ้าเจอ symbol ใน `App.jsx` ให้เปิดเฉพาะช่วงบรรทัดที่เกี่ยวข้อง ไม่ต้องอ่านทั้งไฟล์ทุกครั้ง
- ถ้างานเกี่ยวกับ report/table:
  - เปิด `ReportTable`, `DataTable`, formatter, page/component ที่ render report นั้น

## 6. Verification

- หลังแก้ทุกครั้งต้องรัน `npm run build`
- ถ้าแก้ state/api สำคัญ ให้ตรวจ error boundary, loading fallback, และ auth/session behavior ด้วย
- ถ้าแก้ route/menu ให้ตรวจว่า role-based access ยังไม่พัง

## 7. เอกสารอ้างอิง

- `frontend/BLUEPRINT.md` ยังไม่มีใน repository ปัจจุบัน
- ให้ใช้ `AGENT.md`, `README.md`, โครงสร้าง `src/`, และ route จริงในโค้ดเป็น source of truth แทนจนกว่าจะมี blueprint แยก
