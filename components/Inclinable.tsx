"use client";

import { useRef, type ReactNode } from "react";

/** Incline son contenu en perspective sous le doigt ou la souris (effet carte en relief). */
export default function Inclinable({ children, className, force = 12 }: { children: ReactNode; className?: string; force?: number }) {
  const el = useRef<HTMLDivElement>(null);

  function incliner(e: React.PointerEvent) {
    const r = el.current?.getBoundingClientRect();
    if (!r || !el.current) return;
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.current.style.transform = `perspective(900px) rotateX(${-y * force}deg) rotateY(${x * force}deg) scale(1.02)`;
  }

  function redresser() {
    if (el.current) el.current.style.transform = "";
  }

  return (
    <div
      ref={el}
      onPointerMove={incliner}
      onPointerLeave={redresser}
      onPointerUp={redresser}
      className={`transition-transform duration-200 ease-out [transform-style:preserve-3d] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
