// Controla a abertura e o fechamento do menu em telas menores.
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');

function closeMenu() {
  menuToggle.classList.remove('active');
  navMenu.classList.remove('active');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
}

menuToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('active');

  menuToggle.classList.toggle('active', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

// Fecha o menu depois que o usuário escolhe uma opção no mobile.
navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

// Fecha o menu com a tecla ESC para melhorar a acessibilidade.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navMenu.classList.contains('active')) {
    closeMenu();
  }
});
