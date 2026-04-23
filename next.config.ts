import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para que o Supabase funcione corretamente
  serverExternalPackages: [],
  // Evita erros de prerender com variáveis de ambiente
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export default nextConfig;
