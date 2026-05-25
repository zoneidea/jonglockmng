import { createContext, useContext } from 'react';

export const SubscriptionContext = createContext({
  subscription: null,
  featureKey: 'dashboard',
  actionBlocked: false,
  blockedMessage: '',
});

const subscriptionFeatureByPath = [
  [/^\/organization-settings/, 'organization_settings'],
  [/^\/admins/, 'admin_management'],
  [/^\/pdpa/, 'pdpa_management'],
  [/^\/announcements/, 'announcements'],
  [/^\/tenant/, 'tenant_management'],
  [/^\/market-info|^\/markets|^\/holidays|^\/holiday-calendar|^\/market-images|^\/accessories/, 'market_management'],
  [/^\/booth-types|^\/booths/, 'booth_management'],
  [/^\/product-categories|^\/product-groups|^\/products/, 'product_management'],
  [/^\/coupons|^\/coupon-assignments/, 'coupon_management'],
  [/^\/bookings|^\/booking-edit|^\/booking-edits|^\/booking-payment-proofs/, 'booking_management'],
  [/^\/reports|^\/report-/, 'reports'],
  [/^\/audit/, 'market_audit'],
  [/^\/accounting/, 'accounting'],
];

export function resolveSubscriptionFeature(pathname = '/') {
  return subscriptionFeatureByPath.find(([pattern]) => pattern.test(pathname))?.[1] || 'dashboard';
}

export function buildSubscriptionGate(subscription, featureKey) {
  if (!subscription) {
    return {
      actionBlocked: false,
      blockedMessage: '',
    };
  }
  if (!subscription.writeAllowed) {
    return {
      actionBlocked: true,
      blockedMessage: 'แพ็คเกจหมดอายุหรือยังไม่พร้อมใช้งาน ระบบเปิดให้ดูข้อมูลได้เท่านั้น',
    };
  }
  if (subscription.fullFunction || subscription.plan?.isFullFunction) {
    return {
      actionBlocked: false,
      blockedMessage: '',
    };
  }
  const entitlement = subscription.entitlements?.[featureKey];
  if (!entitlement || entitlement.enabled === false) {
    return {
      actionBlocked: true,
      blockedMessage: 'แพ็คเกจปัจจุบันไม่รองรับฟังก์ชั่นนี้',
    };
  }
  return {
    actionBlocked: false,
    blockedMessage: '',
  };
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
