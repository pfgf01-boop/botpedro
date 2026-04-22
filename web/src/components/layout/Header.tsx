import { LogOut } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-canvas">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-ink-dim">
          Farm Home
        </p>
        <p className="text-sm text-ink-muted">Gestão financeira</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-ink-muted">Conectado como</p>
          <p className="text-sm font-medium">{user?.email ?? "—"}</p>
        </div>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-sm text-ink-muted hover:text-ink transition-colors"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
