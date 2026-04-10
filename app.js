const email = document.getElementById("email");
const password = document.getElementById("password");

function showDashboard() {
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("auth").style.display = "none";
}

function signup() {
  createUserWithEmailAndPassword(window.auth, email.value, password.value)
    .then(() => {
      alert("Account created");
      showDashboard();
    })
    .catch(err => alert(err.message));
}

function login() {
  signInWithEmailAndPassword(window.auth, email.value, password.value)
    .then(() => {
      alert("Login successful");
      showDashboard();
    })
    .catch(err => alert(err.message));
}
