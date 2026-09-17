// Toggle PT-BR / EN. PT-BR is the default language.
  // language toggle
  const langBtns = document.querySelectorAll('.lang-btn');
  function setLang(lang){
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-pt-html]').forEach(el => {
      el.innerHTML = lang === 'pt' ? el.dataset.ptHtml : el.dataset.enHtml;
    });
    langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  }
  langBtns.forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
