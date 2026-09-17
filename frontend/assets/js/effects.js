// Mobile nav, scroll reveal, scroll progress bar, text-scramble hover,
// dual cursor and the twin mascot's eye tracking.
  // nav mobile
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:0.15});
  revealEls.forEach(el => io.observe(el));

  // ---------- scroll progress bar ----------
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress(){
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
  }
  window.addEventListener('scroll', updateScrollProgress);
  updateScrollProgress();

  // ---------- text scramble / decode on hover ----------
  const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#01";
  function scrambleEl(el){
    if(el._scrambling) return;
    const original = el.dataset.scrambleText || el.textContent;
    el.dataset.scrambleText = original;
    el._scrambling = true;
    let iteration = 0;
    clearInterval(el._scrambleTimer);
    el._scrambleTimer = setInterval(() => {
      el.textContent = original.split('').map((letter, index) => {
        if(letter === ' ') return ' ';
        if(index < iteration) return original[index];
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      if(iteration >= original.length){
        clearInterval(el._scrambleTimer);
        el._scrambling = false;
      }
      iteration += 1;
    }, 28);
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    document.querySelectorAll('.scramble').forEach(el => {
      el.addEventListener('mouseenter', () => scrambleEl(el));
    });
  }

  // ---------- twin cursor (dual cursor) ----------
  const twinCursor = document.getElementById('twinCursor');
  const isTouch = window.matchMedia('(hover:none), (pointer:coarse)').matches;
  if(!isTouch){
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0, cursorVisible = false;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if(!cursorVisible){ twinCursor.classList.add('active'); cursorVisible = true; }
    });
    document.addEventListener('mouseleave', () => twinCursor.classList.remove('active'));
    document.querySelectorAll('a, button, .qchip, .lang-btn').forEach(el => {
      el.addEventListener('mouseenter', () => twinCursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => twinCursor.classList.remove('hovering'));
    });
    function animateTwinCursor(){
      const ease = reduceMotion ? 1 : 0.16;
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;
      twinCursor.style.left = curX + 'px';
      twinCursor.style.top = curY + 'px';
      requestAnimationFrame(animateTwinCursor);
    }
    animateTwinCursor();
  }

  // ---------- mascot: eyes follow cursor ----------
  const twinFace = document.getElementById('twinFace');
  const pupilL = document.getElementById('pupilL');
  const pupilR = document.getElementById('pupilR');
  if(twinFace && !isTouch){
    window.addEventListener('mousemove', (e) => {
      const rect = twinFace.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
      const dist = Math.min(2, Math.hypot(e.clientX - cx, e.clientY - cy) / 60);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      pupilL.setAttribute('cx', 17 + dx);
      pupilL.setAttribute('cy', 24 + dy);
      pupilR.setAttribute('cx', 35 + dx);
      pupilR.setAttribute('cy', 24 + dy);
    });
  }
