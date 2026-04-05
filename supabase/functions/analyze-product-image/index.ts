import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image URL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const prompt = `You are a BIS (Bureau of Indian Standards) product safety analysis assistant for Indian consumers. Analyze the product image and provide a detailed BIS-focused safety assessment.

Identify the specific product type (e.g., "LPG gas cylinder", "electric heater", "phone charger") — be as specific as possible, not generic.

Provide:
1. Exact product name/type (be specific — e.g. "LPG domestic gas cylinder" not just "cylinder")
2. Any visible ISI/BIS marks, certification numbers, or safety labels
3. Brand name if visible
4. Product category for BIS purposes (e.g., "LPG equipment", "electrical appliance", "electronics")
5. BIS/IS standard that applies to this product (e.g., IS 3196 for LPG cylinders)
6. Specific safety risks associated with THIS product type
7. Risk assessment (low/medium/high) based on visual inspection and product type

Respond in JSON format:
{
  "productName": "specific product name",
  "brand": "string or null",
  "category": "string",
  "applicableStandard": "IS XXXX or null",
  "certificationMarks": ["list of visible marks"],
  "certificationNumber": "string or null",
  "safetyObservations": ["list of specific observations for this product"],
  "riskLevel": "low|medium|high",
  "summary": "Brief 2-sentence summary specific to this product",
  "recommendation": "Specific BIS safety recommendation for this product type"
}`;

    // Build the image content part for OpenRouter (OpenAI vision format)
    let imageContent: any;
    if (imageUrl.startsWith('data:')) {
      imageContent = { type: "image_url", image_url: { url: imageUrl } };
    } else {
      // Fetch remote image and convert to base64
      const imgResp = await fetch(imageUrl);
      const mimeType = imgResp.headers.get("content-type") || "image/jpeg";
      const buf = await imgResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      imageContent = { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              imageContent,
            ],
          },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, riskLevel: "medium" };
    } catch {
      analysis = { summary: content, riskLevel: "medium" };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing product image:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
