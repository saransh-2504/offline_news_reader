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

//  NEWS API + SEARCH + CATEGORY

  const API_KEY = "01f34776ac18f47af61d0c44277a190d"; //01f34776ac18f47af61d0c44277a190d
  const newsContainer = document.querySelector(".news-container");
  const searchInput = document.getElementById("searchInput");
  const categoryButtons = document.querySelectorAll(".cat");

  let currentCategory = "general";
  let searchText = "";

  // debounce
  let timer;
  function debounce(fn, delay) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, delay);
  }

// FETCH NEWS FROM GNEWS

  function loadNews() {

// Build API URL
    let url = `https://gnews.io/api/v4/search?q=${searchText || "latest"}&topic=${currentCategory}&lang=en&apikey=${API_KEY}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        displayNews(data.articles);
      })
      .catch(() => {
        newsContainer.innerHTML = "<h2>Error loading news.</h2>";
      });
  }

  // DISPLAY NEWS IN GRID

  function displayNews(articles) {

    newsContainer.innerHTML = ""; 

    if (!articles || articles.length === 0) {
      newsContainer.innerHTML = "<h2>No news found.</h2>";
      return;
    }

    articles.forEach(article => {

      let card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${article.image || "https://via.placeholder.com/300"}" />
        <div class="content">
          <div class="tag">${currentCategory.toUpperCase()}</div>
          <div class="title-text">${article.title}</div>
          <div class="desc">${article.description || "No description available."}</div>
          <div class="actions">
            <span>❤️ Save</span>
            <a href="${article.url}" target="_blank" class="btn">Read More</a>
          </div>
        </div>
      `;

      newsContainer.appendChild(card);
    });
  }

// CATEGORY CLICK

  categoryButtons.forEach(btn => {
    btn.addEventListener("click", () => {

      currentCategory = btn.dataset.category;
      loadNews();
    });
  });

// SEARCH INPUT (Debounced)

  searchInput.addEventListener("input", () => {
    debounce(() => {
      searchText = searchInput.value.trim();
      loadNews();
    }, 500);
  });

  loadNews();