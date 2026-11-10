(() => {
  const PATH = document.body.dataset.path || '~';
  const PAGES = { home: 'index.html', attempts: 'attempts.html', contact: 'contact.html' };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (v, n = 2) => String(v).padStart(n, '0');

  /* ---------- line-number gutter ---------- */
  const gutter = document.querySelector('.gutter');
  const fillGutter = () => {
    if (!gutter) return;
    const n = Math.ceil(document.body.scrollHeight / 24);
    const w = n > 99 ? 3 : 2;
    gutter.textContent = Array.from({ length: n }, (_, i) => pad(i + 1, w)).join('\n');
  };
  fillGutter();
  window.addEventListener('load', fillGutter);
  window.addEventListener('resize', fillGutter);

  /* ---------- trailing dot cursor + ln/col readout ---------- */
  const cur = document.querySelector('.cursor');
  const pos = document.getElementById('pos');
  let tx = 0, ty = 0, cx = null, cy = null, raf = null;
  const follow = () => {
    cx += (tx - cx) * 0.2;
    cy += (ty - cy) * 0.2;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.4 ? requestAnimationFrame(follow) : null;
  };
  document.addEventListener('mousemove', (e) => {
    if (pos) pos.textContent = `ln ${pad(Math.floor((e.clientY + window.scrollY) / 24) + 1)}, col ${pad(Math.floor(e.clientX / 9.6) + 1)}`;
    if (!cur) return;
    tx = e.clientX; ty = e.clientY;
    if (cx === null) { cx = tx; cy = ty; }
    cur.style.opacity = '1';
    cur.dataset.hot = e.target.closest && e.target.closest('a, button') ? '1' : '0';
    if (!raf) raf = requestAnimationFrame(follow);
  });
  document.documentElement.addEventListener('mouseleave', () => { if (cur) cur.style.opacity = '0'; });

  /* ---------- homepage headline: types, deletes, loops ---------- */
  const typed = document.getElementById('typed');
  if (typed) {
    const PREFIX = 'trying to make sense\nof the world and myself\nthrough ';
    const WORDS = ['art', 'design', 'technology'];
    const STILL = PREFIX + 'art, design,\ntechnology.';
    const ghost = document.getElementById('ghost');
    const headline = typed.closest('h1');
    if (reduce) {
      typed.textContent = STILL;
      if (ghost) ghost.textContent = STILL;
    } else {
      let paused = false;
      headline.addEventListener('mouseenter', () => { paused = true; });
      headline.addEventListener('mouseleave', () => { paused = false; });
      const s = { phase: 'prefix', k: 0, w: 0 };
      const step = () => {
        if (paused) { setTimeout(step, 200); return; }
        let delay = 90;
        const word = WORDS[s.w];
        if (s.phase === 'prefix') {
          s.k += 1; delay = 38;
          if (s.k >= PREFIX.length) { s.phase = 'type'; s.k = 0; }
        } else if (s.phase === 'type') {
          s.k += 1; delay = 95;
          if (s.k >= word.length) { s.phase = 'hold'; delay = 1500; }
        } else if (s.phase === 'hold') {
          s.phase = 'del'; delay = 60;
        } else {
          s.k -= 1; delay = 55;
          if (s.k <= 0) { s.k = 0; s.w = (s.w + 1) % WORDS.length; s.phase = 'type'; delay = 400; }
        }
        typed.textContent = s.phase === 'prefix' ? PREFIX.slice(0, s.k) : PREFIX + WORDS[s.w].slice(0, s.k);
        setTimeout(step, delay);
      };
      setTimeout(step, 500);
    }
  }

  /* ---------- hidden terminal ---------- */
  const term = document.querySelector('.term');
  if (!term) return;
  const out = term.querySelector('.term-out');
  const openBtn = term.querySelector('.prompt');
  const inWrap = term.querySelector('.term-in');
  const input = term.querySelector('input');
  term.querySelectorAll('.path').forEach((el) => { el.textContent = PATH; });

  const WHOAMI = [
    'artist, maker, technologist.',
    'trying to make sense of the world and myself.',
    'a reflection of the world and the people around me.',
    'flawed, curious, usually mid-experiment.',
    'i ask questions. i get confused. i make things anyway.',
    'making things with passion, intention and curiosity.'
  ];
  const ATTEMPTS = 'attempt_04/   attempt_03/   attempt_02/   attempt_01/';
  const LS = {
    '~/home': 'home/   attempts/   contact/',
    '~/attempts': ATTEMPTS,
    '~/attempts/attempt_04': 'sketch.png   prototype.png   final.png   notes.txt',
    '~/contact': 'email   linkedin   orchid.png'
  };
  let lastWho = -1, seenWho = false;

  const respond = (c) => {
    if (!c) return [];
    if (c === 'help') return [{ text: 'try: whoami · ls · cd <page> · rocks · contact · date · clear · exit' }];
    if (c === 'whoami') {
      let i = Math.floor(Math.random() * WHOAMI.length);
      if (i === lastWho) i = (i + 1) % WHOAMI.length;
      lastWho = i;
      const res = [{ text: 'mariam fatima. ' + WHOAMI[i] }];
      if (!seenWho) { seenWho = true; res.push({ text: '(it changes. run it again.)' }); }
      return res;
    }
    if (c === 'pwd') return [{ text: PATH }];
    if (c === 'ls') return [{ text: LS[PATH] || LS['~/home'] }];
    if (c === 'ls attempts' || c === 'ls attempts/') return [{ text: ATTEMPTS }, { text: '(still loading. some things take time.)' }];
    if (c === 'cd' || c.startsWith('cd ')) {
      const t = c.slice(2).trim().replace(/[~/]/g, '');
      const key = t === '' ? 'home' : (t === '..' ? (PATH.split('/').length > 2 ? 'attempts' : 'home') : t);
      return PAGES[key] ? [{ text: '→ ' + key, href: PAGES[key] }] : [{ text: 'no such directory: ' + t }];
    }
    if (c === 'rocks') return [{ text: "a pebble from every place i've been." }, { text: 'the catalogue is still being collected.' }];
    if (c === 'contact' || c === 'email') return [{ text: 'mxf4882@nyu.edu', href: 'mailto:mxf4882@nyu.edu' }];
    if (c === 'linkedin') return [{ text: 'linkedin.com/in/mariamfatima03', href: 'https://www.linkedin.com/in/mariamfatima03/' }];
    if (c === 'date' || c === 'time') {
      let t = '';
      try { t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit' }); } catch (e) { /* ignore */ }
      return [{ text: "it's " + t + ' in dubai.' }];
    }
    if (c === 'hi' || c === 'hello') return [{ text: 'hi :) say hello properly:' }, { text: '→ contact', href: PAGES.contact }];
    if (c.startsWith('sudo')) return [{ text: 'nice try.' }];
    return [{ text: 'command not found: ' + c + ". try 'help'" }];
  };

  const print = (lines) => {
    lines.forEach((l) => {
      let el;
      if (l.href) {
        el = document.createElement('a');
        el.className = 'tlink';
        el.href = l.href;
        if (/^https?:/.test(l.href)) { el.target = '_blank'; el.rel = 'noopener'; }
      } else {
        el = document.createElement('span');
      }
      el.textContent = l.text;
      out.appendChild(el);
    });
    while (out.children.length > 8) out.removeChild(out.firstChild);
    out.scrollTop = out.scrollHeight;
  };

  let open = false;
  const openTerm = () => {
    if (open) { input.focus(); return; }
    open = true;
    if (!out.children.length) print([{ text: "type 'help' to look around." }]);
    out.hidden = false;
    openBtn.hidden = true;
    inWrap.hidden = false;
    input.focus();
  };
  const closeTerm = () => {
    if (!open) return;
    open = false;
    out.hidden = true;
    inWrap.hidden = true;
    openBtn.hidden = false;
  };

  openBtn.addEventListener('click', openTerm);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeTerm(); openBtn.focus(); return; }
    if (e.key !== 'Enter') return;
    const raw = input.value;
    const c = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    input.value = '';
    if (c === 'exit') { closeTerm(); openBtn.focus(); return; }
    if (c === 'clear') { out.textContent = ''; return; }
    print([{ text: PATH + ' $ ' + raw }].concat(respond(c)));
  });

  // press ~ (or `) anywhere to open; click anywhere else to close
  document.addEventListener('keydown', (e) => {
    if (e.key !== '~' && e.key !== '`') return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    openTerm();
  });
  document.addEventListener('mousedown', (e) => { if (open && !term.contains(e.target)) closeTerm(); });
})();
