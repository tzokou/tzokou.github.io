/* GA4 basic consent mode: the Google tag loads only after an explicit opt-in.
 * https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
 */
(() => {
  'use strict';
  const measurementId = 'G-2VJZGSH2KF';
  const consentKey = 'portfolio.analyticsConsent.v1';
  const consentLifetime = 180 * 24 * 60 * 60 * 1000;
  const disableKey = 'ga-disable-' + measurementId;
  const denied = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
  let loaded = false;
  let returnFocus = null;

  function savedChoice() {
    try {
      const stored = JSON.parse(localStorage.getItem(consentKey));
      if (stored && ['granted', 'denied'].includes(stored.value) &&
          Number.isFinite(stored.expires) && stored.expires > Date.now()) {
        return stored.value;
      }
    } catch (_) {}
    return null;
  }

  let choice = savedChoice();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window[disableKey] = choice !== 'granted';
  window.gtag('consent', 'default', denied);

  function clearAnalyticsCookies() {
    const domain = location.hostname;
    for (const item of document.cookie.split(';')) {
      const name = item.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      for (const suffix of ['', '; domain=' + domain, '; domain=.' + domain]) {
        document.cookie = name + '=; Max-Age=0; path=/' + suffix + '; SameSite=Lax; Secure';
      }
    }
  }

  // Keep ordinary UTM attribution, without forwarding arbitrary query strings.
  function measurementUrl() {
    const current = new URL(location.href);
    const clean = new URL(current.origin + current.pathname);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']) {
      const value = current.searchParams.get(key);
      if (value && /^[a-z0-9_.~ -]{1,100}$/i.test(value)) clean.searchParams.set(key, value);
    }
    return clean.href;
  }

  function enableAnalytics() {
    window[disableKey] = false;
    window.gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    let referrer = '';
    try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch (_) {}
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: location.hostname,
      cookie_path: '/',
      cookie_expires: consentLifetime / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      page_location: measurementUrl(),
      page_referrer: referrer
    });
    const tag = document.createElement('script');
    tag.id = 'portfolio-google-tag';
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
  }

  function applyChoice() {
    document.documentElement.dataset.analyticsConsent = choice || 'pending';
    if (choice === 'granted') {
      enableAnalytics();
    } else {
      // The disable flag stops collection, including after a previous opt-in.
      window[disableKey] = true;
      window.gtag('consent', 'update', denied);
      clearAnalyticsCookies();
    }
  }

  const banner = document.createElement('aside');
  banner.className = 'analytics-consent';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-labelledby', 'analytics-consent-title');
  const title = document.createElement('h2');
  title.id = 'analytics-consent-title';
  const description = document.createElement('p');
  const more = document.createElement('a');
  more.href = 'privacy.html';
  const actions = document.createElement('div');
  actions.className = 'analytics-consent-actions';
  const reject = document.createElement('button');
  const accept = document.createElement('button');
  for (const button of [reject, accept]) {
    button.type = 'button';
    button.className = 'button';
  }
  actions.append(reject, accept, more);
  banner.append(title, description, actions);
  banner.hidden = !!choice;
  document.body.appendChild(banner);

  function updateCopy() {
    const english = document.documentElement.lang === 'en';
    title.textContent = english ? 'Audience measurement' : 'Mesure d’audience';
    description.textContent = english
      ? 'With your permission, Google Analytics measures visits and project clicks to improve this portfolio. You can refuse and browse normally, or change your choice in the footer.'
      : 'Avec votre accord, Google Analytics mesure les visites et les clics sur les projets pour améliorer ce portfolio. Vous pouvez refuser et naviguer normalement, ou modifier votre choix en pied de page.';
    reject.textContent = english ? 'Refuse' : 'Refuser';
    accept.textContent = english ? 'Accept' : 'Accepter';
    more.textContent = english ? 'Privacy notice' : 'Confidentialité';
  }

  function choose(value) {
    choice = value;
    try {
      localStorage.setItem(consentKey, JSON.stringify({
        value, expires: Date.now() + consentLifetime
      }));
    } catch (_) {}
    applyChoice();
    banner.hidden = true;
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    returnFocus = null;
  }

  reject.addEventListener('click', () => choose('denied'));
  accept.addEventListener('click', () => choose('granted'));
  for (const button of document.querySelectorAll('[data-analytics-settings]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      returnFocus = button;
      banner.hidden = false;
      updateCopy();
      reject.focus({ preventScroll: true });
    });
  }
  // Only an event name and contact method are sent, never a visitor's message.
  document.addEventListener('click', event => {
    if (choice !== 'granted' || !(event.target instanceof Element)) return;
    if (event.target.closest('a[href^="mailto:"]')) {
      window.gtag('event', 'contact_click', { method: 'email' });
    }
  });
  window.addEventListener('storage', event => {
    if (event.key !== consentKey && event.key !== null) return;
    choice = savedChoice();
    applyChoice();
    banner.hidden = !!choice;
  });
  new MutationObserver(updateCopy).observe(document.documentElement, {
    attributes: true, attributeFilter: ['lang']
  });
  updateCopy();
  applyChoice();
})();

