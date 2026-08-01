/* === I18N MODULE === */
const I18n = (() => {
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-zh]').forEach((el) => {
      el.textContent = el.getAttribute('data-' + lang);
    });
    localStorage.setItem('sokani-lang', lang);
    // Update toggle button labels
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.dataset.active = lang === btn.dataset.langBtn ? 'true' : 'false';
    });
  }

  function init() {
    const saved = localStorage.getItem('sokani-lang') || 'zh';
    setLang(saved);
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLang(btn.dataset.langBtn);
      });
    });
  }

  return { init, setLang };
})();

/* === CAROUSEL MODULE === */
const Carousel = (() => {
  let current = 0;
  let total = 0;
  let timer = null;

  function go(index, track, dots) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function init() {
    const carousel = document.querySelector('[data-carousel]');
    if (!carousel) return;
    const track = carousel.querySelector('.carousel-track');
    const dots = [...carousel.querySelectorAll('.dot')];
    total = dots.length;

    dots.forEach((dot, i) => dot.addEventListener('click', () => { go(i, track, dots); reset(); }));
    go(0, track, dots);

    // touch swipe
    let startX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(dx < 0 ? current + 1 : current - 1, track, dots); }
      reset();
    });

    function reset() {
      clearInterval(timer);
      timer = setInterval(() => go(current + 1, track, dots), 5000);
    }
    reset();

    // Pause auto-advance when tab is hidden; resume when visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInterval(timer);
      } else {
        reset();
      }
    });
  }

  return { init };
})();

/* === SCENE DEMO MODULE === */
const SceneDemo = (() => {
  function init() {
    const lamp = document.getElementById('demoLamp');
    const hue = document.getElementById('hueSlider');
    const bright = document.getElementById('brightSlider');
    if (!lamp || !hue || !bright) return;

    const update = () => {
      const h = hue.value;
      const l = bright.value;
      const color = `hsl(${h}, 100%, ${l / 2}%)`;
      lamp.style.background = color;
      lamp.style.boxShadow = `0 0 80px 10px hsla(${h}, 100%, ${l / 2}%, 0.5)`;
    };
    hue.addEventListener('input', update);
    bright.addEventListener('input', update);
    update();
  }
  return { init };
})();

/* === PLATFORM DETECT MODULE === */
const PlatformDetect = (() => {
  function init() {
    const section = document.getElementById('download');
    if (!section) return;
    const ua = navigator.userAgent;
    let os = null;
    if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios';
    else if (/Android/i.test(ua)) os = 'android';
    else if (/Mac/i.test(ua)) os = 'mac';
    else if (/Win/i.test(ua)) os = 'win';
    if (os) {
      const card = section.querySelector(`[data-platform="${os}"]`);
      if (card) card.setAttribute('data-detected', 'true');
    }
  }
  return { init };
})();

/* === SCROLL REVEAL MODULE === */
const ScrollReveal = (() => {
  function init() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    els.forEach((el) => obs.observe(el));
  }
  return { init };
})();

/* === BOOTSTRAP === */
document.addEventListener('DOMContentLoaded', () => {
  // Nav scroll state
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile burger (toggles .open on nav-links — styled in responsive task)
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    burger.classList.toggle('open');
    burger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  // Close drawer on link click
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  }));
  // Close drawer on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    }
  });

  I18n.init();
  Carousel.init();
  SceneDemo.init();
  PlatformDetect.init();
  ScrollReveal.init();
});
