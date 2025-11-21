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
