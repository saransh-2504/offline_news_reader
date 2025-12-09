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

  // NewsData.io API key
  const API_KEY = "pub_62558e0e0e0c8c8f8b8e8e8e8e8e8e8e";
  
  // Map categories
  const categoryMap = {
    'general': 'top',
    'business': 'business',
    'entertainment': 'entertainment',
    'health': 'health',
    'science': 'science',
    'sports': 'sports',
    'technology': 'technology',
    'world': 'world'
  };
  const mappedCategory = categoryMap[category] || 'top';
  
  let url;
  
  // If there's a search query, use search
  if (q) {
    url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent(q)}&language=en&size=10`;
  } else {
    // Otherwise use category filter
    url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&category=${mappedCategory}&language=en&size=10`;
  }

  try {
    // Fetch news from NewsData.io API
    const r = await fetch(url);
    const data = await r.json();
    
    // Return the news data
    return res.status(200).json(data);
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
