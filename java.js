document.addEventListener("DOMContentLoaded", () => {

    const authOverlay = document.getElementById("authOverlay");
    const signupBox = document.getElementById("signupBox");
    const loginBox = document.getElementById("loginBox");
    const forgotBox = document.getElementById("forgotBox");
    const greetUser = document.getElementById("greetUser");
    const newsContainer = document.querySelector(".news-container");
    const searchInput = document.getElementById("searchInput");
    const categoryButtons = document.querySelectorAll(".cat");
    const offlineBanner = document.getElementById("offlineBanner");
    const loader = document.getElementById("loader");
    
    // Show/hide offline indicator
    function updateOfflineStatus() {
        if (!navigator.onLine) {
            if (offlineBanner) {
                // Update the banner content with proper HTML structure
                offlineBanner.innerHTML = `
                    <span class="offline-icon">📵</span>
                    <span class="offline-text">You're Offline</span>
                    <span class="offline-subtext">Showing cached articles</span>
                `;
                offlineBanner.style.display = "flex";
                document.body.classList.add("offline-mode");
            }
        } else {
            if (offlineBanner) {
                offlineBanner.style.display = "none";
                document.body.classList.remove("offline-mode");
            }
        }
    }


    // INDEXEDDB SETUP - This will store everything (user data, articles, theme, etc.)
    let db;
    const DB_VERSION = 5; // Increased version to clear old cached data
    const DB_NAME = "newsDB";
    
    // Open or create the database
    const openReq = indexedDB.open(DB_NAME, DB_VERSION);
    
    // This runs when database is created or upgraded
    openReq.onupgradeneeded = (e) => {
        db = e.target.result;
        const oldVersion = e.oldVersion;
        
        // If upgrading from old version, clear articles store
        if (oldVersion > 0 && oldVersion < 5) {
            if (db.objectStoreNames.contains("articles")) {
                db.deleteObjectStore("articles");
            }
        }
        
        // Store for news articles (using composite key: link + category)
        if (!db.objectStoreNames.contains("articles")) {
            db.createObjectStore("articles", { keyPath: "id" }); // Changed to use 'id' as key
        }
        
        // Store for saved articles
        if (!db.objectStoreNames.contains("saved")) {
            db.createObjectStore("saved", { keyPath: "link" });
        }
        
        // Store for user account data (email, password, name)
        if (!db.objectStoreNames.contains("users")) {
            db.createObjectStore("users", { keyPath: "email" });
        }
        
        // Store for app settings (theme, logged user)
        if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "key" });
        }
    };

    // When database is successfully opened
    openReq.onsuccess = (e) => {
        db = e.target.result;
        
        // Fix articles with undefined category
        fixUndefinedCategories();
        
        // Load theme preference from IndexedDB
        loadThemeFromDB();
        
        // Update offline status
        updateOfflineStatus();
        
        // Check if user is logged in
        checkLoginStatus();
    };
    
    // Fix articles that have undefined category
    function fixUndefinedCategories() {
        if (!db) return;
        
        const tx = db.transaction("articles", "readwrite");
        const store = tx.objectStore("articles");
        const req = store.getAll();
        
        req.onsuccess = () => {
            const articles = req.result || [];
            let fixed = 0;
            
            articles.forEach(article => {
                if (!article.category || article.category === "undefined") {
                    article.category = "general"; // Default to general
                    store.put(article);
                    fixed++;
                }
            });
            

        };
    }

    openReq.onerror = (e) => {
        console.warn("IndexedDB failed to open", e);
    };

    // DARK MODE TOGGLE - Now using IndexedDB instead of localStorage
    const themeToggle = document.getElementById("themeToggle");
    
    // Function to load theme from IndexedDB
    function loadThemeFromDB() {
        if (!db) return;
        
        const tx = db.transaction("settings", "readonly");
        const store = tx.objectStore("settings");
        const req = store.get("themeMode");
        
        req.onsuccess = () => {
            const result = req.result;
            if (result && result.value === "dark") {
                document.body.classList.add("dark");
                themeToggle.textContent = "☀️";
            }
        };
    }
    
    // Theme toggle button click handler
    if (themeToggle) {
        themeToggle.style.cursor = "pointer";
        themeToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");
            themeToggle.textContent = isDark ? "☀️" : "🌙";
            
            // Save theme to IndexedDB
            if (db) {
                const tx = db.transaction("settings", "readwrite");
                const store = tx.objectStore("settings");
                store.put({ key: "themeMode", value: isDark ? "dark" : "light" });
            }
        });
    }

    // Function to check if user is logged in
    function checkLoginStatus() {
        if (!db) return;
        
        const tx = db.transaction("settings", "readonly");
        const store = tx.objectStore("settings");
        const req = store.get("loggedUser");
        
        req.onsuccess = () => {
            const result = req.result;
            
            if (result && result.value) {
                // User is logged in
                const email = result.value;
                
                // Get user details
                const userTx = db.transaction("users", "readonly");
                const userStore = userTx.objectStore("users");
                const userReq = userStore.get(email);
                
                userReq.onsuccess = () => {
                    const user = userReq.result;
                    if (user) {
                        greetUser.innerText = "Welcome, " + user.first + "!";
                        authOverlay.style.display = "none";
                        document.body.classList.remove("blur");
                        
                        // Load news articles
                        if (!navigator.onLine) {
                            // Reset to general category when loading offline
                            currentCategory = "general";
                            setActiveCategoryButton("general");
                            loadFromDBArticles();
                        } else {
                            loadNews();
                        }
                    }
                };
            } else {
                // No user logged in, show login screen
                document.body.classList.add("blur");
            }
        };
    }

    // Show login screen by default
    document.body.classList.add("blur");

    window.showLogin = function () {
        signupBox.style.display = "none";
        loginBox.style.display = "block";
        forgotBox.style.display = "none";
    };

    window.showSignup = function () {
        signupBox.style.display = "block";
        loginBox.style.display = "none";
        forgotBox.style.display = "none";
    };

    window.showForgot = function () {
        signupBox.style.display = "none";
        loginBox.style.display = "none";
        forgotBox.style.display = "block";
    };

    // SIGNUP FUNCTION - Now stores data in IndexedDB
    window.signup = function () {
        try {
            // Get values from signup form
            const user = {
                first: document.getElementById("firstName").value.trim(),
                last: document.getElementById("lastName").value.trim(),
                email: document.getElementById("signupEmail").value.trim(),
                password: document.getElementById("signupPassword").value.trim()
            };

            // Check if all fields are filled
            if (!user.first || !user.last || !user.email || !user.password) {
                alert("Please fill all fields.");
                return;
            }

            if (!db) {
                alert("Database not ready. Please try again.");
                return;
            }

            // Save user data to IndexedDB
            const tx = db.transaction("users", "readwrite");
            const store = tx.objectStore("users");
            store.put(user);
            
            // Save logged in user email to settings
            const settingsTx = db.transaction("settings", "readwrite");
            const settingsStore = settingsTx.objectStore("settings");
            settingsStore.put({ key: "loggedUser", value: user.email });

            // Update UI
            greetUser.innerText = "Welcome, " + user.first + "!";
            authOverlay.style.display = "none";
            document.body.classList.remove("blur");
            
            // Load news
            loadNews();

        } catch (err) {
            console.error("Signup error:", err);
            alert("An error occurred during signup.");
        }
    };

    // LOGIN FUNCTION - Now reads from IndexedDB
    window.login = function () {
        try {
            const email = document.getElementById("loginEmail").value.trim();
            const pass = document.getElementById("loginPassword").value.trim();

            if (!db) {
                alert("Database not ready. Please try again.");
                return;
            }

            // Get user from IndexedDB
            const tx = db.transaction("users", "readonly");
            const store = tx.objectStore("users");
            const req = store.get(email);

            req.onsuccess = () => {
                const user = req.result;

                // Check if user exists
                if (!user) {
                    alert("No account found. Please sign up first.");
                    return;
                }

                // Check password
                if (pass === user.password) {
                    // Save logged in user to settings
                    const settingsTx = db.transaction("settings", "readwrite");
                    const settingsStore = settingsTx.objectStore("settings");
                    settingsStore.put({ key: "loggedUser", value: user.email });

                    // Update UI
                    greetUser.innerText = "WELCOME, " + user.first + "!";
                    authOverlay.style.display = "none";
                    document.body.classList.remove("blur");

                    // Load news
                    if (!navigator.onLine) {
                        loadFromDBArticles();
                    } else {
                        loadNews();
                    }
                } else {
                    alert("Incorrect email or password.");
                }
            };

            req.onerror = () => {
                alert("An error occurred during login.");
            };
        }
        catch (err) {
            console.error("Login error:", err);
            alert("An error occurred during login.");
        }
    };

    // RESET PASSWORD FUNCTION - Now updates IndexedDB
    window.resetPassword = function () {
        try {
            const email = document.getElementById("forgotEmail").value.trim();
            const newPass = document.getElementById("newPassword").value.trim();

            if (!db) {
                alert("Database not ready. Please try again.");
                return;
            }

            // Get user from IndexedDB
            const tx = db.transaction("users", "readwrite");
            const store = tx.objectStore("users");
            const req = store.get(email);

            req.onsuccess = () => {
                const user = req.result;

                // Check if user exists
                if (!user) {
                    alert("Email not found!");
                    return;
                }

                // Update password
                user.password = newPass;
                store.put(user);

                alert("Password reset successful!");
                showLogin();
            };

            req.onerror = () => {
                alert("An error occurred.");
            };
        }
        catch (err) {
            console.error("Reset error:", err);
            alert("An error occurred.");
        }
    };

    // LOGOUT FUNCTION - Now removes from IndexedDB
    window.logout = function () {
        if (!db) {
            alert("Database not ready.");
            return;
        }

        // Remove logged user from settings
        const tx = db.transaction("settings", "readwrite");
        const store = tx.objectStore("settings");
        store.delete("loggedUser");

        // Update UI
        document.body.classList.add("blur");
        authOverlay.style.display = "flex";
        alert("Logged out!");
    };

    // NEWS LOADING CONFIGURATION
    const BATCH_SIZE = 10; // Number of articles to show at once
    const AUTO_BATCH_LIMIT = 20; // After this many articles, show "Load More" button
    let totalDisplayed = 0; // Track how many articles are displayed
    let newsPool = []; // Array to store fetched articles
    let loadMoreButtonShown = false; // Track if "Load More" button is shown
    let isSecondBatchLoading = false; // Track if second batch is loading

    const API_KEY = "bb2cdaf3dbb268ba34de8464463e3b2f"; // Your GNews API key
    let currentCategory = "general"; // Current news category (default to general)
    let searchText = ""; // Search keyword
    let pageIndex = 0; // Current page for API
    let isLoading = false; // Track if API call is in progress
    
    // Ensure currentCategory is never undefined
    function getCurrentCategory() {
        return currentCategory || "general";
    }

    // Random search queries for variety
    const RANDOM_QUERIES = [
        "latest", "breaking news", "india news", "world updates",
        "news 2025", "global headlines", "today news", "fresh news"
    ];

    // Detect if running on localhost or Vercel
    function getApiEndpoint() {
        // Check if we're on localhost
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            // For localhost, use direct GNews API
            return null; // Will use direct API call
        } else {
            // For Vercel, use the serverless function
            return "/api/news";
        }
    }

    function buildApiURL() {
        // If there's a search query, use search endpoint
        if (searchText) {
            return `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchText)}&lang=en&max=10&apikey=${API_KEY}`;
        }
        // Otherwise use top-headlines with category filter
        return `https://gnews.io/api/v4/top-headlines?category=${currentCategory}&lang=en&max=10&apikey=${API_KEY}`;
    }

    async function loadNews() {
        if (!navigator.onLine) {
            loadFromDBArticles();
            return;
        }

        if (isLoading) return;
        loader.style.display = "block";

        if (!API_KEY) {
            newsContainer.innerHTML = "<h3>Please add your GNews API key in java.js to load online news. Loading cached articles if available...</h3>";
            loadFromDBArticles();
            return;
        }

        isLoading = true;
        const url = buildApiURL();

        try {
            let res;
            const apiEndpoint = getApiEndpoint();
            
            // Use appropriate endpoint based on environment
            if (apiEndpoint) {
                // Running on Vercel - use serverless function
                let backendURL;
                if (searchText) {
                    backendURL = `${apiEndpoint}?q=${encodeURIComponent(searchText)}`;
                } else {
                    backendURL = `${apiEndpoint}?category=${currentCategory}`;
                }
                res = await fetch(backendURL);
            } else {
                // Running on localhost - use direct API call
                res = await fetch(url);
            }

            const data = await res.json();

            if (data && data.articles && data.articles.length) {

                // Save articles into IndexedDB (Service Worker will cache images)
                try {
                    const tx = db.transaction("articles", "readwrite");
                    const store = tx.objectStore("articles");
                    const category = getCurrentCategory();
                    
                    data.articles.forEach((a) => {
                        const link = a.url || a.link || "";
                        const articleObj = {
                            id: category + "_" + link, // Composite key: category + link
                            title: a.title || "",
                            description: a.description || "",
                            url: link,
                            link: link,
                            image: a.image || "", // Keep original URL, service worker will cache it
                            publishedAt: a.publishedAt || a.pubDate || "",
                            category: category
                        };
                        store.put(articleObj);
                    });
                }
                catch (err) {
                    console.warn("Could not write to DB articles store:", err);
                }

                // Display articles (use online URLs for now, base64 will be used when offline)
                const formatted = data.articles.map(a => ({
                    title: a.title,
                    description: a.description,
                    link: a.url || a.link,
                    image: a.image || '',
                    imageUrl: a.image || '' // Keep original URL for online display
                }));

                // avoid duplicates
                formatted.forEach(item => {
                    if (!newsPool.find(x => x.link === item.link)) {
                        newsPool.push(item);
                    }
                });
                pageIndex++;

                // First batch - show immediately
                if (totalDisplayed === 0) {
                    renderNextBatch();
                    
                    // Load second batch with loader after user scrolls
                    setupScrollListener();
                }
                else {
                    renderNextBatch();
                }
            }
            else {
                console.warn("No articles returned from GNews for URL:", url);
            }
        }
        catch (err) {
            console.error("GNews fetch error:", err);
        }
        finally {
            isLoading = false;
            loader.style.display = "none";
        }
    }

    async function convertImageToBase64(url) {
        if (!url || typeof url !== "string" || url.trim().length < 5) {
            return "";
        }
        
        try {
            // Add timeout to prevent hanging (increased to 10 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const res = await fetch(url, { 
                signal: controller.signal,
                mode: 'cors'
            });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                return "";
            }
            
            const blob = await res.blob();
            
            // Check if blob is actually an image
            if (!blob.type.startsWith('image/')) {
                return "";
            }
            
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve("");
                reader.readAsDataURL(blob);
            });
            
            return base64;
        } catch (err) {
            return "";
        }
    }

    // DISPLAY NEWS CARDS - Creates HTML cards for each article
    function displayNews(articles) {
        if (!articles || !articles.length) {
            if (!newsContainer.children.length) {
                newsContainer.innerHTML = "<h3>No news found.</h3>";
            }
            return;
        }

        articles.forEach(article => {
            const card = document.createElement("div");
            card.className = "card";

            // Escape special characters to prevent HTML injection
            const safeTitle = (article.title || "No title").replace(/"/g, '&quot;');
            const safeDesc = (article.description || "").replace(/"/g, '&quot;');
            const safeImg = (article.image || "").replace(/"/g, '&quot;');

            // Handle image URL - Service Worker will cache images automatically
            let imgUrl = article.image;
            
            // Default placeholder image
            const placeholderImg = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop&q=80";
            
            // Use image URL if available, otherwise placeholder
            if (!imgUrl || typeof imgUrl !== "string" || imgUrl.trim().length < 5) {
                imgUrl = placeholderImg;
            }

            // Create card HTML with better error handling
            card.innerHTML = `<img src="${imgUrl}" alt="Article Image"
      onerror="this.onerror=null; this.src='${placeholderImg}';"/>
      <div class="content">
        <div class="tag">${currentCategory.toUpperCase()}</div>
        <div class="title-text">${article.title || ""}</div>
        <div class="desc">${article.description || ""}</div>
        <div class="actions">
        <span class="save-btn" data-link="${article.link}" data-title="${safeTitle}" data-img="${safeImg}" data-desc="${safeDesc}">🤍 Save</span>
        <a href="${article.link}" class="btn" target="_blank" rel="noopener">Read More</a>
        </div>
      </div>`;

            newsContainer.appendChild(card);

            // Check if this article is already saved
            (function markSavedIfNeeded() {
                if (!db) {
                    return;
                }
                try {
                    const link = article.link;
                    const tx = db.transaction("saved", "readonly");
                    const store = tx.objectStore("saved");
                    const getReq = store.get(link);
                    getReq.onsuccess = () => {
                        if (getReq.result) {
                            const btn = card.querySelector(".save-btn");
                            if (btn) {
                                btn.classList.add("saved");
                                btn.innerHTML = '❤️ Saved';
                            }
                        }
                    };
                }
                catch (err) {
                    console.warn("Could not check saved state:", err);
                }
            })();
        });
    }

    // OFFLINE SEARCH - Search through cached articles
    function searchOffline(keyword) {
        if (!db) return;
        
        // Search in articles store
        const tx = db.transaction("articles", "readonly");
        const store = tx.objectStore("articles");
        const req = store.getAll();
        
        req.onsuccess = () => {
            const articles = req.result || [];
            const lower = keyword.toLowerCase();
            
            // Filter articles by keyword
            const results = articles.filter(a =>
                (a.title && a.title.toLowerCase().includes(lower)) ||
                (a.description && a.description.toLowerCase().includes(lower))
            );
            
            // Display results
            newsContainer.innerHTML = "";
            if (results.length) {
                const formatted = results.map(a => ({
                    title: a.title,
                    description: a.description,
                    link: a.link,
                    image: a.image
                }));
                displayNews(formatted);
            } else {
                newsContainer.innerHTML = "<h3>No matching articles found.</h3>";
            }
        };
    }

    // Load articles from IndexedDB (offline mode)
    function loadFromDBArticles() {
        if (!db) {
            newsContainer.innerHTML = "<h3>No local DB available.</h3>";
            return;
        }

        const tx = db.transaction("articles", "readonly");
        const store = tx.objectStore("articles");
        const req = store.getAll();

        req.onsuccess = () => {
            let items = req.result || [];
            
            // Filter by category if not "general"
            if (currentCategory && currentCategory !== "general") {
                items = items.filter(item => item.category === currentCategory);
            }
            
            if (!items.length) {
                newsContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h3>📵 No cached ${currentCategory} articles available</h3>
                        <p>Please connect to the internet to load ${currentCategory} news.</p>
                    </div>
                `;
                return;
            }
            
            newsContainer.innerHTML = "";
            newsPool = items.map(i => ({
                title: i.title,
                description: i.description,
                link: i.link,
                image: i.image
            }));

            renderNextBatch();

            // No need for sync button here - it's handled by Load More button
        };
        req.onerror = () => {
            newsContainer.innerHTML = "<h3>Could not load cached articles.</h3>";
        };
    }



    // Set initial active category button
    function setActiveCategoryButton(category) {
        categoryButtons.forEach(btn => {
            btn.classList.remove("active-cat");
            if (btn.dataset.category === category) {
                btn.classList.add("active-cat");
            }
        });
    }
    
    // Category click handler
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            setActiveCategoryButton(btn.dataset.category || "general");
            currentCategory = btn.dataset.category || "general";
            
            // Reset everything for new category
            newsContainer.innerHTML = "";
            newsPool = [];
            totalDisplayed = 0;
            pageIndex = 0;
            loadMoreButtonShown = false;
            isSecondBatchLoading = false;
            
            // Remove existing load more button if present
            const existingBtn = document.getElementById("loadMoreButton");
            if (existingBtn) {
                existingBtn.remove();
            }
            
            // Check if online or offline
            if (!navigator.onLine) {
                loadFromDBArticles();
            } else {
                loadNews();
            }
        });
    });

    // Debounced search
    let searchTimer;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
            const keyword = searchInput.value.trim();
            if (!navigator.onLine) {
                searchOffline(keyword);
                return;
            }
            searchText = keyword;
            
            // Reset everything for new search
            newsContainer.innerHTML = "";
            newsPool = [];
            totalDisplayed = 0;
            pageIndex = 0;
            loadMoreButtonShown = false;
            isSecondBatchLoading = false;
            
            // Remove existing load more button if present
            const existingBtn = document.getElementById("loadMoreButton");
            if (existingBtn) {
                existingBtn.remove();
            }
            
            loadNews();
        }, 400);
    });

    // Save article into saved store with base64 image
    document.addEventListener("click", async (e) => {
        if (e.target && e.target.classList.contains("save-btn")) {
            const link = e.target.dataset.link;
            const title = e.target.dataset.title || "Untitled";
            let img = e.target.dataset.img || "";
            const desc = e.target.dataset.desc || "";
            
            if (!db) {
                alert("Local DB not ready. Try again in a moment.");
                return;
            }
            
            // Try to get base64 image from articles store first
            try {
                const articleTx = db.transaction("articles", "readonly");
                const articleStore = articleTx.objectStore("articles");
                const articleReq = articleStore.get(link);
                
                articleReq.onsuccess = () => {
                    const savedArticle = articleReq.result;
                    // Use base64 image if available, otherwise use the URL
                    if (savedArticle && savedArticle.image && savedArticle.image.startsWith("data:image")) {
                        img = savedArticle.image;
                    }
                    
                    // Save to saved store
                    const tx = db.transaction("saved", "readwrite");
                    const store = tx.objectStore("saved");
                    const article = { link, title, img, desc };
                    const putReq = store.put(article);
                    
                    putReq.onsuccess = () => {
                        e.target.classList.add("saved");
                        e.target.innerHTML = '❤️ Saved';
                    };
                    
                    putReq.onerror = () => {
                        alert("Could not save article.");
                    };
                };
            } catch (err) {
                console.warn("Error saving article:", err);
                alert("Could not save article.");
            }
        }
    });

    // FETCH MORE ARTICLES - Gets additional articles and stores them
    async function fetchAndCacheArticles() {
        if (!API_KEY) {
            return;
        }
        
        try {
            let res;
            const apiEndpoint = getApiEndpoint();
            
            // Use appropriate endpoint based on environment
            if (apiEndpoint) {
                // Running on Vercel - use serverless function
                let apiURL;
                if (searchText) {
                    apiURL = `${apiEndpoint}?q=${encodeURIComponent(searchText)}`;
                } else {
                    apiURL = `${apiEndpoint}?category=${currentCategory}`;
                }
                res = await fetch(apiURL);
            } else {
                // Running on localhost - use direct API call
                const url = buildApiURL();
                res = await fetch(url);
            }
            const data = await res.json();
            if (!data.articles || !data.articles.length) {
                return
            }
            const formatted = data.articles.map(a => ({
                title: a.title,
                description: a.description,
                link: a.url || a.link,
                image: a.image || ""
            }));

            // push only unique items
            formatted.forEach(item => {
                if (!newsPool.find(x => x.link === item.link)) {
                    newsPool.push(item);
                }
            });

            // cache in IndexedDB
            try {
                const tx = db.transaction("articles", "readwrite");
                const store = tx.objectStore("articles");
                formatted.forEach(a => {
                    store.put({
                        title: a.title,
                        description: a.description,
                        link: a.link,
                        image: a.image,
                        publishedAt: new Date().toISOString()
                    });
                });
            }
            catch (e) {
                console.warn("Failed to write to DB:", e);
            }
            pageIndex++;
        }
        catch (err) {
            console.error("fetchAndCacheArticles error:", err);
        }
    }

    // take next 10 cards
    function renderNextBatch() {
        if (newsPool.length < BATCH_SIZE && navigator.onLine) {
            fetchMoreBeforeBatch().then(() => {
                actuallyRenderBatch();
            });
            return;
        }
        actuallyRenderBatch();
    }
    function fetchMoreBeforeBatch() {
        return new Promise(async (resolve) => {
            await fetchAndCacheArticles();
            resolve();
        });
    }

    function actuallyRenderBatch() {
        const slice = newsPool.splice(0, BATCH_SIZE);
        if (!slice.length) {
            return
        }
        displayNews(slice);
        totalDisplayed += slice.length;

        // load more
        if (totalDisplayed >= AUTO_BATCH_LIMIT && !loadMoreButtonShown) {
            showLoadMoreButton();
            loadMoreButtonShown = true;
        }
    }


    // SCROLL LISTENER - Shows loader when user reaches bottom, then loads second batch
    function setupScrollListener() {
        if (isSecondBatchLoading) return; // Prevent multiple listeners
        
        const scrollHandler = async () => {
            // Check if user scrolled near bottom
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight;
            
            // If user is within 200px of bottom
            if (scrollPosition >= pageHeight - 200 && !isSecondBatchLoading) {
                isSecondBatchLoading = true;
                
                // Remove scroll listener
                window.removeEventListener("scroll", scrollHandler);
                
                // Show loader for 2 seconds
                loader.style.display = "block";
                
                // Fetch more articles if needed
                if (newsPool.length < BATCH_SIZE && navigator.onLine) {
                    await fetchAndCacheArticles();
                }
                
                // Wait 2 seconds then show articles
                setTimeout(() => {
                    loader.style.display = "none";
                    renderNextBatch();
                }, 2000);
            }
        };
        
        // Add scroll event listener
        window.addEventListener("scroll", scrollHandler);
    }

    // LOAD MORE BUTTON
    function showLoadMoreButton() {
        const btn = document.createElement("a");
        btn.id = "loadMoreButton";
        btn.href = "#";
        btn.innerText = "Load More";
        btn.classList.add("load-more-link");
        btn.onclick = (e) => {
            e.preventDefault();
            renderNextBatch();
        };
        document.querySelector(".news-container").after(btn);
    }

    window.addEventListener("online", () => {
        updateOfflineStatus();
        
        const btn = document.getElementById("loadMoreButton");
        const loadMore = document.getElementById("loadMoreButton");
        if (loadMore) {
            loadMore.innerText = "Load More";
            loadMore.classList.add("load-more-link");
            loadMore.classList.remove("sync-link");
            loadMore.onclick = (e) => {
                e.preventDefault();
                renderNextBatch();
            };
        }

        // Fetch new articles
        newsContainer.innerHTML = "";
        pageIndex = 0;
        newsPool = [];
        totalDisplayed = 0;
        loadMoreButtonShown = false;
        loadNews();
    });

    window.addEventListener("offline", () => {
        updateOfflineStatus();
        
        // Sync with Internet
        const loadMore = document.getElementById("loadMoreButton");
        if (loadMore) {
            loadMore.innerText = "Sync with Internet";
            loadMore.classList.remove("load-more-link");
            loadMore.classList.add("sync-link");
            loadMore.onclick = (e) => {
                e.preventDefault();
                alert("📵 Internet required to sync new articles! Please connect to WiFi or mobile data.");
            };
            setTimeout(() => {
                if (navigator.onLine) {
                    loadNews();
                }
            }, 300);
        }
    });

});



