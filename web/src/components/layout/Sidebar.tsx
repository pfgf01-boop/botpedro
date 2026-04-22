"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  CreditCard,
  CheckCircle2,
  FileText,
  ListTodo,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/extras", label: "Extras", Icon: Sparkles },
  { href: "/cartoes", label: "Cartões", Icon: CreditCard },
  { href: "/contas-pagas", label: "Contas Pagas", Icon: CheckCircle2 },
  { href: "/listas", label: "Listas", Icon: ListTodo },
  { href: "/relatorios", label: "Relatórios", Icon: FileText },
  { href: "/historico", label: "Histórico", Icon: History },
  { href: "/configuracoes", label: "Configurações", Icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-canvas-sunken p-4 gap-1">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <div className="w-8 h-8 rounded-md bg-gradient-primary" />
        <div>
          <p className="text-sm font-semibold leading-none">BOTI</p>
          <p className="text-[10px] text-ink-dim mt-0.5">Farm Home</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-surface-2 text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-surface-1",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto text-[10px] text-ink-dim px-2">
        v0.2 · Fase 2
      </div>
    </aside>
  );
}
