-- Idioma en que se hizo cada pedido (es | en)
ALTER TABLE "Order" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es';
