// This serverless function works on Vercel
// It acts as a proxy to the GNews API to avoid CORS issues

export default async function handler(req, res) {
  
  // Allow requests from any origin (CORS headers)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get query parameters from request
  const { q, category = "general" } = req.query;

  // Your GNews API key
  const API_KEY = "994ad92756a3d2e963f645d08c268201";
  
  let url;
  
  // If there's a search query, use search endpoint
  if (q && q !== "latest") {
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&apikey=${API_KEY}`;
  } else {
    // Otherwise use top-headlines with category filter
    url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&max=10&apikey=${API_KEY}`;
  }

  try {
    // Fetch news from GNews API
    const r = await fetch(url);
    const data = await r.json();
    
    // Return the news data
    return res.status(200).json(data);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
