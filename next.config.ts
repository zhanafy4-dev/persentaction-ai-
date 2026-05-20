import type { NextConfig } from "next";

// standalone = Docker/Railway only; Vercel uses its own output.
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
