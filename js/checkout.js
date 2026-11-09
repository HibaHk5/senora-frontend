/**
 * SENORA — Checkout
 * Vanilla JavaScript. Reads the shopping bag saved by main.js (localStorage key
 * "senora_state_v1"), walks the customer through three steps and shows a demo
 * confirmation. Nothing is sent anywhere and no card data is stored.
 *
 * NOTE FOR PRODUCTION: prices here come from the browser, so a real shop must
 * recalculate every price, discount and delivery fee on the server and hand
 * card details to a payment gateway, never to this script.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Configuration: edit these to match your real policies
     ------------------------------------------------------------------ */
  var CONFIG = {
    STORAGE_KEY: 'senora_state_v1',
    FREE_DELIVERY_THRESHOLD: 25000, // matches the announcement bar
    DELIVERY: {
      express:  { label: 'Express delivery',  fee: 800, freeOverThreshold: true, minDays: 1, maxDays: 3,
                  note: 'Complimentary on orders over PKR 25,000' },
      standard: { label: 'Standard delivery', fee: 400, freeOverThreshold: false, minDays: 3, maxDays: 6,
                  note: 'Tracked courier to your door' },
      pickup:   { label: 'Salon collection',  fee: 0,   freeOverThreshold: false, minDays: 2, maxDays: 3,
                  note: 'Collect from our Lahore salon, by appointment' }
    },
    // Sample promo code. Replace or remove before launch.
    PROMOS: {
      SENORA10: { percent: 10, label: '10% off' }
    },
    PAYMENT_LABELS: { cod: 'Cash on delivery', bank: 'Direct bank transfer', card: 'Credit or debit card' }
  };

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }
  function money(n) { return 'PKR ' + (Number(n) || 0).toLocaleString('en-PK'); }

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        if (k === 'class') node.className = props[k];
        else if (k === 'text') node.textContent = props[k];
        else node.setAttribute(k, props[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $('coToast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3200);
  }

  function addBusinessDays(date, n) {
    var d = new Date(date.getTime());
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) n--; // couriers run Monday to Saturday
    }
    return d;
  }
  function shortDate(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
  function arrivalRange(opt) {
    var now = new Date();
    return shortDate(addBusinessDays(now, opt.minDays)) + ' to ' + shortDate(addBusinessDays(now, opt.maxDays));
  }

  /* ------------------------------------------------------------------
     Bag storage (shared with main.js)
     ------------------------------------------------------------------ */
  function readStore() {
    try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function loadCart() {
    var data = readStore();
    var list = Array.isArray(data.cart) ? data.cart : [];
    return list.map(function (i) {
      return {
        id: String(i.id || ''),
        title: String(i.title || 'Piece'),
        price: Math.max(0, Number(i.price) || 0),
        size: String(i.size || ''),
        color: String(i.color || ''),
        quantity: Math.min(99, Math.max(1, parseInt(i.quantity, 10) || 1)),
        image: typeof i.image === 'string' && /^https:\/\//.test(i.image) ? i.image : ''
      };
    }).filter(function (i) { return i.id && i.price > 0; });
  }
  function saveCart(cart) {
    var data = readStore();
    data.cart = cart;
    try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* memory only */ }
  }

  /* ------------------------------------------------------------------
     State
     ------------------------------------------------------------------ */
  var cart = loadCart();
  var state = {
    delivery: 'express',
    payment: 'cod',
    promo: null,
    done: { info: false, delivery: false },
    info: {}
  };

  /* ------------------------------------------------------------------
     Totals
     ------------------------------------------------------------------ */
  function subtotal() { return cart.reduce(function (s, i) { return s + i.price * i.quantity; }, 0); }
  function discountAmount() {
    return state.promo ? Math.round(subtotal() * state.promo.percent / 100) : 0;
  }
  function deliveryFee(id) {
    var opt = CONFIG.DELIVERY[id];
    if (!opt) return 0;
    if (opt.freeOverThreshold && subtotal() >= CONFIG.FREE_DELIVERY_THRESHOLD) return 0;
    return opt.fee;
  }
  function total() { return subtotal() - discountAmount() + deliveryFee(state.delivery); }

  /* ------------------------------------------------------------------
     Summary rendering
     ------------------------------------------------------------------ */
  function thumb(item) {
    var wrap = el('div', { class: 'co-thumb' });
    if (item.image) {
      var img = el('img', { src: item.image, alt: '', loading: 'lazy' });
      img.addEventListener('error', function () { img.remove(); wrap.classList.add('is-fallback'); wrap.insertBefore(el('span', { text: 'S' }), wrap.firstChild); });
      wrap.appendChild(img);
    } else {
      wrap.classList.add('is-fallback');
      wrap.appendChild(el('span', { text: 'S' }));
    }
    wrap.appendChild(el('span', { class: 'co-qty-badge', text: String(item.quantity) }));
    return wrap;
  }

  function renderItems() {
    var list = $('coItems');
    list.textContent = '';
    cart.forEach(function (item) {
      var minus = el('button', { type: 'button', 'aria-label': 'Decrease quantity of ' + item.title, text: '\u2212' });
      var plus = el('button', { type: 'button', 'aria-label': 'Increase quantity of ' + item.title, text: '+' });
      var remove = el('button', { type: 'button', class: 'co-remove', text: 'Remove' });
      minus.addEventListener('click', function () { changeQty(item.id, -1); });
      plus.addEventListener('click', function () { changeQty(item.id, 1); });
      remove.addEventListener('click', function () { removeItem(item.id); });

      var meta = [item.size, item.color].filter(Boolean).join('  \u00b7  ');
      var li = el('li', { class: 'co-item' }, [
        thumb(item),
        el('div', { class: 'co-item-info' }, [
          el('h3', { text: item.title }),
          el('span', { class: 'co-item-meta', text: meta }),
          el('div', { class: 'co-item-controls' }, [
            el('div', { class: 'co-stepper', role: 'group', 'aria-label': 'Quantity' }, [minus, el('span', { text: String(item.quantity) }), plus]),
            remove
          ])
        ]),
        el('strong', { class: 'co-item-price', text: money(item.price * item.quantity) })
      ]);
      list.appendChild(li);
    });
  }

  function renderTotals() {
    var sub = subtotal(), disc = discountAmount(), fee = deliveryFee(state.delivery), tot = total();
    $('coSubtotal').textContent = money(sub);
    $('coDiscountRow').hidden = !disc;
    $('coDiscount').textContent = '\u2212 ' + money(disc);
    $('coDiscountCode').textContent = state.promo ? '(' + state.promo.code + ')' : '';
    $('coShipping').textContent = fee === 0 ? 'Complimentary' : money(fee);
    $('coTotal').textContent = money(tot);
    $('coToggleTotal').textContent = money(tot);
    $('coPlaceTotal').textContent = money(tot);

    var remaining = CONFIG.FREE_DELIVERY_THRESHOLD - sub;
    var pct = Math.min(100, Math.round(sub / CONFIG.FREE_DELIVERY_THRESHOLD * 100));
    $('coMeterBar').style.width = pct + '%';
    $('coMeterText').textContent = remaining > 0
      ? 'Add ' + money(remaining) + ' more for complimentary express delivery.'
      : 'You have unlocked complimentary express delivery.';
  }

  function renderDeliveryOptions() {
    var box = $('coDeliveryOptions');
    Array.prototype.slice.call(box.querySelectorAll('.co-option')).forEach(function (n) { n.remove(); });
    Object.keys(CONFIG.DELIVERY).forEach(function (id) {
      var opt = CONFIG.DELIVERY[id];
      var fee = deliveryFee(id);
      var input = el('input', { type: 'radio', name: 'delivery', value: id });
      if (state.delivery === id) input.checked = true;
      var label = el('label', { class: 'co-option' + (state.delivery === id ? ' is-selected' : '') }, [
        input,
        el('span', { class: 'co-radio', 'aria-hidden': 'true' }),
        el('span', { class: 'co-option-main' }, [
          el('strong', { text: opt.label }),
          el('small', { text: 'Arrives ' + arrivalRange(opt) + '. ' + opt.note + '.' })
        ]),
        el('span', { class: 'co-option-price', text: fee === 0 ? 'Complimentary' : money(fee) })
      ]);
      input.addEventListener('change', function () {
        state.delivery = id;
        renderDeliveryOptions();
        renderTotals();
      });
      box.appendChild(label);
    });
  }

  function refreshAll() {
    if (!cart.length) { showEmpty(); return; }
    renderItems();
    renderTotals();
    renderDeliveryOptions();
  }

  function changeQty(id, delta) {
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) { removeItem(id); return; }
    if (item.quantity > 99) item.quantity = 99;
    saveCart(cart);
    refreshAll();
  }
  function removeItem(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    saveCart(cart);
    toast('Removed from your bag.');
    refreshAll();
  }

  function showEmpty() {
    $('coFlow').hidden = true;
    $('coConfirm').hidden = true;
    $('coEmpty').hidden = false;
    document.title = 'Your bag | SENORA';
  }

  /* ------------------------------------------------------------------
     Promo code
     ------------------------------------------------------------------ */
  $('coPromoForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('coPromo').value.trim().toUpperCase();
    var msg = $('coPromoMsg');
    if (state.promo && !code) { state.promo = null; msg.textContent = 'Promo code removed.'; msg.className = 'co-promo-msg'; renderTotals(); return; }
    if (!code) { msg.textContent = 'Enter a promo code first.'; msg.className = 'co-promo-msg is-error'; return; }
    var promo = CONFIG.PROMOS[code];
    if (!promo) { msg.textContent = 'That code is not valid.'; msg.className = 'co-promo-msg is-error'; return; }
    state.promo = { code: code, percent: promo.percent, label: promo.label };
    msg.textContent = promo.label + ' applied.';
    msg.className = 'co-promo-msg is-ok';
    renderTotals();
  });

  /* Mobile summary toggle */
  $('coSummaryToggle').addEventListener('click', function () {
    var open = $('coSummary').classList.toggle('is-open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.querySelector('.co-toggle-label').firstChild.nodeValue = open ? 'Hide order summary ' : 'Show order summary ';
  });

  /* ------------------------------------------------------------------
     Validation helpers
     ------------------------------------------------------------------ */
  function setError(inputId, message) {
    var input = $(inputId), err = $('err-' + inputId);
    if (!input || !err) return;
    err.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function firstInvalid(ids) {
    for (var i = 0; i < ids.length; i++) { if ($(ids[i]).getAttribute('aria-invalid') === 'true') return $(ids[i]); }
    return null;
  }
  ['coEmail', 'coName', 'coPhone', 'coAddress', 'coCity', 'coCardNumber', 'coCardName', 'coCardExp', 'coCardCvc'].forEach(function (id) {
    var n = $(id);
    n.addEventListener('input', function () { setError(id, ''); });
    n.addEventListener('change', function () { setError(id, ''); });
  });
  $('coTerms').addEventListener('change', function () { $('err-coTerms').textContent = ''; });

  function validateInfo() {
    var ids = ['coEmail', 'coName', 'coPhone', 'coAddress', 'coCity'];
    var email = $('coEmail').value.trim();
    var phone = $('coPhone').value.replace(/\D/g, '');
    setError('coEmail', !email ? 'Please enter your email address.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Please enter a valid email, like name@example.com.'));
    setError('coName', $('coName').value.trim().length < 2 ? 'Please enter your full name.' : '');
    setError('coPhone', !phone ? 'Please enter a mobile number.' : (phone.length >= 10 && phone.length <= 13 ? '' : 'Please enter a valid number, like 0300 1234567.'));
    setError('coAddress', $('coAddress').value.trim().length < 5 ? 'Please enter your street address.' : '');
    setError('coCity', $('coCity').value ? '' : 'Please choose your city.');
    var bad = firstInvalid(ids);
    if (bad) { bad.focus(); return false; }
    return true;
  }

  /* Card helpers */
  function detectBrand(digits) {
    if (/^4/.test(digits)) return 'Visa';
    var first4 = parseInt(digits.slice(0, 4), 10);
    if (/^5[1-5]/.test(digits) || (digits.length >= 4 && first4 >= 2221 && first4 <= 2720)) return 'Mastercard';
    if (/^62/.test(digits)) return 'UnionPay';
    return '';
  }
  function luhn(digits) {
    var sum = 0, alt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var n = parseInt(digits.charAt(i), 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }
  $('coCardNumber').addEventListener('input', function () {
    var digits = this.value.replace(/\D/g, '').slice(0, 19);
    this.value = digits.replace(/(.{4})/g, '$1 ').trim();
    $('coBrandTag').textContent = detectBrand(digits);
  });
  $('coCardExp').addEventListener('input', function (e) {
    var digits = this.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 1 && parseInt(digits, 10) > 1) digits = '0' + digits;
    this.value = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits;
  });
  $('coCardCvc').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });

  function validateCard() {
    var ids = ['coCardNumber', 'coCardName', 'coCardExp', 'coCardCvc'];
    var digits = $('coCardNumber').value.replace(/\D/g, '');
    var brand = detectBrand(digits);
    var numOk = digits.length >= 15 && digits.length <= 19 && (brand === 'UnionPay' || luhn(digits));
    setError('coCardNumber', !digits ? 'Please enter your card number.' : (numOk ? '' : 'This card number does not look right.'));
    setError('coCardName', $('coCardName').value.trim().length < 2 ? 'Please enter the name on the card.' : '');

    var exp = $('coCardExp').value.replace(/\D/g, '');
    var expMsg = '';
    if (exp.length !== 4) expMsg = 'Please enter the expiry as MM / YY.';
    else {
      var mm = parseInt(exp.slice(0, 2), 10), yy = 2000 + parseInt(exp.slice(2), 10);
      var now = new Date();
      if (mm < 1 || mm > 12) expMsg = 'Month must be between 01 and 12.';
      else if (yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) expMsg = 'This card has expired.';
    }
    setError('coCardExp', expMsg);
    var cvc = $('coCardCvc').value;
    setError('coCardCvc', cvc.length >= 3 ? '' : 'Please enter the 3 or 4 digit code.');
    var bad = firstInvalid(ids);
    if (bad) { bad.focus(); return false; }
    return true;
  }

  /* ------------------------------------------------------------------
     Steps
     ------------------------------------------------------------------ */
  var ORDER = ['info', 'delivery', 'payment'];
  function stepEl(name) { return $('step' + name.charAt(0).toUpperCase() + name.slice(1)); }

  function setProgress(active) {
    var idx = ORDER.indexOf(active);
    Array.prototype.forEach.call($('coProgress').children, function (li, i) {
      li.classList.toggle('is-current', i === idx);
      li.classList.toggle('is-complete', !!state.done[ORDER[i]] && i !== idx);
    });
  }

  function activate(name, focus) {
    ORDER.forEach(function (s) {
      var node = stepEl(s);
      var isActive = s === name;
      node.classList.toggle('is-active', isActive);
      var unlocked = isActive || state.done[s] || (s === 'delivery' && state.done.info) || (s === 'payment' && state.done.delivery);
      node.classList.toggle('is-locked', !unlocked);
      node.classList.toggle('is-done', !!state.done[s] && !isActive);
      var edit = node.querySelector('.co-edit');
      if (edit) edit.hidden = !(state.done[s] && !isActive);
      var recap = node.querySelector('.co-recap');
      if (recap) recap.hidden = !(state.done[s] && !isActive);
    });
    setProgress(name);
    if (focus) {
      var first = stepEl(name).querySelector('input:not([type=hidden]), select');
      stepEl(name).scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (first && name !== 'delivery') setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
    }
  }

  document.querySelectorAll('[data-edit]').forEach(function (b) {
    b.addEventListener('click', function () { activate(b.getAttribute('data-edit'), true); });
  });

  $('formInfo').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateInfo()) return;
    state.info = {
      email: $('coEmail').value.trim(),
      name: $('coName').value.trim(),
      phone: $('coPhone').value.trim(),
      address: $('coAddress').value.trim(),
      address2: $('coAddress2').value.trim(),
      city: $('coCity').value,
      postal: $('coPostal').value.trim(),
      height: $('coHeight').value.trim(),
      gift: $('coGift').checked,
      giftMsg: $('coGiftMsg').value.trim()
    };
    state.done.info = true;
    $('recapInfo').textContent = state.info.name + '  \u00b7  ' + state.info.email + '  \u00b7  ' + state.info.address + ', ' + state.info.city;
    activate('delivery', true);
  });

  $('formDelivery').addEventListener('submit', function (e) {
    e.preventDefault();
    var opt = CONFIG.DELIVERY[state.delivery];
    var fee = deliveryFee(state.delivery);
    state.done.delivery = true;
    $('recapDelivery').textContent = opt.label + '  \u00b7  Arrives ' + arrivalRange(opt) + '  \u00b7  ' + (fee === 0 ? 'Complimentary' : money(fee));
    activate('payment', true);
  });

  /* Gift note */
  $('coGift').addEventListener('change', function () { $('coGiftWrap').hidden = !this.checked; });
  $('coGiftMsg').addEventListener('input', function () { $('coGiftCount').textContent = this.value.length + ' / 200'; });

  /* Payment method switch */
  Array.prototype.forEach.call(document.querySelectorAll('input[name="payment"]'), function (r) {
    r.addEventListener('change', function () {
      state.payment = r.value;
      Array.prototype.forEach.call($('coPaymentOptions').querySelectorAll('.co-option'), function (o) {
        o.classList.toggle('is-selected', o.querySelector('input').checked);
      });
      $('panelBank').hidden = r.value !== 'bank';
      $('panelCard').hidden = r.value !== 'card';
    });
  });

  /* ------------------------------------------------------------------
     Place order
     ------------------------------------------------------------------ */
  var placing = false;
  $('formPayment').addEventListener('submit', function (e) {
    e.preventDefault();
    if (placing) return;
    if (!cart.length) { showEmpty(); return; }
    if (!state.done.info) { activate('info', true); toast('Please complete your information first.'); return; }
    if (!state.done.delivery) { activate('delivery', true); toast('Please choose a delivery method first.'); return; }
    if (state.payment === 'card' && !validateCard()) return;
    if (!$('coTerms').checked) {
      $('err-coTerms').textContent = 'Please accept the terms to place your order.';
      $('coTerms').focus();
      return;
    }

    placing = true;
    var btn = $('coPlaceBtn');
    btn.classList.add('is-loading');
    btn.disabled = true;
    btn.querySelector('.co-btn-label').textContent = 'Placing your order';

    setTimeout(function () { completeOrder(); }, 1400);
  });

  function orderNumber() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
    var arr = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    for (var i = 0; i < 6; i++) out += chars.charAt(arr[i] % chars.length);
    return 'SN-' + out;
  }

  function completeOrder() {
    var snapshot = {
      items: cart.slice(),
      sub: subtotal(), disc: discountAmount(), fee: deliveryFee(state.delivery), tot: total()
    };
    var opt = CONFIG.DELIVERY[state.delivery];
    var info = state.info;

    $('coConfirmName').textContent = info.name.split(' ')[0] + '.';
    $('coOrderNo').textContent = orderNumber();
    var addr = [info.address, info.address2, info.city + (info.postal ? ' ' + info.postal : '')].filter(Boolean).join(', ');
    $('coConfirmAddress').textContent = info.name + ', ' + addr;
    $('coConfirmDelivery').textContent = opt.label + '. Arrives ' + arrivalRange(opt) + '.' + (info.height ? ' Length adjusted for ' + info.height + '.' : '');
    var payText = CONFIG.PAYMENT_LABELS[state.payment];
    if (state.payment === 'card') payText += ' ending ' + $('coCardNumber').value.replace(/\D/g, '').slice(-4);
    if (state.payment === 'bank') payText += '. Please use your order number as the payment reference.';
    if (state.payment === 'cod') payText += '. Please keep ' + money(snapshot.tot) + ' ready for the courier.';
    $('coConfirmPayment').textContent = payText;

    var list = $('coConfirmItems');
    list.textContent = '';
    snapshot.items.forEach(function (item) {
      list.appendChild(el('li', null, [
        thumb(item),
        el('div', null, [el('h3', { text: item.title }), el('span', { text: [item.size, item.color].filter(Boolean).join('  \u00b7  ') })]),
        el('strong', { text: money(item.price * item.quantity) })
      ]));
    });

    var totals = $('coConfirmTotals');
    totals.textContent = '';
    function row(label, value, cls) {
      totals.appendChild(el('div', cls ? { class: cls } : null, [el('dt', { text: label }), el('dd', { text: value })]));
    }
    row('Subtotal', money(snapshot.sub));
    if (snapshot.disc) row('Discount', '\u2212 ' + money(snapshot.disc));
    row('Delivery', snapshot.fee === 0 ? 'Complimentary' : money(snapshot.fee));
    row('Total', money(snapshot.tot), 'co-grand');

    saveOrderToAccount(snapshot, opt, CONFIG.PAYMENT_LABELS[state.payment]);

    // Clear the bag, and wipe every sensitive field
    cart = [];
    saveCart(cart);
    ['coCardNumber', 'coCardName', 'coCardExp', 'coCardCvc'].forEach(function (id) { $(id).value = ''; });

    $('coFlow').hidden = true;
    $('coEmpty').hidden = true;
    $('coConfirm').hidden = false;
    document.title = 'Order received | SENORA';
    window.scrollTo({ top: 0, behavior: 'auto' });
    $('coConfirmTitle').focus({ preventScroll: true });
  }


  /* ------------------------------------------------------------------
     Customer account integration (js/account.js)
     ------------------------------------------------------------------ */
  var acct = window.SenoraAccount || null;
  var lastOrder = null;

  function prefillFromAccount() {
    if (!acct || !acct.isSignedIn()) return;
    var p = acct.getProfile() || {};
    var map = { coEmail: 'email', coName: 'name', coPhone: 'phone', coAddress: 'address', coAddress2: 'address2', coCity: 'city', coPostal: 'postal', coHeight: 'height' };
    Object.keys(map).forEach(function (id) {
      var n = $(id);
      if (n && !n.value && p[map[id]]) { n.value = p[map[id]]; setError(id, ''); }
    });
  }

  function refreshAccountUI() {
    var signedIn = !!(acct && acct.isSignedIn());
    var p = signedIn ? acct.getProfile() : null;
    $('coAccountBar').hidden = !acct;
    if (!acct) return;
    $('coAccountText').textContent = signedIn ? 'Signed in as ' + p.email + '.' : 'Already have an account?';
    $('coAccountBtn').textContent = signedIn ? 'Sign out' : 'Sign in';
    $('coSaveDetailsRow').hidden = !signedIn;
    if (signedIn) prefillFromAccount();
  }

  if (acct) {
    $('coAccountBtn').addEventListener('click', function () {
      if (acct.isSignedIn()) { acct.signOut(); toast('You have been signed out.'); } else acct.open('signin');
    });
    window.addEventListener('senora:auth', refreshAccountUI);
  } else {
    $('coAccountBar').hidden = true;
  }

  function passwordProblem(v) {
    if (!v) return 'Please choose a password.';
    if (v.length < 8) return 'Use at least 8 characters.';
    if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include at least one letter and one number.';
    return '';
  }

  ['svPass', 'svPass2'].forEach(function (id) { $(id).addEventListener('input', function () { setError(id, ''); }); });

  $('coSaveForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!acct || !lastOrder) return;
    var p1 = $('svPass').value, p2 = $('svPass2').value;
    setError('svPass', passwordProblem(p1));
    setError('svPass2', p1 && p1 !== p2 ? 'The passwords do not match.' : (!p2 ? 'Please confirm your password.' : ''));
    var bad = firstInvalid(['svPass', 'svPass2']);
    if (bad) { bad.focus(); return; }
    var i = state.info;
    var res = acct.createAccount({
      name: i.name, email: i.email, phone: i.phone, address: i.address, address2: i.address2,
      city: i.city, postal: i.postal, height: i.height, orders: [lastOrder]
    });
    $('svPass').value = ''; $('svPass2').value = '';
    if (!res.ok) {
      $('coSave').hidden = true;
      var n = $('coSavedNote');
      n.textContent = 'An account with this email already exists. Please sign in from My Account to see this order.';
      n.hidden = false;
      return;
    }
    $('coSave').hidden = true;
    showSavedNote();
  });

  function showSavedNote() {
    var n = $('coSavedNote');
    n.textContent = '';
    n.appendChild(document.createTextNode('Saved to your account. '));
    n.appendChild(el('a', { href: 'account.html#orders', text: 'View this order in My Account' }));
    n.hidden = false;
  }

  function saveOrderToAccount(snapshot, opt, payLabel) {
    lastOrder = {
      id: $('coOrderNo').textContent,
      placedAt: new Date().toISOString(),
      items: snapshot.items.map(function (i) { return { id: i.id, title: i.title, price: i.price, size: i.size, color: i.color, quantity: i.quantity, image: i.image }; }),
      subtotal: snapshot.sub, discount: snapshot.disc, deliveryFee: snapshot.fee, total: snapshot.tot,
      deliveryLabel: opt.label, maxDays: opt.maxDays, payment: payLabel
    };
    $('coSave').hidden = true;
    $('coSavedNote').hidden = true;
    if (!acct) return;
    if (acct.isSignedIn()) {
      acct.addOrder(lastOrder);
      if ($('coSaveDetails').checked) {
        var i = state.info;
        acct.updateProfile({ phone: i.phone, address: i.address, address2: i.address2, city: i.city, postal: i.postal, height: i.height });
      }
      showSavedNote();
    } else {
      $('coSave').hidden = false;
    }
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  if (!cart.length) {
    showEmpty();
  } else {
    refreshAll();
    activate('info', false);
  }
  refreshAccountUI();
})();
