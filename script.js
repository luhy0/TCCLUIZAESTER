// Controla o menu responsivo da navbar no mobile.
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");

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
