# Jonglock Management Domains

## UAT

- Management app: `https://jonglockmng.zonedevnode.com`
- Management API: `https://jonglockapi.zonedevnode.com/management`
- Market deep link base URL: `https://jonglock.zonedevnode.com/market`

## Production

- Management app: `https://management.jonglock.com`
- Management API: `https://api.jonglock.com/management`
- Market deep link base URL: `https://jonglock.com/market`

## Environment Variables

```bash
VITE_API_BASE_URL=https://api.jonglock.com/management
VITE_MARKET_DEEP_LINK_BASE_URL=https://jonglock.com/market
```

Use UAT values for development and UAT hosting. Use Production values only for production builds.
