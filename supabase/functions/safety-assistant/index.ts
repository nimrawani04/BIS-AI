import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are the ISI Guardian Smart Safety Assistant — an expert on Indian product safety standards and BIS (Bureau of Indian Standards) certifications.

When a user asks about a product (e.g. "helmet", "pressure cooker", "electric heater", "extension board"), respond with a structured pre-purchase safety guide in this exact markdown format:

## 🛡️ [Product Name] Buying Guide

### Required Certification
State the required ISI/BIS mark and the relevant Indian Standard number (e.g. IS 4151:2015 for helmets).

### ✅ Check These Before Buying
List 5-7 specific safety checks as a checklist using "- ✔" format. Be practical and specific.

### ⚠️ Red Flags to Watch For
List 3-5 warning signs of fake or unsafe products using "- ⚠" format.

### 💡 Pro Tips
Give 2-3 practical buying tips specific to Indian markets (online and offline).

### 📋 Quick Verdict
One short paragraph summarizing: always buy ISI-certified, check for [key things], and avoid [key risks].

Keep responses concise, practical, and focused on Indian consumer safety. If the product doesn't require BIS certification, mention that but still provide general safety guidance. If the query is not about a product, politely redirect to product safety topics.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Missing query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENROUTER_API_KEY = Deno.env.get("GROK_API_KEY") || Deno.env.get("OPENROUTER_API_KEY") || Deno.env.get("XAI_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("AI API Key is not configured");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Give me a pre-purchase safety guide for: ${query}` },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
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

    // OpenRouter streams in OpenAI SSE format natively — pass through directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("safety-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
