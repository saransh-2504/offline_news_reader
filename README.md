📄 Offline News Reader – OJT Project
--> An offline-capable news application built using HTML, CSS, JavaScript, GNews API, IndexedDB, and Infinite Scrolling.
--> This project was created for my On-Job Training (OJT) evaluation to demonstrate API integration, offline storage, UI design, and authentication logic.

🚀 Features
✔ User Authentication
  - Signup, Login, Logout
  - Forgot Password option
  - LocalStorage session system
  - Blur + fade animations for auth UI

✔ GNews API Integration
  - Fetches live news articles
  - Supports categories:
  - General
  - Technology
  - Sports
  - Entertainment
  - World

✔ Infinite Scrolling
  - Loads 10 new articles on each scroll
  - Uses rotating query keywords to simulate pagination
  - Smooth endless news stream

✔ Search (with Debouncing)
  - Real-time search with 500ms debounce
  - Resets feed when search is cleared

✔ Offline Mode (IndexedDB)
  - Saves fetched articles in IndexedDB
  - Automatically loads cached news when offline
  - Offline banner appears when internet is disconnected

✔ Save Articles ❤
  - Each article has a “Save” button
  - Saved articles stored in IndexedDB
  - Persist even after browser close
  - No duplicates allowed

✔ Saved Articles Page
  - Shows all saved articles
  - Delete saved items
  - Works completely offline

✔ Responsive UI
  - Clean newspaper-style theme
  - Mobile-friendly
  - Smooth interactions and animations


🛠 Tech Stack
Area                                      	Technology
Frontend                            	HTML, CSS, JavaScript
API	                                        GNews API
Storage	                              IndexedDB + LocalStorage
Features	                   Infinite Scroll, Search, Offline Mode
Tools	                               Live Server (VS Code)


📂 Project Structure
offline-news-reader/
│
├── index.html        # Main homepage with news feed
├── saved.html        # Saved articles page
├── java.js           # Full logic: auth + API + offline + save + scroll 
├── style.css         # UI styling
└── README.md         # Documentation
