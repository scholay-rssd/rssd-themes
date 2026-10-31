import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

const profiles = JSON.parse(readFileSync(new URL("../../../../sites/profiles.json", import.meta.url), "utf8"));
const navigation = process.env.SCHOLAY_SITE_NAVIGATION || JSON.stringify(profiles.find((site: { id: string }) => site.id === "personal").navigation);

const nextConfig: NextConfig = {
  output: "export",
  turbopack: { root: process.cwd() },
  trailingSlash: true,
  env: { SCHOLAY_SITE_NAVIGATION: navigation },
};

export default nextConfig;
