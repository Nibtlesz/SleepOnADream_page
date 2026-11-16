import type { Metadata } from "next";
import { CartView } from "@/components/store/CartView";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-site pt-28 pb-24 md:pt-36">
      <h1 className="display mb-10 text-6xl md:text-8xl">Carrito</h1>
      <CartView />
    </div>
  );
}
