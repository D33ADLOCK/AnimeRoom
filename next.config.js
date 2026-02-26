/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-a84c9577f3e14dc795b6c4efb1ecb53b.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default config;
