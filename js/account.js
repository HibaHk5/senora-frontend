/**
 * SENORA — Customer accounts (demo)
 *
 * This is a front-end only demonstration. There is no server, so:
 *   - Passwords are validated for format and then DISCARDED. They are never
 *     stored, logged or checked later.
 *   - The "account" lives in this browser's localStorage (key
 *     "senora_account_v1") and holds the profile, saved address and order
 *     history for this device only.
 *
 * For a real shop, replace the functions marked  // BACKEND  with calls to a
 * real authentication service (Firebase Auth, Supabase, Shopify customer
 * accounts, etc.). The UI, events and page logic can stay as they are.
 */
(function () {
  'use strict';

  var KEY = 'senora_account_v1';
  var CART_KEY = 'senora_state_v1';

  /* ------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }
  function money(n) { return 'PKR ' + (Number(n) || 0).toLocaleString('en-PK'); }
  function el(tag, props, children) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  var toastTimer = null;
  function toast(msg) {
    // On shop pages reuse the site toast (it renders HTML, so escape first)
    if (typeof showToast === 'function' && document.getElementById('toastContainer')) { showToast(esc(msg)); return; }
    var t = document.getElementById('coToast') || document.getElementById('acctToast');
    if (!t) { t = el('div', { id: 'acctToast', class: 'co-toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }

  /* ------------------------------------------------------------------
     Storage
     ------------------------------------------------------------------ */
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function write(data) {
    try {
      if (data) localStorage.setItem(KEY, JSON.stringify(data)); else localStorage.removeItem(KEY);
    } catch (e) { /* memory only */ }
    memory = data;
  }
  var memory = read();
  function store() { return memory || read(); }

  function clip(v, max) { return typeof v === 'string' ? v.trim().slice(0, max || 120) : ''; }

  function emitAuth() {
    updateHeader();
    try { window.dispatchEvent(new CustomEvent('senora:auth', { detail: { signedIn: api.isSignedIn() } })); } catch (e) { /* old browser */ }
  }

  /* ------------------------------------------------------------------
     Public API
     ------------------------------------------------------------------ */
  var api = {
    isSignedIn: function () { var s = store(); return !!(s && s.signedIn && s.profile && s.profile.email); },
    getProfile: function () { var s = store(); return s && s.profile ? s.profile : null; },
    getOrders: function () { var s = store(); return s && Array.isArray(s.orders) ? s.orders : []; },

    // BACKEND: create the account on your server and sign the customer in.
    createAccount: function (data) {
      var existing = store();
      var email = clip(data.email, 120).toLowerCase();
      if (existing && existing.profile && existing.profile.email === email) return { ok: false, error: 'exists' };
      write({
        signedIn: true,
        createdAt: new Date().toISOString(),
        profile: {
          name: clip(data.name, 80), email: email, phone: clip(data.phone, 30),
          address: clip(data.address, 160), address2: clip(data.address2, 120),
          city: clip(data.city, 60), postal: clip(data.postal, 12), height: clip(data.height, 20),
          newsletter: !!data.newsletter
        },
        orders: Array.isArray(data.orders) ? data.orders : []
      });
      emitAuth();
      return { ok: true };
    },

    // BACKEND: verify email + password on your server. Here we only check that
    // an account for this email exists on this device; the password is ignored.
    signIn: function (email) {
      var s = store();
      if (!s || !s.profile || s.profile.email !== clip(email, 120).toLowerCase()) return { ok: false, error: 'not-found' };
      s.signedIn = true;
      write(s);
      emitAuth();
      return { ok: true };
    },

    signOut: function () {
      var s = store();
      if (s) { s.signedIn = false; write(s); }
      emitAuth();
    },

    updateProfile: function (patch) {
      var s = store();
      if (!s || !s.profile) return false;
      ['name', 'phone', 'address', 'address2', 'city', 'postal', 'height'].forEach(function (k) {
        if (typeof patch[k] === 'string') s.profile[k] = clip(patch[k], k === 'address' ? 160 : 120);
      });
      if (typeof patch.newsletter === 'boolean') s.profile.newsletter = patch.newsletter;
      write(s);
      emitAuth();
      return true;
    },

    addOrder: function (order) {
      var s = store();
      if (!s || !s.signedIn) return false;
      s.orders = (s.orders || []).filter(function (o) { return o.id !== order.id; });
      s.orders.unshift(order);
      s.orders = s.orders.slice(0, 50);
      write(s);
      return true;
    },

    deleteAccount: function () { write(null); emitAuth(); },
    open: function (view) { openModal(view || 'signin'); },
    close: function () { closeModal(); }
  };
  window.SenoraAccount = api;

  /* ------------------------------------------------------------------
     Header button + signed-in menu
     ------------------------------------------------------------------ */
  var menu = null;
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open');
    var b = document.querySelector('[data-account-btn]');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function updateHeader() {
    var signedIn = api.isSignedIn();
    var p = api.getProfile();
    document.querySelectorAll('[data-account-btn]').forEach(function (b) {
      var initial = b.querySelector('.acct-initial');
      var icon = b.querySelector('svg');
      if (signedIn && p) {
        b.setAttribute('aria-label', 'Account menu for ' + p.name);
        b.setAttribute('title', 'My account');
        b.setAttribute('aria-haspopup', 'menu');
        if (initial) { initial.textContent = (p.name || p.email).charAt(0).toUpperCase(); initial.hidden = false; }
        if (icon) icon.style.display = 'none';
      } else {
        b.setAttribute('aria-label', 'Sign in or create an account');
        b.setAttribute('title', 'Account');
        b.setAttribute('aria-haspopup', 'dialog');
        if (initial) initial.hidden = true;
        if (icon) icon.style.display = '';
      }
    });
    document.querySelectorAll('[data-account-label]').forEach(function (a) {
      a.textContent = signedIn && p ? 'My Account (' + (p.name.split(' ')[0] || 'you') + ')' : 'Sign In / Create Account';
    });
    if (menu) {
      var hello = menu.querySelector('.acct-menu-hello');
      if (hello) hello.textContent = p ? 'Hello, ' + p.name.split(' ')[0] : '';
    }
    if (!signedIn) closeMenu();
  }

  function buildMenu() {
    menu = el('div', { class: 'acct-menu', role: 'menu', 'aria-label': 'Account menu' }, [
      el('span', { class: 'acct-menu-hello' }),
      el('a', { href: 'account.html#orders', role: 'menuitem', text: 'Orders' }),
      el('a', { href: 'account.html#details', role: 'menuitem', text: 'Details & address' }),
      el('a', { href: 'account.html#wishlist', role: 'menuitem', text: 'Wishlist' }),
      el('button', { type: 'button', role: 'menuitem', class: 'acct-menu-out', text: 'Sign out' })
    ]);
    document.body.appendChild(menu);
    menu.querySelector('.acct-menu-out').addEventListener('click', function () {
      api.signOut(); closeMenu(); toast('You have been signed out.');
      if (document.getElementById('acctPage')) renderAccountPage();
    });
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(e.target) || e.target.closest('[data-account-btn]')) return;
      closeMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  function toggleMenu(btn) {
    if (!menu) buildMenu();
    var open = !menu.classList.contains('is-open');
    if (open) {
      var r = btn.getBoundingClientRect();
      menu.style.top = (r.bottom + 10) + 'px';
      menu.style.right = Math.max(8, window.innerWidth - r.right - 8) + 'px';
      updateHeader();
    }
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-account-btn]');
    if (btn) {
      e.preventDefault();
      if (api.isSignedIn()) toggleMenu(btn); else openModal('signin');
      return;
    }
    var opener = e.target.closest('[data-account-open]');
    if (opener) {
      e.preventDefault();
      var v = opener.getAttribute('data-account-open');
      if (v === 'auto') { if (api.isSignedIn()) window.location.href = 'account.html'; else openModal('signin'); }
      else openModal(v);
    }
  });

  /* ------------------------------------------------------------------
     Modal
     ------------------------------------------------------------------ */
  var modal = null, backdrop = null, lastFocus = null, currentView = 'signin';

  var TEMPLATE =
    '<button type="button" class="acct-close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '<div class="acct-brand"><span>SENORA</span><small>MODEST ATELIER</small></div>' +
    '<div class="acct-tabs" role="tablist" aria-label="Account">' +
      '<button type="button" role="tab" id="tabSignin" data-tab="signin" aria-controls="viewSignin">Sign in</button>' +
      '<button type="button" role="tab" id="tabCreate" data-tab="create" aria-controls="viewCreate">Create account</button>' +
    '</div>' +

    '<section data-view="signin" id="viewSignin" role="tabpanel" aria-labelledby="tabSignin">' +
      '<h2 class="acct-title" id="titleSignin">Welcome <em>back</em></h2>' +
      '<p class="acct-sub">Sign in to see your orders, saved address and wishlist.</p>' +
      '<form id="acctSigninForm" novalidate>' +
        '<div class="co-field"><label for="siEmail">Email address</label><input type="email" id="siEmail" autocomplete="email" inputmode="email" aria-describedby="err-siEmail"><p class="co-error" id="err-siEmail" role="alert"></p></div>' +
        '<div class="co-field"><label for="siPass">Password</label><div class="acct-pass"><input type="password" id="siPass" autocomplete="current-password" aria-describedby="err-siPass"><button type="button" class="acct-eye" data-eye="siPass" aria-label="Show password" aria-pressed="false"></button></div><p class="co-error" id="err-siPass" role="alert"></p></div>' +
        '<div class="acct-row"><button type="button" class="acct-link" data-go="forgot">Forgot password?</button></div>' +
        '<button type="submit" class="co-btn">Sign in</button>' +
      '</form>' +
      '<p class="acct-switch">New to SENORA? <button type="button" class="acct-link" data-go="create">Create an account</button></p>' +
    '</section>' +

    '<section data-view="create" id="viewCreate" role="tabpanel" aria-labelledby="tabCreate" hidden>' +
      '<h2 class="acct-title" id="titleCreate">Join the <em>atelier</em></h2>' +
      '<p class="acct-sub">Save your details, follow your orders and keep your wishlist on every visit.</p>' +
      '<form id="acctCreateForm" novalidate>' +
        '<div class="co-field"><label for="crName">Full name</label><input type="text" id="crName" autocomplete="name" aria-describedby="err-crName"><p class="co-error" id="err-crName" role="alert"></p></div>' +
        '<div class="co-field"><label for="crEmail">Email address</label><input type="email" id="crEmail" autocomplete="email" inputmode="email" aria-describedby="err-crEmail"><p class="co-error" id="err-crEmail" role="alert"></p></div>' +
        '<div class="co-field"><label for="crPass">Password</label><div class="acct-pass"><input type="password" id="crPass" autocomplete="new-password" aria-describedby="err-crPass crHint"><button type="button" class="acct-eye" data-eye="crPass" aria-label="Show password" aria-pressed="false"></button></div>' +
          '<div class="acct-meter" id="crMeter" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="acct-hint" id="crHint">At least 8 characters, with a letter and a number.</p><p class="co-error" id="err-crPass" role="alert"></p></div>' +
        '<div class="co-field"><label for="crPass2">Confirm password</label><input type="password" id="crPass2" autocomplete="new-password" aria-describedby="err-crPass2"><p class="co-error" id="err-crPass2" role="alert"></p></div>' +
        '<label class="co-check"><input type="checkbox" id="crNews"><span class="co-box" aria-hidden="true"></span><span>Send me news of new collections <em>(optional)</em></span></label>' +
        '<button type="submit" class="co-btn">Create my account</button>' +
        '<p class="acct-fine">By creating an account you agree to our <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.</p>' +
      '</form>' +
      '<p class="acct-switch">Already registered? <button type="button" class="acct-link" data-go="signin">Sign in</button></p>' +
    '</section>' +

    '<section data-view="forgot" role="tabpanel" hidden>' +
      '<h2 class="acct-title" id="titleForgot">Reset your <em>password</em></h2>' +
      '<p class="acct-sub">Enter your email and we will send you a link to choose a new one.</p>' +
      '<form id="acctForgotForm" novalidate>' +
        '<div class="co-field"><label for="fgEmail">Email address</label><input type="email" id="fgEmail" autocomplete="email" inputmode="email" aria-describedby="err-fgEmail"><p class="co-error" id="err-fgEmail" role="alert"></p></div>' +
        '<button type="submit" class="co-btn">Send reset link</button>' +
      '</form>' +
      '<p class="acct-note" id="fgDone" hidden></p>' +
      '<p class="acct-switch"><button type="button" class="acct-link" data-go="signin">Back to sign in</button></p>' +
    '</section>' +

    '<section data-view="welcome" role="tabpanel" hidden>' +
      '<svg class="co-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M38 62l16 16 30-34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<h2 class="acct-title" id="welcomeTitle" tabindex="-1">Welcome, <em id="welcomeName"></em></h2>' +
      '<p class="acct-sub" id="welcomeSub"></p>' +
      '<a href="account.html" class="co-btn">Go to my account</a>' +
      '<p class="acct-switch"><button type="button" class="acct-link" data-close>Continue browsing</button></p>' +
    '</section>' +

    '<p class="acct-demo">Demo preview: no real account is created, nothing is sent, and your password is never stored or checked.</p>';

  function buildModal() {
    backdrop = el('div', { class: 'acct-backdrop', id: 'acctBackdrop' });
    modal = el('div', { class: 'acct-modal', id: 'acctModal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'titleSignin', tabindex: '-1' });
    modal.innerHTML = TEMPLATE; // static template: contains no user data
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    backdrop.addEventListener('click', closeModal);
    modal.querySelector('.acct-close').addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
    modal.querySelectorAll('[data-tab],[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-tab') || b.getAttribute('data-go')); });
    });
    modal.querySelectorAll('[data-eye]').forEach(function (b) {
      b.addEventListener('click', function () {
        var input = $(b.getAttribute('data-eye'));
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        b.setAttribute('aria-pressed', show ? 'true' : 'false');
        b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
    modal.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { setError(i.id, ''); });
    });
    $('crPass').addEventListener('input', function () { meter(this.value); });

    $('acctSigninForm').addEventListener('submit', onSignin);
    $('acctCreateForm').addEventListener('submit', onCreate);
    $('acctForgotForm').addEventListener('submit', onForgot);

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(modal.querySelectorAll('button, input, a[href]'), function (n) {
        return !n.disabled && n.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function setError(id, msg) {
    var input = $(id), err = $('err-' + id);
    if (!input || !err) return;
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function firstBad(ids) {
    for (var i = 0; i < ids.length; i++) if ($(ids[i]).getAttribute('aria-invalid') === 'true') return $(ids[i]);
    return null;
  }

  function showView(view, focus) {
    currentView = view;
    modal.querySelectorAll('[data-view]').forEach(function (s) { s.hidden = s.getAttribute('data-view') !== view; });
    var tabs = modal.querySelector('.acct-tabs');
    tabs.hidden = !(view === 'signin' || view === 'create');
    modal.querySelectorAll('[data-tab]').forEach(function (t) {
      var on = t.getAttribute('data-tab') === view;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var heading = modal.querySelector('[data-view="' + view + '"] .acct-title');
    if (heading && heading.id) modal.setAttribute('aria-labelledby', heading.id);
    if (focus !== false) {
      var target = view === 'welcome' ? $('welcomeTitle') : modal.querySelector('[data-view="' + view + '"] input');
      if (target) setTimeout(function () { target.focus(); }, 60);
    }
  }

  function openModal(view) {
    if (!modal) buildModal();
    closeMenu();
    lastFocus = document.activeElement;
    showView(view || 'signin', false);
    backdrop.classList.add('is-open');
    modal.classList.add('is-open');
    document.documentElement.classList.add('acct-lock');
    var target = modal.querySelector('[data-view="' + currentView + '"] input');
    setTimeout(function () { if (target) target.focus(); else modal.focus(); }, 80);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.documentElement.classList.remove('acct-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Password strength */
  function meter(v) {
    var score = 0;
    if (v.length >= 8) score++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) score++;
    var m = $('crMeter');
    m.setAttribute('data-score', v ? String(score) : '0');
  }
  function passwordProblem(v) {
    if (!v) return 'Please choose a password.';
    if (v.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number.';
    return '';
  }

  /* Handlers */
  function onSignin(e) {
    e.preventDefault();
    var email = $('siEmail').value.trim();
    var pass = $('siPass').value;
    setError('siEmail', !email ? 'Please enter your email address.' : (emailOk(email) ? '' : 'Please enter a valid email, like name@example.com.'));
    setError('siPass', pass ? '' : 'Please enter your password.');
    var bad = firstBad(['siEmail', 'siPass']);
    if (bad) { bad.focus(); return; }
    var res = api.signIn(email);
    $('siPass').value = ''; // never keep the password around
    if (!res.ok) {
      setError('siEmail', 'We could not find an account for this email on this device. You can create one below.');
      $('siEmail').focus();
      return;
    }
    closeModal();
    toast('Welcome back, ' + (api.getProfile().name.split(' ')[0]) + '.');
    afterAuth();
  }

  function onCreate(e) {
    e.preventDefault();
    var name = $('crName').value.trim(), email = $('crEmail').value.trim();
    var p1 = $('crPass').value, p2 = $('crPass2').value;
    setError('crName', name.length < 2 ? 'Please enter your full name.' : '');
    setError('crEmail', !email ? 'Please enter your email address.' : (emailOk(email) ? '' : 'Please enter a valid email, like name@example.com.'));
    setError('crPass', passwordProblem(p1));
    setError('crPass2', p1 && p1 !== p2 ? 'The passwords do not match.' : (!p2 ? 'Please confirm your password.' : ''));
    var bad = firstBad(['crName', 'crEmail', 'crPass', 'crPass2']);
    if (bad) { bad.focus(); return; }

    var res = api.createAccount({ name: name, email: email, newsletter: $('crNews').checked });
    $('crPass').value = ''; $('crPass2').value = ''; meter('');
    if (!res.ok) {
      setError('crEmail', 'An account with this email already exists. Please sign in instead.');
      $('crEmail').focus();
      return;
    }
    $('welcomeName').textContent = name.split(' ')[0] + '.';
    $('welcomeSub').textContent = 'Your SENORA account is ready. Your orders and details will be kept here.';
    showView('welcome');
    afterAuth();
  }

  function onForgot(e) {
    e.preventDefault();
    var email = $('fgEmail').value.trim();
    setError('fgEmail', !email ? 'Please enter your email address.' : (emailOk(email) ? '' : 'Please enter a valid email, like name@example.com.'));
    if ($('fgEmail').getAttribute('aria-invalid') === 'true') { $('fgEmail').focus(); return; }
    var done = $('fgDone');
    done.textContent = 'If an account exists for ' + email + ', a reset link would be on its way. (Demo: no email is sent.)';
    done.hidden = false;
  }

  function afterAuth() {
    if (document.getElementById('acctPage')) renderAccountPage();
  }

  /* ------------------------------------------------------------------
     Account page
     ------------------------------------------------------------------ */
  var STEPS = ['Received', 'Being prepared', 'Dispatched', 'Delivered'];
  function orderStage(order) {
    // Demo only: stages are simulated from the time since the order was placed
    var days = (Date.now() - new Date(order.placedAt).getTime()) / 86400000;
    var maxDays = Number(order.maxDays) || 4;
    if (days >= maxDays + 1) return 3;
    if (days >= 1.5) return 2;
    if (days >= 0.2) return 1;
    return 0;
  }

  function readCartStore() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeCartStore(d) { try { localStorage.setItem(CART_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ } }
  function addToStoredCart(item) {
    var d = readCartStore();
    if (!Array.isArray(d.cart)) d.cart = [];
    var found = d.cart.filter(function (i) { return i.id === item.id && i.size === item.size && i.color === item.color; })[0];
    if (found) found.quantity = Math.min(99, (parseInt(found.quantity, 10) || 1) + item.quantity);
    else d.cart.push(item);
    writeCartStore(d);
  }

  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderOrders() {
    var box = $('ordersList');
    box.textContent = '';
    var orders = api.getOrders();
    if (!orders.length) {
      box.appendChild(el('div', { class: 'acct-empty' }, [
        el('h3', { text: 'No orders yet' }),
        el('p', { text: 'When you place an order while signed in, it will appear here with its progress.' }),
        el('a', { href: 'shop.html', class: 'co-btn co-btn-inline', text: 'Shop the collection' })
      ]));
      return;
    }
    orders.forEach(function (o) {
      var stage = orderStage(o);
      var steps = el('ol', { class: 'acct-track', 'aria-label': 'Order progress' });
      STEPS.forEach(function (s, i) {
        steps.appendChild(el('li', { class: i <= stage ? 'is-done' : '' }, [el('span', { text: s })]));
      });
      var items = el('ul', { class: 'acct-order-items' });
      (o.items || []).forEach(function (it) {
        var thumb = el('div', { class: 'co-thumb' });
        if (it.image && /^https:\/\//.test(it.image)) {
          var img = el('img', { src: it.image, alt: '', loading: 'lazy' });
          img.addEventListener('error', function () { img.remove(); thumb.classList.add('is-fallback'); thumb.insertBefore(el('span', { text: 'S' }), thumb.firstChild); });
          thumb.appendChild(img);
        } else { thumb.classList.add('is-fallback'); thumb.appendChild(el('span', { text: 'S' })); }
        items.appendChild(el('li', null, [
          thumb,
          el('div', null, [
            el('strong', { text: it.title }),
            el('span', { text: [it.size, it.color].filter(Boolean).join('  \u00b7  ') + '  \u00b7  Qty ' + it.quantity })
          ]),
          el('em', { text: money(it.price * it.quantity) })
        ]));
      });

      var reorder = el('button', { type: 'button', class: 'coll-cta', text: 'Order again' });
      reorder.addEventListener('click', function () {
        (o.items || []).forEach(function (it) {
          addToStoredCart({ id: it.id, title: it.title, price: it.price, size: it.size, color: it.color, quantity: it.quantity, image: it.image });
        });
        window.location.href = 'checkout.html';
      });

      box.appendChild(el('article', { class: 'acct-order' }, [
        el('header', null, [
          el('div', null, [el('span', { class: 'acct-order-label', text: 'Order' }), el('strong', { class: 'acct-order-no', text: o.id })]),
          el('div', null, [el('span', { class: 'acct-order-label', text: 'Placed' }), el('span', { text: fmtDate(o.placedAt) })]),
          el('div', null, [el('span', { class: 'acct-order-label', text: 'Total' }), el('strong', { text: money(o.total) })]),
          el('span', { class: 'acct-pill', text: STEPS[stage] })
        ]),
        steps,
        items,
        el('footer', null, [
          el('p', { class: 'acct-order-meta', text: [o.deliveryLabel, o.payment].filter(Boolean).join('  \u00b7  ') }),
          reorder
        ])
      ]));
    });
    box.appendChild(el('p', { class: 'co-demo-note', text: 'Demo preview: order progress is simulated from the time since you placed the order.' }));
  }

  function renderDetails() {
    var p = api.getProfile() || {};
    var map = { dName: 'name', dEmail: 'email', dPhone: 'phone', dAddress: 'address', dAddress2: 'address2', dCity: 'city', dPostal: 'postal', dHeight: 'height' };
    Object.keys(map).forEach(function (id) { var n = $(id); if (n) n.value = p[map[id]] || ''; });
    if ($('dNews')) $('dNews').checked = !!p.newsletter;
  }

  function renderWishlist() {
    var box = $('wishList');
    box.textContent = '';
    var ids = [];
    try { ids = (JSON.parse(localStorage.getItem(CART_KEY)) || {}).wishlist || []; } catch (e) { ids = []; }
    var catalog = typeof SENORA_CATALOG !== 'undefined' ? SENORA_CATALOG : [];
    var items = ids.map(function (id) { return catalog.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
    if (!items.length) {
      box.appendChild(el('div', { class: 'acct-empty' }, [
        el('h3', { text: 'Your wishlist is empty' }),
        el('p', { text: 'Tap the heart on any piece to keep it here.' }),
        el('a', { href: 'shop.html', class: 'co-btn co-btn-inline', text: 'Browse the collection' })
      ]));
      return;
    }
    items.forEach(function (p) {
      var img = el('img', { src: p.image, alt: p.title, loading: 'lazy' });
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
      var add = el('button', { type: 'button', class: 'coll-cta', text: 'Add to bag' });
      add.addEventListener('click', function () {
        addToStoredCart({ id: p.id, title: p.title, price: p.price, size: (p.sizes && p.sizes[0]) || 'Standard', color: (p.colors && p.colors[0] && p.colors[0].name) || 'Default', quantity: 1, image: p.image });
        toast(p.title + ' added to your bag.');
      });
      box.appendChild(el('article', { class: 'acct-wish' }, [
        el('a', { href: 'shop.html', class: 'acct-wish-img', 'aria-label': 'View ' + p.title + ' in the shop' }, [img]),
        el('h3', { text: p.title }),
        el('span', { class: 'acct-wish-price', text: money(p.price) }),
        add
      ]));
    });
  }

  function showPanel(name) {
    var panels = ['orders', 'details', 'wishlist'];
    if (panels.indexOf(name) === -1) name = 'orders';
    panels.forEach(function (p) {
      var sec = $('panel-' + p);
      if (sec) sec.hidden = p !== name;
    });
    document.querySelectorAll('[data-panel]').forEach(function (b) {
      var on = b.getAttribute('data-panel') === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (name === 'orders') renderOrders();
    if (name === 'details') renderDetails();
    if (name === 'wishlist') renderWishlist();
  }

  function renderHeading() {
    var h = $('acctHeading');
    if (!h) return;
    var p = api.getProfile();
    h.textContent = '';
    if (api.isSignedIn() && p) {
      h.appendChild(document.createTextNode('Welcome, '));
      h.appendChild(el('em', { text: (p.name.split(' ')[0] || 'you') + '.' }));
    } else {
      h.appendChild(document.createTextNode('Your '));
      h.appendChild(el('em', { text: 'account' }));
    }
  }

  function renderAccountPage() {
    var page = $('acctPage');
    if (!page) return;
    var signedIn = api.isSignedIn();
    $('acctGate').hidden = signedIn;
    $('acctDash').hidden = !signedIn;
    var p = api.getProfile();
    renderHeading();
    if (signedIn) {
      $('acctSince').textContent = 'Member since ' + fmtDate((store() || {}).createdAt || new Date().toISOString());
      showPanel((location.hash || '#orders').replace('#', ''));
    }
  }

  function initAccountPage() {
    if (!$('acctPage')) return;

    document.querySelectorAll('[data-panel]').forEach(function (b) {
      b.addEventListener('click', function () {
        history.replaceState(null, '', '#' + b.getAttribute('data-panel'));
        showPanel(b.getAttribute('data-panel'));
        $('acctPanels').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    window.addEventListener('hashchange', function () { if (api.isSignedIn()) showPanel(location.hash.replace('#', '')); });
    $('acctSignOut').addEventListener('click', function () { api.signOut(); toast('You have been signed out.'); renderAccountPage(); });

    // Details form
    var form = $('detailsForm');
    ['dName', 'dPhone', 'dAddress', 'dCity'].forEach(function (id) { $(id).addEventListener('input', function () { setError(id, ''); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = $('dPhone').value.replace(/\D/g, '');
      setError('dName', $('dName').value.trim().length < 2 ? 'Please enter your full name.' : '');
      setError('dPhone', !phone || (phone.length >= 10 && phone.length <= 13) ? '' : 'Please enter a valid number, like 0300 1234567.');
      var bad = firstBad(['dName', 'dPhone']);
      if (bad) { bad.focus(); return; }
      api.updateProfile({
        name: $('dName').value, phone: $('dPhone').value, address: $('dAddress').value, address2: $('dAddress2').value,
        city: $('dCity').value, postal: $('dPostal').value, height: $('dHeight').value, newsletter: $('dNews').checked
      });
      renderHeading();
      toast('Your details have been saved.');
    });

    // Delete account
    $('delAsk').addEventListener('click', function () { $('delConfirm').hidden = false; $('delAsk').hidden = true; $('delNo').focus(); });
    $('delNo').addEventListener('click', function () { $('delConfirm').hidden = true; $('delAsk').hidden = false; $('delAsk').focus(); });
    $('delYes').addEventListener('click', function () {
      api.deleteAccount();
      $('delConfirm').hidden = true; $('delAsk').hidden = false;
      toast('Your account has been deleted from this device.');
      renderAccountPage();
    });

    renderAccountPage();
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function init() {
    updateHeader();
    initAccountPage();
    window.addEventListener('storage', function (e) { if (e.key === KEY) { memory = read(); emitAuth(); if ($('acctPage')) renderAccountPage(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
