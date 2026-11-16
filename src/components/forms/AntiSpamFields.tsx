"use client";

import { useEffect, useRef } from "react";

/**
 * Campos ocultos antispam: honeypot ("company") + hora de render del formulario.
 * El servidor rechaza envíos con honeypot lleno o hechos en menos de 2.5 s.
 */
export function AntiSpamFields() {
  const ts = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ts.current) ts.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          No llenar este campo
          <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={ts} type="hidden" name="renderedAt" defaultValue="1" />
    </>
  );
}
