/* =============================================================
   Gvantca Bachilava — Portfolio
   Interactions du site + liseuse PDF (feuilletage page à page)
   ============================================================= */
(() => {
  'use strict';

  /* =============================================================
     COORDONNÉES
     - email    : découpé en deux morceaux [avant @, après @] pour ne pas
                  être aspiré par les robots qui lisent le code public
     - phone    : affiché sur la carte de visite (laisser '' pour le masquer)
     - linkedin : adresse complète du profil (laisser '' pour le masquer)
     - formKey  : clé du formulaire, reçue gratuitement par e-mail sur
                  https://web3forms.com (voir README.md)
     ============================================================= */
  const CONTACT = {
    email: ['gvantca.bachilava', 'gmail.com'],
    phone: '07 53 43 02 07',
    linkedin: 'https://www.linkedin.com/in/gvantcabachilava',
    formKey: '',
  };

  /* ---------- Documents de la bibliothèque ---------- */
  const DOCS = {
    memoire: {
      file: 'documents/memoire-m1-typikon-gori.pdf',
      kicker: 'Mémoire de Master 1 · 2025 — 2026',
      title: 'Le typikon orthodoxe géorgien et son appropriation par le monastère Sainte-Marie à Gori',
    },
    carros: {
      file: 'documents/dossier-eglise-saint-paul-carros.pdf',
      kicker: 'Dossier · Licence 3 · 2025',
      title: 'L’église Saint-Paul de Carros',
    },
    ariane: {
      file: 'documents/dossier-jardins-partages-ariane.pdf',
      kicker: 'Enquête collective · Master 1 · 2025',
      title: 'Les jardins partagés de l’Ariane',
    },
    shibari: {
      file: 'documents/dossier-artification-shibari.pdf',
      kicker: 'Anthropologie de la danse · Licence 3 · 2024',
      title: 'L’art du shibari — l’artification d’une pratique corporelle',
    },
    transmission: {
      file: 'documents/dossier-transmission-culturelle.pdf',
      kicker: 'Rapport d’enquête · Licence 2 · 2023',
      title: 'Transmission culturelle — écoles françaises et géorgiennes',
    },
  };

  /* PDF.js (Mozilla) chargé à la demande depuis un CDN */
  const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  /* =============================================================
     LANGUES : français (texte d'origine de la page), anglais, géorgien
     Les traductions sont dans translations.js
     ============================================================= */
  const LANGS = ['fr', 'en', 'ka'];
  const DICT = window.I18N || {};
  let LANG = LANGS.includes(root.lang) ? root.lang : 'fr';
  const langHooks = [];
  const onLang = (fn) => langHooks.push(fn);

  function t(key, vars, fallback) {
    let str = (DICT[LANG] && DICT[LANG][key]) ?? (DICT.fr && DICT.fr[key]) ?? fallback ?? key;
    if (vars) str = str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
    return str;
  }

  /* le français d'origine est lu une fois dans la page */
  const textEls = $$('[data-i18n]');
  const attrEls = $$('[data-i18n-attr]');
  const originalHtml = new Map(textEls.map((el) => [el, el.innerHTML]));
  const attrPairs = (el) => el.dataset.i18nAttr.split(',').map((pair) => pair.split(':').map((x) => x.trim()));
  const originalAttrs = new Map(attrEls.map((el) => [el, Object.fromEntries(attrPairs(el).map(([name]) => [name, el.getAttribute(name)]))]));
  const metaDesc = $('meta[name="description"]');
  const originalTitle = document.title;
  const originalDesc = metaDesc ? metaDesc.content : '';

  function translatePage() {
    const dict = LANG === 'fr' ? {} : (DICT[LANG] || {});
    textEls.forEach((el) => {
      const v = dict[el.dataset.i18n];
      el.innerHTML = v != null ? v : originalHtml.get(el);
    });
    attrEls.forEach((el) => {
      const saved = originalAttrs.get(el);
      attrPairs(el).forEach(([name, key]) => el.setAttribute(name, dict[key] != null ? dict[key] : saved[name]));
    });
    $$('[data-page-label]').forEach((el) => { el.textContent = t('js.p') + ' ' + el.dataset.pageLabel; });
    $$('[data-pages]').forEach((el) => { el.textContent = el.dataset.pages + ' ' + t('js.pp'); });
    document.title = dict['meta.title'] || originalTitle;
    if (metaDesc) metaDesc.content = dict['meta.description'] || originalDesc;
  }

  const switcher = $('.lang');
  const langBtns = $$('.lang__opt');
  function setLang(lang, initial = false) {
    if (!LANGS.includes(lang)) lang = 'fr';
    if (lang === LANG && !initial) return;
    LANG = lang;
    root.lang = lang;
    translatePage();
    langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    if (switcher) switcher.style.setProperty('--i', String(LANGS.indexOf(lang)));
    if (initial) return;
    try { localStorage.setItem('gb-lang', lang); } catch (e) { /* navigation privée */ }
    const url = new URL(location.href);
    if (lang === 'fr') url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
    langHooks.forEach((fn) => fn(lang));
    if (!reduceMotion.matches) {
      $('#main').animate([{ opacity: 0.15, filter: 'blur(2px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 550, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    }
  }
  langBtns.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  setLang(LANG, true);
  root.classList.remove('i18n-wait');

  /* ---------- Entrée en scène ---------- */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
    requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  });

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });


  /* ---------- Navigation ---------- */
  const nav = $('#nav');
  const burger = $('.nav__burger');
  const menu = $('#menu');
  const themed = $$('[data-theme]').filter((el) => el !== nav);
  const navLinks = $$('.nav__links a');
  const navTargets = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const parallaxEls = $$('[data-parallax]');
  let menuOpen = false;
  let ticking = false;

  function updateNav() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);

    if (!menuOpen) {
      const probe = nav.offsetHeight / 2;
      for (const section of themed) {
        const r = section.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          nav.dataset.theme = section.dataset.theme;
          break;
        }
      }
    }

    const mid = window.innerHeight * 0.35;
    let active = null;
    for (const t of navTargets) {
      const r = t.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) active = t;
    }
    navLinks.forEach((a) => a.classList.toggle('is-active', !!active && a.getAttribute('href') === '#' + active.id));
  }

  function updateParallax() {
    if (reduceMotion.matches) return;
    const vh = window.innerHeight;
    for (const el of parallaxEls) {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) continue;
      const offset = box.top + box.height / 2 - vh / 2;
      el.style.setProperty('--py', (offset * -parseFloat(el.dataset.parallax)).toFixed(1) + 'px');
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateNav();
      updateParallax();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('nav--menu', open);
    root.classList.toggle('is-locked', open);
    if (open) {
      nav.dataset.theme = 'dark';
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 500);
      updateNav();
    }
  }
  burger.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 960) setMenu(false); });

  /* ---------- Apparitions au défilement ---------- */
  /* Une photo encore masquée (clip-path) n'est jamais « visible » pour
     l'observateur : on observe donc son conteneur à la place. */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const watched = el.classList.contains('ph') ? el.parentElement : el;
      if (!groups.has(watched)) groups.set(watched, []);
      groups.get(watched).push(el);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        groups.get(entry.target).forEach((el) => el.classList.add('is-in'));
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    groups.forEach((_, watched) => io.observe(watched));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Reflet du verre qui suit le pointeur ---------- */
  document.addEventListener('pointermove', (e) => {
    const target = e.target instanceof Element ? e.target.closest('.btn, .icon-btn, .toc__list button') : null;
    if (!target) return;
    const r = target.getBoundingClientRect();
    target.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
    target.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
  }, { passive: true });

  /* =============================================================
     CARTE DE VISITE
     ============================================================= */
  const email = (Array.isArray(CONTACT.email) ? CONTACT.email.filter(Boolean).join('@') : String(CONTACT.email || '')).trim();
  const phone = String(CONTACT.phone || '').trim();
  const phoneIntl = phone ? '+33' + phone.replace(/\D/g, '').replace(/^0/, '') : '';
  /* numéro au format international hors de la version française */
  const phoneShown = () => (LANG === 'fr' || !phoneIntl ? phone : '+33 ' + phoneIntl.slice(3).replace(/^(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5'));
  const linkedin = String(CONTACT.linkedin || '').trim();
  const formKey = String(CONTACT.formKey || '').trim();

  const card = $('#card');
  if (card) {
    const fill = (name, href, text) => {
      const line = $('[data-card="' + name + '"]', card);
      if (!line || !href) return;
      const a = $('a', line);
      a.href = href;
      a.textContent = text;
      line.hidden = false;
    };
    fill('email', email && 'mailto:' + email, email);
    fill('phone', phoneIntl && 'tel:' + phoneIntl, phoneShown());
    onLang(() => { if (phoneIntl) $('[data-card="phone"] a', card).textContent = phoneShown(); });
    fill('linkedin', linkedin, linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''));

    /* copier l'adresse */
    const copyBtn = $('.card__copy', card);
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
      } catch (err) {
        const tmp = document.createElement('textarea');
        tmp.value = email;
        document.body.append(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
      }
      copyBtn.textContent = t('js.copied');
      copyBtn.classList.add('is-done');
      setTimeout(() => {
        copyBtn.textContent = t('card.copy');
        copyBtn.classList.remove('is-done');
      }, 1800);
    });

    /* inclinaison 3D et reflet qui suivent la souris */
    const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canTilt && !reduceMotion.matches) {
      const wrap = card.parentElement;
      wrap.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', ((px - 0.5) * 14).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      wrap.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        ['--rx', '--ry', '--gx', '--gy'].forEach((v) => card.style.removeProperty(v));
      });
    }
  }

  /* fichier contact (.vcf) à ajouter au carnet d'adresses */
  const vcardBtn = $('[data-vcard]');
  if (vcardBtn) {
    vcardBtn.addEventListener('click', () => {
      const site = location.protocol.startsWith('http') ? location.href.split('#')[0] : '';
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Bachilava;Gvantca;;;',
        'FN:Gvantca Bachilava',
        'TITLE:' + t('js.vcardTitle'),
        'ORG:Université Côte d\'Azur',
        'ADR;TYPE=WORK:;;;Nice;;;France',
      ];
      if (email) lines.push('EMAIL;TYPE=INTERNET:' + email);
      if (phoneIntl) lines.push('TEL;TYPE=CELL:' + phoneIntl);
      if (linkedin) lines.push('URL:' + linkedin);
      if (site) lines.push('URL:' + site);
      lines.push('END:VCARD');
      const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gvantca-bachilava.vcf';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
  }

  /* =============================================================
     FORMULAIRE DE CONTACT
     Envoi : Web3Forms. Protections contre le spam, dans l'ordre :
       1. contrôle des champs (format, longueurs, liens, code, mots suspects)
       2. pièges à robots invisibles (deux champs cachés)
       3. délai minimal de saisie (un robot remplit tout en une fraction de seconde)
       4. limite d'envois par navigateur (1 par minute, 3 par 24 h, pas de doublon)
       5. vérification hCaptcha « Je suis humain »
       6. filtre anti-spam de Web3Forms côté serveur
     ============================================================= */
  const form = $('#contact-form');
  if (form) {
    const LIMITS = { name: [2, 80], subject: 120, message: [20, 3000], links: 2 };
    const MIN_FILL_MS = 2500;
    const COOLDOWN_MS = 60 * 1000;
    const MAX_PER_DAY = 3;
    const STORE_KEY = 'gb-contact-history';
    /* clé hCaptcha publique et partagée, fournie par Web3Forms pour l'offre gratuite */
    const HCAPTCHA_SITEKEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2';

    const DISPOSABLE = ['yopmail.com', 'yopmail.fr', 'mailinator.com', 'guerrillamail.com', 'sharklasers.com',
      '10minutemail.com', 'temp-mail.org', 'tempmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com',
      'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'mailnesia.com', 'jetable.org', 'mintemail.com'];
    const SPAM_WORDS = /\b(viagra|cialis|casino|bitcoin|crypto(currency)?|forex|backlinks?|seo (services?|agency)|porn|escort|loan offer|payday|betting|nft drop)\b/i;
    const LINK_RE = /(https?:\/\/|www\.)\S+/gi;
    const HTML_RE = /<\s*\/?\s*[a-z][^>]*>|\[(url|link|img)\b/i;
    const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’ .\-]+$/u;
    const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

    const fieldsBox = $('.contact-form__fields', form);
    const doneBox = $('.contact-form__done', form);
    const status = $('#cf-status');
    const counter = $('#cf-count');
    const submitBtn = $('button[type="submit"]', form);
    const captchaField = $('#cf-captcha-field');
    const captchaBox = $('#cf-captcha');
    const inputs = {
      name: form.elements.name,
      email: form.elements.email,
      subject: form.elements.subject,
      message: form.elements.message,
    };
    let tried = false;
    let sending = false;
    let firstTouch = 0;

    /* ---- outils ---- */
    const clean = (v) => String(v || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    const oneLine = (v) => clean(v).replace(/\s+/g, ' ');
    const countLinks = (v) => (String(v).match(LINK_RE) || []).length;
    const hash = (v) => {
      let h = 0;
      for (let i = 0; i < v.length; i++) h = (Math.imul(31, h) + v.charCodeAt(i)) | 0;
      return String(h);
    };
    const readHistory = () => {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
    };
    const writeHistory = (list) => {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(-10))); } catch (e) { /* navigation privée */ }
    };

    const setStatus = (text, isError = false) => {
      status.textContent = text;
      status.classList.toggle('is-error', isError);
    };
    const setError = (input, message) => {
      const box = document.getElementById(input.id + '-error');
      if (box) box.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !message;
    };
    const updateCounter = () => {
      const n = inputs.message.value.length;
      counter.textContent = n + ' / ' + LIMITS.message[1];
      counter.classList.toggle('is-near', n > LIMITS.message[1] * 0.9);
    };

    /* ---- 1. contrôle des champs ---- */
    function checkName() {
      const v = oneLine(inputs.name.value);
      if (!v) return t('err.name.empty');
      if (v.length < LIMITS.name[0]) return t('err.name.short');
      if (v.length > LIMITS.name[1]) return t('err.name.long', { n: LIMITS.name[1] });
      if (!NAME_RE.test(v)) return t('err.name.invalid');
      return '';
    }
    function checkEmail() {
      const v = clean(inputs.email.value).toLowerCase();
      if (!v) return t('err.email.empty');
      if (v.length > 160 || !EMAIL_RE.test(v) || v.includes('..')) return t('err.email.invalid');
      if (DISPOSABLE.includes(v.split('@')[1])) return t('err.email.disposable');
      return '';
    }
    function checkSubject() {
      const v = oneLine(inputs.subject.value);
      if (v.length > LIMITS.subject) return t('err.subject.long', { n: LIMITS.subject });
      if (countLinks(v) || HTML_RE.test(v)) return t('err.subject.links');
      return '';
    }
    function checkMessage() {
      const v = clean(inputs.message.value);
      if (!v) return t('err.msg.empty');
      if (v.length < LIMITS.message[0]) return t('err.msg.short', { n: LIMITS.message[0] });
      if (v.length > LIMITS.message[1]) return t('err.msg.long', { n: LIMITS.message[1] });
      if (HTML_RE.test(v)) return t('err.msg.html');
      if (countLinks(v) > LIMITS.links) return t('err.msg.links');
      if (/(.)\1{11,}/.test(v)) return t('err.msg.repeat');
      return '';
    }
    function validate() {
      const a = setError(inputs.name, checkName());
      const b = setError(inputs.email, checkEmail());
      const c = setError(inputs.subject, checkSubject());
      const d = setError(inputs.message, checkMessage());
      return a && b && c && d;
    }

    /* ---- 5. hCaptcha, chargé seulement quand le formulaire approche ---- */
    let captchaId = null;
    let captchaPromise = null;
    function loadCaptcha() {
      if (!formKey) return Promise.resolve(null);
      if (captchaPromise) return captchaPromise;
      captchaPromise = new Promise((resolve, reject) => {
        window.__gbCaptchaReady = () => resolve(window.hcaptcha);
        const script = document.createElement('script');
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&hl=' + LANG + '&onload=__gbCaptchaReady';
        script.async = true;
        script.onerror = () => reject(new Error('hCaptcha indisponible'));
        document.head.append(script);
      }).then((hc) => {
        captchaId = hc.render(captchaBox, {
          sitekey: HCAPTCHA_SITEKEY,
          theme: 'dark',
          size: captchaBox.clientWidth && captchaBox.clientWidth < 304 ? 'compact' : 'normal',
          callback: () => { $('#cf-captcha-error').textContent = ''; },
          'expired-callback': () => { $('#cf-captcha-error').textContent = t('err.captchaExpired'); },
        });
        return hc;
      }).catch((err) => {
        captchaPromise = null;
        throw err;
      });
      return captchaPromise;
    }
    const captchaToken = () => {
      try { return captchaId !== null && window.hcaptcha ? window.hcaptcha.getResponse(captchaId) : ''; } catch (e) { return ''; }
    };
    const resetCaptcha = () => {
      try { if (captchaId !== null && window.hcaptcha) window.hcaptcha.reset(captchaId); } catch (e) { /* rien */ }
    };

    if (formKey) {
      captchaField.hidden = false;
      if ('IntersectionObserver' in window) {
        const watch = new IntersectionObserver((entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            watch.disconnect();
            loadCaptcha().catch(() => {});
          }
        }, { rootMargin: '400px 0px' });
        watch.observe(form);
      } else {
        loadCaptcha().catch(() => {});
      }
    }

    /* ---- événements de saisie ---- */
    const touch = () => {
      if (!firstTouch) firstTouch = Date.now();
      if (formKey) loadCaptcha().catch(() => {});
    };
    ['focusin', 'pointerdown', 'keydown', 'input'].forEach((type) => form.addEventListener(type, touch));
    Object.values(inputs).forEach((input) => {
      input.addEventListener('input', () => {
        if (input === inputs.message) updateCounter();
        if (tried) validate();
      });
      input.addEventListener('blur', () => {
        if (!tried || !input.value) return;
        validate();
      });
    });
    updateCounter();

    function showDone() {
      form.reset();
      updateCounter();
      tried = false;
      firstTouch = 0;
      setStatus('');
      Object.values(inputs).forEach((i) => setError(i, ''));
      fieldsBox.hidden = true;
      doneBox.hidden = false;
    }

    $('[data-form-again]', form).addEventListener('click', () => {
      doneBox.hidden = true;
      fieldsBox.hidden = false;
      inputs.name.focus();
    });

    const fallback = () => (email ? t('st.fallback', { email }) : '');

    /* changement de langue : messages du formulaire dans la nouvelle langue */
    onLang(() => {
      setStatus('');
      $('#cf-captcha-error').textContent = '';
      if (tried) validate();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      tried = true;
      setStatus('');
      $('#cf-captcha-error').textContent = '';

      if (!validate()) {
        setStatus(t('st.fix'), true);
        const firstInvalid = Object.values(inputs).find((i) => i.getAttribute('aria-invalid') === 'true');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const data = {
        name: oneLine(inputs.name.value),
        email: clean(inputs.email.value).toLowerCase(),
        subject: oneLine(inputs.subject.value),
        message: clean(inputs.message.value),
      };

      /* 2. pièges à robots remplis : on fait semblant que tout s'est bien passé */
      if (form.elements.website_url.value || form.elements.botcheck.checked) { showDone(); return; }

      /* 3. formulaire rempli trop vite (ou sans aucune saisie) : robot */
      if (!firstTouch || Date.now() - firstTouch < MIN_FILL_MS) { showDone(); return; }

      /* mots typiques des spams */
      if (SPAM_WORDS.test(data.subject + ' ' + data.message)) {
        setStatus(t('st.spam', { fallback: fallback() }), true);
        return;
      }

      /* 4. limites d'envoi dans ce navigateur */
      const now = Date.now();
      const history = readHistory().filter((h) => now - h.t < 24 * 3600 * 1000);
      const last = history[history.length - 1];
      const fingerprint = hash(data.email + '|' + data.message);
      if (history.some((h) => h.h === fingerprint)) {
        setStatus(t('st.dup'), true);
        return;
      }
      if (last && now - last.t < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - last.t)) / 1000);
        setStatus(t('st.cooldown', { s: wait }), true);
        return;
      }
      if (history.length >= MAX_PER_DAY) {
        setStatus(t('st.daily', { fallback: fallback() }), true);
        return;
      }

      /* formulaire pas encore relié : on ouvre la messagerie du visiteur */
      if (!formKey) {
        if (email) {
          const body = data.message + '\n\n' + data.name + ' · ' + data.email;
          location.href = 'mailto:' + email
            + '?subject=' + encodeURIComponent(data.subject || 'Message depuis le portfolio')
            + '&body=' + encodeURIComponent(body);
          setStatus(t('st.mailto'));
        } else {
          setStatus(t('st.unlinked'), true);
        }
        return;
      }

      /* 5. vérification humaine */
      try {
        await loadCaptcha();
      } catch (err) {
        setStatus(t('st.captchaFail', { fallback: fallback() }), true);
        return;
      }
      const token = captchaToken();
      if (!token) {
        $('#cf-captcha-error').textContent = t('err.captcha');
        setStatus(t('st.lastCheck'), true);
        return;
      }

      sending = true;
      form.classList.add('is-sending');
      submitBtn.disabled = true;
      setStatus(t('st.sending'));

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: formKey,
            subject: 'Portfolio · ' + (data.subject || 'nouveau message de ' + data.name),
            from_name: 'Portfolio Gvantca Bachilava',
            replyto: data.email,
            name: data.name,
            email: data.email,
            objet: data.subject || '—',
            langue: { fr: 'français', en: 'anglais', ka: 'géorgien' }[LANG],
            message: data.message,
            'h-captcha-response': token,
          }),
          signal: controller.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || 'HTTP ' + res.status);
        history.push({ t: Date.now(), h: fingerprint });
        writeHistory(history);
        showDone();
      } catch (err) {
        console.error('[contact]', err);
        setStatus(t('st.error', { fallback: fallback() }), true);
      } finally {
        clearTimeout(timer);
        resetCaptcha();
        sending = false;
        form.classList.remove('is-sending');
        submitBtn.disabled = false;
      }
    });
  }

  /* =============================================================
     LISEUSE PDF
     ============================================================= */
  const Reader = (() => {
    const el = $('#reader');
    const stage = $('#reader-stage');
    const book = $('#book');
    const slots = {
      left: $('[data-slot="left"]', book),
      right: $('[data-slot="right"]', book),
    };
    const ui = {
      kicker: $('#reader-kicker'),
      title: $('#reader-title'),
      count: $('#reader-count'),
      range: $('#reader-range'),
      zoom: $('#reader-zoom'),
      loader: $('#reader-loader'),
      progress: $('#reader-progress'),
      error: $('#reader-error'),
      errorText: $('#reader-error-text'),
      errorLink: $('#reader-error-link'),
      prev: $('[data-act="prev"]', el),
      next: $('[data-act="next"]', el),
      mode: $('[data-act="mode"]', el),
      full: $('[data-act="fullscreen"]', el),
      download: $('[data-act="download"]', el),
      close: $('[data-act="close"]', el),
    };
    const outside = [$('.skip'), nav, menu, $('#main'), $('.footer')].filter(Boolean);
    const ZOOMS = [1, 1.25, 1.5, 2, 2.5];
    const MAX_PIXELS = 6e6;

    const S = {
      id: null,
      task: null,
      pdf: null,
      n: 0,
      aspect: 1 / 1.414,
      page: 1,
      spread: false,
      mode: 'auto',
      zoom: 0,
      pw: 0,
      ph: 0,
      cache: new Map(),
      busy: false,
      pending: null,
      token: 0,
      opener: null,
      hideTimer: 0,
    };

    let libPromise = null;
    function loadPdfJs() {
      if (!libPromise) {
        libPromise = import(PDFJS + '/legacy/build/pdf.min.mjs').then((lib) => {
          lib.GlobalWorkerOptions.workerSrc = PDFJS + '/legacy/build/pdf.worker.min.mjs';
          return lib;
        });
        libPromise.catch(() => { libPromise = null; });
      }
      return libPromise;
    }

    function setDocInfo(id) {
      const doc = DOCS[id];
      ui.kicker.textContent = t('doc.' + id + '.kicker', null, doc.kicker);
      ui.title.textContent = t('doc.' + id + '.title', null, doc.title);
    }

    /* changement de langue pendant la lecture */
    onLang(() => {
      if (!S.id) return;
      setDocInfo(S.id);
      updateUI();
      if (!ui.error.hidden) showError();
      $$('canvas[data-page]', el).forEach((c) => c.setAttribute('aria-label', t('js.page') + ' ' + c.dataset.page));
    });

    /* ---- ouverture / fermeture ---- */
    async function open(id, page = 1, opener = null, fromHistory = false) {
      const doc = DOCS[id];
      if (!doc) return;
      if (opener) S.opener = opener;
      clearTimeout(S.hideTimer);

      if (el.hidden || !el.classList.contains('is-open')) {
        el.hidden = false;
        void el.offsetWidth;
        el.classList.add('is-open');
        root.classList.add('is-locked');
        outside.forEach((n) => { n.inert = true; });
      }

      setDocInfo(id);
      ui.download.href = doc.file;
      ui.download.setAttribute('download', doc.file.split('/').pop());
      ui.errorLink.href = doc.file;

      if (!fromHistory) {
        const state = { reader: id };
        const url = '#lire-' + id + (page > 1 ? '-' + page : '');
        if (history.state && history.state.reader) history.replaceState(state, '', url);
        else history.pushState(state, '', url);
      }
      ui.close.focus({ preventScroll: true });

      if (S.id === id && S.pdf) {
        request({ type: 'jump', page });
        return;
      }

      const token = ++S.token;
      reset();
      S.id = id;
      ui.error.hidden = true;
      showLoader(true);

      try {
        const lib = await loadPdfJs();
        if (token !== S.token) return;
        const task = lib.getDocument({
          url: doc.file,
          cMapUrl: PDFJS + '/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: PDFJS + '/standard_fonts/',
          isEvalSupported: false,
        });
        S.task = task;
        task.onProgress = (p) => setProgress(p && p.total ? p.loaded / p.total : null);
        const pdf = await task.promise;
        if (token !== S.token) return;

        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        S.pdf = pdf;
        S.n = pdf.numPages;
        S.aspect = vp.width / vp.height;
        layout();

        S.busy = true;
        try { await show(page, false); } finally { S.busy = false; }
        if (token !== S.token) return;
        showLoader(false);
        if (S.pending) pump();
      } catch (err) {
        if (token !== S.token) return;
        console.error('[liseuse]', err);
        showLoader(false);
        showError();
      }
    }

    function close(fromHistory = false) {
      if (!el.classList.contains('is-open')) return;
      el.classList.remove('is-open');
      root.classList.remove('is-locked');
      outside.forEach((n) => { n.inert = false; });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      S.hideTimer = setTimeout(() => { el.hidden = true; }, 450);
      if (!fromHistory && history.state && history.state.reader) history.back();
      if (S.opener && document.contains(S.opener)) S.opener.focus({ preventScroll: true });
    }

    function reset() {
      S.pending = null;
      if (S.task) S.task.destroy().catch(() => {});
      S.task = null;
      S.pdf = null;
      S.n = 0;
      S.page = 1;
      S.cache.forEach((p) => p.then((c) => { c.canvas.width = 0; c.canvas.height = 0; }).catch(() => {}));
      S.cache.clear();
      $$('.flipper', book).forEach((f) => f.remove());
      setSlot('left', null);
      setSlot('right', null);
      updateUI();
    }

    /* ---- mise en page ---- */
    function layout() {
      if (!S.pdf) return false;
      const cs = getComputedStyle(stage);
      const W = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const H = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const a = S.aspect;
      const hSingle = Math.min(H, W / a);
      const hDouble = Math.min(H, W / 2 / a);
      const spread = S.mode === 'double' ? true
        : S.mode === 'single' ? false
        : (W >= 720 && hDouble >= hSingle * 0.8);
      const z = ZOOMS[S.zoom];
      const ph = Math.max(140, Math.floor((spread ? hDouble : hSingle) * z));
      const pw = Math.floor(ph * a);
      const changed = ph !== S.ph || pw !== S.pw || spread !== S.spread;

      S.ph = ph;
      S.pw = pw;
      S.spread = spread;
      book.style.setProperty('--pw', pw + 'px');
      book.style.setProperty('--ph', ph + 'px');
      book.classList.toggle('is-single', !spread);
      stage.classList.toggle('is-zoomed', z > 1);
      ui.zoom.textContent = Math.round(z * 100) + ' %';
      ui.mode.setAttribute('aria-pressed', String(spread));
      return changed;
    }

    /* ---- rendu d'une page dans un canvas (avec cache) ---- */
    function renderPage(n) {
      const key = n + ':' + S.pw + 'x' + S.ph;
      const cached = S.cache.get(key);
      if (cached) return cached;

      const pdf = S.pdf;
      const pw = S.pw;
      const ph = S.ph;
      const job = pdf.getPage(n).then((page) => {
        const base = page.getViewport({ scale: 1 });
        const fit = Math.min(pw / base.width, ph / base.height);
        const cssW = base.width * fit;
        const cssH = base.height * fit;
        let ratio = Math.min(window.devicePixelRatio || 1, 2.5);
        ratio = Math.min(ratio, Math.sqrt(MAX_PIXELS / (cssW * cssH)));
        const viewport = page.getViewport({ scale: fit * ratio });

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', t('js.page') + ' ' + n);
        canvas.dataset.page = n;

        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return page.render({ canvasContext: ctx, viewport }).promise.then(() => ({ canvas, n }));
      });
      S.cache.set(key, job);
      job.catch(() => S.cache.delete(key));
      return job;
    }

    function trimCache() {
      const size = ':' + S.pw + 'x' + S.ph;
      for (const [key, job] of S.cache) {
        const n = parseInt(key, 10);
        if (!key.endsWith(size) || Math.abs(n - S.page) > 6) {
          S.cache.delete(key);
          job.then((c) => {
            if (!c.canvas.isConnected) { c.canvas.width = 0; c.canvas.height = 0; }
          }).catch(() => {});
        }
      }
    }

    function prefetch() {
      const pdf = S.pdf;
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 120));
      idle(() => {
        if (pdf !== S.pdf) return;
        const pages = [];
        [1, -1].forEach((dir) => {
          const t = neighbor(dir);
          if (t == null) return;
          if (S.spread) spreadPages(t).forEach((p) => { if (p) pages.push(p); });
          else pages.push(t);
        });
        pages.forEach((p) => renderPage(p).catch(() => {}));
      });
    }

    /* ---- logique des doubles pages : [gauche, droite] ---- */
    function spreadPages(p) {
      if (p <= 1) return [null, 1];
      const left = p % 2 === 0 ? p : p - 1;
      return [left, left + 1 <= S.n ? left + 1 : null];
    }

    function neighbor(dir) {
      if (!S.n) return null;
      if (S.spread) {
        const [left] = spreadPages(S.page);
        if (dir > 0) {
          const t = left ? left + 2 : 2;
          return t <= S.n ? t : null;
        }
        if (!left) return null;
        return left - 2 >= 2 ? left - 2 : 1;
      }
      const t = S.page + dir;
      return t >= 1 && t <= S.n ? t : null;
    }

    function clampPage(p) {
      return Math.min(Math.max(1, Math.round(p) || 1), S.n || 1);
    }

    function setSlot(side, item) {
      const slot = slots[side];
      if (item) {
        slot.replaceChildren(item.canvas);
        slot.classList.remove('is-empty');
      } else {
        slot.replaceChildren();
        slot.classList.add('is-empty');
      }
    }

    /* ---- file d'actions : une animation à la fois ---- */
    function request(action) {
      if (!S.pdf) {
        if (S.id) S.pending = action;
        return;
      }
      const p = S.pending;
      if (action.type === 'turn' && p && p.type === 'turn' && p.dir === action.dir) {
        p.count = Math.min(p.count + 1, 8);
      } else {
        S.pending = action.type === 'turn' ? { type: 'turn', dir: action.dir, count: 1 } : action;
      }
      if (!S.busy) pump();
    }

    async function pump() {
      if (S.busy) return;
      S.busy = true;
      try {
        while (S.pending && S.pdf) {
          const a = S.pending;
          S.pending = null;
          if (a.type === 'turn') {
            const moved = await turn(a.dir, a.count > 1);
            if (moved && a.count > 1) {
              const p = S.pending;
              if (!p) S.pending = { type: 'turn', dir: a.dir, count: a.count - 1 };
              else if (p.type === 'turn' && p.dir === a.dir) p.count = Math.min(p.count + a.count - 1, 8);
            }
          } else {
            await show(a.page == null ? S.page : a.page, true);
          }
        }
      } catch (err) {
        console.error('[liseuse]', err);
      } finally {
        S.busy = false;
      }
    }

    /* ---- affichage direct (ouverture, saut, redimensionnement) ---- */
    async function show(page, fade) {
      if (!S.pdf) return;
      const pdf = S.pdf;
      const target = clampPage(page);
      const changed = target !== S.page;

      if (S.spread) {
        const [l, r] = spreadPages(target);
        const [cl, cr] = await Promise.all([l ? renderPage(l) : null, r ? renderPage(r) : null]);
        if (pdf !== S.pdf) return;
        setSlot('left', cl);
        setSlot('right', cr);
      } else {
        const c = await renderPage(target);
        if (pdf !== S.pdf) return;
        setSlot('left', null);
        setSlot('right', c);
      }

      S.page = target;
      updateUI();
      trimCache();
      prefetch();
      if (stage.classList.contains('is-zoomed')) {
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      }
      if (fade && changed && !reduceMotion.matches) {
        book.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
      }
    }

    /* ---- tourner une page (animation 3D) ---- */
    async function turn(dir, fast) {
      const target = neighbor(dir);
      if (target == null) {
        nudge(dir);
        return false;
      }
      const pdf = S.pdf;
      const animate = !reduceMotion.matches;
      const duration = fast ? 420 : 860;

      if (S.spread) {
        const [l, r] = spreadPages(S.page);
        const [l2, r2] = spreadPages(target);
        const [cl, cr, cl2, cr2] = await Promise.all([l, r, l2, r2].map((p) => (p ? renderPage(p) : null)));
        if (pdf !== S.pdf) return false;

        if (!animate) {
          setSlot('left', cl2);
          setSlot('right', cr2);
        } else if (dir > 0) {
          const fl = makeFlipper('right', cr, cl2);
          setSlot('right', cr2);
          await flip(fl, 0, -180, duration);
          fl.remove();
          if (pdf !== S.pdf) return false;
          setSlot('left', cl2);
        } else {
          const fl = makeFlipper('left', cl, cr2);
          setSlot('left', cl2);
          await flip(fl, 0, 180, duration);
          fl.remove();
          if (pdf !== S.pdf) return false;
          setSlot('right', cr2);
        }
      } else {
        const [cur, next] = await Promise.all([renderPage(S.page), renderPage(target)]);
        if (pdf !== S.pdf) return false;

        if (!animate) {
          setSlot('right', next);
        } else if (dir > 0) {
          const fl = makeFlipper('single', cur, null);
          setSlot('right', next);
          await flip(fl, 0, -180, duration, 'out');
          fl.remove();
        } else {
          const fl = makeFlipper('single', next, null);
          await flip(fl, -180, 0, duration, 'in');
          fl.remove();
          if (pdf !== S.pdf) return false;
          setSlot('right', next);
        }
      }

      S.page = target;
      updateUI();
      trimCache();
      prefetch();
      return true;
    }

    function makeFlipper(kind, front, back) {
      const fl = document.createElement('div');
      fl.className = 'flipper flipper--' + kind;
      fl.append(makeFace('front', front), makeFace('back', back));
      book.append(fl);
      return fl;
    }

    function makeFace(side, item) {
      const face = document.createElement('div');
      face.className = 'flipper__face flipper__face--' + side;
      if (item) face.append(item.canvas);
      else face.classList.add('is-blank');
      const shade = document.createElement('div');
      shade.className = 'flipper__shade';
      face.append(shade);
      return face;
    }

    function flip(fl, from, to, duration, fade) {
      const easing = 'cubic-bezier(.45, .05, .25, 1)';
      const at = (t) => 'rotateY(' + (from + (to - from) * t) + 'deg)';
      let frames;
      if (fade === 'out') {
        frames = [
          { transform: at(0), opacity: 1 },
          { transform: at(0.55), opacity: 1, offset: 0.55 },
          { transform: at(1), opacity: 0 },
        ];
      } else if (fade === 'in') {
        frames = [
          { transform: at(0), opacity: 0 },
          { transform: at(0.45), opacity: 1, offset: 0.45 },
          { transform: at(1), opacity: 1 },
        ];
      } else {
        frames = [{ transform: at(0) }, { transform: at(1) }];
      }
      const anim = fl.animate(frames, { duration, easing, fill: 'forwards' });
      $$('.flipper__shade', fl).forEach((s) => {
        s.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, easing });
      });
      return anim.finished.catch(() => {});
    }

    function nudge(dir) {
      if (reduceMotion.matches) return;
      const d = dir > 0 ? -10 : 10;
      book.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(' + d + 'px)' }, { transform: 'translateX(0)' }],
        { duration: 380, easing: 'cubic-bezier(.3, .7, .4, 1)' }
      );
    }

    /* ---- interface ---- */
    function updateUI() {
      const n = S.n;
      if (!n) {
        ui.count.textContent = '—';
        ui.range.max = 1;
        ui.range.value = 1;
        ui.range.style.setProperty('--p', '0%');
        return;
      }
      let label = String(S.page);
      if (S.spread) {
        const [l, r] = spreadPages(S.page);
        label = l && r ? l + '–' + r : String(l || r);
      }
      ui.count.textContent = label + ' / ' + n;
      ui.range.max = n;
      ui.range.value = S.page;
      ui.range.style.setProperty('--p', (n > 1 ? ((S.page - 1) / (n - 1)) * 100 : 100) + '%');
      ui.range.setAttribute('aria-valuetext', t('js.pageOf', { label, n }));
      ui.prev.setAttribute('aria-disabled', String(neighbor(-1) == null));
      ui.next.setAttribute('aria-disabled', String(neighbor(1) == null));

      if (history.state && history.state.reader === S.id) {
        history.replaceState(history.state, '', '#lire-' + S.id + (S.page > 1 ? '-' + S.page : ''));
      }
    }

    function showLoader(on) {
      ui.loader.classList.toggle('is-hidden', !on);
      if (on) setProgress(null);
    }

    function setProgress(ratio) {
      const bar = ui.progress.parentElement;
      if (ratio == null) {
        bar.classList.add('is-indeterminate');
        ui.progress.style.width = '';
      } else {
        bar.classList.remove('is-indeterminate');
        ui.progress.style.width = Math.round(Math.min(1, ratio) * 100) + '%';
      }
    }

    function showError() {
      ui.error.hidden = false;
      ui.errorText.textContent = location.protocol === 'file:'
        ? t('js.readerFile')
        : t('js.readerNet');
    }

    function zoom(step) {
      const z = Math.max(0, Math.min(ZOOMS.length - 1, S.zoom + step));
      if (z === S.zoom) return;
      S.zoom = z;
      if (layout()) request({ type: 'jump' });
    }

    function toggleMode() {
      S.mode = S.spread ? 'single' : 'double';
      if (layout()) request({ type: 'jump' });
    }

    function trapFocus(e) {
      const focusables = $$('button, a[href], input', el).filter((x) => !x.hidden && x.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ---- événements ---- */
    el.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest('[data-act]') : null;
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'download') return;
      e.preventDefault();
      if (act === 'close') close();
      else if (act === 'prev') request({ type: 'turn', dir: -1 });
      else if (act === 'next') request({ type: 'turn', dir: 1 });
      else if (act === 'zoom-in') zoom(1);
      else if (act === 'zoom-out') zoom(-1);
      else if (act === 'mode') toggleMode();
      else if (act === 'fullscreen') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      }
    });

    if (!document.fullscreenEnabled) ui.full.hidden = true;
    document.addEventListener('fullscreenchange', () => {
      ui.full.setAttribute('aria-pressed', String(!!document.fullscreenElement));
    });

    ui.range.addEventListener('input', () => {
      const v = Number(ui.range.value);
      ui.count.textContent = v + ' / ' + S.n;
      ui.range.style.setProperty('--p', (S.n > 1 ? ((v - 1) / (S.n - 1)) * 100 : 100) + '%');
    });
    ui.range.addEventListener('change', () => request({ type: 'jump', page: Number(ui.range.value) }));

    document.addEventListener('keydown', (e) => {
      if (!el.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') { trapFocus(e); return; }
      if (e.target === ui.range || e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          request({ type: 'turn', dir: 1 });
          break;
        case 'ArrowLeft':
        case 'PageUp':
          request({ type: 'turn', dir: -1 });
          break;
        case ' ':
          if (e.target instanceof Element && e.target.closest('button, a')) return;
          request({ type: 'turn', dir: e.shiftKey ? -1 : 1 });
          break;
        case 'Home':
          request({ type: 'jump', page: 1 });
          break;
        case 'End':
          request({ type: 'jump', page: S.n });
          break;
        case '+':
        case '=':
          zoom(1);
          break;
        case '-':
        case '_':
          zoom(-1);
          break;
        default:
          return;
      }
      e.preventDefault();
    });

    /* glisser du doigt ou clic sur la page */
    let down = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    stage.addEventListener('pointercancel', () => { down = null; });
    stage.addEventListener('pointerup', (e) => {
      if (!down || !S.pdf) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const dt = Date.now() - down.t;
      down = null;
      if (ZOOMS[S.zoom] > 1) return;

      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        request({ type: 'turn', dir: dx < 0 ? 1 : -1 });
        return;
      }
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 600) {
        const r = book.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        const mid = S.spread ? r.left + r.width / 2 : r.left + r.width * 0.35;
        request({ type: 'turn', dir: e.clientX < mid ? -1 : 1 });
      }
    });

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (el.classList.contains('is-open') && S.pdf && layout()) request({ type: 'jump' });
      }, 140);
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
    else window.addEventListener('resize', onResize);

    /* bouton « retour » du navigateur = fermer la liseuse */
    window.addEventListener('popstate', (e) => {
      const st = e.state;
      if (st && st.reader && DOCS[st.reader]) {
        const m = location.hash.match(/-(\d+)$/);
        open(st.reader, m ? Number(m[1]) : 1, null, true);
      } else {
        close(true);
      }
    });

    /* lien direct : …/#lire-memoire-24 */
    function openFromHash() {
      const m = location.hash.match(/^#lire-([a-z]+)(?:-(\d+))?$/);
      if (!m || !DOCS[m[1]]) return;
      history.replaceState(null, '', location.pathname + location.search);
      open(m[1], m[2] ? Number(m[2]) : 1);
    }

    return { open, openFromHash };
  })();

  /* Boutons « Feuilleter » / « Ouvrir » */
  document.addEventListener('click', (e) => {
    const trigger = e.target instanceof Element ? e.target.closest('[data-open]') : null;
    if (!trigger) return;
    e.preventDefault();
    Reader.open(trigger.dataset.open, parseInt(trigger.dataset.page, 10) || 1, trigger);
  });

  Reader.openFromHash();
})();
