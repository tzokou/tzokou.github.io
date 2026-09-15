(() => {
  const setLanguage = lang => {
    lang = lang === 'en' ? 'en' : 'fr';
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-fr').forEach(el => el.hidden = lang !== 'fr');
    document.querySelectorAll('.lang-en').forEach(el => el.hidden = lang !== 'en');
    ['fr','en'].forEach(l => document.getElementById('btn-'+l).setAttribute('aria-pressed',String(l === lang)));
    document.title = lang === 'fr' ? 'Thierry Zokou | Analyste de données junior · Finance & BI' : 'Thierry Zokou | Junior Data Analyst · Finance & BI';
    try { localStorage.setItem('portfolio-lang',lang); } catch (_) {}
  };
  ['fr','en'].forEach(l => document.getElementById('btn-'+l).addEventListener('click',() => setLanguage(l)));
  let saved = 'fr'; try { saved = localStorage.getItem('portfolio-lang') || 'fr'; } catch (_) {}
  setLanguage(saved);
})();