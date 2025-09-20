// js/auth.js
const USERS_KEY = "usuarios_app";
const SESSION_KEY = "usuario_actual";

/* Devuelve la carpeta base donde están los archivos (funciona con file:// y http://) */
function baseHref() {
  const href = location.href;
  return href.substring(0, href.lastIndexOf("/") + 1);
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadUsers error:", e);
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function saveSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}
function getSession() {
  return localStorage.getItem(SESSION_KEY);
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* logout accesible desde HTML (botón) */
function logout() {
  clearSession();
  const base = baseHref();
  window.location.href = base + "login.html";
}
window.logout = logout;

/* Ejecutar cuando DOM esté listo */
document.addEventListener("DOMContentLoaded", () => {
  console.log("auth.js cargado en:", location.href);

  /* ------ Registro ------ */
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("regUser").value.trim();
      const password = document.getElementById("regPass").value;
      const msg = document.getElementById("registerMessage");

      if (!username || !password) { msg.textContent = "Completa ambos campos."; return; }

      const users = loadUsers();
      if (users.find(u => u.username === username)) {
        msg.textContent = "⚠️ Usuario ya existe.";
        return;
      }

      users.push({ username, password });
      saveUsers(users);
      msg.textContent = "✅ Registro exitoso. Redirigiendo al login...";
      setTimeout(() => { window.location.href = baseHref() + "login.html"; }, 700);
    });
  }

  /* ------ Login ------ */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUser").value.trim();
      const password = document.getElementById("loginPass").value;
      const msg = document.getElementById("loginMessage");

      if (!username || !password) { msg.textContent = "Completa ambos campos."; return; }

      const users = loadUsers();
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        saveSession(username);
        console.log("Login OK:", username);
        // Redirige usando baseHref() para asegurar la ruta correcta
        window.location.href = baseHref() + "index.html";
      } else {
        msg.textContent = "❌ Usuario o contraseña incorrectos.";
      }
    });
  }

  /* ------ Protección de páginas internas ------ */
  (function protectPages() {
    const path = location.pathname;
    const filename = path.substring(path.lastIndexOf("/") + 1);
    const publicPages = ["login.html", "register.html", ""]; // "" si servidor usa index por defecto
    if (!publicPages.includes(filename)) {
      if (!getSession()) {
        console.log("No hay sesión -> redirigiendo a login.html");
        window.location.href = baseHref() + "login.html";
      } else {
        // si existe elemento userGreeting, mostrar saludo
        const g = document.getElementById("userGreeting");
        if (g) g.textContent = `Hola, ${getSession()} 👋`;
      }
    }
  })();
});

