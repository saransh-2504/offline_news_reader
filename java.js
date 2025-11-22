document.addEventListener("DOMContentLoaded", () => {

  const authOverlay = document.getElementById("authOverlay");
  const signupBox = document.getElementById("signupBox");
  const loginBox = document.getElementById("loginBox");
  const forgotBox = document.getElementById("forgotBox");

  // APPLY BLUR WHEN PAGE LOADS 

  document.body.classList.add("blur");

  // AUTO LOGIN CHECK 
  const loggedUser = localStorage.getItem("loggedUser");
  const userData = JSON.parse(localStorage.getItem("userData"));

  if (loggedUser && userData) {
    greetUser.innerText = "Welcome, " + userData.first + "!";
    authOverlay.style.display = "none";
    document.body.classList.remove("blur");
  }

  // SWITCH SCREENS 
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

  // SIGNUP FUNCTION 
  window.signup = function () {
    let user = {
      first: document.getElementById("firstName").value.trim(),
      last: document.getElementById("lastName").value.trim(),
      email: document.getElementById("signupEmail").value.trim(),
      password: document.getElementById("signupPassword").value.trim(),
    };

    if (!user.first || !user.last || !user.email || !user.password) {
      alert("Please fill all fields.");
      return;
    }

    localStorage.setItem("userData", JSON.stringify(user));
    localStorage.setItem("loggedUser", user.email);

    greetUser.innerText = "Welcome, " + user.first + "!";

    // SUCCESS → close modal

    authOverlay.classList.add("fade");
    authOverlay.style.display = "none";
    document.body.classList.remove("blur");
  };

  // LOGIN FUNCTION 
  window.login = function () {
    let email = document.getElementById("loginEmail").value.trim();
    let pass = document.getElementById("loginPassword").value.trim();

    let user = JSON.parse(localStorage.getItem("userData"));
    if (!user) return alert("No account. Sign up first.");


    if (email === user.email && pass === user.password) {
      localStorage.setItem("loggedUser", user.email);

      greetUser.innerText = "Welcome, " + user.first + "!";

      authOverlay.classList.add("fade");
      authOverlay.style.display = "none";
      document.body.classList.remove("blur");
    } else {
      alert("Incorrect credentials.");
    }
  };

  // RESET PASSWORD FUNCTION 
  window.resetPassword = function () {
    let email = document.getElementById("forgotEmail").value.trim();
    let newPass = document.getElementById("newPassword").value.trim();

    let user = JSON.parse(localStorage.getItem("userData"));

    if (!user || email !== user.email) {
      return alert("Email not found!");
    }

    user.password = newPass;
    localStorage.setItem("userData", JSON.stringify(user));

    alert("Password reset successful!");
    showLogin();
  };

  // LOGOUT
  window.logout = () => {
    localStorage.removeItem("loggedUser");

    document.body.classList.add("blur");
    authOverlay.style.display = "flex";

    alert("Logged out!");
  }
});


// GNEWS + INFINITE SCROLL SYSTEM

const API_KEY = ""; //01f34776ac18f47af61d0c44277a190d
const newsContainer = document.querySelector(".news-container");
const searchInput = document.getElementById("searchInput"); 
const categoryButtons = document.querySelectorAll(".cat");

let currentCategory = "general";
let searchText = "";
let pageIndex = 0;  
let isLoading = false;

//imulate more pages

const RANDOM_QUERIES = [
  "latest", "breaking news", "india news", "world updates",
  "news 2025", "global headlines", "today news", "fresh news"
];


// Build GNews API 

function buildApiURL() {
  let q = searchText || RANDOM_QUERIES[pageIndex % RANDOM_QUERIES.length];

  return `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&topic=${currentCategory}&lang=en&apikey=${API_KEY}`;
}

// Fetch news from GNews

async function loadNews() {
  if (isLoading) return;
  isLoading = true;

  let url = buildApiURL();

  try {
    let res = await fetch(url);
    let data = await res.json();

    if (!data.articles) {
      isLoading = false;
      return;
    }

    displayNews(data.articles);
    pageIndex++; 

  } catch (e) {
    console.log("API ERROR:", e);
  }

  isLoading = false;
}

// Display news

function displayNews(articles) {

  articles.forEach(article => {
    let card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${article.image || 'https://via.placeholder.com/300'}" />
      <div class="content">
        <div class="tag">${currentCategory.toUpperCase()}</div>
        <div class="title-text">${article.title}</div>
        <div class="desc">${article.description || "No description available."}</div>
        <div class="actions">
          <span class="save-btn"
      data-title="${article.title}"
      data-link="${article.url}"
      data-img="${article.image || ''}"
      data-desc="${article.description || ''}">
      ❤️ Save
</span>

          <a href="${article.url}" class="btn" target="_blank">Read More</a>
        </div>
      </div>
    `;

    newsContainer.appendChild(card);
  });
}

// Infinite scrolling

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadNews();
  }
});

// Category filter

categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {

    currentCategory = btn.dataset.category;

    // Reset page
    newsContainer.innerHTML = "";
    pageIndex = 0;

    loadNews();
  });
});

// Search handler 

let searchTimer;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    searchText = searchInput.value.trim();

    newsContainer.innerHTML = "";
    pageIndex = 0;

    loadNews();
  }, 500);
});

// --------------------------------------------------------------
// SAVE ARTICLE HANDLER
// --------------------------------------------------------------
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("save-btn")) {

    let article = {
      title: e.target.dataset.title,
      link: e.target.dataset.link,
      img: e.target.dataset.img,
      desc: e.target.dataset.desc
    };

    let saved = JSON.parse(localStorage.getItem("savedArticles") || "[]");

    // avoid duplicates
    if (!saved.find(a => a.link === article.link)) {
      saved.push(article);
      localStorage.setItem("savedArticles", JSON.stringify(saved));
      alert("Saved! ❤️");
    } else {
      alert("Already saved.");
    }
  }
});

loadNews();
