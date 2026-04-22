import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

function loadEnv(): Env {
  const parsed = schema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${JSON.stringify(parsed.error.format(), null, 2)}`,
    );
  }
  return parsed.data;
}

// Proxy lazy: só valida quando alguma propriedade é acessada em runtime.
// Isso permite que `next build` conclua sem envs definidos (ex: Vercel antes da 1ª config).
export const env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    if (!cached) cached = loadEnv();
    return cached[prop];
  },
});
