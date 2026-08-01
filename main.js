/* === I18N MODULE ===
 * 支持 10 种语言，自动检测浏览器语言，用户可手动切换（记忆选择）。
 * HTML 元素用 data-i18n="key" 标记，JS 从 TRANSLATIONS 字典查找翻译。
 */
const SUPPORTED_LANGS = ['en', 'zh-CN', 'zh-TW', 'ja', 'fr', 'de', 'ko', 'it', 'es', 'pt'];
const DEFAULT_LANG = 'en';

const I18n = (() => {
  // 将浏览器语言标签映射到我们支持的语言代码
  function resolveLang(raw) {
    if (!raw) return DEFAULT_LANG;
    const lower = raw.toLowerCase();
    // 精确匹配
    if (SUPPORTED_LANGS.includes(raw)) return raw;
    if (SUPPORTED_LANGS.includes(lower)) return lower;
    // 处理 zh-CN / zh-TW 的常见变体
    if (lower === 'zh' || lower.startsWith('zh-hans') || lower === 'zh-cn' || lower === 'zh-sg') return 'zh-CN';
    if (lower.startsWith('zh-hant') || lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo') return 'zh-TW';
    // pt-BR / pt-PT 都映射到 pt（面向巴西翻译）
    if (lower.startsWith('pt')) return 'pt';
    // 按主语言前缀匹配
    const prefix = lower.split('-')[0];
    const match = SUPPORTED_LANGS.find((code) => code.split('-')[0] === prefix);
    return match || DEFAULT_LANG;
  }

  // 检测用户首选语言: localStorage > navigator
  function detectLang() {
    const saved = localStorage.getItem('sokani-lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
    return resolveLang(nav);
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = dict[key];
      if (text !== undefined) el.textContent = text;
    });
    localStorage.setItem('sokani-lang', lang);
    // 更新语言切换器当前选中状态
    const selector = document.getElementById('langSelect');
    if (selector) selector.value = lang;
    // 更新 <html lang> 和页面 title
    const titleEl = document.querySelector('[data-i18n="hero.title"]');
    if (titleEl) document.title = 'Sokani — ' + (dict['hero.title'] || '');
  }

  // 动态填充语言下拉菜单选项
  function buildSelector() {
    const selector = document.getElementById('langSelect');
    if (!selector) return;
    selector.innerHTML = '';
    SUPPORTED_LANGS.forEach((code) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = TRANSLATIONS[code]['lang.' + code] || code;
      selector.appendChild(opt);
    });
    selector.addEventListener('change', () => setLang(selector.value));
  }

  function init() {
    buildSelector();
    setLang(detectLang());
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
