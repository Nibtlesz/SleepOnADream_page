"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "./client";

/** `next/link` que agrega el prefijo del idioma actual a las rutas internas. */
export function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { href: localize } = useI18n();
  return <Link href={typeof href === "string" ? localize(href) : href} {...props} />;
}
