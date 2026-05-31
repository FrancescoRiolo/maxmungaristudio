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

  var MOBILE_BP   = 768;
  var CROSSFADE   = 800;   /* ms crossfade tra slide */
  var isMobile    = window.innerWidth < MOBILE_BP;

  /* ═══════════════════════════════════════════════
     SLIDES — aggiungi/rimuovi qui
     type:'vimeo'  src: ID Vimeo  (dura fino a ended)
     type:'image'  src: path      duration: ms
  ════════════════════════════════════════════════ */
  var SLIDES = isMobile
    ? [
        { type: 'vimeo', src: '1190963009' },
        { type: 'image', src: 'newassets/heromobile.jpg', duration: 6000 }
      ]
    : [
        { type: 'vimeo', src: '1190963009' },
        { type: 'image', src: 'newassets/hero1.jpeg', duration: 6000 },
        { type: 'image', src: 'newassets/hero2.jpg',  duration: 6000 },
        { type: 'image', src: 'newassets/hero3.jpg',  duration: 6000 },
        { type: 'image', src: 'newassets/hero4.jpg',  duration: 6000 }
      ];

  var N       = SLIDES.length;
  var cur     = 0;
  var timer   = null;
  var player  = null;   /* unico player Vimeo */
  var ready   = false;  /* player pronto */

  /* ── Costruisce DOM ── */
  SLIDES.forEach(function(s, i) {
    var el = document.createElement('div');
    el.className = 'hero-slide' + (i === 0 ? ' active' : '');
    el.id = 'slide-' + i;

    if (s.type === 'image') {
      var img = document.createElement('img');
      img.src = s.src; img.alt = '';
      img.decoding = 'async';
      el.appendChild(img);

    } else if (s.type === 'vimeo') {
      el.classList.add('is-video');
      var ifr = document.createElement('iframe');
      ifr.id  = 'vimeo-hero';
      ifr.src = 'https://player.vimeo.com/video/' + s.src +
                '?autoplay=0&muted=1&controls=0&loop=0&playsinline=1&background=1';
      ifr.allow = 'autoplay; fullscreen; picture-in-picture';
      ifr.setAttribute('allowfullscreen', '');
      ifr.title = '';
      el.appendChild(ifr);
    }
    carousel.appendChild(el);
  });

  var els = Array.prototype.slice.call(carousel.querySelectorAll('.hero-slide'));

  /* ── goTo: crossfade tra slide ── */
  function goTo(idx) {
    var next    = ((idx % N) + N) % N;
    var leaving = cur;
    cur = next;

    /* Slide entrante visibile */
    els[cur].classList.add('active');

    /* Reset zoom immagine entrante */
    var img = els[cur].querySelector('img');
    if (img) { img.style.animation = 'none'; img.offsetHeight; img.style.animation = ''; }

    /* Avvia video se è un vimeo */
    if (SLIDES[cur].type === 'vimeo' && player && ready) {
      player.setCurrentTime(0).then(function() { player.play(); });
    }

    /* Dopo crossfade: togli la slide uscente */
    setTimeout(function() {
      els[leaving].classList.remove('active');
    }, CROSSFADE);

    /* Timer per immagini */
    clearTimeout(timer);
    if (SLIDES[cur].type === 'image') {
      var c = cur;
      timer = setTimeout(function() { goTo(c + 1); }, SLIDES[cur].duration);
    }
  }

  /* ── Inizializza Vimeo se presente ── */
  var vimeoIdx = -1;
  SLIDES.forEach(function(s, i) { if (s.type === 'vimeo') vimeoIdx = i; });

  if (vimeoIdx >= 0) {
    function initPlayer() {
      var ifr = document.getElementById('vimeo-hero');
      if (!ifr || typeof Vimeo === 'undefined') return;
      player = new Vimeo.Player(ifr);

      player.ready().then(function() {
        ready = true;
        /* Avvia subito per bufferizzare (anche sotto l'intro) */
        player.play().catch(function() {});
        /* Preload immagini mentre il video carica */
        SLIDES.forEach(function(s) {
          if (s.type === 'image') { var x = new Image(); x.src = s.src; }
        });
      });

      player.on('ended', function() {
        if (document.getElementById('intro-screen')) {
          /* Intro ancora aperta: riparti da 0 in loop finché non entra */
          player.setCurrentTime(0).then(function() { player.play(); });
          return;
        }
        clearTimeout(timer);
        goTo(vimeoIdx + 1);
      });
    }

    if (typeof Vimeo !== 'undefined') {
      initPlayer();
    } else {
      document.addEventListener('DOMContentLoaded', initPlayer);
    }
  }

  /* ── Avvio carosello ── */
  if (SLIDES[0].type === 'image') {
    timer = setTimeout(function() { goTo(1); }, SLIDES[0].duration);
  }
  /* Per vimeo: il timer parte dall'evento ended */

  /* ── Resize reload ── */
  var _rt;
  window.addEventListener('resize', function() {
    clearTimeout(_rt);
    _rt = setTimeout(function() {
      if ((window.innerWidth < MOBILE_BP) !== isMobile) window.location.reload();
    }, 300);
  });

  /* ── Esponi player per l'intro ── */
  window.__heroVimeoPlayer = function() { return player; };

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

  /* Blocca scroll e nasconde scrollbar mentre l'intro è visibile */
  document.documentElement.classList.add('intro-visible');
  document.body.classList.add('intro-visible');
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
        document.documentElement.classList.remove('intro-visible');
        document.body.classList.remove('intro-visible');
        document.body.style.overflow = '';
        sessionStorage.setItem('introPlayed', '1');
        if (window.__startSocialHover) window.__startSocialHover();
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
        document.documentElement.classList.remove('intro-visible');
        document.body.classList.remove('intro-visible');
        document.body.style.overflow = '';

        /* Riavvia il video Vimeo dall'inizio quando l'intro scompare */
        var p0 = window.__heroVimeoPlayer && window.__heroVimeoPlayer();
        if (p0) { p0.setCurrentTime(0).then(function() { p0.play(); }); }
      }, T_DISPERSE * 0.4);

      /* 4. Rimozione DOM */
      setTimeout(function() {
        screen.remove();
        sessionStorage.setItem('introPlayed', '1');
        if (window.__startSocialHover) window.__startSocialHover();
      }, T_DISPERSE + T_BGFADE2 + 100);
    }
  }

  /* ── Logo landing: SVG esterno via <img>, nessuna animazione DOM necessaria ── */

  btn.addEventListener('click', startTransition);

  /* Consenti anche la pressione di Invio/Spazio da tastiera */
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startTransition();
    }
  });
})();

/* ── Showcase paginato ── */
(function() {
  var wrap     = document.querySelector('.showcase-wrap');
  var viewport = document.querySelector('.showcase-viewport');
  var grid     = document.querySelector('.showcase-grid');
  var btnPrev  = document.querySelector('.showcase-prev');
  var btnNext  = document.querySelector('.showcase-next');
  if (!wrap || !grid || !btnPrev || !btnNext) return;

  var W = window.innerWidth;
  var COLS = W >= 1920 ? 4 : 4;
  var ROWS = 2;

  var items      = Array.prototype.slice.call(grid.querySelectorAll('.showcase-item'));
  var perPage    = COLS * ROWS;
  var totalPages = Math.ceil(items.length / perPage);
  var curPage    = 0;

  /* Layout: griglia larga totalPages pagine affiancate, ROWS righe fisse */
  grid.style.gridTemplateColumns = 'repeat(' + (COLS * totalPages) + ', 1fr)';
  grid.style.gridTemplateRows = 'repeat(' + ROWS + ', 1fr)';
  grid.style.width = (totalPages * 100) + '%';

  /* Ogni item occupa 1 colonna della griglia espansa */
  /* Raggruppa items in pagine: riordina per colonna-pagina */
  /* La griglia CSS naturalmente dispone left-to-right, dobbiamo
     assicurarci che dopo COLS item per riga si vada alla riga successiva
     DENTRO la stessa pagina. Usiamo CSS grid-column per forzare. */
  items.forEach(function(item, i) {
    var page    = Math.floor(i / perPage);
    var posInPage = i % perPage;
    var col     = page * COLS + (posInPage % COLS) + 1;
    var row     = Math.floor(posInPage / COLS) + 1;
    item.style.gridColumn = col;
    item.style.gridRow    = row;
  });

  function goTo(page) {
    curPage = Math.max(0, Math.min(page, totalPages - 1));
    var offset = curPage * (100 / totalPages);
    grid.style.transform = 'translateX(-' + offset + '%)';
    btnPrev.disabled = curPage === 0;
    btnNext.disabled = curPage === totalPages - 1;
  }

  btnPrev.addEventListener('click', function() { stopAuto(); goTo(curPage - 1); setTimeout(startAuto, 4000); });
  btnNext.addEventListener('click', function() { stopAuto(); goTo(curPage + 1); setTimeout(startAuto, 4000); });

  /* Swipe touch */
  var touchStartX = 0;
  viewport.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { stopAuto(); goTo(dx < 0 ? curPage + 1 : curPage - 1); setTimeout(startAuto, 4000); }
  }, { passive: true });

  /* Autoscroll desktop */
  var autoTimer = null;
  function startAuto() {
    autoTimer = setInterval(function() {
      goTo(curPage < totalPages - 1 ? curPage + 1 : 0);
    }, 7000);
  }
  function stopAuto() { clearInterval(autoTimer); }
  wrap.addEventListener('mouseenter', stopAuto);
  wrap.addEventListener('mouseleave', startAuto);

  goTo(0);
  startAuto();
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

/* ── Avid + Eko logo carousel (sincronizzati) ── */
(function() {
  var avidContainers = ['#avidCarousel', '#avidCarouselHero'];
  var allAvid = avidContainers.map(function(sel) {
    var el = document.querySelector(sel);
    return el ? Array.prototype.slice.call(el.querySelectorAll('.avid-slide')) : [];
  }).filter(function(arr) { return arr.length > 0; });

  var ekoEl = document.querySelector('#ekoCarousel');
  var ekoSlides = ekoEl ? Array.prototype.slice.call(ekoEl.querySelectorAll('.avid-slide')) : [];

  if (!allAvid.length && !ekoSlides.length) return;

  var avidN = allAvid.length ? allAvid[0].length : 0;
  var ekoN  = ekoSlides.length;
  var cur = 0;

  setInterval(function() {
    /* Avid */
    if (avidN) {
      allAvid.forEach(function(slides) { slides[cur % avidN].classList.remove('active'); });
    }
    /* Eko */
    if (ekoN) {
      ekoSlides[cur % ekoN].classList.remove('active');
    }

    cur++;

    /* Avid */
    if (avidN) {
      allAvid.forEach(function(slides) { slides[cur % avidN].classList.add('active'); });
    }
    /* Eko */
    if (ekoN) {
      ekoSlides[cur % ekoN].classList.add('active');
    }
  }, 2500);
})();

/* ── Hero social strip coin-flip ── */
window.__startSocialHover = (function() {
  var started = false;

  /* Colori brand per ogni social */
  var BRAND = {
    'Instagram': { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', border: 'transparent' },
    'Facebook':  { bg: '#1877f2', border: '#1877f2' },
    'YouTube':   { bg: '#ff0000', border: '#ff0000' }
  };

  function flipIcon(el, toBrand, cb) {
    /* Prima metà del flip: nascondi */
    el.style.transition = 'transform 0.1s ease-in';
    el.style.transform  = 'rotateY(90deg)';
    setTimeout(function() {
      /* A metà flip: cambia colore */
      if (toBrand) {
        var label = el.getAttribute('aria-label');
        var brand = BRAND[label] || { bg: 'rgba(255,255,255,0.2)', border: 'rgba(255,255,255,0.8)' };
        el.style.background   = brand.bg;
        el.style.borderColor  = brand.border;
        el.style.color        = '#fff';
      } else {
        el.style.background   = '';
        el.style.borderColor  = '';
        el.style.color        = '';
      }
      /* Seconda metà del flip: mostra */
      el.style.transition = 'transform 0.1s ease-out';
      el.style.transform  = 'rotateY(0deg)';
      setTimeout(cb, 100);
    }, 100);
  }

  function runSequence(icons) {
    var i = 0;
    function flipNext() {
      if (i >= icons.length) {
        /* Tutti flippati a brand — aspetta 750ms poi riflippa a ghost */
        setTimeout(function() {
          var j = 0;
          function unflipNext() {
            if (j >= icons.length) {
              /* Pausa 5s poi ricomincia */
              setTimeout(function() { runSequence(icons); }, 2500);
              return;
            }
            flipIcon(icons[j++], false, function() {
              setTimeout(unflipNext, 75);
            });
          }
          unflipNext();
        }, 750);
        return;
      }
      flipIcon(icons[i++], true, function() {
        setTimeout(flipNext, 75);
      });
    }
    flipNext();
  }

  return function() {
    if (started) return;
    started = true;
    var icons = Array.prototype.slice.call(
      document.querySelectorAll('.hero-social-strip .social-icon')
    );
    if (!icons.length) return;
    runSequence(icons);
  };
})();

/* Fallback: parte 3s dopo il load se l'intro è già stata saltata */
window.addEventListener('load', function() {
  if (sessionStorage.getItem('introPlayed')) {
    setTimeout(window.__startSocialHover, 3000);
  }
});

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



/* ── WhatsApp button visibility ── */
(function() {
  var btn = document.getElementById('wa-btn');
  if (!btn) return;
  function update() {
    if (window.scrollY >= 440) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    } else {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
