import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generate embedding using Gemini
 */
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text }]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured (needed for embeddings)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { batch_size = 10, offset = 0 } = await req.json().catch(() => ({}));

    // Fetch chunks without embeddings
    const { data: chunks, error: fetchError } = await supabase
      .from('bis_knowledge_chunks')
      .select('id, content')
      .is('embedding', null)
      .range(offset, offset + batch_size - 1);

    if (fetchError) {
      throw fetchError;
    }

    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No chunks without embeddings found",
        processed: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${chunks.length} chunks...`);
    let processed = 0;
    let failed = 0;

    // Process chunks one by one to avoid rate limits
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.content, geminiApiKey);
        
        const { error: updateError } = await supabase
          .from('bis_knowledge_chunks')
          .update({ embedding })
          .eq('id', chunk.id);

        if (updateError) {
          console.error(`Error updating chunk ${chunk.id}:`, updateError);
          failed++;
        } else {
          processed++;
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error processing chunk ${chunk.id}:`, error);
        failed++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      processed,
      failed,
      total_found: chunks.length,
      message: `Processed ${processed} chunks, ${failed} failed`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-embeddings error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
