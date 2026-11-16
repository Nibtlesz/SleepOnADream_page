import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { getI18n } from "@/i18n/server";
import { paymentOptions } from "@/server/payments/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.checkout, robots: { index: false, follow: false } };
}

export default async function CheckoutPage() {
  const { t } = await getI18n();
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <h1 className="display mb-10 text-6xl md:text-8xl">{t.checkout.title}</h1>
      <CheckoutFlow paymentOptions={paymentOptions()} />
    </div>
  );
}
