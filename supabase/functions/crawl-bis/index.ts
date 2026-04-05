import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scraping is now done locally via `npm run scrape:bis`.
 * This edge function is kept as a placeholder and returns a 410 Gone.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return new Response(
    JSON.stringify({
      error: "Scraping has moved to a local script.",
      instructions: "Run `npm run scrape:bis` on your machine to scrape BIS and push chunks to Supabase.",
    }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
