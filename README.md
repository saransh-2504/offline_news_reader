# 📰 Newzify Velvet - Offline News Reader

> A Progressive Web App (PWA) that allows you to read news articles offline with full functionality.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saransh-2504/offline_news_reader)

## ✨ Features

- ✅ **Offline-First Architecture** - Works completely offline after initial load
- ✅ **Service Worker** - Caches images and articles automatically  
- ✅ **IndexedDB Storage** - Stores user data, articles, and preferences
- ✅ **Category Filtering** - Browse news by Technology, Sports, Entertainment, World
- ✅ **Dark/Light Mode** - Theme preference persists offline
- ✅ **Save Articles** - Bookmark articles for later reading
- ✅ **User Authentication** - Login/Signup with offline support
- ✅ **Infinite Scrolling** - Smooth endless news stream
- ✅ **Search with Debouncing** - Real-time search functionality

## 🚀 Quick Deploy to Vercel

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Deploy! Your app will be live in seconds

**OR**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import: `https://github.com/saransh-2504/offline_news_reader`
4. Click "Deploy"

Your app will be live at: `https://your-project-name.vercel.app`

## 🛠 Tech Stack

| Area | Technology |
|------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Storage | IndexedDB |
| Caching | Service Worker |
| API | GNews API |
| Deployment | Vercel (Serverless Functions) |

## 📂 Project Structure

```
offline_news_reader/
├── api/
│   └── news.js          # Vercel serverless function
├── index.html           # Main page
├── saved.html           # Saved articles page  
├── java.js              # Main application logic
├── sw.js                # Service Worker
├── style.css            # Styles
├── vercel.json          # Vercel configuration
└── README.md            # Documentation
```

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/saransh-2504/offline_news_reader.git
cd offline_news_reader

# Open in browser
# Simply open index.html or use a local server:
python -m http.server 8000
# Visit http://localhost:8000
```

## 🧪 Testing Offline Mode

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Reload the page
5. Browse different categories - everything works offline!

## 🔧 Configuration

### API Key Setup

The GNews API key is configured in:
- `java.js` (line 340) - for localhost
- `api/news.js` (line 15) - for Vercel

Replace with your own API key from [GNews.io](https://gnews.io/)

## 📱 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari  
- ✅ Opera

**Requirements**: Service Worker support, IndexedDB support

## 🎯 How It Works

### Online Mode
1. Fetches articles from GNews API via Vercel serverless function
2. Service Worker caches images automatically
3. Articles stored in IndexedDB with category tags

### Offline Mode  
1. Service Worker serves cached images
2. Articles loaded from IndexedDB
3. Category filtering works with cached data
4. All preferences persist (theme, saved articles, login)

## 📄 License

MIT License - Feel free to use for your projects!

## 👨‍💻 Author

**Saransh** - OJT Project 2025

---

⭐ Star this repo if you found it helpful!
