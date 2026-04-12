const apiKey = "YOUR_GROQ_API_KEY";

async function checkLimits() {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1
      }),
    });

    console.log("Status:", res.status);
    
    // Log all headers for debugging
    console.log("--- All Headers ---");
    for (const [key, value] of res.headers.entries()) {
      if (key.includes("ratelimit")) {
        console.log(`${key}: ${value}`);
      }
    }

    if (!res.ok) {
      const data = await res.json();
      console.log("Error Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkLimits();
