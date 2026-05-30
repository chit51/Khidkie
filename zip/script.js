/* ==============================================
   KHIDKIE™ — Interactive JS  (script.js)
   ============================================== */

/* ---- Page Loader ---- */
(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 1300);
  });
})();

/* ---- Scroll Progress Bar ---- */
(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ---- Navbar: scroll shrink + glassmorphism ---- */
(function () {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

/* ---- Mobile Menu Toggle ---- */
(function () {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    menuBtn.setAttribute('aria-expanded', String(!open));
    menuBtn.querySelector('i').className = open ? 'fas fa-bars' : 'fas fa-times';
  });

  // Close on nav link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        navLinks.style.display = 'none';
        menuBtn.querySelector('i').className = 'fas fa-bars';
      }
    });
  });
})();

/* ---- Scroll Reveal (IntersectionObserver) ---- */
(function () {
  const classes = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale'];
  const selector = classes.map(c => '.' + c).join(', ');
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ---- Counter Animation (eased) ---- */
(function () {
  const counters = document.querySelectorAll('.counter-value');
  if (!counters.length) return;
  let hasAnimated = false;

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animateCounters() {
    if (hasAnimated) return;
    hasAnimated = true;

    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const duration = 2200;
      const start = performance.now();

      (function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.round(easeOutQuart(progress) * target);
        counter.textContent = value.toLocaleString() + (progress < 1 ? '' : '+');
        if (progress < 1) requestAnimationFrame(update);
        else counter.textContent = target.toLocaleString() + '+';
      })(start);
    });
  }

  const section = document.querySelector('#counter-section');
  if (!section) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
  }, { threshold: 0.4 });
  obs.observe(section);
})();

/* ---- Hero Floating Particles ---- */
(function () {
  const container = document.getElementById('hero-particles');
  if (!container) return;

  const COUNT = 25;
  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 12 + 8}s;
      animation-delay:${Math.random() * 10}s;
      opacity:${Math.random() * 0.6 + 0.2};
    `;
    container.appendChild(p);
  }
})();

/* ---- Scroll Indicator click ---- */
(function () {
  const si = document.querySelector('.scroll-indicator');
  if (!si) return;
  si.addEventListener('click', () => {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
  });
})();

/* ---- Back to Top Button ---- */
(function () {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ---- Gallery Lightbox ---- */
(function () {
  const lb = document.getElementById('gallery-lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  if (!lb || !lbImg) return;

  let images = [];
  let current = 0;

  function open(index) {
    current = ((index % images.length) + images.length) % images.length;
    const src = images[current];
    lbImg.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.series-gallery-item, .gallery-lightbox-trigger').forEach((item, idx) => {
    const src = item.dataset.lightboxSrc ||
      (item.style.backgroundImage
        ? item.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1')
        : null);
    if (!src) return;
    images.push(src);
    item.style.cursor = 'pointer';
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => open(images.indexOf(src)));
    item.addEventListener('keydown', e => { if (e.key === 'Enter') open(images.indexOf(src)); });
  });

  if (lbClose) lbClose.addEventListener('click', close);
  if (lbPrev)  lbPrev.addEventListener('click', () => open(current - 1));
  if (lbNext)  lbNext.addEventListener('click', () => open(current + 1));

  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') open(current - 1);
    if (e.key === 'ArrowRight') open(current + 1);
  });
})();

/* ---- Testimonial Auto-Slider ---- */
(function () {
  const track = document.querySelector('.testimonial-slider-track');
  const dotsContainer = document.querySelector('.testimonial-dots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  let current = 0;
  let autoTimer;

  function getVisible() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function totalSlides() {
    return Math.max(1, cards.length - getVisible() + 1);
  }

  function createDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goTo(idx) {
    current = ((idx % totalSlides()) + totalSlides()) % totalSlides();
    const cardWidth = cards[0].offsetWidth;
    const gap = 32; // 2rem gap
    track.style.transform = `translateX(-${current * (cardWidth + gap)}px)`;
    if (dotsContainer) {
      dotsContainer.querySelectorAll('.testimonial-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }
    restartAuto();
  }

  function next() { goTo(current + 1); }

  function restartAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, 4500);
  }

  createDots();
  restartAuto();
  window.addEventListener('resize', () => { createDots(); goTo(0); });

  // Touch/swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { if (diff > 0) next(); else goTo(current - 1); }
  });
})();

/* ---- Ripple Effect on Buttons ---- */
(function () {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('btn-ripple');
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      circle.className = 'ripple-circle';
      circle.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
      `;
      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  });
})();

/* ---- Product Filter Buttons (products section) ---- */
(function () {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter || 'all';
      document.querySelectorAll('.series1-card').forEach(card => {
        const category = card.dataset.category || 'all';
        const show = filter === 'all' || category === filter;
        card.style.display = show ? '' : 'none';
        if (show) card.classList.add('reveal-scale');
      });
    });
  });
})();

/* ---- "Other" select box toggle in enquiry form ---- */
(function () {
  const whoSelect = document.getElementById('who');
  if (!whoSelect) return;
  whoSelect.addEventListener('change', function () {
    const otherBox = document.getElementById('other-box');
    const otherInput = document.getElementById('other_text');
    if (!otherBox) return;
    const isOther = this.value === 'Other';
    otherBox.style.display = isOther ? 'block' : 'none';
    if (otherInput) { otherInput.required = isOther; if (!isOther) otherInput.value = ''; }
  });
})();

/* ---- Corporate Group Tabs ---- */
function switchFirm(evt, firmId) {
  document.querySelectorAll('.firm-content').forEach(c => {
    c.style.display = 'none';
    c.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(firmId);
  if (target) { target.style.display = 'block'; target.classList.add('active'); }
  evt.currentTarget.classList.add('active');
}

/* ---- Image Modal for hotspot ---- */
function openImagePopup(imageSrc) {
  const modal = document.getElementById('imageModal');
  const img   = document.getElementById('mapImage');
  if (!modal || !img) return;
  img.src = imageSrc;
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) modal.style.display = 'none';
}

/* ---- Series scroll arrows ---- */
(function () {
  document.querySelectorAll('.series-scroll-wrapper').forEach(wrapper => {
    const track = wrapper.querySelector('.series-scroll-track');
    const dots = wrapper.querySelectorAll('.dot');
    const leftArrow = wrapper.querySelector('.left-arrow');
    const rightArrow = wrapper.querySelector('.right-arrow');
    if (!track) return;

    if (leftArrow) leftArrow.addEventListener('click', () => track.scrollBy({ left: -(track.clientWidth * 0.8), behavior: 'smooth' }));
    if (rightArrow) rightArrow.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));

    if (dots.length) {
      track.addEventListener('scroll', () => {
        const index = Math.round((track.scrollLeft / (track.scrollWidth - track.clientWidth)) * (dots.length - 1));
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
      });
    }
  });
})();

/* ---- Enquiry Popup (60s delay) ---- */
(function () {
  const overlay = document.getElementById('khidkiePopupOverlay');
  if (!overlay) return;
  setTimeout(() => {
    if (!sessionStorage.getItem('khidkiePopupShown')) {
      overlay.style.display = 'flex';
      sessionStorage.setItem('khidkiePopupShown', 'true');
    }
  }, 60000);
})();

function closeKhidkiePopup() {
  const overlay = document.getElementById('khidkiePopupOverlay');
  if (overlay) overlay.style.display = 'none';
}

/* ---- Footer Year ---- */
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---- Brochure tracking stubs ---- */
function trackBrochureView() { console.log('[Khidkie] Brochure viewed'); }
function trackBrochureDownload() { console.log('[Khidkie] Brochure downloaded'); }

/* ---- Navbar active link highlight on scroll ---- */
(function () {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navAs = document.querySelectorAll('.nav-links a[href^="#"]');
  if (!sections.length || !navAs.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navAs.forEach(a => {
          a.style.color = (a.getAttribute('href') === '#' + e.target.id) ? '#ff6b6b' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
})();

/* ---- Add reveal classes to main sections dynamically ---- */
(function () {
  const targets = [
    { sel: '.section-title',    cls: 'reveal'       },
    { sel: '.section-subtitle', cls: 'reveal'       },
    { sel: '.feature-card',     cls: 'reveal-scale' },
    { sel: '.testimonial-card', cls: 'reveal-scale' },
    { sel: '.series1-card',     cls: 'reveal'       },
    { sel: '.counter-item',     cls: 'reveal-scale' },
    { sel: '.series-gallery-item', cls: 'reveal-scale' },
  ];

  targets.forEach(({ sel, cls }) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal') &&
          !el.classList.contains('reveal-left') &&
          !el.classList.contains('reveal-right') &&
          !el.classList.contains('reveal-scale')) {
        el.classList.add(cls);
        el.style.transitionDelay = (i % 4) * 0.1 + 's';
      }
    });
  });

  // Re-trigger observer for newly added classes
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
})();

/* ---- Slideshow (if slides exist) ---- */
(function () {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;
  let current = 0;
  function showSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
  }
  setInterval(() => { current = (current + 1) % slides.length; showSlide(current); }, 3000);
})();