export const PRO_MONTHLY_USD = Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE ?? "9.99") || 9.99;

export type SubscriptionStatus = "free" | "pro";
