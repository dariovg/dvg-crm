"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const SHORTCUTS = [
  { keys: "⌘ K", desc: "Búsqueda global" },
  { keys: "N", desc: "Nuevo lead (en Leads)" },
  { keys: "G → L", desc: "Ir a Leads" },
  { keys: "G → D", desc: "Ir a Resumen" },
  { keys: "G → P", desc: "Ir a Pipeline" },
  { keys: "G → T", desc: "Ir a Tareas" },
  { keys: "G → C", desc: "Ir a Calendario" },
  { keys: "?", desc: "Ver atajos" },
  { keys: "Esc", desc: "Cerrar modal" },
];

export default function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingG = useRef(false);
  const gTimer = useRef(null);

  useEffect(() => {
    function clearG() {
      pendingG.current = false;
      if (gTimer.current) clearTimeout(gTimer.current);
    }

    function onKey(e) {
      const tag = e.target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        e.target?.isContentEditable;

      if (e.key === "Escape") {
        setHelpOpen(false);
        return;
      }

      if (typing && e.key !== "Escape") return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (e.metaKey || e.ctrlKey) return;

      if (pendingG.current) {
        e.preventDefault();
        clearG();
        const map = {
          l: "/leads",
          d: "/dashboard",
          p: "/pipeline",
          t: "/tasks",
          c: "/calendar",
        };
        const route = map[e.key.toLowerCase()];
        if (route) router.push(route);
        return;
      }

      if (e.key === "g" || e.key === "G") {
        pendingG.current = true;
        gTimer.current = setTimeout(clearG, 1200);
        return;
      }

      if (e.key === "n" || e.key === "N") {
        if (pathname === "/leads" || pathname.startsWith("/leads")) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("crm:new-lead"));
        } else {
          router.push("/leads?new=1");
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearG();
    };
  }, [router, pathname]);

  if (!helpOpen) return null;

  return (
    <div className="search-overlay" onClick={() => setHelpOpen(false)}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Atajos de teclado</h2>
        <ul className="shortcuts-list">
          {SHORTCUTS.map((s) => (
            <li key={s.keys}>
              <kbd>{s.keys}</kbd>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
        <p className="search-foot">
          Pulsa <kbd>?</kbd> para cerrar
        </p>
      </div>
    </div>
  );
}
