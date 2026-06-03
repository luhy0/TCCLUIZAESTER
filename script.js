// Controla o menu responsivo da navbar no mobile.
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");

const SESSION_KEY = "guardiaoLogado";

function closeMenu() {
  if (!menuToggle || !navMenu) return;

  menuToggle.classList.remove("is-open");
  navMenu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menu");
}

function toggleMenu() {
  if (!menuToggle || !navMenu) return;

  const isOpen = navMenu.classList.toggle("is-open");

  menuToggle.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
}

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", toggleMenu);

  // Fecha o menu ao escolher uma opção, melhorando a navegação em telas menores.
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Fecha o menu se a tela voltar ao tamanho desktop.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });
}

function showMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("success", type === "success");
}

async function sendAuthRequest(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }

  return result;
}

// Cadastro conectado ao backend Firebase: envia os dados para /api/cadastro.
const cadastroForm = document.querySelector("#cadastro-form");

if (cadastroForm) {
  const cadastroMessage = document.querySelector("#cadastro-message");

  cadastroForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = cadastroForm.nome.value.trim();
    const email = cadastroForm.email.value.trim().toLowerCase();
    const password = cadastroForm.senha.value.trim();

    if (!name || !email || !password) {
      showMessage(cadastroMessage, "Preencha todos os campos para criar sua conta.");
      return;
    }

    try {
      showMessage(cadastroMessage, "Criando sua conta...", "success");
      await sendAuthRequest("/api/cadastro", { name, email, password });
      showMessage(cadastroMessage, "Conta criada com sucesso! Redirecionando...", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (error) {
      showMessage(cadastroMessage, error.message);
    }
  });
}

// Login conectado ao backend Firebase: valida email e senha em /api/login.
const loginForm = document.querySelector("#login-form");

if (loginForm) {
  const loginMessage = document.querySelector("#login-message");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.senha.value.trim();

    if (!email || !password) {
      showMessage(loginMessage, "Email ou senha inválidos");
      return;
    }

    try {
      showMessage(loginMessage, "Verificando seus dados...", "success");
      const result = await sendAuthRequest("/api/login", { email, password });

      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      window.location.href = "index.html";
    } catch (error) {
      const message = error.status === 400 || error.status === 401
        ? "Email ou senha inválidos"
        : error.message;
      showMessage(loginMessage, message);
    }
  });
}

// Reforça a navegação dos botões principais caso algum ambiente bloqueie o clique padrão do link.
const navigationButtons = document.querySelectorAll(".js-nav-button[data-destination]");

navigationButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    const destination = button.dataset.destination;

    if (!destination) return;

    event.preventDefault();
    window.location.href = destination;
  });
});
