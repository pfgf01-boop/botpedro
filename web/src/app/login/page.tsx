import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar — BOTI" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card animate-fadeUp">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-md bg-gradient-primary" />
              <span className="text-xl font-semibold tracking-tight">BOTI</span>
            </div>
            <h1 className="text-2xl font-semibold">Bem-vindo de volta</h1>
            <p className="text-ink-muted mt-1 text-sm">
              Enviaremos um link mágico para seu email.
            </p>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-ink-dim mt-6">
          Farm Home · Gestão Financeira
        </p>
      </div>
    </main>
  );
}
