const motionItems = [
  {
    "file": "08",
    "code": "ALARM",
    "name": "我想再睡五分钟",
    "lines": [
      "我想",
      "再睡五分钟"
    ],
    "alt": "企鹅豆躺在被窝里揉眼睛，转身伸手关闹钟",
    "description": "闹钟一响，我的手就先替我做了决定：关掉，再往被子里缩一缩。",
    "tag": "被窝再留会儿",
    "color": "#d5bdd0"
  },
  {
    "file": "09",
    "code": "WATER",
    "name": "我给绿植开小灶",
    "lines": [
      "我给",
      "绿植开小灶"
    ],
    "alt": "企鹅豆提着水壶给身旁的盆栽浇水",
    "description": "提上小水壶，给阳台上的绿植浇点水。照顾它们的时候，我也顺便放空一会儿。",
    "tag": "给绿植浇水",
    "color": "#b9ccb1"
  },
  {
    "file": "01",
    "code": "TABLET",
    "name": "我就想窝着看平板",
    "lines": [
      "我就想",
      "窝着看平板"
    ],
    "alt": "企鹅豆靠在床上的枕头上，双手拿着平板",
    "description": "把枕头垫好，找个舒服的姿势。今天的我，想在被窝里多待一会儿。",
    "tag": "我的独处时间",
    "color": "#bbbdd3"
  },
  {
    "file": "03",
    "code": "SNACK",
    "name": "我的快乐少不了薯片",
    "lines": [
      "我的快乐",
      "少不了薯片"
    ],
    "alt": "企鹅豆坐在被窝里看平板，把薯片送到嘴边",
    "description": "平板里放着喜欢的内容，手边是脆脆的薯片。对我来说，这就是舒服的休息时间。",
    "tag": "休息要配零食",
    "color": "#d4b28d"
  },
  {
    "file": "04",
    "code": "EAT",
    "name": "我最爱吃溏心蛋拌饭",
    "lines": [
      "我最爱吃",
      "溏心蛋拌饭"
    ],
    "alt": "企鹅豆坐在餐桌前，用筷子把碗里的食物夹到嘴边",
    "description": "戳开溏心蛋，把蛋黄拌进热乎乎的米饭里。吃到这一口，我就很满足。",
    "tag": "一碗就很满足",
    "color": "#d9c9a2"
  },
  {
    "file": "05",
    "code": "BATH",
    "name": "我想泡个澡慢慢放松",
    "lines": [
      "我想泡个澡",
      "慢慢放松"
    ],
    "alt": "企鹅豆头顶粉色毛巾，坐在粉色浴盆里泡澡，身旁漂着小黄鸭",
    "description": "把自己泡进热水里，让脑袋也歇一歇。今天剩下的时间，我想慢一点过。",
    "tag": "把疲惫泡走",
    "color": "#b9d2dd"
  }
];
let active = 0;
let requested = 0;
let requestVersion = 0;
const dots = document.querySelector('.carousel-dots');
const motionCard = document.querySelector('.work-card');
const imagePromises = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function loadMotionImage(item) {
  if (!imagePromises.has(item.file)) {
    const task = new Promise((resolve, reject) => {
      const image = new Image(240, 240);
      image.alt = item.alt;
      image.id = 'work-image';
      image.onload = async () => {
        try { await image.decode(); } catch { /* A loaded GIF is safe to display. */ }
        resolve(image);
      };
      image.onerror = () => { imagePromises.delete(item.file); reject(new Error('Image failed to load')); };
      image.src = `assets/motion-${item.file}.gif`;
    });
    imagePromises.set(item.file, task);
  }
  return imagePromises.get(item.file);
}
function renderMotion(index, image) {
  const item = motionItems[index];
  const oldImage = document.querySelector('#work-image');
  if (oldImage !== image) oldImage.replaceWith(image);
  image.alt = item.alt;
  document.querySelector('#work-code').textContent = item.code;
  const title = document.querySelector('#work-title');
  title.replaceChildren(document.createTextNode(item.lines[0]), document.createElement('br'), document.createTextNode(item.lines[1]));
  document.querySelector('#work-description').textContent = item.description;
  document.querySelector('#work-tag').textContent = item.tag;
  document.querySelector('#work-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(motionItems.length).padStart(2, '0')}`;
  const preview = document.querySelector('#motion-preview');
  preview.style.background = item.color;
  preview.setAttribute('aria-label', `查看${item.name}大图`);
  document.querySelector('#motion-status').textContent = '';
  [...dots.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  active = index;
}
async function showMotion(index) {
  requested = (index + motionItems.length) % motionItems.length;
  const next = requested;
  const version = ++requestVersion;
  motionCard.setAttribute('aria-busy', 'true');
  try {
    const image = await loadMotionImage(motionItems[next]);
    if (version !== requestVersion) return;
    renderMotion(next, image);
    if (!reducedMotion.matches) image.animate([{opacity: .25}, {opacity: 1}], {duration: 180});
  } catch {
    if (version === requestVersion) {
      requested = active;
      document.querySelector('#motion-status').textContent = '这张动图暂时没有加载成功，请再试一次。';
    }
  } finally {
    if (version === requestVersion) motionCard.setAttribute('aria-busy', 'false');
  }
}
motionItems.forEach((item, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', item.name);
  button.setAttribute('aria-pressed', String(index === 0));
  button.addEventListener('click', () => showMotion(index));
  dots.append(button);
});
renderMotion(0, document.querySelector('#work-image'));
document.querySelector('.previous').addEventListener('click', () => showMotion(requested - 1));
document.querySelector('.next').addEventListener('click', () => showMotion(requested + 1));
// Preload the original GIFs; each switch commits its image and copy together.
// Fetch other animations only when selected; the first visit should not
// download every GIF in the carousel.
const dialog = document.querySelector('#sticker-dialog');
function openSticker(src, name, kind, alt) {
  document.querySelector('#dialog-image').src = src;
  document.querySelector('#dialog-image').alt = alt || name;
  document.querySelector('#dialog-title').textContent = name;
  document.querySelector('#dialog-kind').textContent = kind;
  const link = document.querySelector('#dialog-download');
  link.href = src;
  link.download = `小猪盖被-${name}.${src.split('.').pop()}`;
  dialog.showModal();
}
function openMotion() {
  const item = motionItems[active];
  openSticker(`assets/motion-${item.file}.gif`, item.name, '小猪盖被 / 企鹅豆 · 动态表情', item.alt);
}
document.querySelector('#view-motion').addEventListener('click', openMotion);
document.querySelector('#motion-preview').addEventListener('click', openMotion);
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }
});
// Background colors are a local preference; source character colors are preserved.
const colorToggle = document.querySelector('#color-toggle');
const colorPanel = document.querySelector('#color-panel');
const colorControls = document.querySelector('.color-controls');
const colorHex = document.querySelector('#background-hex');
const colorPicker = document.querySelector('#background-picker');
const colorError = document.querySelector('#color-error');
const colorSwatches = [...document.querySelectorAll('.color-swatch')];
const colorStorageKey = 'penguindou.background';
const defaultBackground = '#313ff4';

function colorLuminance(rgb) {
  return rgb.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
}
function mixColor(rgb, target, amount) {
  return '#' + rgb.map(value => Math.round(value + (target - value) * amount).toString(16).padStart(2, '0')).join('');
}
function applyBackground(value, save = true) {
  const color = value.toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) return false;
  const preset = colorSwatches.find(button => button.dataset.color === color);
  const rgb = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  const luminance = colorLuminance(rgb);
  const darkBackground = luminance < 0.18;
  const sceneInk = darkBackground ? '#f4f2e8' : '#090a0c';
  const cloud = color === defaultBackground ? '#6671ff' : mixColor(rgb, luminance > 0.68 ? 0 : 255, luminance > 0.68 ? 0.14 : 0.25);
  document.body.style.setProperty('--chosen-background', color);
  document.body.style.setProperty('--chosen-cloud', cloud);
  document.body.style.setProperty('--chosen-ink', sceneInk);
  document.body.style.setProperty('--chosen-title', luminance > 0.68 ? mixColor(rgb, 0, 0.25) : '#f1eedc');
  document.body.style.setProperty('--chosen-accent', darkBackground ? mixColor(rgb, 255, 0.7) : color);
  document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]').content = color;
  colorPicker.value = color;
  colorHex.value = color.toUpperCase();
  colorHex.removeAttribute('aria-invalid');
  colorError.textContent = '';
  colorSwatches.forEach(button => button.setAttribute('aria-pressed', String(button === preset)));
  document.querySelector('#color-status').textContent = `当前：${preset ? preset.dataset.name : color.toUpperCase()}`;
  if (save) {
    try { localStorage.setItem(colorStorageKey, color); } catch { /* Colors work even when storage is unavailable. */ }
  }
  return true;
}
function setColorPanel(open, returnFocus = false) {
  colorPanel.hidden = !open;
  colorToggle.setAttribute('aria-expanded', String(open));
  if (open) (colorPanel.querySelector('[aria-pressed="true"]') || colorHex).focus({preventScroll: true});
  else if (returnFocus) colorToggle.focus({preventScroll: true});
}
colorToggle.addEventListener('click', () => setColorPanel(colorPanel.hidden));
document.querySelector('#color-close').addEventListener('click', () => setColorPanel(false, true));
colorSwatches.forEach(button => button.addEventListener('click', () => applyBackground(button.dataset.color)));
colorPicker.addEventListener('input', () => applyBackground(colorPicker.value));
document.querySelector('#custom-color-form').addEventListener('submit', event => {
  event.preventDefault();
  let value = colorHex.value.trim();
  if (!value.startsWith('#')) value = '#' + value;
  if (!applyBackground(value)) {
    colorHex.setAttribute('aria-invalid', 'true');
    colorError.textContent = '请输入 6 位颜色代码，例如 #A8D8FF。';
    colorHex.focus();
  }
});
document.querySelector('#color-reset').addEventListener('click', () => applyBackground(defaultBackground));
document.addEventListener('click', event => {
  if (!colorPanel.hidden && !colorControls.contains(event.target)) setColorPanel(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !colorPanel.hidden) { event.preventDefault(); setColorPanel(false, true); }
});
try { applyBackground(localStorage.getItem(colorStorageKey) || defaultBackground, false); }
catch { applyBackground(defaultBackground, false); }

// Ease toward the scroll position, then stop rendering when the scenery settles.
const scenes = [...document.querySelectorAll('.hero, .daily, .moods, .about, .closing')];
const hero = scenes[0];
const compactViewport = matchMedia('(max-width: 700px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const visibleScenes = new Set(scenes);
const scenePositions = new Map(scenes.map(section => [section, {current: 0, target: 0, ready: false}]));
let sceneFrame = 0;
let lastSceneTime = 0;
let measureScenes = true;
let pointerX = 0;
let pointerY = 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function paintScenes(time) {
  sceneFrame = 0;
  if (reducedMotion.matches || document.hidden) return;
  const viewportHeight = window.innerHeight;
  const strength = compactViewport.matches ? 0.58 : 1;
  const delta = lastSceneTime ? Math.min(time - lastSceneTime, 64) : 16;
  const easing = 1 - Math.exp(-delta / 145);
  lastSceneTime = time;
  if (measureScenes) {
    // Finish layout reads before writing styles; easing frames reuse these targets.
    const measurements = [...visibleScenes].map(section => ({section, rect: section.getBoundingClientRect()}));
    measurements.forEach(({section, rect}) => {
      const state = scenePositions.get(section);
      state.target = clamp((viewportHeight / 2 - rect.top - rect.height / 2) / ((viewportHeight + rect.height) / 2), -1, 1);
      if (!state.ready) { state.current = state.target; state.ready = true; }
    });
    measureScenes = false;
  }
  let settling = false;
  visibleScenes.forEach(section => {
    const state = scenePositions.get(section);
    const difference = state.target - state.current;
    if (Math.abs(difference) > 0.0005) {
      state.current += difference * easing;
      settling = true;
    } else state.current = state.target;
    const progress = state.current * strength;
    section.style.setProperty('--travel', `${(progress * 900).toFixed(2)}px`);
    section.style.setProperty('--turn', `${(progress * 190).toFixed(2)}deg`);
    section.style.setProperty('--tilt', `${(progress * 38).toFixed(2)}deg`);
    section.style.setProperty('--dolly', `${(progress * 360).toFixed(2)}px`);
    section.style.setProperty('--scene-zoom', (1 + Math.abs(progress) * 0.16).toFixed(4));
    section.style.setProperty('--figure-zoom', (1 + Math.abs(progress) * 0.09).toFixed(4));
    section.style.setProperty('--scene-light', (0.9 + (1 - Math.abs(state.current)) * 0.13).toFixed(3));
  });
  hero.style.setProperty('--px', pointerX.toFixed(2));
  hero.style.setProperty('--py', pointerY.toFixed(2));
  if (settling) sceneFrame = requestAnimationFrame(paintScenes);
  else lastSceneTime = 0;
}
function queueScenes() {
  measureScenes = true;
  if (!sceneFrame && !reducedMotion.matches && !document.hidden) sceneFrame = requestAnimationFrame(paintScenes);
}
const sceneObserver = new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
    if (isIntersecting) visibleScenes.add(target);
    else { visibleScenes.delete(target); scenePositions.get(target).ready = false; }
    target.classList.toggle('scene-visible', isIntersecting);
  });
  queueScenes();
}, {rootMargin: '160px 0px'});
scenes.forEach(section => sceneObserver.observe(section));

function syncMotionPreference() {
  cancelAnimationFrame(sceneFrame);
  sceneFrame = 0;
  lastSceneTime = 0;
  document.documentElement.dataset.sceneMotion = reducedMotion.matches ? 'reduced' : 'enabled';
  scenes.forEach(section => {
    ['--travel', '--turn', '--tilt', '--dolly', '--scene-light', '--scene-zoom', '--figure-zoom'].forEach(property => section.style.removeProperty(property));
    scenePositions.get(section).ready = false;
  });
  pointerX = pointerY = 0;
  hero.style.setProperty('--px', 0);
  hero.style.setProperty('--py', 0);
  queueScenes();
}
hero.addEventListener('pointermove', event => {
  if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
  const rect = hero.getBoundingClientRect();
  pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
  pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
  queueScenes();
});
hero.addEventListener('pointerleave', () => { pointerX = pointerY = 0; queueScenes(); });
window.addEventListener('scroll', queueScenes, {passive: true});
window.addEventListener('resize', queueScenes, {passive: true});
window.addEventListener('pageshow', queueScenes);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(sceneFrame); sceneFrame = 0; lastSceneTime = 0; }
  else queueScenes();
});
compactViewport.addEventListener('change', queueScenes);
reducedMotion.addEventListener('change', syncMotionPreference);
syncMotionPreference();

// The personal portfolio owns each collection; every image comes from the archive.
const collectionGrid = document.querySelector('#collection-grid');
const stickerGrid = document.querySelector('#sticker-grid');
const seriesSelect = document.querySelector('#series-select');
const categoryButtons = [...document.querySelectorAll('[data-category]')];
let selectedSeries = stickerCollections[0];
let selectedCategory = '角色 IP';

function createImage(item, alt, lazy = true) {
  const img = document.createElement('img');
  img.src = item.src;
  img.alt = alt;
  img.width = item.width || 240;
  img.height = item.height || 240;
  img.decoding = 'async';
  if (lazy) img.loading = 'lazy';
  if (item.animated) img.classList.add('original-motion');
  return img;
}
function renderCollections() {
  const visible = stickerCollections.filter(series => selectedCategory === '全部' || series.kind === selectedCategory);
  const fragment = document.createDocumentFragment();
  visible.forEach(series => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'collection-card';
    button.dataset.series = series.id;
    button.style.setProperty('--tile', series.color);
    button.setAttribute('aria-pressed', String(series === selectedSeries));
    button.setAttribute('aria-label', `展开${series.name}系列，${series.items.length}张表情`);
    const art = document.createElement('div');
    art.className = 'collection-art';
    const item = series.items.find(item => item.src === series.cover) || series.items[0];
    art.append(createImage({...item, src: series.cover}, ''));
    const number = document.createElement('span');
    number.className = 'collection-number';
    number.textContent = String(stickerCollections.indexOf(series) + 1).padStart(2, '0');
    art.append(number);
    if (series.id === 'penguin') {
      const badge = document.createElement('span');
      badge.className = 'collection-featured';
      badge.textContent = '主推';
      art.append(badge);
    }
    const meta = document.createElement('div');
    meta.className = 'collection-meta';
    const title = document.createElement('h3');
    title.textContent = series.name;
    const count = document.createElement('span');
    count.textContent = `${String(series.items.length).padStart(2, '0')} 张表情`;
    const arrow = document.createElement('b');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    meta.append(title, count, arrow);
    button.append(art, meta);
    button.addEventListener('click', () => selectSeries(series.id, true));
    fragment.append(button);
  });
  collectionGrid.replaceChildren(fragment);
  document.querySelector('#collection-status').textContent = `${visible.length} 个系列`;
  categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === selectedCategory)));
  queueScenes();
}
function selectSeries(id, scroll = false) {
  const series = stickerCollections.find(series => series.id === id);
  if (!series) return;
  selectedSeries = series;
  seriesSelect.value = series.id;
  document.querySelector('#library-title').textContent = series.name;
  document.querySelector('#library-description').textContent = series.description;
  document.querySelector('#library-category').textContent = `${series.kind} / 小猪盖被`;
  document.querySelector('#library-count').textContent = `${series.items.length} 张表情`;
  const cover = document.querySelector('#library-cover');
  cover.src = series.cover;
  cover.alt = '';
  const fragment = document.createDocumentFragment();
  series.items.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'library-sticker';
    button.setAttribute('aria-label', `查看${series.name}：${item.name}`);
    const art = document.createElement('div');
    art.className = 'library-sticker-art';
    art.append(createImage(item, `${series.name}：${item.name}`));
    const badge = document.createElement('small');
    badge.textContent = item.animated ? 'GIF' : String(index + 1).padStart(2, '0');
    art.append(badge);
    const label = document.createElement('span');
    label.className = 'library-sticker-name';
    label.textContent = item.name;
    button.append(art, label);
    button.addEventListener('click', () => openSticker(item.src, item.name, `小猪盖被 / ${series.name} · ${item.animated ? '动态' : '静态'}表情`, `${series.name}：${item.name}`));
    fragment.append(button);
  });
  stickerGrid.replaceChildren(fragment);
  const seriesLink = document.querySelector('#series-page-link') || document.createElement('a');
  seriesLink.id = 'series-page-link';
  seriesLink.href = '/works/' + series.id + '/';
  seriesLink.textContent = '查看 ' + series.name + ' 的介绍与创作手记 ↗';
  seriesLink.className = 'series-page-link';
  document.querySelector('#sticker-library').append(seriesLink);
  document.querySelectorAll('.collection-card').forEach(card => card.setAttribute('aria-pressed', String(card.dataset.series === series.id)));
  queueScenes();
  if (scroll) {
    document.querySelector('#sticker-library').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
    // Focus the series selector without moving again so keyboard users can continue browsing.
    seriesSelect.focus({preventScroll: true});
  }
}
stickerCollections.forEach(series => {
  const option = document.createElement('option');
  option.value = series.id;
  option.textContent = `${series.name} · ${series.items.length} 张`;
  seriesSelect.append(option);
});
seriesSelect.addEventListener('change', () => selectSeries(seriesSelect.value));
categoryButtons.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.category;
  renderCollections();
}));
document.querySelectorAll('[data-collection]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  selectSeries(link.dataset.collection, true);
}));
renderCollections();
selectSeries(selectedSeries.id);
