import { PaymentAuthShell } from "@/app/payment/payment-auth-shell";
import { PaymentSuccessClient } from "@/app/payment/success/payment-success-client";

export default function PaymentSuccessPage() {
  return (
    <PaymentAuthShell>
      <PaymentSuccessClient />
    </PaymentAuthShell>
  );
}
