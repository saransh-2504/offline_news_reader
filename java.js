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


  // INDEXEDDB (newsDB)

  let db;
  const DB_VERSION = 2;
  const DB_NAME = "newsDB";

  const openReq = indexedDB.open(DB_NAME, DB_VERSION);

  openReq.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("articles")) {
      db.createObjectStore("articles", { keyPath: "link" });
    }
    if (!db.objectStoreNames.contains("saved")) {
      db.createObjectStore("saved", { keyPath: "link" });
    }
  };

  openReq.onsuccess = (e) => {
    db = e.target.result;
    console.log("IndexedDB ready");
  };

  openReq.onerror = (e) => {
    console.warn("IndexedDB failed to open", e);
  };

  //signup, login, logout, forgot

  document.body.classList.add("blur");

  const storedUser = JSON.parse(localStorage.getItem("userData") || "null");
  const loggedUser = localStorage.getItem("loggedUser");

  if (loggedUser && storedUser) {
    greetUser.innerText = "Welcome, " + storedUser.first + "!";
    authOverlay.style.display = "none";
    document.body.classList.remove("blur");
  }

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

  window.signup = function () {
    try {
      const user = {
        first: document.getElementById("firstName").value.trim(),
        last: document.getElementById("lastName").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        password: document.getElementById("signupPassword").value.trim()
      };

      if (!user.first || !user.last || !user.email || !user.password) {
        alert("Please fill all fields.");
        return;
      }

      localStorage.setItem("userData", JSON.stringify(user));
      localStorage.setItem("loggedUser", user.email);

      greetUser.innerText = "Welcome, " + user.first + "!";
      authOverlay.style.display = "none";
      document.body.classList.remove("blur");

    } catch (err) {
      console.error("Signup error:", err);
      alert("An error occurred during signup.");
    }
  };

  window.login = function () {
    try {
      const email = document.getElementById("loginEmail").value.trim();
      const pass = document.getElementById("loginPassword").value.trim();
      const user = JSON.parse(localStorage.getItem("userData") || "null");

      if (!user) {
        alert("No account found. Please sign up first.");
        return;
      }

      if (email === user.email && pass === user.password) {
        localStorage.setItem("loggedUser", user.email);
        greetUser.innerText = "WELCOME, " + user.first + "!";
        authOverlay.style.display = "none";
        document.body.classList.remove("blur");
      } else {
        alert("Incorrect email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("An error occurred during login.");
    }
  };

  window.resetPassword = function () {
    try {
      const email = document.getElementById("forgotEmail").value.trim();
      const newPass = document.getElementById("newPassword").value.trim();
      const user = JSON.parse(localStorage.getItem("userData") || "null");

      if (!user || email !== user.email) {
        alert("Email not found!");
        return;
      }

      user.password = newPass;
      localStorage.setItem("userData", JSON.stringify(user));
      alert("Password reset successful!");
      showLogin();
    } catch (err) {
      console.error("Reset error:", err);
      alert("An error occurred.");
    }
  };

  window.logout = function () {
    localStorage.removeItem("loggedUser");
    document.body.classList.add("blur");
    authOverlay.style.display = "flex";
    alert("Logged out!");
  };

  // GNEWS INFINITE SCROLL

  const API_KEY = ""; // --> api key 
  let currentCategory = "general";
  let searchText = "";
  let pageIndex = 0;
  let isLoading = false;

  const RANDOM_QUERIES = [
    "latest", "breaking news", "india news", "world updates",
    "news 2025", "global headlines", "today news", "fresh news"
  ];

  function buildApiURL() {
    const q = searchText || RANDOM_QUERIES[pageIndex % RANDOM_QUERIES.length];
    return `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&topic=${currentCategory}&lang=en&apikey=${API_KEY}`;
  }

  async function loadNews() {
    if (!navigator.onLine) {
      console.log("Loading articles from IndexedDB (offline)");
      showOfflineBanner(true);
      loadFromDBArticles();
      return;
    } else {
      showOfflineBanner(false);
    }

    if (isLoading) return;
    if (!API_KEY) {
      newsContainer.innerHTML = "<h3>Please add your GNews API key in java.js to load online news. Loading cached articles if available...</h3>";
      loadFromDBArticles();
      return;
    }

    isLoading = true;
    const url = buildApiURL();

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.articles && data.articles.length) {

        // Save articles into saved section
        try {
          const tx = db.transaction("articles", "readwrite");
          const store = tx.objectStore("articles");
          data.articles.forEach(a => {
            const articleObj = {
              title: a.title || "",
              description: a.description || "",
              url: a.url || a.link || "",
              image: a.image || "",
              publishedAt: a.publishedAt || a.pubDate || ""
            };
            articleObj.link = articleObj.url;
            store.put(articleObj);
          });
        } catch (err) {
          console.warn("Could not write to DB articles store:", err);
        }

        // Display articles
        displayNews(data.articles.map(a => ({
          title: a.title,
          description: a.description,
          link: a.url || a.link,
          image: a.image || '',
        })));

        pageIndex++;
      } else {
        console.warn("No articles returned from GNews for URL:", url);
      }
    } catch (err) {
      console.error("GNews fetch error:", err);
    } finally {
      isLoading = false;
    }
  }
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

      const safeTitle = (article.title || "No title").replace(/"/g, '&quot;');
      const safeDesc = (article.description || "").replace(/"/g, '&quot;');
      const safeImg = (article.image || '').replace(/"/g, '&quot;');

      card.innerHTML = `
      <img src="${article.image || article.imageUrl || 'https://via.placeholder.com/300'}" alt="article image" />
      <div class="content">
        <div class="tag">${currentCategory.toUpperCase()}</div>
        <div class="title-text">${article.title || ""}</div>
        <div class="desc">${article.description || ""}</div>
        <div class="actions">
        <span class="save-btn" data-link="${article.link}" data-title="${safeTitle}" data-img="${safeImg}" data-desc="${safeDesc}">🤍 Save</span>
        <a href="${article.link}" class="btn" target="_blank" rel="noopener">Read More</a>
        </div>
      </div>
      `;

      newsContainer.appendChild(card);

      (function markSavedIfNeeded() {
        if (!db) return;
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
        } catch (err) {
          console.warn("Could not check saved state:", err);
        }
      })();
    });
  }

  // Load articles from saved section
  function loadFromDBArticles() {
    if (!db) {
      newsContainer.innerHTML = "<h3>No local DB available.</h3>";
      return;
    }

    const tx = db.transaction("articles", "readonly");
    const store = tx.objectStore("articles");
    const req = store.getAll();

    req.onsuccess = () => {
      const items = req.result || [];
      if (!items.length) {
        newsContainer.innerHTML = "<h3>No cached articles available.</h3>";
        return;
      }
      newsContainer.innerHTML = "";
      displayNews(items.map(i => ({
        title: i.title,
        description: i.description,
        link: i.link,
        image: i.image
      })));
    };

    req.onerror = () => {
      newsContainer.innerHTML = "<h3>Could not load cached articles.</h3>";
    };
  }

  function showOfflineBanner(show) {
    if (!offlineBanner) return;
    offlineBanner.style.display = show ? "block" : "none";
  }

  // Infinite scroll trigger
  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadNews();
    }
  });

  // Category click handler
  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      categoryButtons.forEach(b => b.classList.remove("active-cat"));
      btn.classList.add("active-cat");

      currentCategory = btn.dataset.category || "general";
      newsContainer.innerHTML = "";
      pageIndex = 0;
      loadNews();
    });
  });

  // Debounced search
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchText = searchInput.value.trim();
      newsContainer.innerHTML = "";
      pageIndex = 0;
      loadNews();
    }, 1500);
  });

  // Save article into saved store
  document.addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("save-btn")) {
      const link = e.target.dataset.link;
      const title = e.target.dataset.title || "Untitled";
      const img = e.target.dataset.img || "";
      const desc = e.target.dataset.desc || "";

      if (!db) {
        alert("Local DB not ready. Try again in a moment.");
        return;
      }

      const tx = db.transaction("saved", "readwrite");
      const store = tx.objectStore("saved");
      const article = { link, title, img, desc };

      const putReq = store.put(article);
      putReq.onsuccess = () => {
        e.target.classList.add("saved");
        e.target.innerHTML = '❤️ Saved';
        // alert("Saved offline! ❤️");
      };
      putReq.onerror = () => {
        alert("Could not save article.");
      };

    }
  });

  window.addEventListener("online", () => {
    showOfflineBanner(false);
    newsContainer.innerHTML = "";
    pageIndex = 0;
    loadNews();
  });

  window.addEventListener("offline", () => {
    showOfflineBanner(true);
    loadFromDBArticles();
  });

  setTimeout(() => {
    if (!navigator.onLine) {
      showOfflineBanner(true);
      loadFromDBArticles();
    } else {
      loadNews();
    }
  }, 300);

});
