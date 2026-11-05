# Jonglock Management Frontend

React + Tailwind management UI สำหรับระบบ Jonglock.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Build

```bash
npm run build
```

## Backend

ตั้งค่า API ที่ `.env`:

```bash
VITE_API_BASE_URL=https://jonglockapi.zonedevnode.com/management
```

รายละเอียด workflow และสิทธิ์อยู่ใน [AGENT.md](./AGENT.md).

Organization payment settings are managed on `/organization-settings` and apply to
all markets in that organization. The old market-info payment form has been moved.
Backend migration 056 must run before deploying this version; see
`backend/docs/ORGANIZATION_PAYMENT_SETTINGS.md` in the workspace for the API and
migration contract. Registered bank fields remain encrypted on the backend.
