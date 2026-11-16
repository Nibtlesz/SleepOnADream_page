import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { paymentOptions } from "@/server/payments/config";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <h1 className="display mb-10 text-6xl md:text-8xl">Checkout</h1>
      <CheckoutFlow paymentOptions={paymentOptions()} />
    </div>
  );
}
