import type { NextConfig } from "next";

// standalone = Docker/Railway only; Vercel uses its own output.
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  serverExternalPackages: ["bcrypt", "pg", "@prisma/client", "@prisma/adapter-pg"],
};

export default nextConfig;
