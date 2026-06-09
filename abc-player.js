/* ============================================================
   abc-player.js — A/B Comparator Player Factory
   Uso: createABCPlayer({ n: '2', previewLabel: 'Anteprima', tracks: [...] })
============================================================ */
(function() {
  'use strict';

  /* Cache AudioBuffer condivisa tra tutte le istanze — evita ri-download */
  const sharedCache = new Map();

  function fetchAudio(url) {
    return new Promise(function(resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error('HTTP ' + xhr.status));
      };
      xhr.onerror = reject;
      xhr.send();
    });
  }

  window.createABCPlayer = function(cfg) {
    const n            = String(cfg.n);
    const previewLabel = cfg.previewLabel || 'Preview';
    const tracks       = cfg.tracks || [];

    const $          = id => document.getElementById(id);
    const empty      = $('abcEmpty'    + n);
    const player     = $('abcPlayer'   + n);
    const npTitle    = $('abcNpTitle'  + n);
    const npArtist   = $('abcNpArtist' + n);
    const btnA       = $('abcBtnA'     + n);
    const btnB       = $('abcBtnB'     + n);
    const wave       = $('abcWave'     + n);
    const waveBody   = wave ? wave.querySelector('.abc-wave-body') : null;
    const badge      = $('abcBadge'    + n);
    const timeEl     = $('abcTime'     + n);
    const cvA        = $('abcCvA'      + n);
    const cvB        = $('abcCvB'      + n);
    const phProg     = $('abcPhProg'   + n);
    const phLine     = $('abcPhLine'   + n);
    const btnPlay    = $('abcPlay'     + n);
    const iconPlay   = $('abcIconPlay' + n);
    const iconPause  = $('abcIconPause'+ n);
    const volSlider  = $('abcVol'      + n);
    const rowsEl     = $('abcRows'     + n);

    if (!empty || !player || !waveBody) return;

    let actx = null;
    let bufA = null, bufB = null;
    let srcA = null, srcB = null;
    let gA = null, gB = null, gate = null;
    let playing = false;
    let t0 = 0, offset = 0, dur = 0;
    let raf = null;
    let track = 'A';
    let curIdx = -1;

    function initCtx() {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    }

    async function getBuffer(url) {
      if (sharedCache.has(url)) return sharedCache.get(url);
      initCtx();
      const raw = await fetchAudio(url);
      const buf = await actx.decodeAudioData(raw);
      sharedCache.set(url, buf);
      return buf;
    }

    function analyze(buf, N) {
      const d = buf.getChannelData(0), bs = Math.floor(d.length / N);
      const pk = new Float32Array(N), rms = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        let max = 0, sum = 0, s = i * bs;
        for (let j = 0; j < bs; j++) {
          const v = Math.abs(d[s + j]);
          if (v > max) max = v;
          sum += d[s + j] * d[s + j];
        }
        pk[i]  = max;
        rms[i] = Math.sqrt(sum / bs);
      }
      return { pk, rms };
    }

    function drawCv(cv, buf, color) {
      cv.width  = waveBody.offsetWidth;
      cv.height = waveBody.offsetHeight;
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      if (!buf) return;
      const w = cv.width, h = cv.height, mid = h / 2;
      const N = 400, gap = 1, barW = Math.max(1, (w / N) - gap);
      const { pk } = analyze(buf, N);
      for (let i = 0; i < N; i++) {
        const x = (i / N) * w, a = pk[i] * mid * 0.88;
        c.fillStyle = color + '50'; c.fillRect(x, mid - a, barW, a);
        c.fillStyle = color + '30'; c.fillRect(x, mid,     barW, a);
        c.fillStyle = color;        c.fillRect(x, mid - a, barW, 1.5);
      }
    }

    function drawFakeCv(cv) {
      cv.width  = waveBody.offsetWidth  || 300;
      cv.height = waveBody.offsetHeight || 90;
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const w = cv.width, h = cv.height, mid = h / 2;
      const N = 400, gap = 1, barW = Math.max(1, (w / N) - gap);
      let val = 0.25 + Math.random() * 0.3;
      for (let i = 0; i < N; i++) {
        val += (Math.random() - 0.5) * 0.12;
        val = Math.max(0.04, Math.min(0.85, val));
        const x = (i / N) * w, a = val * mid * 0.88;
        c.fillStyle = 'rgba(160,160,160,0.18)'; c.fillRect(x, mid - a, barW, a);
        c.fillStyle = 'rgba(160,160,160,0.10)'; c.fillRect(x, mid,     barW, a);
        c.fillStyle = 'rgba(160,160,160,0.35)'; c.fillRect(x, mid - a, barW, 1.5);
      }
    }

    function showFakeWaveform() {
      requestAnimationFrame(() => { drawFakeCv(cvA); drawFakeCv(cvB); });
    }

    function redraw() {
      requestAnimationFrame(() => {
        if (waveBody.offsetWidth > 0) {
          drawCv(cvA, bufA, '#5b8abf');
          drawCv(cvB, bufB, '#ffad4d');
        } else {
          requestAnimationFrame(() => {
            drawCv(cvA, bufA, '#5b8abf');
            drawCv(cvB, bufB, '#ffad4d');
          });
        }
      });
    }

    function buildGraph(off) {
      srcA = actx.createBufferSource(); srcB = actx.createBufferSource();
      srcA.buffer = bufA; srcB.buffer = bufB;
      gA = actx.createGain(); gB = actx.createGain(); gate = actx.createGain();
      gA.gain.value   = track === 'A' ? 1 : 0;
      gB.gain.value   = track === 'B' ? 1 : 0;
      gate.gain.value = volSlider.value / 100;
      srcA.connect(gA).connect(gate);
      srcB.connect(gB).connect(gate);
      gate.connect(actx.destination);
      srcA.start(actx.currentTime, off);
      srcB.start(actx.currentTime, off);
      t0 = actx.currentTime - off;
      srcA.onended = () => { if (playing) onEnd(); };
    }

    function teardown() {
      try { if (srcA) srcA.stop(); } catch(e) {}
      try { if (srcB) srcB.stop(); } catch(e) {}
      srcA = srcB = gA = gB = gate = null;
    }

    function onEnd() {
      playing = false; offset = 0;
      cancelAnimationFrame(raf);
      updatePlayUI(); setProgress(0);
      timeEl.textContent = fmt(0) + ' / ' + fmt(dur);
      updateRows();
    }

    function updatePlayUI() {
      iconPlay.style.display  = playing ? 'none' : 'block';
      iconPause.style.display = playing ? 'block' : 'none';
      waveBody.classList.toggle('is-playing', playing);
    }

    function setProgress(r) {
      const p = (r * 100).toFixed(2) + '%';
      phProg.style.width = p; phLine.style.left = p;
    }

    function tick() {
      if (!playing) return;
      const el = Math.min(actx.currentTime - t0, dur);
      setProgress(el / dur);
      timeEl.textContent = fmt(el) + ' / ' + fmt(dur);
      raf = requestAnimationFrame(tick);
    }

    function fmt(s) {
      return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    }

    function setTrack(t) {
      track = t;
      btnA.className = 'abc-btn' + (t === 'A' ? ' on-a' : '');
      btnB.className = 'abc-btn' + (t === 'B' ? ' on-b' : '');
      wave.className = 'abc-wave' + (t === 'B' ? ' on-b' : '');
      cvA.classList.toggle('hidden', t !== 'A');
      cvB.classList.toggle('hidden', t !== 'B');
      badge.className  = 'abc-badge ' + (t === 'A' ? 'a' : 'b');
      badge.textContent = t;
      if (gA && gB) {
        gA.gain.setTargetAtTime(t === 'A' ? 1 : 0, actx.currentTime, 0.005);
        gB.gain.setTargetAtTime(t === 'B' ? 1 : 0, actx.currentTime, 0.005);
      }
      updateRows();
    }

    btnA.addEventListener('click', () => { if (track !== 'A') setTrack('A'); });
    btnB.addEventListener('click', () => { if (track !== 'B') setTrack('B'); });

    btnPlay.addEventListener('click', async e => {
      e.stopPropagation();
      if (!bufA || !bufB) {
        await loadTrack(curIdx >= 0 ? curIdx : 0);
        if (!bufA || !bufB) return;
        initCtx();
        await actx.resume();
        buildGraph(offset); playing = true; tick();
        updatePlayUI(); updateRows();
        return;
      }
      await actx.resume();
      if (playing) {
        offset = actx.currentTime - t0;
        teardown(); playing = false; cancelAnimationFrame(raf);
      } else {
        buildGraph(offset); playing = true; tick();
      }
      updatePlayUI(); updateRows();
    });

    volSlider.addEventListener('input', () => {
      if (gate) gate.gain.setTargetAtTime(volSlider.value / 100, actx.currentTime, 0.01);
    });

    function showTrack(idx) {
      if (!tracks.length) return;
      curIdx = idx; bufA = null; bufB = null; offset = 0;
      setProgress(0);
      const tr = tracks[idx];
      npTitle.textContent  = tr.title;
      npArtist.textContent = tr.artist;
      empty.style.display  = 'none';
      player.classList.add('visible');
      btnA.disabled = btnB.disabled = false;
      btnPlay.disabled = false;
      phLine.style.display = 'none';
      timeEl.textContent = '0:00 / ' + tr.dur;
      updateRows();
      showFakeWaveform();
    }

    async function loadTrack(idx) {
      if (!tracks.length) return;
      initCtx();
      if (playing) { teardown(); playing = false; cancelAnimationFrame(raf); updatePlayUI(); }
      if (curIdx !== idx) showTrack(idx);
      const tr = tracks[idx];
      const cached = sharedCache.has(tr.a) && sharedCache.has(tr.b);
      if (!cached) {
        btnPlay.classList.add('loading');
        btnPlay.disabled = false;
      }
      try {
        const [bA, bB] = await Promise.all([getBuffer(tr.a), getBuffer(tr.b)]);
        bufA = bA; bufB = bB;
        dur = Math.min(bA.duration, bB.duration);
        timeEl.textContent = fmt(0) + ' / ' + fmt(dur);
        phLine.style.display = 'block';
        btnPlay.classList.remove('loading');
        redraw();
      } catch(err) {
        btnPlay.classList.remove('loading');
      }
      updateRows();
    }

    function updateRows() {
      rowsEl.querySelectorAll('.abc-row').forEach((r, i) => {
        r.classList.toggle('active',     i === curIdx);
        r.classList.toggle('on-b',       i === curIdx && track === 'B');
        r.classList.toggle('is-playing', i === curIdx && playing);
      });
    }

    function buildRows(trks) {
      if (!rowsEl) return;
      rowsEl.innerHTML = '';
      trks.forEach((tr, i) => {
        const row = document.createElement('div');
        row.className = 'abc-row';
        row.innerHTML =
          '<div class="abc-rn">' +
            '<span class="n">' + (i + 1) + '</span>' +
            '<span class="p"><svg viewBox="0 0 16 16"><path d="M4 2.5l9 5.5-9 5.5V2.5z"/></svg></span>' +
            '<span class="eq"><span></span><span></span><span></span></span>' +
          '</div>' +
          '<div class="abc-ri">' +
            '<div class="abc-ri-t">' + tr.title + '<span class="abc-preview-tag">' + previewLabel + '</span></div>' +
            '<div class="abc-ri-a">' + tr.artist + '</div>' +
          '</div>' +
          '<div class="abc-rd">' + tr.dur + '</div>';
        row.addEventListener('click', () => loadTrack(i));
        rowsEl.appendChild(row);
      });
    }

    window.addEventListener('resize', () => { if (bufA || bufB) redraw(); });

    buildRows(tracks);
    if (tracks.length) requestAnimationFrame(() => showTrack(0));
  };

})();
