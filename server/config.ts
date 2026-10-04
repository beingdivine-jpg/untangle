import type { ServicesConfig } from "./community.js";
export const servicesConfig = (): ServicesConfig => ({
  enabled: process.env.COMMUNITY_ENABLED === "true",
  aiEnabled: process.env.LIVE_COACH_ENABLED === "true",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
});
