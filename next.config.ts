import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  // Zapewnienie poprawnego działania z Drizzle ORM
  webpack: (config) => {
    // Dodajemy obsługę natywnych modułów Node.js
    config.externals.push({
      'pg-native': 'pg-native',
    });
    return config;
  },
};

export default nextConfig;
