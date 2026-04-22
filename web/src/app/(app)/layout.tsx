import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// Todas as rotas autenticadas dependem de sessão (cookies) e devem ser dinâmicas.
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 animate-fadeUp">{children}</main>
      </div>
    </div>
  );
}
