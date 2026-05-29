// Controla o menu responsivo da navbar no mobile.
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");

const STORAGE_KEY = "guardioesUsuarios";
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

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function showMessage(element, message, type = "error") {
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("success", type === "success");
}

// Cadastro simples: salva o usuário no localStorage do navegador.
const cadastroForm = document.querySelector("#cadastro-form");

if (cadastroForm) {
  const cadastroMessage = document.querySelector("#cadastro-message");

  cadastroForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = cadastroForm.nome.value.trim();
    const email = cadastroForm.email.value.trim().toLowerCase();
    const password = cadastroForm.senha.value.trim();

    if (!name || !email || !password) {
      showMessage(cadastroMessage, "Preencha todos os campos para criar sua conta.");
      return;
    }

    const users = getUsers();
    const emailAlreadyExists = users.some((user) => user.email === email);

    if (emailAlreadyExists) {
      showMessage(cadastroMessage, "Este email já está cadastrado.");
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    showMessage(cadastroMessage, "Conta criada com sucesso! Redirecionando...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  });
}

// Login simples: verifica email e senha salvos antes de liberar a página inicial.
const loginForm = document.querySelector("#login-form");

if (loginForm) {
  const loginMessage = document.querySelector("#login-message");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.senha.value.trim();
    const users = getUsers();
    const validUser = users.find((user) => user.email === email && user.password === password);

    if (!validUser) {
      showMessage(loginMessage, "Email ou senha inválidos");
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: validUser.name, email: validUser.email }));
    window.location.href = "index.html";
  });
}
