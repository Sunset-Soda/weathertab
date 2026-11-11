(() => {
  'use strict';

  /* ---------- Storage (falls back to localStorage if opened outside Firefox) ---------- */
  const ext = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const hasBrowserSearch = !!(ext && ext.search && (ext.search.search || ext.search.query));
  const hasExtStorage = !!(ext && ext.storage && ext.storage.local);

  const store = {
    async get(key) {
      if (hasExtStorage) {
        const r = await ext.storage.local.get(key);
        return r[key];
      }
      const v = localStorage.getItem('weathertab_' + key);
      return v === null ? undefined : JSON.parse(v);
    },
    async set(key, value) {
      if (hasExtStorage) return ext.storage.local.set({ [key]: value });
      localStorage.setItem('weathertab_' + key, JSON.stringify(value));
    },
    async clear() {
      if (hasExtStorage) return ext.storage.local.clear();
      Object.keys(localStorage).filter(k => k.startsWith('weathertab_')).forEach(k => localStorage.removeItem(k));
    }
  };

  /* ---------- Defaults ---------- */
  const ENGINES = {
    browser: { name: 'Browser default', url: null },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
    startpage: { name: 'Startpage', url: 'https://www.startpage.com/do/search?q=' },
    ecosia: { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=' }
  };

  // Layout grid: 12 columns. Each widget sits at (col, row) and spans `span` columns.
  const DEFAULT_LAYOUT = {
    clock: { col: 1, row: 1, span: 6, align: 'start', visible: true },
    date: { col: 1, row: 2, span: 6, align: 'start' },
    greeting: { col: 1, row: 3, span: 6, align: 'start' },
    weather: { col: 9, row: 1, span: 4, align: 'start' },
    search: { col: 3, row: 4, span: 8, align: 'start', visible: true },
    links: { col: 1, row: 5, span: 12, align: 'start', visible: true }
  };

  const DEFAULT_SETTINGS = {
    name: '',
    showGreeting: true,
    showDate: true,
    timeFormat: '24',
    showSeconds: false,
    newTab: false,
    engine: hasBrowserSearch ? 'browser' : 'duckduckgo',
    theme: 'macchiato',
    accent: '#c6a0f6',
    font: 'system',
    layout: DEFAULT_LAYOUT,
    tileStyle: 'card',
    tileWidth: 200,
    iconSize: 72,
    iconTint: 'accent',
    tileIcons: 'letters',
    clockSize: 96,
    bgImage: '',
    photoMode: 'none',
    photoSlots: { dawn: '', day: '', dusk: '', night: '' },
    fx: 'none',
    fxSpeed: 1,
    fxDensity: 1,
    bgDim: 40,
    bgBlur: 0,
    weather: {
      enabled: true,
      units: 'metric',
      forecast: true,
      lat: null,
      lon: null,
      place: ''
    }
  };

  // Catppuccin Macchiato accent colours
  const ACCENTS = [
    ['Rosewater', '#f4dbd6'], ['Flamingo', '#f0c6c6'], ['Pink', '#f5bde6'], ['Mauve', '#c6a0f6'],
    ['Red', '#ed8796'], ['Maroon', '#ee99a0'], ['Peach', '#f5a97f'], ['Yellow', '#eed49f'],
    ['Green', '#a6da95'], ['Teal', '#8bd5ca'], ['Sky', '#91d7e3'], ['Sapphire', '#7dc4e4'],
    ['Blue', '#8aadf4'], ['Lavender', '#b7bdf8']
  ];
  const MACCHIATO_BASE = '#24273a';

  // Full-palette themes. Each one has its own accent colours (shown as swatches in Settings).
  const CAT_NAMES = ['Rosewater', 'Flamingo', 'Pink', 'Mauve', 'Red', 'Maroon', 'Peach', 'Yellow', 'Green', 'Teal', 'Sky', 'Sapphire', 'Blue', 'Lavender'];
  const cat = (hexes) => CAT_NAMES.map((n, i) => [n, hexes[i]]);
  const THEMES = {
    latte: { name: 'Latte', group: 'Catppuccin', mode: 'light', bg: '#eff1f5', text: '#4c4f69', muted: '#6c6f85', s1: '#e6e9ef', s2: '#ccd0da', bd: '#9ca0b0', crust: '#dce0e8', danger: '#d20f39', accent: '#8839ef',
      accents: cat(['#dc8a78', '#dd7878', '#ea76cb', '#8839ef', '#d20f39', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#179299', '#04a5e5', '#209fb5', '#1e66f5', '#7287fd']) },
    frappe: { name: 'Frappé', group: 'Catppuccin', mode: 'dark', bg: '#303446', text: '#c6d0f5', muted: '#a5adce', s1: '#414559', s2: '#51576d', bd: '#838ba7', crust: '#232634', danger: '#e78284', accent: '#ca9ee6',
      accents: cat(['#f2d5cf', '#eebebe', '#f4b8e4', '#ca9ee6', '#e78284', '#ea999c', '#ef9f76', '#e5c890', '#a6d189', '#81c8be', '#99d1db', '#85c1dc', '#8caaee', '#babbf1']) },
    macchiato: { name: 'Macchiato', group: 'Catppuccin', mode: 'dark', bg: '#24273a', text: '#cad3f4', muted: '#a5adcb', s1: '#363a4f', s2: '#494d64', bd: '#8087a2', crust: '#181926', danger: '#ed8796', accent: '#c6a0f6',
      accents: cat(['#f4dbd6', '#f0c6c6', '#f5bde6', '#c6a0f6', '#ed8796', '#ee99a0', '#f5a97f', '#eed49f', '#a6da95', '#8bd5ca', '#91d7e3', '#7dc4e4', '#8aadf4', '#b7bdf8']) },
    mocha: { name: 'Mocha', group: 'Catppuccin', mode: 'dark', bg: '#1e1e2e', text: '#cdd6f4', muted: '#a6adc8', s1: '#313244', s2: '#45475a', bd: '#7f849c', crust: '#11111b', danger: '#f38ba8', accent: '#cba6f7',
      accents: cat(['#f5e0dc', '#f2cdcd', '#f5c2e7', '#cba6f7', '#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89dceb', '#74c7ec', '#89b4fa', '#b4befe']) },
    dracula: { name: 'Dracula', group: 'Dracula', mode: 'dark', bg: '#282a36', text: '#f8f8f2', muted: '#a3abcc', s1: '#343746', s2: '#44475a', bd: '#6272a4', crust: '#191a21', danger: '#ff5555', accent: '#bd93f9',
      accents: [['Pink', '#ff79c6'], ['Purple', '#bd93f9'], ['Cyan', '#8be9fd'], ['Green', '#50fa7b'], ['Orange', '#ffb86c'], ['Red', '#ff5555'], ['Yellow', '#f1fa8c']] },
    alucard: { name: 'Alucard (light)', group: 'Dracula', mode: 'light', bg: '#fffbeb', text: '#1f1f1f', muted: '#6c664b', s1: '#f5f0dc', s2: '#cfcfde', bd: '#6c664b', crust: '#e8e3cc', danger: '#cb3a2a', accent: '#644ac9',
      accents: [['Pink', '#a3144d'], ['Purple', '#644ac9'], ['Cyan', '#036a96'], ['Green', '#14710a'], ['Orange', '#a34d14'], ['Red', '#cb3a2a'], ['Yellow', '#846e15']] },
    nord: { name: 'Nord', group: 'Nord', mode: 'dark', bg: '#2e3440', text: '#e5e9f0', muted: '#aab3c5', s1: '#3b4252', s2: '#434c5e', bd: '#616e88', crust: '#242933', danger: '#bf616a', accent: '#88c0d0',
      accents: [['Frost teal', '#8fbcbb'], ['Frost ice', '#88c0d0'], ['Frost sky', '#81a1c1'], ['Frost blue', '#5e81ac'], ['Red', '#bf616a'], ['Orange', '#d08770'], ['Yellow', '#ebcb8b'], ['Green', '#a3be8c'], ['Purple', '#b48ead']] },
    nordlight: { name: 'Nord Light', group: 'Nord', mode: 'light', bg: '#eceff4', text: '#2e3440', muted: '#4c566a', s1: '#e5e9f0', s2: '#d8dee9', bd: '#4c566a', crust: '#d8dee9', danger: '#bf616a', accent: '#5e81ac',
      accents: [['Frost teal', '#8fbcbb'], ['Frost ice', '#88c0d0'], ['Frost sky', '#81a1c1'], ['Frost blue', '#5e81ac'], ['Red', '#bf616a'], ['Orange', '#d08770'], ['Yellow', '#ebcb8b'], ['Green', '#a3be8c'], ['Purple', '#b48ead']] }
  };
  const THEME_GROUPS = ['Catppuccin', 'Dracula', 'Nord'];
  const themeOf = (id) => THEMES[id] || null;
  const accentsFor = (id) => (themeOf(id) ? themeOf(id).accents : ACCENTS);
  const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (hex, a) => `rgba(${rgbOf(hex).join(',')},${a})`;
  const PALETTE_VARS = ['--bg', '--text', '--muted', '--surface', '--surface-2', '--border', '--shadow', '--overlay', '--danger'];

  const uid = () => Math.random().toString(36).slice(2, 10);

  const DEFAULT_GROUPS = [
    {
      id: uid(), name: 'Everyday', links: [
        { id: uid(), title: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { id: uid(), title: 'GitHub', url: 'https://github.com' },
        { id: uid(), title: 'YouTube', url: 'https://www.youtube.com' },
        { id: uid(), title: 'Reddit', url: 'https://www.reddit.com' }
      ]
    },
    {
      id: uid(), name: 'News', links: [
        { id: uid(), title: 'BBC News', url: 'https://www.bbc.com/news' },
        { id: uid(), title: 'Reuters', url: 'https://www.reuters.com' },
        { id: uid(), title: 'Hacker News', url: 'https://news.ycombinator.com' }
      ]
    }
  ];

  let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  let groups = [];
  let weatherCache = null;
  let editing = false;

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      node.append(c.nodeType ? c : document.createTextNode(c));
    }
    return node;
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
    target[last] = value;
  }
  function deepMerge(base, extra) {
    const out = JSON.parse(JSON.stringify(base));
    for (const [k, v] of Object.entries(extra || {})) {
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
        out[k] = deepMerge(base[k], v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  const saveSettings = () => store.set('settings', settings);
  const saveGroups = () => store.set('groups', groups);

  function normaliseUrl(raw) {
    let u = raw.trim();
    if (!u) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    try {
      const parsed = new URL(u);
      if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  }

  function hueFor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }

  function onAccent(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return '#0b0e16';
    const n = parseInt(m[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#0b0e16' : '#ffffff';
  }

  /* ---------- Appearance ---------- */
  const FONTS = {
    system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  };

  // Font pairings from the Cubely themes kit. Roles: ui = body text, display = greeting,
  // mono = small labels, moves = clock, temperature and tile letters.
  const F = (family, weights, fallback) => ({ family, weights, stack: `"${family}", ${fallback}` });
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const CM = '"Courier New", monospace';
  const HN = '"Helvetica Neue", Arial, sans-serif';
  const FONT_SETS = [
    { id: 'cherry', name: 'Cherry Pop', ui: F('Josefin Sans', '400;500;600;700', HN), display: F('Yellowtail', '', '"Brush Script MT", cursive'), mono: F('Space Mono', '400;700', MONO), moves: F('Playfair Display', '700', 'Georgia, serif') },
    { id: 'grape', name: 'Grape Grunge', ui: F('Courier Prime', '400;700', CM), display: F('Permanent Marker', '', '"Comic Sans MS", cursive'), mono: F('Courier Prime', '400;700', CM), moves: F('Courier Prime', '400;700', CM) },
    { id: 'disco', name: 'Camp Glitter', ui: F('Fredoka', '400;500;600;700', '"Trebuchet MS", sans-serif'), display: F('Rye', '', 'Georgia, serif'), mono: F('Rubik Mono One', '', '"Arial Black", sans-serif'), moves: F('Rubik Mono One', '', '"Arial Black", sans-serif') },
    { id: 'diary', name: 'Midnight Diary', ui: F('Cormorant Garamond', '500;600;700', 'Georgia, serif'), display: F('Pinyon Script', '', '"Snell Roundhand", cursive'), mono: F('Cutive Mono', '', CM), moves: F('Caveat', '700', '"Segoe Script", cursive') },
    { id: 'chrome', name: 'Chrome Chaos', ui: F('Outfit', '400;500;600;700', HN), display: F('Syncopate', '700', '"Arial Black", sans-serif'), mono: F('DM Mono', '400;500', CM), moves: F('Unbounded', '600;700', '"Arial Black", sans-serif') },
    { id: 'riot', name: 'Scarlet Scribble', ui: F('Archivo', '400;500;600;700', HN), display: F('Titan One', '', '"Arial Black", sans-serif'), mono: F('IBM Plex Mono', '400;500', CM), moves: F('Anton', '', 'Impact, sans-serif') },
    { id: 'crate', name: 'Crate Jungle', ui: F('Nunito', '400;600;700', HN), display: F('Bangers', '', 'Impact, sans-serif'), mono: F('Roboto Mono', '400;500', CM), moves: F('Luckiest Guy', '', 'Impact, sans-serif') },
    { id: 'shore', name: 'Lonely Shore', ui: F('Barlow', '400;500;600;700', HN), display: F('Michroma', '', '"Arial Black", sans-serif'), mono: F('Share Tech Mono', '', CM), moves: F('Chakra Petch', '600;700', '"Arial Narrow", sans-serif') },
    { id: 'witch', name: 'Noir Witch', ui: F('Raleway', '400;500;600;700', HN), display: F('Cinzel Decorative', '700', '"Times New Roman", serif'), mono: F('Overpass Mono', '400;500', CM), moves: F('Cinzel', '600;700', '"Times New Roman", serif') },
    { id: 'meadow', name: 'Meadow Quest', ui: F('Alegreya Sans', '400;500;700', HN), display: F('Uncial Antiqua', '', '"Palatino Linotype", serif'), mono: F('Fira Mono', '400;500', CM), moves: F('Philosopher', '400;700', 'Georgia, serif') },
    { id: 'spark', name: 'Static Spark', ui: F('Nunito', '400;600;700', HN), display: F('Bungee', '', 'Impact, sans-serif'), mono: F('Roboto Mono', '400;500', CM), moves: F('Bungee', '', 'Impact, sans-serif') },
    { id: 'lucha', name: 'Lucha Libre', ui: F('Barlow', '400;500;600;700', HN), display: F('Bowlby One', '', 'Impact, sans-serif'), mono: F('Share Tech Mono', '', CM), moves: F('Bowlby One', '', 'Impact, sans-serif') },
    { id: 'ember', name: 'Ember Wing', ui: F('Nunito', '400;600;700', HN), display: F('Alfa Slab One', '', 'Georgia, serif'), mono: F('Roboto Mono', '400;500', CM), moves: F('Alfa Slab One', '', 'Georgia, serif') },
    { id: 'moon', name: 'Crescent Sparkle', ui: F('Quicksand', '400;500;600;700', '"Trebuchet MS", sans-serif'), display: F('Pacifico', '', '"Brush Script MT", cursive'), mono: F('Fira Mono', '400;500', CM), moves: F('Fredoka', '400;500;600;700', '"Trebuchet MS", sans-serif') },
    { id: 'drift', name: 'Midnight Drift', ui: F('Rubik', '400;500;600;700', HN), display: F('Big Shoulders Display', '700;800', '"Arial Narrow", sans-serif'), mono: F('JetBrains Mono', '400;500', CM), moves: F('Teko', '500;600;700', '"Arial Narrow", sans-serif') },
    { id: 'ring', name: 'Ringside Rush', ui: F('Barlow', '400;500;600;700', HN), display: F('Staatliches', '', 'Impact, sans-serif'), mono: F('Roboto Mono', '400;500', CM), moves: F('Staatliches', '', 'Impact, sans-serif') }
  ];

  const loadedFontSets = new Set();
  function fontSetUrl(set) {
    const seen = new Set();
    const parts = [];
    for (const role of [set.ui, set.display, set.mono, set.moves]) {
      if (seen.has(role.family)) continue;
      seen.add(role.family);
      parts.push('family=' + role.family.replace(/ /g, '+') + (role.weights ? ':wght@' + role.weights : ''));
    }
    return 'https://fonts.googleapis.com/css2?' + parts.join('&') + '&display=swap';
  }
  // Fonts are only requested when a theme font set is actually selected.
  function loadFontSet(set) {
    if (loadedFontSets.has(set.id)) return;
    loadedFontSets.add(set.id);
    document.head.append(el('link', { rel: 'stylesheet', href: fontSetUrl(set), dataset: { fontSet: set.id } }));
  }
  function resolveFont(id) {
    const set = FONT_SETS.find((s) => s.id === id);
    if (set) return { themed: true, set, ui: set.ui.stack, display: set.display.stack, mono: set.mono.stack, moves: set.moves.stack };
    const s = FONTS[id] || FONTS.system;
    return { themed: false, ui: s, display: s, mono: s, moves: s };
  }
  function populateFonts() {
    const sel = document.querySelector('[data-setting="font"]');
    const builtin = el('optgroup', { label: 'Built-in' });
    for (const [id, name] of [['system', 'System'], ['rounded', 'Rounded'], ['serif', 'Serif'], ['mono', 'Monospace']]) {
      builtin.append(el('option', { value: id, text: name }));
    }
    const themed = el('optgroup', { label: 'Google Fonts' });
    const byFont = [...FONT_SETS].sort((a, b) => a.ui.family.localeCompare(b.ui.family) || a.display.family.localeCompare(b.display.family));
    for (const s of byFont) themed.append(el('option', { value: s.id, text: s.ui.family + ' + ' + s.display.family }));
    sel.append(builtin, themed);
  }

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------- Photo by time of day ---------- */
  // Ask for a size that matches the screen (Commons caches these standard widths); it never upscales past the original
  const commonsWidth = () => { const px = window.innerWidth * (window.devicePixelRatio || 1); return px > 2560 ? 3840 : px > 1920 ? 2560 : 1920; };
  const commons = (file) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${commonsWidth()}`;
  // Four time-of-day photos per city (Wikimedia Commons file names). A missing slot borrows the nearest time of day.
  const PHOTO_SETS = {
    tokyo: { name: 'Tokyo', slots: {
      dawn: 'Buildings with colorful neon street signs at blue hour, Shinjuku, Tokyo.jpg',
      day: 'Roppongi Hills Mori Tower from Tokyo Tower Day.jpg',
      dusk: 'Ginza area at dusk from Tokyo Tower.jpg',
      night: 'Tokyo nightview.jpg' } },
    london: { name: 'London', slots: {
      dawn: 'Tower Bridge view at dawn.jpg',
      day: 'City of London skyline from London City Hall - Oct 2008 - Aligned.jpg',
      dusk: 'City of London skyline at dusk.jpg',
      night: 'PalaceOfWestminsterAtNight.jpg' } },
    newyork: { name: 'New York', slots: {
      dawn: 'Nyc dawn.jpg',
      day: 'Midtown Manhattan from Jersey City September 2020 HDR.jpg',
      dusk: 'Yellow-blue sunset over New York.jpg',
      night: 'New York City at night HDR edit1.jpg' } },
    paris: { name: 'Paris', slots: {
      day: 'Eiffel tower from Cite Architecture Chaillot.jpg',
      dusk: 'Notre-Dame de Paris and Île de la Cité at dusk 140516 1.jpg',
      night: 'Eiffel Tower and Pont Alexandre III at night.jpg' } },
    sydney: { name: 'Sydney', slots: {
      day: 'Sydney skyline from the north aerial 2010.jpg',
      dusk: 'Sydney skyline at dusk - Dec 2008.jpg',
      night: 'Sydney Harbour Bridge night.jpg' } },
    dubai: { name: 'Dubai', slots: {
      day: 'Dubai Marina Skyline.jpg',
      night: 'City of Dubai at Night, United Arab Emirates.jpg' } },
    singapore: { name: 'Singapore', slots: {
      dawn: 'Singapore Skyline in the Early Morning.JPG',
      day: 'Singapore Skyline.jpg',
      dusk: 'Singapore Marina Bay Dusk 2018-02-27.jpg',
      night: 'Singapore Marina-Bay-at-night-01.jpg' } },
    auckland: { name: 'Auckland', slots: {
      day: 'Auckland CBD skyline from Waitemata Harbour entrance.jpg',
      dusk: 'Auckland city skyline at dusk.jpg',
      night: 'Auckland Skyline at night.jpg' } }
  };
  const PHASE_FALLBACK = { dawn: ['dawn', 'dusk', 'day', 'night'], day: ['day', 'dawn', 'dusk', 'night'], dusk: ['dusk', 'dawn', 'night', 'day'], night: ['night', 'dusk', 'dawn', 'day'] };
  const PHASES = [['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']];
  const phaseNow = () => {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
  };
  const safeImg = (s) => (typeof s === 'string' && /^(data:image\/|https?:\/\/)/i.test(s) ? s : '');
  // The picture to show right now ('' = none), plus credit info for built-in photos
  function currentPhoto() {
    if (settings.photoMode !== 'custom' && !PHOTO_SETS[settings.photoMode]) return { src: '', credit: null };
    const phase = phaseNow();
    const own = safeImg(settings.photoSlots && settings.photoSlots[phase]);
    if (own) return { src: own, credit: null };
    const set = PHOTO_SETS[settings.photoMode];
    if (!set) return { src: '', credit: null };
    const f = set.slots[PHASE_FALLBACK[phase].find((p) => set.slots[p])];
    return { src: commons(f), credit: { href: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.replace(/ /g, '_')), text: `Photo: Wikimedia Commons · ${set.name}` } };
  }
  // Drawn skyline used when a photo can't load (offline, blocked, or a broken link)
  function fallbackArt(phase) {
    const sky = { dawn: ['#1b2a5c', '#7b6fb0', '#f4a6a0'], day: ['#3d86d6', '#7ec0f0', '#cfe9fb'], dusk: ['#2a2358', '#b4506e', '#f7a35c'], night: ['#050816', '#0d1636', '#1c2a5a'] }[phase];
    let s = '';
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    if (phase === 'night' || phase === 'dawn') for (let i = 0; i < 90; i++) s += `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.5 + 0.4).toFixed(1)}" fill="#fff" opacity="${(r() * 0.7 + 0.2).toFixed(2)}"/>`;
    const orb = { dawn: [1180, 520, 46, '#ffd9a8'], day: [1250, 190, 54, '#fff6c9'], dusk: [380, 560, 60, '#ffc27a'], night: [1230, 160, 36, '#e9efff'] }[phase];
    s += `<circle cx="${orb[0]}" cy="${orb[1]}" r="${orb[2] * 2.4}" fill="${orb[3]}" opacity="0.18"/><circle cx="${orb[0]}" cy="${orb[1]}" r="${orb[2]}" fill="${orb[3]}"/>`;
    const dark = phase === 'night' ? ['#0a0f24', '#111a38'] : phase === 'day' ? ['#4b6a8f', '#33506f'] : ['#241d46', '#171233'];
    let x = -20, back = '', front = '', win = '';
    while (x < 1620) { const w = 50 + r() * 70, h = 120 + r() * 330; back += `<rect x="${x.toFixed(0)}" y="${(900 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${dark[0]}"/>`; x += w - 6; }
    x = -40;
    while (x < 1620) {
      const w = 60 + r() * 90, h = 90 + r() * 260, y = 900 - h;
      front += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${dark[1]}"/>`;
      if (phase !== 'day') for (let wy = y + 14; wy < 880; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (r() > 0.62) win += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="8" fill="#ffd98a" opacity="${(r() * 0.5 + 0.35).toFixed(2)}"/>`;
      x += w + 4;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="0.55" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/>${s}${back}${front}${win}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  let shownSrc = null;
  let photoNote = '';
  function applyBackground(first) {
    const bg = $('bg');
    const photo = currentPhoto();
    const src = photo.src || safeImg(settings.bgImage) || '';
    const credit = $('photoCredit');
    credit.hidden = !photo.credit;
    if (photo.credit) { credit.href = photo.credit.href; credit.textContent = photo.credit.text; }
    bg.style.filter = src && settings.bgBlur ? `blur(${settings.bgBlur}px)` : 'none';
    $('bgOverlay').style.display = src ? 'block' : 'none';
    if (src === shownSrc) return;
    const set = () => {
      shownSrc = src;
      bg.style.backgroundImage = src ? `url("${src.replace(/"/g, '%22')}")` : 'none';
      bg.style.opacity = '1';
    };
    if (!src) { set(); return; }
    // Load first so a broken link never leaves a blank screen; then fade across
    const img = new Image();
    img.onload = () => {
      const n = $('photoNow');
      const need = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) * 0.7;
      photoNote = src.startsWith('http') && img.naturalWidth < need ? `This photo is only ${img.naturalWidth}px wide, so it looks soft on your screen. Replace it with a larger picture for a sharper background.` : '';
      if (n) n.textContent = photoNote || `Right now it's ${phaseNow()} where you are.`;
      if (first || !shownSrc) set();
      else { bg.style.opacity = '0'; setTimeout(set, 700); }
    };
    img.onerror = () => {
      const n = $('photoNow');
      photoNote = `That photo couldn't load (offline or blocked), so a drawn ${phaseNow()} skyline is shown instead.`;
      if (n) n.textContent = `That photo couldn't load (offline or blocked), so a drawn ${phaseNow()} skyline is shown instead.`;
      if (photo.credit) $('photoCredit').hidden = true;
      if (!photo.src) return;
      const art = fallbackArt(phaseNow());
      if (art === shownSrc) return;
      shownSrc = art;
      bg.style.backgroundImage = `url("${art}")`;
      bg.style.opacity = '1';
    };
    img.src = src;
  }

  function renderPhotoSlots() {
    $('photoBox').hidden = settings.photoMode === 'none';
    if (settings.photoMode === 'none') return;
    const box = $('photoSlots');
    box.textContent = '';
    const now = phaseNow();
    $('photoNow').textContent = photoNote || `Right now it's ${now} where you are.`;
    for (const [id, label] of PHASES) {
      const own = safeImg(settings.photoSlots[id]);
      const file = el('input', { type: 'file', accept: 'image/*', hidden: true });
      file.addEventListener('change', async () => {
        const f = file.files[0];
        if (!f) return;
        try {
          settings.photoSlots[id] = await fileToPhoto(f);
          saveSettings(); applyBackground(); renderPhotoSlots();
        } catch (e) { $('photoNow').textContent = "Couldn't read that image."; }
      });
      const row = el('div', { class: 'photoSlot' + (id === now ? ' current' : '') });
      row.append(
        el('span', { class: 'pname', text: label }),
        el('span', { class: 'pstat', text: own ? 'Your photo' : settings.photoMode === 'custom' ? 'Not set' : 'Built-in' }),
        el('label', { class: 'btn ghost fileBtn', text: own ? 'Replace' : 'Upload' }, [file])
      );
      if (own) row.append(el('button', { type: 'button', class: 'btn ghost', text: 'Reset', onclick: () => { settings.photoSlots[id] = ''; saveSettings(); applyBackground(); renderPhotoSlots(); } }));
      box.append(row);
    }
  }

  // Shrink uploaded photos to a sensible size so they don't fill storage
  function fileToPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const scale = Math.min(1, 2200 / img.width, 1400 / img.height);
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * scale));
          c.height = Math.max(1, Math.round(img.height * scale));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.86));
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  let swatchTheme = null;
  function applyAppearance() {
    const root = document.documentElement;
    if (settings.theme !== 'auto' && settings.theme !== 'dark' && settings.theme !== 'light' && !THEMES[settings.theme]) settings.theme = 'macchiato';
    const theme = settings.theme === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : settings.theme;
    const T = themeOf(theme);
    root.dataset.theme = theme;
    root.dataset.mode = T ? T.mode : theme;
    if (T) {
      const dark = T.mode === 'dark';
      const v = {
        '--bg': T.bg, '--text': T.text, '--muted': T.muted,
        '--surface': rgba(T.s1, dark ? 0.65 : 0.75), '--surface-2': rgba(T.s2, dark ? 0.85 : 0.9),
        '--border': rgba(T.bd, 0.28), '--shadow': dark ? `0 10px 30px ${rgba(T.crust, 0.55)}` : '0 10px 30px rgba(30,40,70,0.15)',
        '--overlay': rgbOf(T.crust).join(', '), '--danger': T.danger
      };
      for (const k of PALETTE_VARS) root.style.setProperty(k, v[k]);
      root.style.colorScheme = T.mode;
    } else {
      for (const k of PALETTE_VARS) root.style.removeProperty(k);
      root.style.colorScheme = '';
    }
    root.style.setProperty('--accent', settings.accent);
    const oa = onAccent(settings.accent);
    let onA = oa;
    if (T) onA = oa === '#0b0e16' ? (T.mode === 'dark' ? T.bg : T.text) : (T.mode === 'light' ? T.bg : oa);
    root.style.setProperty('--on-accent', onA);
    if (swatchTheme !== theme) { swatchTheme = theme; buildSwatches(); }
    const fs = resolveFont(settings.font);
    root.style.setProperty('--font', fs.ui);
    root.style.setProperty('--font-display', fs.display);
    root.style.setProperty('--font-mono', fs.mono);
    root.style.setProperty('--font-moves', fs.moves);
    root.style.setProperty('--greeting-size', fs.themed ? '1.6rem' : '1.05rem');
    $('fontHint').hidden = !fs.themed;
    if (fs.themed) loadFontSet(fs.set);
    root.dataset.tiles = settings.tileStyle === 'rounded' ? 'rounded' : 'card';
    root.style.setProperty('--tile-w', settings.tileWidth + 'px');
    root.style.setProperty('--icon-size', settings.iconSize + 'px');
    root.style.setProperty('--clock-size', settings.clockSize + 'px');
    root.style.setProperty('--bg-dim', String(settings.bgDim / 100));

    applyBackground(shownSrc === null);
    $('faviconHint').hidden = settings.tileIcons !== 'favicons';
    updateFx();
  }
  darkQuery.addEventListener('change', () => { if (settings.theme === 'auto') applyAppearance(); });

  /* ---------- Clock & greeting ---------- */
  function renderClock() {
    const now = new Date();
    const opts = {
      hour: settings.timeFormat === '12' ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12'
    };
    if (settings.showSeconds) opts.second = '2-digit';
    $('time').textContent = now.toLocaleTimeString(undefined, opts);

    const dateEl = $('date');
    dateEl.hidden = !settings.showDate;
    if (settings.showDate) {
      dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const g = $('greeting');
    g.hidden = !settings.showGreeting;
    if (settings.showGreeting) {
      const h = now.getHours();
      const part = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
      g.textContent = settings.name ? `${part}, ${settings.name}` : part;
    }
  }

  /* ---------- Search ---------- */
  function populateEngines() {
    const sel = $('engineSelect');
    sel.textContent = '';
    for (const [key, e] of Object.entries(ENGINES)) {
      if (key === 'browser' && !hasBrowserSearch) continue;
      sel.append(el('option', { value: key, text: e.name }));
    }
  }

  async function doSearch(query) {
    const q = query.trim();
    if (!q) return;
    // Looks like a URL? Go straight there.
    if (!/\s/.test(q) && /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(q)) {
      const u = normaliseUrl(q);
      if (u) { window.location.href = u; return; }
    }
    const engine = ENGINES[settings.engine] || ENGINES.duckduckgo;
    if (!engine.url && hasBrowserSearch) {
      try {
        // Firefox: search.search({query}); Chrome: search.query({text})
        if (ext.search.search) await ext.search.search({ query: q, disposition: 'CURRENT_TAB' });
        else await ext.search.query({ text: q, disposition: 'CURRENT_TAB' });
        return;
      } catch { /* fall through */ }
    }
    window.location.href = (engine.url || ENGINES.duckduckgo.url) + encodeURIComponent(q);
  }

  /* ---------- Groups & tiles ---------- */
  // Should this link's icon be tinted with the accent colour?
  function tintFor(link) {
    if (link.tint === 'accent') return true;
    if (link.tint === 'original') return false;
    return settings.iconTint === 'accent';
  }

  function makeIcon(link) {
    const host = hostOf(link.url);
    const letter = (link.title || host || '?').trim().charAt(0).toUpperCase();
    const icon = el('div', { class: 'tileIcon letter', text: letter });
    // Letter colours (used by the Rounded style; the Card style shows the letter in the accent colour).
    const TT = themeOf(document.documentElement.dataset.theme);
    if (TT) {
      icon.style.background = TT.accents[hueFor(host || link.title) % TT.accents.length][1];
      icon.style.color = TT.bg;
    } else {
      icon.style.background = `hsl(${hueFor(host || link.title)} 45% 42%)`;
    }

    const showBoxed = (img, kind) => {
      icon.className = 'tileIcon ' + (kind || 'boxed');
      icon.removeAttribute('style');
      icon.textContent = '';
      icon.append(img);
    };
    const showMasked = (src) => {
      icon.className = 'tileIcon masked full';
      icon.removeAttribute('style');
      icon.textContent = '';
      const v = `url("${src.replace(/"/g, '%22')}")`;
      icon.style.setProperty('-webkit-mask-image', v);
      icon.style.setProperty('mask-image', v);
    };

    if (link.icon) {
      // Custom icon (uploaded, searched, or an image address). Falls back to the letter if it fails to load.
      // Only icons stored inside the extension can be tinted; remote addresses always keep their own colours.
      const canTint = link.icon.startsWith('data:') && tintFor(link);
      const img = el('img', { alt: '', src: link.icon });
      img.addEventListener('load', () => (canTint ? showMasked(link.icon) : showBoxed(img, 'full')));
    } else if (settings.tileIcons === 'favicons' && host) {
      const img = el('img', { alt: '', src: `https://icons.duckduckgo.com/ip3/${host}.ico`, loading: 'lazy' });
      img.addEventListener('load', () => { if (img.naturalWidth > 1) showBoxed(img); });
    }
    return icon;
  }

  let dragInfo = null;

  function renderGroups() {
    const wrap = $('groups');
    wrap.textContent = '';
    document.body.classList.toggle('editing', editing);

    for (const group of groups) {
      const title = el('h3', {}, [group.name]);
      if (editing) {
        title.append(el('button', { type: 'button', text: 'Rename / delete', onclick: () => openGroupDialog(group) }));
      }

      const tiles = el('div', { class: 'tiles' });
      for (const link of group.links) {
        const tile = el('a', {
          class: 'tile',
          href: editing ? '#' : link.url,
          title: link.url,
          draggable: editing ? 'true' : undefined
        }, [makeIcon(link), el('span', { class: 'tileTitle', text: link.title }), el('span', { class: 'tileUrl', text: hostOf(link.url) || link.url })]);

        if (!editing) {
          if (settings.newTab) { tile.target = '_blank'; tile.rel = 'noopener noreferrer'; }
        } else {
          tile.addEventListener('click', (e) => { e.preventDefault(); openLinkDialog(group, link); });
          tile.addEventListener('dragstart', (e) => {
            dragInfo = { groupId: group.id, linkId: link.id };
            tile.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', link.id);
          });
          tile.addEventListener('dragend', () => tile.classList.remove('dragging'));
          tile.addEventListener('dragover', (e) => { if (dragInfo) e.preventDefault(); });
          tile.addEventListener('drop', (e) => {
            e.preventDefault();
            moveLink(dragInfo, group.id, link.id);
          });
        }
        tiles.append(tile);
      }

      if (editing) {
        const add = el('button', { type: 'button', class: 'tile add', onclick: () => openLinkDialog(group, null) },
          [el('span', { class: 'plus', text: '+' }), el('span', { class: 'tileTitle', text: 'Add link' })]);
        add.addEventListener('dragover', (e) => { if (dragInfo) e.preventDefault(); });
        add.addEventListener('drop', (e) => { e.preventDefault(); moveLink(dragInfo, group.id, null); });
        tiles.append(add);
      }

      wrap.append(el('div', { class: 'group' }, [title, tiles]));
    }

    if (editing) {
      wrap.append(el('div', { class: 'group' }, [
        el('button', { type: 'button', class: 'btn ghost', text: '+ Add group', onclick: () => openGroupDialog(null) })
      ]));
    } else if (!groups.length) {
      wrap.append(el('p', { class: 'hint', text: 'No links yet. Click the pencil button to add some.' }));
    }
  }

  function moveLink(info, toGroupId, beforeLinkId) {
    dragInfo = null;
    if (!info) return;
    const from = groups.find(g => g.id === info.groupId);
    const to = groups.find(g => g.id === toGroupId);
    if (!from || !to) return;
    const idx = from.links.findIndex(l => l.id === info.linkId);
    if (idx < 0 || info.linkId === beforeLinkId) return;
    const [link] = from.links.splice(idx, 1);
    const at = beforeLinkId ? to.links.findIndex(l => l.id === beforeLinkId) : -1;
    if (at < 0) to.links.push(link); else to.links.splice(at, 0, link);
    saveGroups();
    renderGroups();
  }

  /* Icon picker */
  let pendingIcon;
  let pendingTint;
  const MAX_ICON_BYTES = 200 * 1024;
  const iconifyUrl = (prefix, name) => `https://api.iconify.design/${prefix}/${name}.svg?height=64`;

  function renderIconPreview() {
    const url = normaliseUrl($('linkUrl').value) || '';
    $('iconPreview').textContent = '';
    $('iconPreview').append(makeIcon({ title: $('linkTitle').value, url, icon: pendingIcon, tint: pendingTint }));
  }

  function setPendingIcon(value) {
    pendingIcon = value || undefined;
    $('iconUrl').value = pendingIcon && /^https?:/.test(pendingIcon) ? pendingIcon : '';
    renderIconPreview();
  }

  function fileToIcon(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const dataUrl = String(reader.result);
        if (file.type === 'image/svg+xml') {
          if (dataUrl.length > MAX_ICON_BYTES) reject(new Error('big'));
          else resolve(dataUrl);
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const S = 256;
          const scale = Math.min(S / img.width, S / img.height, 1);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function guessIconQuery() {
    const title = $('linkTitle').value.trim();
    if (title) return title;
    const host = hostOf(normaliseUrl($('linkUrl').value) || '');
    const parts = host.split('.');
    return parts.length > 1 ? parts[parts.length - 2] : host;
  }

  async function searchIcons() {
    const q = $('iconQuery').value.trim();
    const out = $('iconResults');
    const msg = $('iconMsg');
    out.textContent = '';
    msg.textContent = '';
    msg.classList.remove('err');
    if (!q) return;
    msg.textContent = 'Searching…';
    try {
      const base = 'https://api.iconify.design/search?limit=48&query=' + encodeURIComponent(q);
      let res = await fetch(base + '&prefixes=logos,simple-icons,mdi,tabler,fa6-brands');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let icons = (await res.json()).icons || [];
      if (!icons.length) {
        // Nothing in the brand/common sets: try every icon set.
        res = await fetch(base);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        icons = (await res.json()).icons || [];
      }
      msg.textContent = icons.length ? '' : 'No icons found. Try another word.';
      for (const full of icons) {
        const [prefix, name] = full.split(':');
        if (!prefix || !name) continue;
        const url = iconifyUrl(prefix, name);
        out.append(el('button', { type: 'button', class: 'iconOpt', title: full, onclick: () => pickIcon(url) },
          [el('img', { src: url, alt: full, loading: 'lazy' })]));
      }
    } catch {
      msg.textContent = 'Icon search failed. Check your connection.';
      msg.classList.add('err');
    }
  }

  async function pickIcon(url) {
    const msg = $('iconMsg');
    msg.classList.remove('err');
    msg.textContent = 'Saving icon…';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const svg = (await res.text()).trim();
      if (!/^<svg[\s>]/i.test(svg) || svg.length > MAX_ICON_BYTES) throw new Error('bad svg');
      setPendingIcon('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      $('iconSearch').hidden = true;
      msg.textContent = '';
    } catch {
      msg.textContent = 'Could not download that icon. Try another.';
      msg.classList.add('err');
    }
  }

  $('iconSearchBtn').addEventListener('click', () => {
    const panel = $('iconSearch');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      if (!$('iconQuery').value.trim()) $('iconQuery').value = guessIconQuery();
      $('iconQuery').focus();
      if ($('iconQuery').value.trim() && !$('iconResults').children.length) searchIcons();
    }
  });
  $('iconQueryBtn').addEventListener('click', searchIcons);
  $('iconQuery').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchIcons(); } });
  $('iconFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPendingIcon(await fileToIcon(file));
      $('linkErr').hidden = true;
    } catch (err) {
      $('linkErr').textContent = err.message === 'big' ? 'That SVG is too large (200 KB max).' : 'Could not read that image.';
      $('linkErr').hidden = false;
    }
  });
  $('iconReset').addEventListener('click', () => setPendingIcon(undefined));
  $('iconTintSel').addEventListener('change', () => { pendingTint = $('iconTintSel').value || undefined; renderIconPreview(); });
  function applyIconUrl() {
    const v = $('iconUrl').value.trim();
    if (!v) { if (pendingIcon && /^https?:/.test(pendingIcon)) setPendingIcon(undefined); return; }
    const u = normaliseUrl(v);
    if (u) setPendingIcon(u);
  }
  $('iconUrl').addEventListener('change', applyIconUrl);
  $('iconUrl').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyIconUrl(); } });
  $('linkTitle').addEventListener('input', renderIconPreview);
  $('linkUrl').addEventListener('input', renderIconPreview);

  /* Link dialog */
  let linkCtx = null;
  function openLinkDialog(group, link) {
    linkCtx = { group, link };
    $('linkDialogTitle').textContent = link ? 'Edit link' : 'Add link';
    $('linkTitle').value = link ? link.title : '';
    $('linkUrl').value = link ? link.url : '';
    $('linkDelete').hidden = !link;
    $('linkErr').hidden = true;
    $('iconSearch').hidden = true;
    $('iconQuery').value = '';
    $('iconResults').textContent = '';
    $('iconMsg').textContent = '';
    pendingTint = link ? link.tint : undefined;
    $('iconTintSel').value = pendingTint || '';
    setPendingIcon(link ? link.icon : undefined);
    $('linkDialog').showModal();
    $('linkTitle').focus();
  }

  $('linkForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = normaliseUrl($('linkUrl').value);
    if (!url) {
      $('linkErr').textContent = 'Please enter a valid http(s) address.';
      $('linkErr').hidden = false;
      return;
    }
    const title = $('linkTitle').value.trim() || hostOf(url);
    applyIconUrl();
    if (linkCtx.link) {
      linkCtx.link.title = title;
      linkCtx.link.url = url;
      if (pendingIcon) linkCtx.link.icon = pendingIcon; else delete linkCtx.link.icon;
      if (pendingTint) linkCtx.link.tint = pendingTint; else delete linkCtx.link.tint;
    } else {
      const created = { id: uid(), title, url };
      if (pendingIcon) created.icon = pendingIcon;
      if (pendingTint) created.tint = pendingTint;
      linkCtx.group.links.push(created);
    }
    saveGroups();
    $('linkDialog').close();
    renderGroups();
  });
  $('linkCancel').addEventListener('click', () => $('linkDialog').close());
  $('linkDelete').addEventListener('click', () => {
    linkCtx.group.links = linkCtx.group.links.filter(l => l.id !== linkCtx.link.id);
    saveGroups();
    $('linkDialog').close();
    renderGroups();
  });

  /* Group dialog */
  let groupCtx = null;
  function openGroupDialog(group) {
    groupCtx = group;
    $('groupName').value = group ? group.name : '';
    $('groupDelete').hidden = !group;
    $('groupDialog').showModal();
    $('groupName').focus();
  }
  $('groupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('groupName').value.trim();
    if (!name) return;
    if (groupCtx) groupCtx.name = name;
    else groups.push({ id: uid(), name, links: [] });
    saveGroups();
    $('groupDialog').close();
    renderGroups();
  });
  $('groupCancel').addEventListener('click', () => $('groupDialog').close());
  $('groupDelete').addEventListener('click', () => {
    if (groupCtx.links.length && !confirm(`Delete "${groupCtx.name}" and its ${groupCtx.links.length} link(s)?`)) return;
    groups = groups.filter(g => g.id !== groupCtx.id);
    saveGroups();
    $('groupDialog').close();
    renderGroups();
  });

  /* ---------- Weather (Open-Meteo, no API key) ---------- */
  const WMO = {
    0: ['Clear sky', '☀️', '🌙'],
    1: ['Mainly clear', '🌤️', '🌙'],
    2: ['Partly cloudy', '⛅', '☁️'],
    3: ['Overcast', '☁️', '☁️'],
    45: ['Fog', '🌫️', '🌫️'],
    48: ['Rime fog', '🌫️', '🌫️'],
    51: ['Light drizzle', '🌦️', '🌧️'],
    53: ['Drizzle', '🌦️', '🌧️'],
    55: ['Heavy drizzle', '🌧️', '🌧️'],
    56: ['Freezing drizzle', '🌧️', '🌧️'],
    57: ['Freezing drizzle', '🌧️', '🌧️'],
    61: ['Light rain', '🌦️', '🌧️'],
    63: ['Rain', '🌧️', '🌧️'],
    65: ['Heavy rain', '🌧️', '🌧️'],
    66: ['Freezing rain', '🌧️', '🌧️'],
    67: ['Freezing rain', '🌧️', '🌧️'],
    71: ['Light snow', '🌨️', '🌨️'],
    73: ['Snow', '🌨️', '🌨️'],
    75: ['Heavy snow', '❄️', '❄️'],
    77: ['Snow grains', '🌨️', '🌨️'],
    80: ['Light showers', '🌦️', '🌧️'],
    81: ['Showers', '🌧️', '🌧️'],
    82: ['Violent showers', '⛈️', '⛈️'],
    85: ['Snow showers', '🌨️', '🌨️'],
    86: ['Heavy snow showers', '❄️', '❄️'],
    95: ['Thunderstorm', '⛈️', '⛈️'],
    96: ['Thunderstorm, hail', '⛈️', '⛈️'],
    99: ['Thunderstorm, heavy hail', '⛈️', '⛈️']
  };

  function wmo(code, isDay = true) {
    const e = WMO[code] || ['Unknown', '❔', '❔'];
    return { text: e[0], icon: isDay ? e[1] : e[2] };
  }

  const WEATHER_TTL = 15 * 60 * 1000;

  async function loadWeather(force = false) {
    const w = settings.weather;
    const box = $('weather');
    if (!w.enabled) { box.hidden = true; return; }
    box.hidden = false;
    if (w.lat == null || w.lon == null) { renderWeather(null); return; }

    const key = `${w.lat},${w.lon},${w.units}`;
    const cached = weatherCache && weatherCache.key === key ? weatherCache : null;
    if (cached && !force && Date.now() - cached.t < WEATHER_TTL) {
      renderWeather(cached.data);
      return;
    }
    if (cached) renderWeather(cached.data, 'Updating…');

    const metric = w.units === 'metric';
    const params = new URLSearchParams({
      latitude: w.lat,
      longitude: w.lon,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '6',
      temperature_unit: metric ? 'celsius' : 'fahrenheit',
      wind_speed_unit: metric ? 'kmh' : 'mph'
    });

    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?' + params);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      weatherCache = { key, t: Date.now(), data };
      await store.set('weatherCache', weatherCache);
      updateFx();
      renderWeather(data);
    } catch (err) {
      if (cached) renderWeather(cached.data, 'Offline — showing last known weather');
      else renderWeather(null, 'Could not load weather. Check your connection.');
    }
  }

  function renderWeather(data, note) {
    const box = $('weather');
    box.textContent = '';
    const w = settings.weather;

    if (w.lat == null) {
      box.append(el('div', { class: 'wEmpty' }, [
        el('span', { text: 'Set a location to see the weather.' }),
        el('button', { class: 'btn', type: 'button', text: 'Choose location', onclick: () => openSettings('Weather') })
      ]));
      return;
    }
    if (!data) {
      box.append(el('div', { class: 'wEmpty' }, [
        el('span', { text: note || 'Loading weather…' }),
        note ? el('button', { class: 'btn ghost', type: 'button', text: 'Retry', onclick: () => loadWeather(true) }) : null
      ]));
      return;
    }

    const c = data.current;
    const unitT = w.units === 'metric' ? '°C' : '°F';
    const unitW = w.units === 'metric' ? 'km/h' : 'mph';
    const cond = wmo(c.weather_code, c.is_day === 1);
    const d = data.daily;

    box.append(el('div', { class: 'wNow' }, [
      el('div', { class: 'wIcon', text: cond.icon, 'aria-hidden': 'true' }),
      el('div', { class: 'wTemp', text: Math.round(c.temperature_2m) + '°' }),
      el('div', { class: 'wMeta' }, [
        el('div', { class: 'wDesc', text: cond.text }),
        el('div', { class: 'wPlace', text: w.place || 'Your location', title: w.place || '' })
      ])
    ]));

    box.append(el('div', { class: 'wStats' }, [
      el('span', {}, ['Feels ', el('b', { text: Math.round(c.apparent_temperature) + unitT })]),
      el('span', {}, ['Humidity ', el('b', { text: Math.round(c.relative_humidity_2m) + '%' })]),
      el('span', {}, ['Wind ', el('b', { text: Math.round(c.wind_speed_10m) + ' ' + unitW })]),
      d && d.precipitation_probability_max && d.precipitation_probability_max[0] != null
        ? el('span', {}, ['Rain ', el('b', { text: d.precipitation_probability_max[0] + '%' })]) : null
    ]));

    if (w.forecast && d && d.time) {
      const fc = el('div', { class: 'wForecast' });
      for (let i = 1; i <= 5 && i < d.time.length; i++) {
        const day = new Date(d.time[i] + 'T12:00:00');
        const f = wmo(d.weather_code[i], true);
        fc.append(el('div', { class: 'wDay', title: f.text }, [
          el('span', { class: 'd', text: day.toLocaleDateString(undefined, { weekday: 'short' }) }),
          el('span', { class: 'i', text: f.icon }),
          el('span', { class: 'hi', text: Math.round(d.temperature_2m_max[i]) + '°' }),
          el('span', { class: 'lo', text: Math.round(d.temperature_2m_min[i]) + '°' })
        ]));
      }
      box.append(fc);
    }

    if (note) box.append(el('div', { class: 'wNote', text: note }));
  }

  /* Location search */
  async function searchPlaces() {
    const q = $('placeInput').value.trim();
    const out = $('placeResults');
    const msg = $('placeMsg');
    out.textContent = '';
    msg.textContent = '';
    msg.classList.remove('err');
    if (!q) return;
    msg.textContent = 'Searching…';
    try {
      const url = 'https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(q);
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const results = json.results || [];
      msg.textContent = results.length ? '' : 'No matches found.';
      for (const r of results) {
        const label = [r.name, r.admin1, r.country].filter(Boolean).join(', ');
        out.append(el('button', { type: 'button', text: label, onclick: () => chooseLocation(r.latitude, r.longitude, label) }));
      }
    } catch {
      msg.textContent = 'Search failed. Check your connection.';
      msg.classList.add('err');
    }
  }

  function chooseLocation(lat, lon, place) {
    settings.weather.lat = Math.round(lat * 1000) / 1000;
    settings.weather.lon = Math.round(lon * 1000) / 1000;
    settings.weather.place = place;
    saveSettings();
    $('placeResults').textContent = '';
    $('placeInput').value = '';
    $('placeMsg').textContent = '';
    syncSettingsUI();
    loadWeather(true);
  }

  function useGeolocation() {
    const msg = $('placeMsg');
    msg.classList.remove('err');
    if (!navigator.geolocation) { msg.textContent = 'Geolocation is not available.'; msg.classList.add('err'); return; }
    msg.textContent = 'Asking Firefox for your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => chooseLocation(pos.coords.latitude, pos.coords.longitude, 'Current location'),
      () => { msg.textContent = 'Location was blocked or unavailable. Search for a city instead.'; msg.classList.add('err'); },
      { timeout: 15000, maximumAge: 600000 }
    );
  }

  /* ---------- Themed drop-downs (replace the browser's plain <select> pop-ups) ---------- */
  function enhanceSelect(sel) {
    if (sel._cs) return;
    sel._cs = true;
    const wrap = el('div', { class: 'cs' });
    sel.before(wrap);
    const btn = el('button', { type: 'button', class: 'csBtn', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' });
    const lab = el('span', { class: 'csLabel' });
    btn.append(lab, el('span', { class: 'csChev', 'aria-hidden': 'true' }));
    wrap.append(btn, sel);
    sel.classList.add('csNative');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    const refresh = () => { lab.textContent = sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : ''; };
    sel._refresh = refresh;
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { get() { return d.get.call(sel); }, set(v) { d.set.call(sel, v); refresh(); }, configurable: true });
    refresh();

    let pop = null, items = [], active = -1;
    const setActive = (i, scroll) => {
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach((it, k) => it.node.classList.toggle('active', k === active));
      if (scroll) items[active].node.scrollIntoView({ block: 'nearest' });
    };
    const close = () => {
      if (!pop) return;
      pop.remove();
      pop = null;
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
    const outside = (e) => { if (pop && !pop.contains(e.target) && !btn.contains(e.target)) close(); };
    const onScroll = (e) => { if (pop && !pop.contains(e.target)) close(); };
    const choose = (opt) => {
      sel.value = opt.value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close();
      btn.focus();
    };
    const open = () => {
      if (pop) return;
      refresh();
      pop = el('div', { class: 'csPop', role: 'listbox' });
      items = [];
      const addOpt = (o) => {
        const node = el('div', { class: 'csOpt', role: 'option', text: o.textContent, 'aria-selected': String(o.selected) });
        if (o.disabled) node.classList.add('disabled');
        node.classList.toggle('selected', o.selected);
        node.addEventListener('pointermove', () => setActive(items.findIndex((x) => x.node === node)));
        node.addEventListener('click', () => { if (!o.disabled) choose(o); });
        pop.append(node);
        items.push({ opt: o, node });
      };
      for (const c of sel.children) {
        if (c.tagName === 'OPTGROUP') {
          pop.append(el('div', { class: 'csGroup', text: c.label }));
          [...c.children].forEach(addOpt);
        } else addOpt(c);
      }
      pop.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }); // don't let the surrounding <label> re-open it
      wrap.append(pop);
      const r = btn.getBoundingClientRect();
      const w = Math.min(Math.max(r.width, sel.dataset.wide ? 340 : 250), window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
      pop.style.width = w + 'px';
      pop.style.left = left + 'px';
      const natural = pop.scrollHeight;
      const below = window.innerHeight - r.bottom - 12, above = r.top - 12;
      const down = natural <= below || below >= above;
      const avail = Math.max(120, down ? below : above);
      pop.style.maxHeight = Math.min(natural, avail, 420) + 'px';
      if (down) pop.style.top = r.bottom + 6 + 'px';
      else { pop.style.bottom = window.innerHeight - r.top + 6 + 'px'; pop.classList.add('up'); }
      btn.setAttribute('aria-expanded', 'true');
      setActive(Math.max(0, items.findIndex((x) => x.opt.selected)), true);
      document.addEventListener('pointerdown', outside, true);
      document.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', close);
    };
    btn.addEventListener('click', () => (pop ? close() : open()));
    btn.addEventListener('keydown', (e) => {
      const k = e.key;
      if (!pop) {
        if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); open(); }
        return;
      }
      if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (k === 'ArrowDown') { e.preventDefault(); setActive(active + 1, true); }
      else if (k === 'ArrowUp') { e.preventDefault(); setActive(active - 1, true); }
      else if (k === 'Home') { e.preventDefault(); setActive(0, true); }
      else if (k === 'End') { e.preventDefault(); setActive(items.length - 1, true); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); const it = items[active]; if (it && !it.opt.disabled) choose(it.opt); }
      else if (k === 'Tab') close();
    });
  }

  function enhanceSelects() {
    document.querySelectorAll('select:not([size])').forEach(enhanceSelect);
    document.querySelectorAll('select:not([size])').forEach((s) => s._refresh && s._refresh());
  }

  /* ---------- Settings drawer ---------- */
  function syncSettingsUI() {
    document.querySelectorAll('[data-setting]').forEach((input) => {
      const val = getPath(settings, input.dataset.setting);
      if (input.type === 'checkbox') input.checked = !!val;
      else input.value = val ?? '';
    });
    enhanceSelects();
    document.querySelectorAll('.swatch').forEach((b) => {
      const on = b.dataset.hex.toLowerCase() === String(settings.accent).toLowerCase();
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $('currentPlace').textContent = settings.weather.place || 'not set';
    renderPhotoSlots();
    $('bgUrl').value = settings.bgImage && !settings.bgImage.startsWith('data:') ? settings.bgImage : '';
  }

  function buildSwatches() {
    const wrap = $('swatches');
    wrap.textContent = '';
    for (const [name, hex] of accentsFor(document.documentElement.dataset.theme)) {
      const b = el('button', { type: 'button', class: 'swatch', title: name, 'aria-label': name, dataset: { hex } });
      b.style.background = hex;
      b.addEventListener('click', () => {
        settings.accent = hex;
        saveSettings();
        applyAppearance();
        syncSettingsUI();
      });
      wrap.append(b);
    }
    wrap.querySelectorAll('.swatch').forEach((b) => b.classList.toggle('selected', b.dataset.hex.toLowerCase() === String(settings.accent).toLowerCase()));
  }

  function populatePhotoModes() {
    const sel = document.querySelector('[data-setting="photoMode"]');
    sel.textContent = '';
    sel.append(el('option', { value: 'none', text: 'Off' }));
    for (const [id, s] of Object.entries(PHOTO_SETS)) sel.append(el('option', { value: id, text: s.name }));
    sel.append(el('option', { value: 'custom', text: 'My own photos' }));
  }

  function populateThemes() {
    const sel = document.querySelector('[data-setting="theme"]');
    sel.textContent = '';
    for (const g of THEME_GROUPS) {
      const og = el('optgroup', { label: g });
      for (const [id, t] of Object.entries(THEMES)) if (t.group === g) og.append(el('option', { value: id, text: `${g} ${t.name}`.replace(`${g} ${g}`, g) }));
      sel.append(og);
    }
    const basic = el('optgroup', { label: 'Basic' });
    for (const [v, t] of [['dark', 'Dark'], ['light', 'Light'], ['auto', 'Match system']]) basic.append(el('option', { value: v, text: t }));
    sel.append(basic);
  }

  function bindSettings() {
    populateThemes();
    populatePhotoModes();
    buildSettingsNav();
    buildSwatches();
    document.querySelectorAll('[data-setting]').forEach((input) => {
      const evt = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
      input.addEventListener(evt, () => {
        let v;
        if (input.type === 'checkbox') v = input.checked;
        else if (input.type === 'range') v = Number(input.value);
        else v = input.value;
        const prevTheme = settings.theme;
        setPath(settings, input.dataset.setting, v);
        if (input.dataset.setting === 'theme') {
          // Move to the new theme's own default accent if the current one came from the old theme's list
          const was = accentsFor(prevTheme).some((a) => a[1].toLowerCase() === String(settings.accent).toLowerCase());
          const now = accentsFor(settings.theme).some((a) => a[1].toLowerCase() === String(settings.accent).toLowerCase());
          const T2 = themeOf(settings.theme);
          const wasDefault = themeOf(prevTheme) && String(settings.accent).toLowerCase() === themeOf(prevTheme).accent.toLowerCase();
          if (T2 && wasDefault) settings.accent = T2.accent;
          else if (was && !now) settings.accent = T2 ? T2.accent : ACCENTS[3][1];
        }
        saveSettings();
        applyAppearance();
        renderClock();
        renderGroups();
        renderLayout();
        syncSettingsUI();
        if (input.dataset.setting.startsWith('weather.')) loadWeather(input.dataset.setting === 'weather.units');
      });
    });

    $('bgUrl').addEventListener('change', () => {
      const v = $('bgUrl').value.trim();
      const u = v ? normaliseUrl(v) : '';
      settings.bgImage = u || '';
      saveSettings();
      applyAppearance();
    });
    $('bgFile').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        settings.bgImage = String(reader.result);
        saveSettings();
        applyAppearance();
        syncSettingsUI();
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
    $('bgClear').addEventListener('click', () => {
      settings.bgImage = '';
      saveSettings();
      applyAppearance();
      syncSettingsUI();
    });

    $('placeSearchBtn').addEventListener('click', searchPlaces);
    $('placeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchPlaces(); } });
    $('geoBtn').addEventListener('click', useGeolocation);

    $('exportBtn').addEventListener('click', exportBackup);
    $('importFile').addEventListener('change', importBackup);
    $('resetBtn').addEventListener('click', async () => {
      if (!confirm('Reset all settings and links to defaults?')) return;
      await store.clear();
      location.reload();
    });
  }

  function setSettingsTab(name) {
    const panes = [...document.querySelectorAll('#settings .drawerBody > details')];
    const target = panes.find((d) => d.querySelector('summary').textContent === name) || panes[0];
    panes.forEach((d) => d.classList.toggle('active', d === target));
    document.querySelectorAll('#settingsNav button').forEach((b) => b.setAttribute('aria-selected', String(b.textContent === target.querySelector('summary').textContent)));
    $('settings').querySelector('.drawerBody').scrollTop = 0;
  }

  function buildSettingsNav() {
    const nav = $('settingsNav');
    nav.textContent = '';
    document.querySelectorAll('#settings .drawerBody > details').forEach((d) => {
      d.open = true;
      const name = d.querySelector('summary').textContent;
      nav.append(el('button', { type: 'button', role: 'tab', text: name, onclick: () => setSettingsTab(name) }));
    });
    setSettingsTab('General');
  }

  function openSettings(sectionName) {
    $('settings').hidden = false;
    syncSettingsUI();
    if (sectionName) setSettingsTab(sectionName);
  }
  const closeSettings = () => { $('settings').hidden = true; };

  /* ---------- Backup ---------- */
  function exportBackup() {
    const payload = { app: 'WeatherTab', version: 1, settings, groups };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'weathertab-backup.json' });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function importBackup(e) {
    const file = e.target.files[0];
    const msg = $('backupMsg');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.app !== 'WeatherTab' || !Array.isArray(data.groups)) throw new Error('bad file');
        settings = deepMerge(DEFAULT_SETTINGS, data.settings);
        groups = data.groups.map(g => ({
          id: uid(),
          name: String(g.name || 'Group'),
          links: (g.links || [])
            .map(l => {
              const out = { id: uid(), title: String(l.title || ''), url: normaliseUrl(String(l.url || '')) };
              const ic = typeof l.icon === 'string' ? l.icon : '';
              if (/^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/i.test(ic) || /^https:\/\//i.test(ic)) out.icon = ic;
              if (l.tint === 'accent' || l.tint === 'original') out.tint = l.tint;
              return out;
            })
            .filter(l => l.url)
        }));
        await saveSettings();
        await saveGroups();
        location.reload();
      } catch {
        msg.textContent = 'That file is not a valid WeatherTab backup.';
        msg.classList.add('err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ---------- Animated backgrounds (canvas, 30 fps; paused when hidden or when "reduce motion" is on) ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FX = { canvas: null, ctx: null, raf: 0, last: 0, t: 0, w: 0, h: 0, u: 1, key: '', effect: null };

  const inkColor = (a) => (document.documentElement.dataset.mode === 'light' ? `rgba(30,40,70,${a})` : `rgba(255,255,255,${a})`);
  const hsla = (c, a) => `hsla(${c.h},${c.s}%,${c.l}%,${a})`;

  function hexToHsl(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return { h: 270, s: 80, l: 78 };
    const n = parseInt(m[1], 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  // Colours taken from the accent colour by rotating its hue
  const accentPal = () => {
    const b = hexToHsl(settings.accent);
    return [0, 40, -40, 80, -80].map((d) => ({ h: (b.h + d + 360) % 360, s: b.s, l: b.l }));
  };
  const WARM = ['#f5a97f', '#eed49f', '#f5bde6', '#ee99a0'].map(hexToHsl);
  const COOL = ['#939ab7', '#8087a2', '#7dc4e4', '#a5adcb'].map(hexToHsl);

  // Soft drifting colour clouds (aurora, sunny, cloudy)
  function blobEffect(getPal, alpha, count) {
    let blobs = [];
    return {
      scale: 0.5,
      init() {
        const pal = getPal();
        const n = Math.max(2, Math.round(count * settings.fxDensity));
        blobs = Array.from({ length: n }, (_, i) => ({
          c: pal[i % pal.length], px: rnd(0, 6.28), py: rnd(0, 6.28), sx: rnd(0.15, 0.35), sy: rnd(0.15, 0.35), r: rnd(0.35, 0.6)
        }));
      },
      draw(ctx, dt, t) {
        const { w, h } = FX;
        ctx.clearRect(0, 0, w, h);
        for (const b of blobs) {
          const x = w * (0.5 + 0.4 * Math.sin(b.px + t * b.sx));
          const y = h * (0.5 + 0.35 * Math.sin(b.py + t * b.sy));
          const r = Math.max(w, h) * b.r;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, hsla(b.c, alpha));
          g.addColorStop(1, hsla(b.c, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
      }
    };
  }

  const gradientEffect = {
    scale: 0.5,
    init() { this.pal = accentPal(); },
    draw(ctx, dt, t) {
      const { w, h } = FX;
      const a = t * 0.08, d = Math.hypot(w, h) / 2, cx = w / 2, cy = h / 2;
      const g = ctx.createLinearGradient(cx - Math.cos(a) * d, cy - Math.sin(a) * d, cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      g.addColorStop(0, hsla(this.pal[0], 0.35));
      g.addColorStop(0.5, hsla(this.pal[1], 0.3));
      g.addColorStop(1, hsla(this.pal[2], 0.35));
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  };

  const starsEffect = (() => {
    let stars = [], meteors = [], next = 3;
    return {
      scale: 'px',
      init() {
        const area = (FX.w * FX.h) / (FX.u * FX.u);
        const n = Math.round((area / 7000) * settings.fxDensity);
        stars = Array.from({ length: n }, () => ({ x: Math.random() * FX.w, y: Math.random() * FX.h, r: rnd(0.4, 1.5) * FX.u, ph: rnd(0, 6.28), sp: rnd(0.6, 2.2) }));
        meteors = [];
        next = rnd(2, 5);
      },
      draw(ctx, dt, t) {
        const { w, h, u } = FX;
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
          const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(s.ph + t * s.sp));
          ctx.fillStyle = inkColor(a * 0.9);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, 6.283);
          ctx.fill();
        }
        next -= dt;
        if (next <= 0) {
          meteors.push({ x: rnd(0.3, 1) * w, y: rnd(0, 0.35) * h, vx: -rnd(500, 800) * u, vy: rnd(250, 450) * u, life: 1 });
          next = rnd(4, 9) / settings.fxDensity;
        }
        meteors = meteors.filter((m) => m.life > 0);
        for (const m of meteors) {
          m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt * 1.2;
          const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.12, m.y - m.vy * 0.12);
          g.addColorStop(0, inkColor(Math.max(0, m.life)));
          g.addColorStop(1, inkColor(0));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6 * u;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.vx * 0.12, m.y - m.vy * 0.12);
          ctx.stroke();
        }
      }
    };
  })();

  function rainEffect(storm) {
    let drops = [], flash = 0, nextFlash = 4;
    const slant = 0.18;
    return {
      scale: 'px',
      init() {
        const n = Math.round((FX.w / FX.u / 5) * settings.fxDensity);
        drops = Array.from({ length: n }, () => ({ x: rnd(0, FX.w * 1.1), y: rnd(0, FX.h), l: rnd(10, 26) * FX.u, v: rnd(700, 1100) * FX.u }));
      },
      draw(ctx, dt) {
        const { w, h, u } = FX;
        ctx.clearRect(0, 0, w, h);
        if (storm) {
          nextFlash -= dt;
          if (nextFlash <= 0) { flash = 1; nextFlash = rnd(3, 9); }
          if (flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${flash * 0.22})`;
            ctx.fillRect(0, 0, w, h);
            flash = Math.max(0, flash - dt * 3);
          }
        }
        ctx.strokeStyle = inkColor(0.28);
        ctx.lineWidth = Math.max(1, u);
        ctx.beginPath();
        for (const d of drops) {
          d.y += d.v * dt; d.x -= d.v * slant * dt;
          if (d.y > h) { d.y = -d.l; d.x = rnd(0, w * 1.1); }
          if (d.x < -20) d.x += w + 40;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.l * slant, d.y - d.l);
        }
        ctx.stroke();
      }
    };
  }

  const snowEffect = (() => {
    let flakes = [];
    return {
      scale: 'px',
      init() {
        const n = Math.round((FX.w / FX.u / 9) * settings.fxDensity);
        flakes = Array.from({ length: n }, () => ({ x: rnd(0, FX.w), y: rnd(0, FX.h), r: rnd(1, 3.2) * FX.u, v: rnd(25, 70) * FX.u, ph: rnd(0, 6.28), sw: rnd(0.5, 1.4) }));
      },
      draw(ctx, dt, t) {
        const { w, h, u } = FX;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = inkColor(0.8);
        ctx.beginPath();
        for (const f of flakes) {
          f.y += f.v * dt;
          f.x += Math.sin(f.ph + t * f.sw) * 18 * u * dt;
          if (f.y > h + f.r) { f.y = -f.r; f.x = rnd(0, w); }
          ctx.moveTo(f.x + f.r, f.y);
          ctx.arc(f.x, f.y, f.r, 0, 6.283);
        }
        ctx.fill();
      }
    };
  })();

  const firefliesEffect = (() => {
    let flies = [], sprites = [];
    const sprite = (c) => {
      const s = 64, cv = document.createElement('canvas');
      cv.width = cv.height = s;
      const g = cv.getContext('2d');
      const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      gr.addColorStop(0, hsla(c, 1));
      gr.addColorStop(0.25, hsla(c, 0.6));
      gr.addColorStop(1, hsla(c, 0));
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      return cv;
    };
    return {
      scale: 'px',
      init() {
        sprites = accentPal().map(sprite);
        const n = Math.round(26 * settings.fxDensity * Math.max(0.6, FX.w / FX.u / 1400));
        flies = Array.from({ length: n }, (_, i) => ({
          x: rnd(0, FX.w), y: rnd(0, FX.h), a: rnd(0, 6.28), v: rnd(8, 28) * FX.u, turn: rnd(-0.6, 0.6),
          size: rnd(18, 46) * FX.u, ph: rnd(0, 6.28), sp: rnd(0.5, 1.6), s: sprites[i % sprites.length]
        }));
      },
      draw(ctx, dt, t) {
        const { w, h } = FX;
        const light = document.documentElement.dataset.mode === 'light';
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
        for (const f of flies) {
          f.a += Math.sin(t * 0.7 + f.ph) * f.turn * dt * 2;
          f.x += Math.cos(f.a) * f.v * dt;
          f.y += Math.sin(f.a) * f.v * dt;
          if (f.x < -f.size) f.x = w + f.size; else if (f.x > w + f.size) f.x = -f.size;
          if (f.y < -f.size) f.y = h + f.size; else if (f.y > h + f.size) f.y = -f.size;
          ctx.globalAlpha = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(f.ph + t * f.sp))) * (light ? 0.6 : 1);
          ctx.drawImage(f.s, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };
  })();

  const wavesEffect = {
    scale: 0.5,
    init() { this.pal = accentPal(); },
    draw(ctx, dt, t) {
      const { w, h } = FX;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        const base = h * (0.6 + 0.09 * i), amp = h * (0.025 + 0.008 * i);
        const k = ((1.1 + 0.45 * i) * Math.PI * 2) / w, sp = (0.35 + 0.12 * i) * (i % 2 ? -1 : 1);
        const step = Math.max(4, w / 160);
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w + step; x += step) {
          ctx.lineTo(x, base + Math.sin(x * k + t * sp * 2) * amp + Math.sin(x * k * 2.3 - t * sp) * amp * 0.4);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = hsla(this.pal[i % this.pal.length], 0.16 + 0.03 * i);
        ctx.fill();
      }
    }
  };

  const EFFECTS = {
    aurora: blobEffect(accentPal, 0.34, 5),
    sunny: blobEffect(() => WARM, 0.3, 4),
    cloudy: blobEffect(() => COOL, 0.28, 5),
    gradient: gradientEffect,
    stars: starsEffect,
    rain: rainEffect(false),
    storm: rainEffect(true),
    snow: snowEffect,
    fireflies: firefliesEffect,
    waves: wavesEffect
  };

  // "Match the weather": pick an effect from the current conditions
  function weatherEffect() {
    const d = weatherCache && weatherCache.data;
    if (!settings.weather.enabled || !d || !d.current) return 'aurora';
    const code = d.current.weather_code;
    const day = d.current.is_day === 1;
    if (code >= 95) return 'storm';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if (code === 0 || code === 1) return day ? 'sunny' : 'stars';
    return 'cloudy';
  }

  function fxResize(effect) {
    const u = effect.scale === 'px' ? Math.min(window.devicePixelRatio || 1, 1.5) : effect.scale;
    FX.u = u;
    FX.w = Math.max(1, Math.round(window.innerWidth * u));
    FX.h = Math.max(1, Math.round(window.innerHeight * u));
    FX.canvas.width = FX.w;
    FX.canvas.height = FX.h;
  }

  function fxLoop(now) {
    FX.raf = requestAnimationFrame(fxLoop);
    const real = (now - FX.last) / 1000;
    if (real < 1 / 30 - 0.002) return; // cap at ~30 fps to save battery
    FX.last = now;
    const dt = Math.min(real, 0.1) * settings.fxSpeed;
    FX.t += dt;
    FX.effect.draw(FX.ctx, dt, FX.t);
  }

  function fxStop() {
    if (FX.raf) cancelAnimationFrame(FX.raf);
    FX.raf = 0;
  }

  function fxStart() {
    if (FX.raf || !FX.effect || document.hidden || reduceMotion.matches) return;
    FX.last = performance.now();
    FX.raf = requestAnimationFrame(fxLoop);
  }

  function updateFx() {
    if (!FX.canvas) {
      FX.canvas = $('fx');
      FX.ctx = FX.canvas.getContext('2d');
    }
    const name = settings.fx === 'weather' ? weatherEffect() : settings.fx;
    const effect = EFFECTS[name];
    $('fxHint').hidden = !(effect && reduceMotion.matches);
    if (!effect) {
      fxStop();
      FX.effect = null;
      FX.key = '';
      FX.canvas.hidden = true;
      FX.canvas.dataset.effect = 'none';
      return;
    }
    FX.canvas.hidden = false;
    FX.canvas.dataset.effect = name;
    const key = [name, window.innerWidth, window.innerHeight, settings.fxDensity, settings.accent, document.documentElement.dataset.theme].join('|');
    if (key !== FX.key) {
      FX.key = key;
      FX.effect = effect;
      fxResize(effect);
      effect.init();
      if (reduceMotion.matches) {
        FX.t = 6;
        effect.draw(FX.ctx, 0, FX.t); // a single still frame
      }
    }
    fxStart();
  }

  /* ---------- Layout editor (12-column grid: drag to move, drag the edge to resize) ---------- */
  const COLS = 12;
  const WIDGET_IDS = ['clock', 'date', 'greeting', 'weather', 'search', 'links'];
  const WIDGET_LABELS = { clock: 'Clock', date: 'Date', greeting: 'Greeting', weather: 'Weather', search: 'Search', links: 'Links' };
  const MIN_SPAN = { clock: 3, date: 2, greeting: 2, weather: 3, search: 3, links: 3 };

  const isVisible = (id) => {
    if (id === 'weather') return !!settings.weather.enabled;
    if (id === 'date') return !!settings.showDate;
    if (id === 'greeting') return !!settings.showGreeting;
    return settings.layout[id].visible !== false;
  };
  const overlap = (a, b) => a.row === b.row && a.col <= b.col + b.span - 1 && b.col <= a.col + a.span - 1;

  function sanitizeLayout() {
    const L = settings.layout || {};
    let ok = true;
    for (const id of WIDGET_IDS) {
      const c = L[id];
      if (!c || !Number.isInteger(c.col) || !Number.isInteger(c.row) || !Number.isInteger(c.span)
        || c.row < 1 || c.col < 1 || c.span < MIN_SPAN[id] || c.col + c.span - 1 > COLS) ok = false;
    }
    if (ok) {
      for (const a of WIDGET_IDS) for (const b of WIDGET_IDS) {
        if (a < b && isVisible(a) && isVisible(b) && overlap(L[a], L[b])) ok = false;
      }
    }
    if (!ok) settings.layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    for (const id of WIDGET_IDS) {
      if (!['start', 'center', 'end'].includes(settings.layout[id].align)) settings.layout[id].align = 'start';
    }
  }

  function fits(id, col, row, span) {
    if (row < 1 || col < 1 || col + span - 1 > COLS) return false;
    const cand = { col, row, span };
    return WIDGET_IDS.every((o) => o === id || !isVisible(o) || !overlap(cand, settings.layout[o]));
  }

  function findSpot(id, span) {
    for (let row = 1; row < 60; row++) {
      for (let col = 1; col + span - 1 <= COLS; col++) {
        if (fits(id, col, row, span)) return { col, row };
      }
    }
    return { col: 1, row: 1 };
  }

  function setVisible(id, vis) {
    if (vis) {
      const c = settings.layout[id];
      Object.assign(c, findSpot(id, c.span));
    }
    if (id === 'weather') settings.weather.enabled = vis;
    else if (id === 'date') settings.showDate = vis;
    else if (id === 'greeting') settings.showGreeting = vis;
    else settings.layout[id].visible = vis;
    saveSettings();
    syncSettingsUI();
    renderClock();
    renderLayout();
    if (id === 'weather') loadWeather();
  }

  function resetLayout() {
    settings.layout = JSON.parse(JSON.stringify(DEFAULT_LAYOUT));
    settings.weather.enabled = true;
    settings.showDate = true;
    settings.showGreeting = true;
    saveSettings();
    syncSettingsUI();
    renderLayout();
    loadWeather();
  }

  function toggleEdit() {
    editing = !editing;
    renderGroups();
    renderLayout();
  }

  function gridMetrics() {
    const L = $('layout');
    const gap = parseFloat(getComputedStyle(L).columnGap) || 0;
    const colW = (L.clientWidth - gap * (COLS - 1)) / COLS;
    return { step: colW + gap };
  }

  let widgetDrag = null; // { id, grab } while a widget is being dragged
  const clearGhost = () => document.querySelectorAll('#layout .cell.ghost, #layout .cell.bad').forEach((c) => c.classList.remove('ghost', 'bad'));

  function dropTarget(cell) {
    const span = settings.layout[widgetDrag.id].span;
    const col = Math.min(Math.max(Number(cell.dataset.col) - widgetDrag.grab, 1), COLS - span + 1);
    return { col, row: Number(cell.dataset.row), span };
  }

  function showGhost(cell) {
    clearGhost();
    const t = dropTarget(cell);
    const cls = fits(widgetDrag.id, t.col, t.row, t.span) ? 'ghost' : 'bad';
    document.querySelectorAll(`#layout .cell[data-row="${t.row}"]`).forEach((c) => {
      const cc = Number(c.dataset.col);
      if (cc >= t.col && cc < t.col + t.span) c.classList.add(cls);
    });
  }

  function endWidgetDrag() {
    widgetDrag = null;
    $('layout').classList.remove('dragging');
    clearGhost();
  }

  function makeBar(id, wrapper) {
    const cfg = settings.layout[id];
    const bar = el('div', { class: 'wBar' });

    const handle = el('span', { class: 'wHandle', role: 'button', draggable: 'true', title: 'Drag to move', text: '⠿' });
    handle.addEventListener('dragstart', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const grab = Math.max(0, Math.min(cfg.span - 1, Math.floor((e.clientX - rect.left) / gridMetrics().step)));
      widgetDrag = { id, grab };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.setDragImage(wrapper, e.clientX - rect.left, e.clientY - rect.top);
      setTimeout(() => { if (widgetDrag) $('layout').classList.add('dragging'); }, 0);
    });
    handle.addEventListener('dragend', endWidgetDrag);
    bar.append(handle, el('span', { class: 'wLabel', text: WIDGET_LABELS[id] }));

    if (id === 'clock') {
      bar.append(el('button', {
        type: 'button', class: 'wBtn', title: 'Show seconds', 'aria-pressed': String(!!settings.showSeconds), text: 'Seconds',
        onclick: () => { settings.showSeconds = !settings.showSeconds; saveSettings(); syncSettingsUI(); renderClock(); renderLayout(); }
      }));
    }
    if (id === 'clock' || id === 'date' || id === 'greeting' || id === 'links') {
      for (const [val, sym, name] of [['start', '⇤', 'Align left'], ['center', '↔', 'Centre'], ['end', '⇥', 'Align right']]) {
        bar.append(el('button', {
          type: 'button', class: 'wBtn', title: name, 'aria-label': name, 'aria-pressed': String(cfg.align === val), text: sym,
          onclick: () => { cfg.align = val; saveSettings(); renderLayout(); }
        }));
      }
    }
    if (id !== 'links') {
      bar.append(el('button', { type: 'button', class: 'wBtn remove', title: 'Remove ' + WIDGET_LABELS[id], 'aria-label': 'Remove ' + WIDGET_LABELS[id], text: '✕', onclick: () => setVisible(id, false) }));
    }
    return bar;
  }

  function makeResizeHandle(id, wrapper) {
    const rh = el('div', { class: 'resizeHandle', title: 'Drag to resize' });
    rh.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      rh.setPointerCapture(e.pointerId);
      const c = settings.layout[id];
      const startX = e.clientX;
      const startSpan = c.span;
      const { step } = gridMetrics();
      const move = (ev) => {
        let next = startSpan + Math.round((ev.clientX - startX) / step);
        next = Math.max(MIN_SPAN[id], Math.min(next, COLS - c.col + 1));
        while (next > c.span && !fits(id, c.col, c.row, next)) next--;
        if (next !== c.span) {
          c.span = next;
          wrapper.style.gridColumn = `${c.col} / span ${c.span}`;
        }
      };
      const up = () => {
        rh.removeEventListener('pointermove', move);
        rh.removeEventListener('pointerup', up);
        rh.removeEventListener('pointercancel', up);
        saveSettings();
        renderLayout();
      };
      rh.addEventListener('pointermove', move);
      rh.addEventListener('pointerup', up);
      rh.addEventListener('pointercancel', up);
    });
    return rh;
  }

  function renderEditBar() {
    const bar = $('editBar');
    bar.textContent = '';
    bar.hidden = !editing;
    if (!editing) return;
    bar.append(el('span', { class: 'editHint', text: 'Editing: drag ⠿ to move a widget, drag its right edge to resize. Everything snaps to a 12-column grid.' }));
    for (const id of WIDGET_IDS) {
      if (!isVisible(id)) bar.append(el('button', { type: 'button', class: 'btn ghost small', text: '+ ' + WIDGET_LABELS[id], onclick: () => setVisible(id, true) }));
    }
    bar.append(el('button', { type: 'button', class: 'btn ghost small', text: 'Reset layout', onclick: resetLayout }));
    bar.append(el('button', { type: 'button', class: 'btn small', text: 'Done', onclick: toggleEdit }));
  }

  function renderLayout() {
    const L = $('layout');
    L.classList.toggle('editing', editing);
    L.querySelectorAll('.cell, .wBar, .resizeHandle').forEach((n) => n.remove());

    // If turning something on (e.g. from Settings) would overlap another widget, move it to free space
    WIDGET_IDS.forEach((id, i) => {
      if (!isVisible(id)) return;
      if (WIDGET_IDS.slice(0, i).some((o) => isVisible(o) && overlap(settings.layout[id], settings.layout[o]))) {
        Object.assign(settings.layout[id], findSpot(id, settings.layout[id].span));
        saveSettings();
      }
    });

    let lastRow = 1;
    for (const id of WIDGET_IDS) {
      const w = L.querySelector(`[data-widget="${id}"]`);
      const cfg = settings.layout[id];
      const vis = isVisible(id);
      w.hidden = !vis;
      w.dataset.align = cfg.align;
      w.style.gridColumn = `${cfg.col} / span ${cfg.span}`;
      w.style.gridRow = String(cfg.row);
      w.style.order = String(cfg.row * 100 + cfg.col);
      if (vis) lastRow = Math.max(lastRow, cfg.row);
      if (editing && vis) w.append(makeBar(id, w), makeResizeHandle(id, w));
    }

    if (editing) {
      const rows = lastRow + 2;
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= COLS; c++) {
          const cell = el('div', { class: 'cell', dataset: { col: String(c), row: String(r) } });
          cell.style.gridColumn = String(c);
          cell.style.gridRow = String(r);
          cell.addEventListener('dragover', (e) => {
            if (!widgetDrag) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            showGhost(cell);
          });
          cell.addEventListener('drop', (e) => {
            if (!widgetDrag) return;
            e.preventDefault();
            const { id } = widgetDrag;
            const t = dropTarget(cell);
            endWidgetDrag();
            if (fits(id, t.col, t.row, t.span)) {
              Object.assign(settings.layout[id], { col: t.col, row: t.row });
              saveSettings();
            }
            renderLayout();
          });
          L.append(cell);
        }
      }
    }
    renderEditBar();
  }

  /* ---------- Init ---------- */
  async function init() {
    const [s, g, wc] = await Promise.all([store.get('settings'), store.get('groups'), store.get('weatherCache')]);
    if (s && s.layout && s.layout.clock && !s.layout.date) {
      // Older layout: date and greeting used to live inside the clock. Put them under it and shift what was below.
      const L = s.layout, c = L.clock;
      for (const k of Object.keys(L)) if (k !== 'clock' && L[k] && L[k].row > c.row) L[k].row += 2;
      L.date = { col: c.col, row: c.row + 1, span: c.span, align: c.align || 'start' };
      L.greeting = { col: c.col, row: c.row + 2, span: c.span, align: c.align || 'start' };
    }
    settings = deepMerge(DEFAULT_SETTINGS, s);
    sanitizeLayout();
    if (g) {
      groups = g;
    } else {
      groups = DEFAULT_GROUPS;
      saveGroups();
    }
    weatherCache = wc || null;

    populateEngines();
    populateFonts();
    bindSettings();
    syncSettingsUI();
    applyAppearance();
    renderClock();
    renderGroups();
    renderLayout();
    loadWeather();

    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateFx, 150); });
    document.addEventListener('visibilitychange', () => (document.hidden ? fxStop() : fxStart()));
    reduceMotion.addEventListener('change', updateFx);

    let lastPhase = phaseNow();
    setInterval(() => { if (settings.photoMode === 'none') return; applyBackground(); const p = phaseNow(); if (p !== lastPhase) { lastPhase = p; renderPhotoSlots(); } }, 60000);
    setInterval(renderClock, 1000);
    // Refresh weather every 15 minutes if the tab stays open.
    setInterval(() => loadWeather(), WEATHER_TTL);

    $('searchForm').addEventListener('submit', (e) => { e.preventDefault(); doSearch($('searchInput').value); });
    $('settingsBtn').addEventListener('click', () => ($('settings').hidden ? openSettings() : closeSettings()));
    $('closeSettings').addEventListener('click', closeSettings);
    $('editBtn').addEventListener('click', toggleEdit);

    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); $('searchInput').focus(); }
      if (e.key === 'Escape' && !$('settings').hidden) closeSettings();
      else if (e.key === 'Escape' && editing && !document.querySelector('dialog[open]')) toggleEdit();
    });
  }

  init();
})();
