document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ===== CARRUSEL ===== */
(function () {
  const track = document.getElementById('carruselTrack');
  const puntosContenedor = document.getElementById('carruselPuntos');
  if (!track) return;

  const slides = Array.from(track.children);
  let indice = 0;

  slides.forEach((_, i) => {
    const punto = document.createElement('button');
    punto.type = 'button';
    punto.setAttribute('aria-label', 'Ir al producto ' + (i + 1));
    punto.addEventListener('click', () => irA(i));
    puntosContenedor.appendChild(punto);
  });

  function actualizar() {
    track.style.transform = `translateX(-${indice * 100}%)`;
    Array.from(puntosContenedor.children).forEach((p, i) => {
      p.classList.toggle('activo', i === indice);
    });
  }

  function irA(i) {
    indice = (i + slides.length) % slides.length;
    actualizar();
  }

  const INTERVALO_MS = 4000;
  let autoplay = setInterval(() => irA(indice + 1), INTERVALO_MS);

  function reiniciarAutoplay() {
    clearInterval(autoplay);
    autoplay = setInterval(() => irA(indice + 1), INTERVALO_MS);
  }

  document.getElementById('carruselPrev').addEventListener('click', () => { irA(indice - 1); reiniciarAutoplay(); });
  document.getElementById('carruselNext').addEventListener('click', () => { irA(indice + 1); reiniciarAutoplay(); });
  puntosContenedor.addEventListener('click', reiniciarAutoplay);

  const carrusel = document.getElementById('carrusel');
  carrusel.addEventListener('mouseenter', () => clearInterval(autoplay));
  carrusel.addEventListener('mouseleave', reiniciarAutoplay);

  actualizar();
})();

/* ===== CARRITO ===== */
(function () {
  const CLAVE_STORAGE = 'tostonesMarCarrito';
  let carrito = JSON.parse(localStorage.getItem(CLAVE_STORAGE) || '[]');

  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartVacio = document.getElementById('cartVacio');
  const cartDrawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('overlay');
  const btnCheckout = document.getElementById('btnCheckout');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutForm = document.getElementById('checkoutForm');

  function guardar() {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(carrito));
  }

  function render() {
    cartCount.textContent = carrito.reduce((total, item) => total + item.cantidad, 0);

    cartItems.innerHTML = '';
    if (carrito.length === 0) {
      cartItems.appendChild(cartVacio);
      btnCheckout.style.display = 'none';
      return;
    }
    btnCheckout.style.display = 'block';

    carrito.forEach((item, i) => {
      const fila = document.createElement('div');
      fila.className = 'cart-item';
      fila.innerHTML = `
        <span class="cart-item-nombre">${item.nombre}</span>
        <span class="cart-item-cantidad">x${item.cantidad}</span>
        <button type="button" class="cart-item-quitar" aria-label="Quitar">✕</button>
      `;
      fila.querySelector('.cart-item-quitar').addEventListener('click', () => {
        carrito.splice(i, 1);
        guardar();
        render();
      });
      cartItems.appendChild(fila);
    });
  }

  function agregarAlCarrito(nombre, cantidad) {
    const existente = carrito.find(item => item.nombre === nombre);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      carrito.push({ nombre, cantidad });
    }
    guardar();
    render();
    cartCount.classList.remove('bump');
    requestAnimationFrame(() => cartCount.classList.add('bump'));
  }

  function abrirCarrito() {
    cartDrawer.classList.add('abierto');
    overlay.classList.add('visible');
  }
  function cerrarCarrito() {
    cartDrawer.classList.remove('abierto');
    overlay.classList.remove('visible');
  }

  document.getElementById('cartBtn').addEventListener('click', abrirCarrito);
  document.getElementById('cerrarCart').addEventListener('click', cerrarCarrito);
  overlay.addEventListener('click', () => {
    cerrarCarrito();
    cerrarModal();
  });

  document.querySelectorAll('.qty-btn').forEach(boton => {
    boton.addEventListener('click', () => {
      const input = boton.parentElement.querySelector('.qty-input');
      let valor = parseInt(input.value, 10) || 1;
      valor = boton.dataset.action === 'inc' ? valor + 1 : Math.max(1, valor - 1);
      input.value = valor;
    });
  });

  document.querySelectorAll('.btn-add-cart').forEach(boton => {
    boton.addEventListener('click', () => {
      const contenedor = boton.closest('.add-to-cart');
      const nombre = contenedor.dataset.nombre;
      const cantidad = parseInt(contenedor.querySelector('.qty-input').value, 10) || 1;
      agregarAlCarrito(nombre, cantidad);
      abrirCarrito();
    });
  });

  /* ===== FORMULARIO Y ENVÍO POR CORREO ===== */
  function abrirModal() {
    checkoutModal.classList.add('visible');
  }
  function cerrarModal() {
    checkoutModal.classList.remove('visible');
  }

  btnCheckout.addEventListener('click', () => {
    cerrarCarrito();
    abrirModal();
  });
  document.getElementById('cerrarModal').addEventListener('click', cerrarModal);

  checkoutForm.addEventListener('submit', e => {
    e.preventDefault();

    const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();

    if (!nombreCompleto || !telefono || !correo) return;

    const listaProductos = carrito
      .map(item => `- ${item.nombre} x${item.cantidad}`)
      .join('\r\n');

    const asunto = 'Solicitud de pedido - Tostones Mar';
    const cuerpo =
      `Nombre completo: ${nombreCompleto}\r\n` +
      `Teléfono: ${telefono}\r\n` +
      `Correo electrónico: ${correo}\r\n\r\n` +
      `Productos solicitados:\r\n${listaProductos}\r\n\r\n` +
      `Este mensaje fue generado desde la página web de Tostones Mar.`;

    const mailto = `mailto:angelgmm2102@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailto;

    carrito = [];
    guardar();
    render();
    checkoutForm.reset();
    cerrarModal();
  });

  render();
})();

/* ===== MENÚ MÓVIL ===== */
(function () {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    menuBtn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('abierto');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ===== REVELADO AL HACER SCROLL ===== */
(function () {
  const elementos = document.querySelectorAll('.reveal');
  if (!elementos.length || !('IntersectionObserver' in window)) {
    elementos.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elementos.forEach(el => observer.observe(el));
})();
