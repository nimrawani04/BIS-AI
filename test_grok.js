const fetch = require('node-fetch');

async function test() {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VITE_GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Test" }]
    }),
  });
  console.log(resp.status);
  const text = await resp.text();
  console.log(text);
}

test();
