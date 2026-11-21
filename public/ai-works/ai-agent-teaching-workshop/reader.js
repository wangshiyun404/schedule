'use strict';
(() => {
  const data = window.WORKSHOP_SLIDES;
  if (!data || !data.slides.length) return;
  const {slides} = data;
  const byId = id => document.getElementById(id);
  const image = byId('slide'), caption = byId('caption'), field = byId('page');
  const prev = byId('prev'), next = byId('next'), full = byId('full');
  const viewer = byId('viewer'), resources = byId('resources'), hotspots = byId('hotspots'), links = [];
  let current = 0, touch = null;
  document.documentElement.style.setProperty('--slide-ratio', data.width + '/' + data.height);
  field.max = slides.length;
  byId('total').textContent = '/ ' + slides.length;
  const hash = n => '#slide-' + n;
  const readHash = () => +(location.hash.match(/^#slide-(\d+)$/)?.[1] || 1);
  function resourceLink(url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }
  function render(n, update=false) {
    current = Math.max(1, Math.min(slides.length, Math.trunc(n) || 1));
    const entry = slides[current - 1];
    const label = '第 ' + current + ' 页' + (entry.title ? '：' + entry.title : '');
    image.alt = label; image.src = entry.src; caption.textContent = label;
    resources.replaceChildren();
    hotspots.replaceChildren();
    resources.hidden = !entry.links?.length;
    if (!resources.hidden) {
      const lead = document.createElement('span'); lead.textContent = '本页链接：'; resources.append(lead);
      entry.links.forEach(({label,url,rects = []}) => {
        const a = resourceLink(url); a.textContent = label; resources.append(a);
        rects.forEach(([x,y,w,h], i) => {
          const hotspot = resourceLink(url);
          hotspot.className = 'hotspot';
          hotspot.title = label;
          hotspot.setAttribute('aria-label', label);
          if (i) {hotspot.tabIndex = -1; hotspot.setAttribute('aria-hidden','true');}
          Object.assign(hotspot.style, {left:x*100+'%',top:y*100+'%',width:w*100+'%',height:h*100+'%'});
          hotspots.append(hotspot);
        });
      });
    }
    field.value = current; prev.disabled = current === 1; next.disabled = current === slides.length;
    links.forEach((link, i) => i === current - 1 ? link.setAttribute('aria-current','page') : link.removeAttribute('aria-current'));
    if (update && location.hash !== hash(current)) history.pushState(null,'',hash(current));
    if (current < slides.length) (new Image()).src = slides[current].src;
  }
  slides.forEach((entry,i) => {
    const link = document.createElement('a');
    link.href = hash(i+1); link.textContent = i+1;
    link.title = '第 ' + (i+1) + ' 页' + (entry.title ? '：' + entry.title : '');
    link.setAttribute('aria-label',link.title);
    link.addEventListener('click', e => {e.preventDefault();render(i+1,true);});
    byId('pages').append(link); links.push(link);
  });
  prev.addEventListener('click', () => render(current-1,true));
  next.addEventListener('click', () => render(current+1,true));
  byId('jump').addEventListener('submit', e => {e.preventDefault();render(+field.value,true);});
  window.addEventListener('hashchange', () => render(readHash()));
  const toggleFull = (on) => {document.body.classList.toggle('present', on);full.textContent = on ? '退出全屏' : '全屏';full.setAttribute('aria-pressed',String(on));};
  full.setAttribute('aria-pressed','false');
  full.addEventListener('click', () => toggleFull(!document.body.classList.contains('present')));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('present')) {toggleFull(false);return;}
    if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
    const chosen = {ArrowLeft:current-1, ArrowRight:current+1, Home:1, End:slides.length}[e.key];
    if (typeof chosen === 'number') {e.preventDefault();render(chosen,true);}
  });
  viewer.addEventListener('touchstart', e => {touch = e.touches.length === 1 ? [e.touches[0].clientX,e.touches[0].clientY] : null;}, {passive:true});
  viewer.addEventListener('touchmove', e => {if (e.touches.length !== 1) touch = null;}, {passive:true});
  viewer.addEventListener('touchend', e => {
    if (!touch) return;
    const point = e.changedTouches[0], dx = point.clientX - touch[0], dy = point.clientY - touch[1];
    touch = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)*1.4) render(current+(dx<0?1:-1),true);
  }, {passive:true});
  viewer.addEventListener('touchcancel', () => {touch=null;}, {passive:true});
  render(readHash());
})();
