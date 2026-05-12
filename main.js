/* ── Navbar scroll ── */
const navbar = document.getElementById('navbar');
const tickNav = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', tickNav, { passive: true });
tickNav();

/* ── Hamburger ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;
hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  hamburger.classList.toggle('open', menuOpen);
  hamburger.setAttribute('aria-expanded', menuOpen);
  mobileMenu.classList.toggle('open', menuOpen);
  mobileMenu.setAttribute('aria-hidden', !menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});
function closeMobile() {
  menuOpen = false;
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', true);
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) closeMobile(); });

/* ── Scroll reveal ── */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }),
    { threshold: 0, rootMargin: '0px 0px 0px 0px' }
  );
  revealEls.forEach(el => io.observe(el));
  setTimeout(() => revealEls.forEach(el => el.classList.add('visible')), 800);
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ── Hero carosello ── */
(function() {
  var carousel = document.getElementById('heroCarousel');
  if (!carousel) return;

  var MOBILE_BP = 768; /* breakpoint mobile/tablet */
  var isMobile = window.innerWidth < MOBILE_BP;

  /* ═══════════════════════════════════════════════
     MODIFICARE QUESTO COMPONENTE PER AGGIUNGERE VIDEO O IMMAGINI
     ─────────────────────────────────────────────
     Ordine desktop: video → hero1 → hero2 → hero3 → (loop)
     type: 'image' → src: percorso, duration: ms di pausa
     type: 'vimeo' → src: ID Vimeo, dura fino alla fine del video
  ════════════════════════════════════════════════ */
  var SLIDES_DESKTOP = [
    { type: 'video', src: 'newassets/vid1.mp4' },
    { type: 'video', src: 'newassets/Vid2.mp4' },
    { type: 'video', src: 'newassets/vid3.mp4' },
    { type: 'video', src: 'newassets/Vid4.mp4' },
    { type: 'image', src: 'newassets/hero1.jpeg', duration: 6000 },
    { type: 'image', src: 'newassets/hero2.jpg',  duration: 6000 },
    { type: 'image', src: 'newassets/hero3.jpg',  duration: 6000 },
    { type: 'image', src: 'newassets/hero4.jpg',  duration: 6000 }
  ];

  var SLIDES = isMobile ? [
    { type: 'image', src: 'newassets/heromobile.jpg', duration: 999999 }
  ] : SLIDES_DESKTOP;
  var N = SLIDES.length;
  var current = 0;
  var timer = null;

  /* ── Preload immagini hero in background ── */
  SLIDES.forEach(function(slide) {
    if (slide.type !== 'image') return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = slide.src;
    document.head.appendChild(link);
  });

  /* Costruisce tutte le slide nel DOM */
  SLIDES.forEach(function(slide, i) {
    var el = document.createElement('div');
    el.className = 'hero-slide' + (i === 0 ? ' active' : '');
    el.id = 'slide-' + i;

    if (slide.type === 'image') {
      var img = document.createElement('img');
      img.src = slide.src;
      img.alt = '';
      img.fetchPriority = 'low';
      img.decoding = 'async';
      el.appendChild(img);

    } else if (slide.type === 'video') {
      el.classList.add('is-video');
      var vid = document.createElement('video');
      vid.id = 'video-' + i;
      vid.src = slide.src;
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.setAttribute('playsinline', '');
      el.appendChild(vid);
    }

    carousel.appendChild(el);
  });

  var slideEls = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));

  var CROSSFADE_MS = 1500; /* durata crossfade in ms */

  function goTo(idx) {
    var next = ((idx % N) + N) % N;
    var leaving = current;
    current = next;

    /* Slide entrante: parte subito (opacity 0 → 1) */
    slideEls[current].classList.add('active');

    /* Reset heroZoom per le immagini entranti */
    var img = slideEls[current].querySelector('img');
    if (img) { img.style.animation = 'none'; img.offsetHeight; img.style.animation = ''; }

    /* Avvia video entrante subito così è visibile durante il crossfade */
    if (SLIDES[current].type === 'video') {
      var vidIn = document.getElementById('video-' + current);
      if (vidIn) { vidIn.currentTime = 0; vidIn.play().catch(function() {}); }
    }

    /* Slide uscente: lasciala visibile durante il crossfade, poi rimuovi active */
    setTimeout(function() {
      slideEls[leaving].classList.remove('active');
      /* Pausa video uscente solo dopo che è scomparso */
      var vidOut = slideEls[leaving].querySelector('video');
      if (vidOut) { vidOut.pause(); vidOut.currentTime = 0; }
    }, CROSSFADE_MS);

    clearTimeout(timer);

    if (SLIDES[current].type === 'image') {
      var c = current;
      timer = setTimeout(function() { goTo(c + 1); }, SLIDES[current].duration);
    }
    /* Per i video il timer è gestito dall'evento 'ended' */
  }

  /* ── Inizializza video HTML5 ── */
  SLIDES.forEach(function(slide, i) {
    if (slide.type !== 'video') return;
    (function(idx) {
      var vid = document.getElementById('video-' + idx);
      if (!vid) return;
      /* Quando finisce passa alla slide successiva */
      vid.addEventListener('ended', function() {
        clearTimeout(timer);
        goTo(idx + 1);
      });
      /* Se è il primo slide, avvia subito */
      if (idx === 0) {
        vid.play().catch(function() {});
      }
    })(i);
  });

  /* Avvia il carosello */
  if (SLIDES[0].type === 'video') {
    /* niente timer — aspetta evento 'ended'. Fallback 60s */
    timer = setTimeout(function() { if (current === 0) goTo(1); }, 60000);
  } else if (SLIDES[0].type === 'image') {
    if (N > 1) timer = setTimeout(function() { goTo(1); }, SLIDES[0].duration);
  }

  /* ── Resize: se si passa da mobile a desktop (o viceversa) ricarica la pagina
     così il carosello viene reinizializzato con le slide corrette ── */
  var _resizeTO;
  window.addEventListener('resize', function() {
    clearTimeout(_resizeTO);
    _resizeTO = setTimeout(function() {
      var nowMobile = window.innerWidth < MOBILE_BP;
      if (nowMobile !== isMobile) {
        window.location.reload();
      }
    }, 300);
  });

})();

/* ── Intro: dispersione logo + particelle ── */
function launchParticles(logoEl) {
  var canvas = document.createElement('canvas');
  canvas.id = 'intro-particles';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');

  /* Centro del logo */
  var rect = logoEl.getBoundingClientRect();
  var cx = rect.left + rect.width  / 2;
  var cy = rect.top  + rect.height / 2;

  /* Colori dal design system */
  var COLORS = ['#e8871a', '#ffffff', '#c4a882', '#d4956a', '#f5f0ea'];

  /* Genera particelle */
  var COUNT = 80;
  var particles = [];
  for (var i = 0; i < COUNT; i++) {
    var angle  = Math.random() * Math.PI * 2;
    var speed  = 1.5 + Math.random() * 5.5;
    var size   = 2 + Math.random() * 6;
    var life   = 0.6 + Math.random() * 0.4; /* durata relativa 0–1 */
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (Math.random() * 1.5), /* leggero drift in su */
      size: size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
      life: life,
      decay: 0.012 + Math.random() * 0.018
    });
  }

  var startTime = null;
  var DURATION  = 1400; /* ms totali animazione particelle */

  function step(ts) {
    if (!startTime) startTime = ts;
    var elapsed = ts - startTime;
    var progress = Math.min(elapsed / DURATION, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(function(p) {
      if (p.alpha <= 0) return;

      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.06; /* gravità leggera */
      p.vx *= 0.98; /* attrito aria */
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle   = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(step);
}

(function() {
  var screen = document.getElementById('intro-screen');
  var inner  = document.getElementById('introLogoInner');
  var btn    = document.getElementById('intro-enter-btn');
  if (!screen || !inner || !btn) return;

  /* Mostra intro solo una volta per sessione */
  if (sessionStorage.getItem('introPlayed')) {
    screen.style.display = 'none';
    return;
  }

  /* Blocca scroll mentre l'intro è visibile */
  document.body.style.overflow = 'hidden';

  /* Rileva dispositivi touch / mobile-tablet (< 1024px o touchscreen) */
  var isTouchDevice = (window.innerWidth < 1024) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0);

  /*
    DESKTOP: zoom + flip in simultanea — 5.5 secondi fade
    MOBILE/TABLET: nessuna animazione — semplice fade rapido (600ms)
  */
  var T_LOGO    = 1600; /* durata animazione logo: flip + zoom */
  var T_BGDELAY =  600; /* il fade schermo parte subito dopo il flip */
  var T_BGFADE  = 5500; /* fade schermo desktop: 5.5 secondi */
  var T_MOBILE_FADE = 600; /* fade rapido su mobile: 0.6s */

  function startTransition() {
    var hint = document.querySelector('.intro-hint');
    [btn, hint].forEach(function(el) {
      if (!el) return;
      el.style.animation = 'none';
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    });
    btn.disabled = true;

    if (isTouchDevice) {
      /* ── Mobile/Tablet: nessun flip, nessuno zoom — fade diretto ── */
      screen.style.transition = 'opacity ' + T_MOBILE_FADE + 'ms ease';
      screen.style.opacity = '0';
      screen.style.pointerEvents = 'none';
      setTimeout(function() {
        screen.remove();
        document.body.style.overflow = '';
        sessionStorage.setItem('introPlayed', '1');
      }, T_MOBILE_FADE + 50);

    } else {
      /* ── Desktop: dispersione + particelle ── */
      var T_DISPERSE = 900;  /* durata animazione logo */
      var T_BGFADE2  = 1200; /* fade schermo dopo dispersione */

      /* 1. Lancia le particelle dal logo */
      // launchParticles(inner);

      /* 2. Anima il logo: scala + blur + fade */
      inner.style.transition = 'none';
      inner.offsetHeight;
      inner.style.animation = 'introDisperse ' + T_DISPERSE + 'ms cubic-bezier(0.2,0,0.8,1) forwards';

      /* 3. Fade schermo */
      setTimeout(function() {
        screen.style.transition = 'opacity ' + T_BGFADE2 + 'ms ease';
        screen.style.opacity = '0';
        screen.style.pointerEvents = 'none';
        document.body.style.overflow = '';
      }, T_DISPERSE * 0.4);

      /* 4. Rimozione DOM */
      setTimeout(function() {
        screen.remove();
        sessionStorage.setItem('introPlayed', '1');
      }, T_DISPERSE + T_BGFADE2 + 100);
    }
  }

  btn.addEventListener('click', startTransition);

  /* Consenti anche la pressione di Invio/Spazio da tastiera */
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startTransition();
    }
  });
})();

/* ── Studio gallery carousel (solo mobile) ── */
(function() {
  if (window.innerWidth >= 768) return;
  var photos = Array.prototype.slice.call(document.querySelectorAll('.studio-gallery .studio-photo'));
  if (!photos.length) return;
  var cur = 0;
  photos[0].classList.add('active-slide');
  setInterval(function() {
    photos[cur].classList.remove('active-slide');
    cur = (cur + 1) % photos.length;
    photos[cur].classList.add('active-slide');
  }, 4000);
})();

/* ── YouTube player — click apre YouTube in nuova scheda ── */
document.querySelectorAll('.yt-lazy').forEach(function(el) {
  el.addEventListener('click', function() {
    var id = el.dataset.ytid;
    window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
  });
});

/* ── Avid logo carousel ── */
(function() {
  /* Gestisce tutti i contenitori avid (bio + hero) in sincronia */
  var containers = ['#avidCarousel', '#avidCarouselHero'];
  var allSlides = containers.map(function(sel) {
    var el = document.querySelector(sel);
    return el ? Array.prototype.slice.call(el.querySelectorAll('.avid-slide')) : [];
  }).filter(function(arr) { return arr.length > 0; });
  if (!allSlides.length) return;
  var n = allSlides[0].length;
  var cur = 0;
  setInterval(function() {
    allSlides.forEach(function(slides) {
      slides[cur].classList.remove('active');
    });
    cur = (cur + 1) % n;
    allSlides.forEach(function(slides) {
      slides[cur].classList.add('active');
    });
  }, 2500);
})();

/* ── Video carousel (Lavori) ── */
(function() {
  var track    = document.getElementById('vcarouselTrack');
  var prevBtn  = document.getElementById('vcarouselPrev');
  var nextBtn  = document.getElementById('vcarouselNext');
  var dotsWrap = document.getElementById('vcarouselDots');
  if (!track || !prevBtn || !nextBtn) return;

  var items = Array.prototype.slice.call(track.querySelectorAll('.vcarousel-item'));
  var total = items.length;
  var current = 0;
  var perPage = 1;
  var gap = 20; /* px — deve matchare il gap CSS (1.25rem ≈ 20px) */

  /* Calcola quante slide mostrare in base alla larghezza viewport */
  function getPerPage() {
    var w = window.innerWidth;
    /* In UHD/ultrawide i box sono più grandi — se l'item width risulta
       inferiore a 320px con 4 colonne, scende a 3 automaticamente */
    if (w >= 2560) {
      var containerW = track.parentElement ? track.parentElement.offsetWidth : w;
      var itemW4 = (containerW - gap * 3) / 4;
      return itemW4 >= 320 ? 4 : 3;
    }
    if (w >= 1920) return 4;
    if (w >= 1280) return 3;
    if (w >= 768)  return 2;
    return 1;
  }

  /* Imposta larghezza di ogni item e aggiorna tutto */
  function setup() {
    perPage  = getPerPage();
    var containerW = track.parentElement.offsetWidth;
    var itemW = (containerW - gap * (perPage - 1)) / perPage;
    items.forEach(function(item) {
      item.style.width = itemW + 'px';
    });
    /* Ricava il gap reale dal CSS computato se disponibile */
    var style = window.getComputedStyle(track);
    gap = parseFloat(style.gap) || gap;
    /* Clamp current so we don't go past max */
    var maxPage = Math.max(0, total - perPage);
    if (current > maxPage) current = maxPage;
    render();
  }

  function render() {
    var containerW = track.parentElement.offsetWidth;
    var itemW = (containerW - gap * (perPage - 1)) / perPage;
    var offset = current * (itemW + gap);
    track.style.transform = 'translateX(-' + offset + 'px)';

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= total - perPage;

    /* Dots — uno per pagina */
    var pages = Math.ceil(total / perPage);
    var activePage = Math.floor(current / perPage);
    dotsWrap.innerHTML = '';
    for (var i = 0; i < pages; i++) {
      (function(idx) {
        var dot = document.createElement('button');
        dot.className = 'vcarousel-dot' + (idx === activePage ? ' active' : '');
        dot.setAttribute('aria-label', 'Pagina ' + (idx + 1));
        dot.addEventListener('click', function() {
          current = idx * perPage;
          render();
        });
        dotsWrap.appendChild(dot);
      })(i);
    }
  }

  prevBtn.addEventListener('click', function() {
    if (current > 0) { current--; render(); }
  });
  nextBtn.addEventListener('click', function() {
    if (current < total - perPage) { current++; render(); }
  });

  /* Swipe touch */
  var startX = 0;
  track.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function(e) {
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < total - perPage) { current++; render(); }
      if (diff < 0 && current > 0)               { current--; render(); }
    }
  });

  setup();
  window.addEventListener('resize', setup);

  /* ── Auto-scroll ogni 4 secondi ── */
  var autoTimer = null;
  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function() {
      if (current < total - perPage) {
        current++;
      } else {
        current = 0; /* loop */
      }
      render();
    }, 4000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }
  /* Pausa su interazione manuale, riparte dopo 8s di inattività */
  prevBtn.addEventListener('click', resetAuto);
  nextBtn.addEventListener('click', resetAuto);
  track.addEventListener('touchend', resetAuto);
  startAuto();
})();

/* ── Smooth scroll con offset navbar ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = a.getAttribute('href');
    if (target === '#') return;
    const el = document.querySelector(target);
    if (!el) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
