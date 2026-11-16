import type { Metadata } from "next";
import { CartView } from "@/components/store/CartView";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.cart, robots: { index: false } };
}

export default async function CartPage() {
  const { t } = await getI18n();
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <h1 className="display mb-10 text-6xl md:text-8xl">{t.cart.title}</h1>
      <CartView />
    </div>
  );
}
