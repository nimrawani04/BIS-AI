import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are the ISI Guardian Home Safety Analyst. You receive a list of household products with their certification status and safety score.

Generate a personalized home safety analysis in markdown. Be specific about each product. Use this structure:

## 🏠 Your Home Safety Analysis

### Priority Actions
List the most urgent safety actions needed, numbered. Be specific about which product and what to do.

### Product-by-Product Assessment
For each product, give a brief 1-2 line assessment with specific advice.

### Room-by-Room Tips
Based on the product categories, provide 3-4 practical tips for the rooms these products are likely in (kitchen, electrical areas, etc.).

### Your Action Plan
A prioritized 3-step action plan to improve the home safety score.

Keep it concise, practical, and focused on Indian consumer safety standards. Use emojis sparingly for visual clarity.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { products, score } = await req.json();
    if (!products) {
      return new Response(JSON.stringify({ error: "Missing products" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "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";
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Home Safety Score: ${score}/100\n\nProducts scanned:\n${products}\n\nPlease provide a detailed home safety analysis.` },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("OpenRouter API error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("home-safety-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
