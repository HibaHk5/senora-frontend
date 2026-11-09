/**
 * SENORA — Luxury Modest Fashion Atelier
 * Frontend Logic, State Management & Micro-interactions
 * Vanilla JavaScript (ES6+)
 * 
 * NOTE: The shopping bag and wishlist are kept in memory and mirrored to
 * localStorage (key: senora_state_v1) so they survive moving between pages
 * and reloads. Only product ids, size, colour and quantity are trusted when
 * loading: titles, prices and images always come from SENORA_CATALOG.
 * No cookies are used. Checkout form data and card details are never stored.
 */

'use strict';

/* ==========================================================================
   1. Configuration & Global State (In-Memory Only)
   ========================================================================== */
const SENORA_CONFIG = {
  CURRENCY: 'PKR',
  FREE_SHIPPING_THRESHOLD_PKR: 25000,
  SHIPPING_LABEL: 'Complimentary shipping across Pakistan on orders over PKR 25,000',
  IS_DEMO: true
};

// Global in-memory state (resets on page reload; no persistent cookies/storage)
const SENORA_STATE = {
  cart: [
    {
      id: 'sn-01',
      title: 'Nocturne Raw Silk Abaya',
      price: 28500,
      size: 'Medium (56")',
      color: 'Obsidian Noir',
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
    }
  ],
  wishlist: new Set(['sn-02']),
  isCartOpen: false,
  isWishlistOpen: false,
  isSearchOpen: false,
  isMobileNavOpen: false,
  isProductModalOpen: false
};

// Product catalog reference for search, details, and cart interactions
const SENORA_CATALOG = [
  {
    id: 'sn-01',
    title: 'Nocturne Raw Silk Abaya',
    category: 'Abayas',
    categoryTag: 'Atelier Abaya',
    price: 28500,
    tag: 'Pure Silk Crepe',
    description: 'Cut from weightless raw silk crepe, the Nocturne Abaya drapes with an architectural stillness unique to pure mulberry fibres. The kimono-style open front is finished with hand-rolled hems, and the relaxed floor-grazing silhouette is designed to be worn effortlessly from morning to evening.',
    composition: 'Shell: 100% Mulberry Silk Crepe\nLining: 95% Modal, 5% Lycra\nCare: Dry clean only',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Obsidian Noir', hex: '#111111' },
      { name: 'Deep Bronze', hex: '#2b2824' }
    ],
    sizes: ['52"', '54"', '56"', '58"']
  },
  {
    id: 'sn-02',
    title: 'Draped Sand Crepe Co-ord',
    category: 'Co-ords',
    categoryTag: 'Tailored Co-ord',
    price: 22000,
    tag: 'Artisan Tailored',
    description: 'A considered two-piece set in Italian matte crepe — the wide-leg trouser and relaxed kimono blouse are cut to move together as a single editorial silhouette. Precision-serged seams, invisible side pockets, and an elasticated waistband deliver both comfort and quiet luxury.',
    composition: 'Shell: 80% Polyester Crepe, 20% Viscose\nFinish: Matte pressed\nCare: Hand wash cold, lay flat to dry',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Sand Ivory', hex: '#E7E2D7' },
      { name: 'Stone Grey', hex: '#8B8985' }
    ],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'sn-03',
    title: 'Pleated Atelier Column Dress',
    category: 'Dresses',
    categoryTag: 'Modest Column Dress',
    price: 34500,
    tag: 'Limited Edition',
    description: 'An elevated column dress defined by its precise knife-pleating — each fold pressed by hand at our Lahore atelier. The high neckline, full-length sleeves, and ankle-grazing hem make this a cornerstone piece for occasions requiring understated grandeur.',
    composition: 'Shell: 100% Japanese Polyester Charmeuse\nConstruction: Hand-pleated, dry-press finish\nCare: Dry clean or gentle machine wash cold',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Noir', hex: '#1c1c1a' },
      { name: 'Pewter', hex: '#54524e' }
    ],
    sizes: ['S', 'M', 'L']
  },
  {
    id: 'sn-04',
    title: 'Structured Wool-Blend Trench Cape',
    category: 'Outerwear',
    categoryTag: 'Atelier Outerwear',
    price: 39000,
    tag: 'Heavy Drape Wool',
    description: 'A defining outerwear statement — the Trench Cape is woven from a double-weight British wool blend and structured with interior boning at the shoulders. The voluminous silhouette wraps generously, securing with a single hidden press stud for a clean editorial line.',
    composition: 'Shell: 70% Merino Wool, 30% Polyamide\nInterfacing: Horsehair canvas shoulder boning\nCare: Dry clean only. Do not wash.',
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Charcoal', hex: '#2F2E2B' },
      { name: 'Bone Wool', hex: '#DCD7CE' }
    ],
    sizes: ['One Size']
  },
  {
    id: 'sn-05',
    title: 'Mirage Batwing Crepe Abaya',
    category: 'Abayas',
    categoryTag: 'Draped Abaya',
    price: 26000,
    tag: 'Fluid Georgette',
    description: 'Cut with sculptural batwing sleeves and seamless kimono shoulders, the Mirage Abaya brings dynamic fluidity to modest dressing. Hand-dyed in muted earthen tones and detailed with delicate tone-on-tone French seam stitching.',
    composition: 'Shell: 100% Japanese High-Twist Crepe\nLining: Unlined for weightless drape\nCare: Gentle hand wash or dry clean',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Taupe Umber', hex: '#483C32' },
      { name: 'Raw Ochre', hex: '#7A6B5D' }
    ],
    sizes: ['52"', '54"', '56"', '58"']
  },
  {
    id: 'sn-06',
    title: 'Monolith Raw Linen Co-ord',
    category: 'Co-ords',
    categoryTag: 'Textured Co-ord',
    price: 24500,
    tag: 'Belgian Linen',
    description: 'A structured tunic and column pant tailored from untreated Belgian linen. Features an elongated asymmetric tunic hem, concealed mother-of-pearl closures, and relaxed double-pleated trousers.',
    composition: 'Shell: 100% Pure Flax Linen\nWash: Enzyme washed for soft drape\nCare: Machine wash cold on delicate, steam press',
    image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Natural Oatmeal', hex: '#D8D2C6' },
      { name: 'Washed Charcoal', hex: '#383838' }
    ],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'sn-07',
    title: 'Sovereign Tiered Silk Gown',
    category: 'Dresses',
    categoryTag: 'Occasion Dress',
    price: 36000,
    tag: 'Silk Habotai',
    description: 'An occasion gown crafted from whisper-weight silk habotai with generous architectural volume. Featuring discreet gathered tiers, a high modest mandarin collar, and elongated buttoned cuffs.',
    composition: 'Shell: 100% Pure Silk Habotai\nLining: 100% Breathable Viscose\nCare: Professional dry clean only',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Deep Espresso', hex: '#261F1D' },
      { name: 'Parchment', hex: '#EBE6DC' }
    ],
    sizes: ['S', 'M', 'L']
  },
  {
    id: 'sn-08',
    title: 'Kashmir Double-Faced Cocoon Coat',
    category: 'Outerwear',
    categoryTag: 'Atelier Outerwear',
    price: 44000,
    tag: 'Cashmere & Wool',
    description: 'Crafted from hand-split double-faced cashmere and virgin wool, this cocoon silhouette wraps with total modesty and regal warmth. Unlined with invisible hand-stitched borders and deep patch pockets.',
    composition: 'Shell: 60% Virgin Wool, 40% Cashmere\nConstruction: Hand-finished double-face\nCare: Specialist dry clean only',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
    colors: [
      { name: 'Camel Tan', hex: '#9C7A5B' },
      { name: 'Obsidian', hex: '#141414' }
    ],
    sizes: ['One Size']
  }
];

/* ==========================================================================
   1b. Persistence (bag + wishlist survive page changes)
   ========================================================================== */
const SENORA_STORAGE_KEY = 'senora_state_v1';

function persistState() {
  try {
    localStorage.setItem(SENORA_STORAGE_KEY, JSON.stringify({
      cart: SENORA_STATE.cart.map(i => ({ id: i.id, title: i.title, price: i.price, size: i.size, color: i.color, quantity: i.quantity, image: i.image })),
      wishlist: Array.from(SENORA_STATE.wishlist)
    }));
  } catch (err) { /* storage unavailable (private mode): fall back to memory only */ }
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(SENORA_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const clean = (s, fallback) => (typeof s === 'string' ? s.replace(/[^\w\s"'.()\-•]/g, '').slice(0, 40) : fallback);

    if (Array.isArray(data.cart)) {
      SENORA_STATE.cart = data.cart.map(saved => {
        const product = SENORA_CATALOG.find(p => p.id === saved.id);
        if (!product) return null;
        const qty = Math.min(99, Math.max(1, parseInt(saved.quantity, 10) || 1));
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          size: clean(saved.size, 'Standard'),
          color: clean(saved.color, 'Default'),
          quantity: qty,
          image: product.image
        };
      }).filter(Boolean);
    }
    if (Array.isArray(data.wishlist)) {
      SENORA_STATE.wishlist = new Set(data.wishlist.filter(id => SENORA_CATALOG.some(p => p.id === id)));
    }
  } catch (err) { /* ignore corrupt storage */ }
}

loadPersistedState();


/* ==========================================================================
   2. DOM Utility Helpers
   ========================================================================== */
function formatPKR(amount) {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return 'PKR ' + safeAmount.toLocaleString('en-PK');
}

// Manage body scroll lock cleanly across multiple modals/drawers
function updateBodyScrollLock() {
  const anyOpen = SENORA_STATE.isCartOpen || SENORA_STATE.isWishlistOpen || SENORA_STATE.isSearchOpen || SENORA_STATE.isMobileNavOpen || SENORA_STATE.isProductModalOpen;
  if (anyOpen) {
    document.body.classList.add('no-scroll');
  } else {
    document.body.classList.remove('no-scroll');
  }
}

// Debounced, non-duplicating toast system
let lastToastMessage = '';
let lastToastTime = 0;

function showToast(message, iconSvg = null) {
  const container = document.getElementById('toastContainer');
  if (!container || !message) return;

  // Prevent exact duplicate toasts within 1 second
  const now = Date.now();
  if (message === lastToastMessage && (now - lastToastTime) < 1000) {
    return;
  }
  lastToastMessage = message;
  lastToastTime = now;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const defaultIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

  toast.innerHTML = `
    ${iconSvg || defaultIcon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger entrance transition
  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  // Auto remove toast
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 400);
  }, 3200);
}

// Accessible Focus Trapping inside active overlays
function trapFocus(containerElement, event) {
  if (!containerElement) return;
  const focusables = containerElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    last.focus();
    event.preventDefault();
  } else if (!event.shiftKey && document.activeElement === last) {
    first.focus();
    event.preventDefault();
  }
}

/* ==========================================================================
   3. Header & Sticky Scroll Behavior
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   4. Shopping Bag Drawer & Cart Operations
   ========================================================================== */
let cartDrawerOverlay = null;
let cartDrawer = null;
let cartToggleBtn = null;
let cartCloseBtn = null;

function openCart() {
  // If wishlist is open, close it first
  if (SENORA_STATE.isWishlistOpen) {
    closeWishlist();
  }
  // If mobile nav is open, close it first
  if (SENORA_STATE.isMobileNavOpen) {
    closeMobileNav();
  }
  // If search is open, close it
  if (SENORA_STATE.isSearchOpen) {
    closeSearch();
  }

  SENORA_STATE.isCartOpen = true;

  if (cartDrawerOverlay) cartDrawerOverlay.classList.add('is-active');
  if (cartDrawer) {
    cartDrawer.classList.add('is-active');
    cartDrawer.setAttribute('aria-hidden', 'false');
  }
  if (cartToggleBtn) cartToggleBtn.setAttribute('aria-expanded', 'true');

  updateBodyScrollLock();
  renderCart();

  // Focus close button for accessibility
  if (cartCloseBtn) {
    setTimeout(() => cartCloseBtn.focus(), 50);
  }
}

function closeCart() {
  SENORA_STATE.isCartOpen = false;

  if (cartDrawerOverlay) cartDrawerOverlay.classList.remove('is-active');
  if (cartDrawer) {
    cartDrawer.classList.remove('is-active');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }
  if (cartToggleBtn) {
    cartToggleBtn.setAttribute('aria-expanded', 'false');
    cartToggleBtn.focus();
  }

  updateBodyScrollLock();
}

function addToCart(productId) {
  const product = SENORA_CATALOG.find(p => p.id === productId);
  if (!product) return;

  const existingItem = SENORA_STATE.cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    SENORA_STATE.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      size: product.sizes && product.sizes[0] ? product.sizes[0] : 'Standard',
      color: 'Default',
      quantity: 1,
      image: product.image
    });
  }

  renderCart();
  showToast(`Added "${product.title}" to your Shopping Bag.`);
  openCart();
}

function updateCartQuantity(productId, delta) {
  const itemIndex = SENORA_STATE.cart.findIndex(item => item.id === productId);
  if (itemIndex === -1) return;

  SENORA_STATE.cart[itemIndex].quantity += delta;
  if (SENORA_STATE.cart[itemIndex].quantity <= 0) {
    SENORA_STATE.cart.splice(itemIndex, 1);
    showToast('Item removed from your Shopping Bag.');
  }

  renderCart();
}

function removeFromCart(productId) {
  SENORA_STATE.cart = SENORA_STATE.cart.filter(item => item.id !== productId);
  renderCart();
  showToast('Item removed from your Shopping Bag.');
}

function renderCart() {
  persistState();
  const itemsContainer = document.getElementById('cartItemsContainer');
  const countBadge = document.getElementById('cartCountBadge');
  const subtotalEl = document.getElementById('cartSubtotalAmount');
  const meterTextEl = document.getElementById('shippingMeterText');
  const meterProgressEl = document.getElementById('shippingProgressBar');

  const totalItems = SENORA_STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = SENORA_STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Update Cart Header Badge
  if (countBadge) {
    countBadge.textContent = totalItems;
    countBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  // Update Cart Subtotal
  if (subtotalEl) {
    subtotalEl.textContent = formatPKR(subtotal);
  }

  // Update Free Shipping Meter
  const threshold = SENORA_CONFIG.FREE_SHIPPING_THRESHOLD_PKR;
  if (meterTextEl && meterProgressEl) {
    if (subtotal >= threshold) {
      meterTextEl.innerHTML = `<strong>Congratulations!</strong> You have unlocked complimentary express shipping.`;
      meterProgressEl.style.width = '100%';
    } else {
      const remaining = threshold - subtotal;
      const percentage = Math.min(100, Math.round((subtotal / threshold) * 100));
      meterTextEl.innerHTML = `Add <strong>${formatPKR(remaining)}</strong> more to qualify for complimentary delivery.`;
      meterProgressEl.style.width = `${percentage}%`;
    }
  }

  // Render Items List safely
  if (!itemsContainer) return;

  if (SENORA_STATE.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <p>Your Shopping Bag is empty</p>
        <span style="font-size: 0.8125rem; color: var(--color-stone);">Discover new arrivals crafted for modest elegance.</span>
      </div>
    `;
    return;
  }

  // Render cart items with data-action attributes for safe event delegation
  itemsContainer.innerHTML = SENORA_STATE.cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="handleImageError(this)">
      <div class="cart-item-details">
        <div>
          <h4 class="cart-item-title">${item.title}</h4>
          <span class="cart-item-option">${item.size} • ${item.color}</span>
        </div>
        <div class="cart-item-price">${formatPKR(item.price * item.quantity)}</div>
        <div class="cart-item-actions">
          <div class="quantity-stepper" role="group" aria-label="Quantity for ${item.title}">
            <button class="qty-btn" type="button" aria-label="Decrease quantity" data-action="cart-qty-decrease" data-id="${item.id}">-</button>
            <span class="qty-input" aria-label="Current quantity">${item.quantity}</span>
            <button class="qty-btn" type="button" aria-label="Increase quantity" data-action="cart-qty-increase" data-id="${item.id}">+</button>
          </div>
          <button class="item-remove-btn" type="button" data-action="cart-remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function initCartDrawer() {
  cartToggleBtn = document.getElementById('cartToggleBtn');
  cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  cartDrawer = document.getElementById('cartDrawer');
  cartCloseBtn = document.getElementById('cartCloseBtn');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');
  const itemsContainer = document.getElementById('cartItemsContainer');

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeCart);

  // Safe Event Delegation for Cart Item actions (avoids inline onclick handlers)
  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const productId = button.getAttribute('data-id');

      if (action === 'cart-qty-decrease') {
        updateCartQuantity(productId, -1);
      } else if (action === 'cart-qty-increase') {
        updateCartQuantity(productId, 1);
      } else if (action === 'cart-remove') {
        removeFromCart(productId);
      }
    });
  }

  // Demo checkout action
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (SENORA_STATE.cart.length === 0) {
        showToast('Your shopping bag is currently empty.');
        return;
      }
      window.location.href = 'checkout.html';
    });
  }

  renderCart();
}

/* ==========================================================================
   5. Wishlist Drawer & State Management
   ========================================================================== */
let wishlistHeaderBtn = null;
let wishlistDrawerOverlay = null;
let wishlistDrawer = null;
let wishlistCloseBtn = null;
let wishlistItemsContainer = null;
let wishlistExploreBtn = null;

function syncProductWishlistButtons() {
  document.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
    const productId = btn.getAttribute('data-product-id');
    const product = SENORA_CATALOG.find(p => p.id === productId);
    const title = product ? product.title : 'Item';

    if (SENORA_STATE.wishlist.has(productId)) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute('aria-label', `Remove ${title} from wishlist`);
    } else {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', `Save ${title} to wishlist`);
    }
  });
}

function updateWishlistBadge() {
  persistState();
  const countBadge = document.getElementById('wishlistCountBadge');
  if (!countBadge) return;
  const count = SENORA_STATE.wishlist.size;
  countBadge.textContent = count;
  countBadge.style.display = count > 0 ? 'flex' : 'none';
}

function openWishlist() {
  if (SENORA_STATE.isCartOpen) closeCart();
  if (SENORA_STATE.isSearchOpen) closeSearch();
  if (SENORA_STATE.isMobileNavOpen) closeMobileNav();

  SENORA_STATE.isWishlistOpen = true;

  if (wishlistDrawerOverlay) wishlistDrawerOverlay.classList.add('is-active');
  if (wishlistDrawer) {
    wishlistDrawer.classList.add('is-active');
    wishlistDrawer.setAttribute('aria-hidden', 'false');
  }
  if (wishlistHeaderBtn) wishlistHeaderBtn.setAttribute('aria-expanded', 'true');

  updateBodyScrollLock();
  renderWishlist();

  if (wishlistCloseBtn) {
    setTimeout(() => wishlistCloseBtn.focus(), 50);
  }
}

function closeWishlist() {
  SENORA_STATE.isWishlistOpen = false;

  if (wishlistDrawerOverlay) wishlistDrawerOverlay.classList.remove('is-active');
  if (wishlistDrawer) {
    wishlistDrawer.classList.remove('is-active');
    wishlistDrawer.setAttribute('aria-hidden', 'true');
  }
  if (wishlistHeaderBtn) {
    wishlistHeaderBtn.setAttribute('aria-expanded', 'false');
    wishlistHeaderBtn.focus();
  }

  updateBodyScrollLock();
}

function renderWishlist() {
  if (!wishlistItemsContainer) return;

  if (SENORA_STATE.wishlist.size === 0) {
    wishlistItemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <p>Your Wishlist is empty</p>
        <span style="font-size: 0.8125rem; color: var(--color-stone);">Tap the heart icon on any piece to save it for private viewing.</span>
      </div>
    `;
    return;
  }

  const items = Array.from(SENORA_STATE.wishlist).map(id => SENORA_CATALOG.find(p => p.id === id)).filter(Boolean);

  wishlistItemsContainer.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="handleImageError(this)">
      <div class="cart-item-details">
        <div>
          <h4 class="cart-item-title">${item.title}</h4>
          <span class="cart-item-option">${item.category} • ${item.tag}</span>
        </div>
        <div class="cart-item-price">${formatPKR(item.price)}</div>
        <div class="cart-item-actions">
          <button class="btn btn-primary" type="button" style="padding: 0.45rem 0.9rem; font-size: 0.65rem;" data-action="wishlist-move-to-bag" data-id="${item.id}">
            Move to Bag
          </button>
          <button class="item-remove-btn" type="button" data-action="wishlist-remove" data-id="${item.id}">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

function initWishlist() {
  wishlistHeaderBtn = document.getElementById('wishlistHeaderBtn');
  wishlistDrawerOverlay = document.getElementById('wishlistDrawerOverlay');
  wishlistDrawer = document.getElementById('wishlistDrawer');
  wishlistCloseBtn = document.getElementById('wishlistCloseBtn');
  wishlistItemsContainer = document.getElementById('wishlistItemsContainer');
  wishlistExploreBtn = document.getElementById('wishlistExploreBtn');
  const wishlistButtons = document.querySelectorAll('[data-action="toggle-wishlist"]');

  if (wishlistHeaderBtn) wishlistHeaderBtn.addEventListener('click', openWishlist);
  if (wishlistCloseBtn) wishlistCloseBtn.addEventListener('click', closeWishlist);
  if (wishlistDrawerOverlay) wishlistDrawerOverlay.addEventListener('click', closeWishlist);

  if (wishlistExploreBtn) {
    wishlistExploreBtn.addEventListener('click', () => {
      closeWishlist();
      const target = document.getElementById('newArrivals');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Event Delegation for Wishlist Drawer Items
  if (wishlistItemsContainer) {
    wishlistItemsContainer.addEventListener('click', (e) => {
      const moveBtn = e.target.closest('[data-action="wishlist-move-to-bag"]');
      if (moveBtn) {
        const id = moveBtn.getAttribute('data-id');
        addToCart(id);
        SENORA_STATE.wishlist.delete(id);
        syncProductWishlistButtons();
        updateWishlistBadge();
        renderWishlist();
        closeWishlist();
        openCart();
        return;
      }

      const removeBtn = e.target.closest('[data-action="wishlist-remove"]');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-id');
        const item = SENORA_CATALOG.find(p => p.id === id);
        SENORA_STATE.wishlist.delete(id);
        syncProductWishlistButtons();
        updateWishlistBadge();
        renderWishlist();
        showToast(`Removed "${item ? item.title : 'piece'}" from your Wishlist.`);
      }
    });
  }

  syncProductWishlistButtons();
  updateWishlistBadge();
  renderWishlist();
}

/* ==========================================================================
   6. Search Overlay Modal
   ========================================================================== */
let searchToggleBtn = null;
let searchModal = null;
let searchCloseBtn = null;
let searchInput = null;

function openSearch() {
  if (SENORA_STATE.isCartOpen) closeCart();
  if (SENORA_STATE.isWishlistOpen) closeWishlist();
  if (SENORA_STATE.isMobileNavOpen) closeMobileNav();

  SENORA_STATE.isSearchOpen = true;

  if (searchModal) {
    searchModal.classList.add('is-active');
    searchModal.setAttribute('aria-hidden', 'false');
  }
  if (searchToggleBtn) searchToggleBtn.setAttribute('aria-expanded', 'true');

  updateBodyScrollLock();

  if (searchInput) {
    searchInput.value = '';
    renderSearchResults('');
    setTimeout(() => searchInput.focus(), 60);
  }
}

function closeSearch() {
  SENORA_STATE.isSearchOpen = false;

  if (searchModal) {
    searchModal.classList.remove('is-active');
    searchModal.setAttribute('aria-hidden', 'true');
  }
  if (searchToggleBtn) {
    searchToggleBtn.setAttribute('aria-expanded', 'false');
    searchToggleBtn.focus();
  }

  updateBodyScrollLock();
}

function renderSearchResults(query) {
  const resultsContainer = document.getElementById('searchResultsList');
  if (!resultsContainer) return;

  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    resultsContainer.innerHTML = `
      <div style="font-size: 0.8125rem; color: var(--color-stone); padding: 1.25rem 0;">
        Start typing to explore abayas, co-ords, luxury outerwear, and silks.
      </div>
    `;
    return;
  }

  const matches = SENORA_CATALOG.filter(item => 
    item.title.toLowerCase().includes(cleanQuery) ||
    item.category.toLowerCase().includes(cleanQuery) ||
    item.tag.toLowerCase().includes(cleanQuery)
  );

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div style="font-size: 0.8125rem; color: var(--color-stone-muted); padding: 1.5rem 0;">
        No atelier pieces found matching "<strong>${query}</strong>". Explore our popular categories above.
      </div>
    `;
    return;
  }

  // Render search results: clicking does NOT automatically add to bag!
  // Instead, provides option to View Silhouette (scroll to piece) or explicit Quick Add button.
  resultsContainer.innerHTML = matches.map(item => `
    <div class="search-result-item" data-id="${item.id}" role="button" tabindex="0" aria-label="View ${item.title}">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <img src="${item.image}" alt="${item.title}" style="width: 44px; height: 56px; object-fit: cover; background: var(--color-ivory);" onerror="handleImageError(this)">
        <div>
          <strong style="display: block;">${item.title}</strong>
          <span style="font-size: 0.75rem; color: var(--color-stone);">${item.category} • ${item.tag}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="font-weight: 600; font-size: 0.875rem;">${formatPKR(item.price)}</span>
        <button type="button" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.65rem;" data-action="search-quick-add" data-id="${item.id}" aria-label="Add ${item.title} to bag">
          Add
        </button>
      </div>
    </div>
  `).join('');
}

function initSearchModal() {
  searchToggleBtn = document.getElementById('searchToggleBtn');
  searchModal = document.getElementById('searchModal');
  searchCloseBtn = document.getElementById('searchCloseBtn');
  searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('searchResultsList');
  const searchTags = document.querySelectorAll('.search-tag');

  if (searchToggleBtn) searchToggleBtn.addEventListener('click', openSearch);
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearch);

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  searchTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const text = tag.textContent.trim();
      if (searchInput) {
        searchInput.value = text;
        renderSearchResults(text);
      }
    });
  });

  // Handle Search Result interactions
  if (resultsContainer) {
    resultsContainer.addEventListener('click', (e) => {
      // If user clicked the explicit "Add" button
      const addBtn = e.target.closest('[data-action="search-quick-add"]');
      if (addBtn) {
        e.stopPropagation();
        const id = addBtn.getAttribute('data-id');
        addToCart(id);
        closeSearch();
        return;
      }

      // If user clicked the search result item to inspect the product
      const itemEl = e.target.closest('.search-result-item');
      if (itemEl) {
        const id = itemEl.getAttribute('data-id');
        const product = SENORA_CATALOG.find(p => p.id === id);
        closeSearch();

        // Scroll to the product on page & highlight
        const targetCard = document.querySelector(`.product-card[data-product-id="${id}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.add('search-highlight');
          setTimeout(() => targetCard.classList.remove('search-highlight'), 2200);
          showToast(`Viewing "${product ? product.title : 'piece'}" in the Atelier showcase.`);
        } else {
          showToast(`Selected "${product ? product.title : 'piece'}".`);
        }
      }
    });
  }
}

/* ==========================================================================
   7. Mobile Navigation Drawer & Dedicated Overlay
   ========================================================================== */
let mobileNavToggle = null;
let mobileNavDrawer = null;
let mobileNavClose = null;
let mobileNavOverlay = null;

function openMobileNav() {
  if (SENORA_STATE.isCartOpen) closeCart();
  if (SENORA_STATE.isWishlistOpen) closeWishlist();
  if (SENORA_STATE.isSearchOpen) closeSearch();

  SENORA_STATE.isMobileNavOpen = true;

  if (mobileNavOverlay) mobileNavOverlay.classList.add('is-active');
  if (mobileNavDrawer) {
    mobileNavDrawer.classList.add('is-active');
    mobileNavDrawer.setAttribute('aria-hidden', 'false');
  }
  if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', 'true');

  updateBodyScrollLock();

  if (mobileNavClose) {
    setTimeout(() => mobileNavClose.focus(), 50);
  }
}

function closeMobileNav() {
  SENORA_STATE.isMobileNavOpen = false;

  if (mobileNavOverlay) mobileNavOverlay.classList.remove('is-active');
  if (mobileNavDrawer) {
    mobileNavDrawer.classList.remove('is-active');
    mobileNavDrawer.setAttribute('aria-hidden', 'true');
  }
  if (mobileNavToggle) {
    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNavToggle.focus();
  }

  updateBodyScrollLock();
}

function initMobileNav() {
  mobileNavToggle = document.getElementById('mobileNavToggle');
  mobileNavDrawer = document.getElementById('mobileNavDrawer');
  mobileNavClose = document.getElementById('mobileNavClose');
  mobileNavOverlay = document.getElementById('mobileNavOverlay');

  if (mobileNavToggle) mobileNavToggle.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);

  if (mobileNavDrawer) {
    mobileNavDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }
}

/* ==========================================================================
   7b. Product Detail Modal
   ========================================================================== */

// Scoped modal state — resets on each open
let _modalTriggerEl = null;
let _modalProduct   = null;
let _modalSelected  = { colorIndex: 0, sizeIndex: 0, qty: 1 };

let _productModalBackdrop = null;
let _productModal         = null;
let _productModalClose    = null;
let _productModalBody     = null;

function openProductModal(productId, triggerEl) {
  const product = SENORA_CATALOG.find(p => p.id === productId);
  if (!product) return;

  // Close any other open overlays first
  if (SENORA_STATE.isCartOpen)      closeCart();
  if (SENORA_STATE.isWishlistOpen)  closeWishlist();
  if (SENORA_STATE.isSearchOpen)    closeSearch();
  if (SENORA_STATE.isMobileNavOpen) closeMobileNav();

  _modalTriggerEl = triggerEl || null;
  _modalProduct   = product;
  _modalSelected  = { colorIndex: 0, sizeIndex: 0, qty: 1 };

  SENORA_STATE.isProductModalOpen = true;
  updateBodyScrollLock();

  renderProductModal(product);

  if (_productModalBackdrop) _productModalBackdrop.classList.add('is-active');
  if (_productModal) {
    _productModal.classList.add('is-active');
    _productModal.setAttribute('aria-hidden', 'false');
  }

  // Focus close button after transition
  setTimeout(() => {
    if (_productModalClose) _productModalClose.focus();
  }, 80);
}

function closeProductModal() {
  SENORA_STATE.isProductModalOpen = false;
  updateBodyScrollLock();

  if (_productModalBackdrop) _productModalBackdrop.classList.remove('is-active');
  if (_productModal) {
    _productModal.classList.remove('is-active');
    _productModal.setAttribute('aria-hidden', 'true');
  }

  // Restore focus to whatever triggered the modal
  if (_modalTriggerEl) {
    setTimeout(() => { if (_modalTriggerEl) _modalTriggerEl.focus(); }, 50);
  }
  _modalTriggerEl = null;
  _modalProduct   = null;
}

function renderProductModal(product) {
  if (!_productModalBody) return;

  const isWishlisted = SENORA_STATE.wishlist.has(product.id);

  _productModalBody.innerHTML = `
    <div class="modal-gallery">
      ${product.tag ? `<span class="modal-gallery-badge">${product.tag}</span>` : ''}
      <img
        class="modal-main-img"
        id="modalMainImg"
        src="${product.image}"
        alt="${product.title}"
        onerror="handleImageError(this)"
      >
      <div class="modal-thumb-row" aria-label="Product images">
        <img
          class="modal-thumb is-active"
          src="${product.image}"
          alt="${product.title} — primary view"
          data-action="modal-thumb"
          data-src="${product.image}"
          onerror="handleImageError(this)"
        >
        <img
          class="modal-thumb"
          src="${product.hoverImage}"
          alt="${product.title} — alternate view"
          data-action="modal-thumb"
          data-src="${product.hoverImage}"
          onerror="handleImageError(this)"
        >
      </div>
    </div>

    <div class="modal-info">
      <span class="modal-category-tag">${product.categoryTag || product.category}</span>

      <h2 class="modal-product-title" id="modalProductTitle">${product.title}</h2>

      <div class="modal-price-row">
        <span class="modal-price">${formatPKR(product.price)}</span>
        ${product.tag ? `<span class="modal-product-tag">${product.tag}</span>` : ''}
      </div>

      <hr class="modal-divider">

      <p class="modal-description">${product.description || ''}</p>

      ${product.composition ? `<p class="modal-composition">${product.composition.replace(/\n/g, '<br>')}</p>` : ''}

      <div class="modal-shipping-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <span>Complimentary tracked shipping over PKR 25,000 · Atelier packaging included</span>
      </div>

      <hr class="modal-divider">

      <!-- Color selector -->
      <div class="modal-selector-group" role="group" aria-labelledby="modalColorLabel">
        <span class="modal-label" id="modalColorLabel">
          Colour — <span id="modalColorName">${product.colors[0]?.name || ''}</span>
        </span>
        <div class="modal-color-row" role="radiogroup" aria-label="Select colour">
          ${product.colors.map((c, i) => `
            <button
              class="modal-color-pill${i === 0 ? ' is-active' : ''}"
              type="button"
              data-action="modal-color"
              data-index="${i}"
              data-color-name="${c.name}"
              style="background-color: ${c.hex};"
              aria-label="${c.name}"
              aria-pressed="${i === 0 ? 'true' : 'false'}"
              title="${c.name}"
            ></button>
          `).join('')}
        </div>
      </div>

      <!-- Size selector -->
      <div class="modal-selector-group" role="group" aria-labelledby="modalSizeLabel">
        <div class="modal-size-header">
          <span class="modal-label" id="modalSizeLabel">Size</span>
          <span class="modal-size-guide-link" title="Bespoke tailored lengths available upon request">Bespoke Fitting Advice</span>
        </div>
        <div class="modal-size-row" role="radiogroup" aria-label="Select size">
          ${product.sizes.map((s, i) => `
            <button
              class="modal-size-btn${i === 0 ? ' is-active' : ''}"
              type="button"
              data-action="modal-size"
              data-index="${i}"
              aria-pressed="${i === 0 ? 'true' : 'false'}"
            >${s}</button>
          `).join('')}
        </div>
      </div>

      <!-- Quantity stepper -->
      <div>
        <span class="modal-label">Quantity</span>
        <div class="modal-qty-row" role="group" aria-label="Quantity">
          <button class="modal-qty-btn" type="button" data-action="modal-qty-dec" aria-label="Decrease quantity">−</button>
          <span class="modal-qty-value" id="modalQtyDisplay" aria-live="polite">1</span>
          <button class="modal-qty-btn" type="button" data-action="modal-qty-inc" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <!-- CTA buttons -->
      <div class="modal-cta-group">
        <button
          class="modal-add-to-bag-btn"
          type="button"
          data-action="modal-add-to-bag"
          aria-label="Add ${product.title} to Shopping Bag"
        >
          <span>Add to Shopping Bag</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        <button
          class="modal-wishlist-btn${isWishlisted ? ' is-wishlisted' : ''}"
          type="button"
          data-action="modal-toggle-wishlist"
          aria-pressed="${isWishlisted ? 'true' : 'false'}"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
        </button>
      </div>
    </div>
  `;
}

function addToCartFromModal() {
  if (!_modalProduct) return;
  const product = _modalProduct;

  const selectedColor = product.colors[_modalSelected.colorIndex];
  const selectedSize  = product.sizes[_modalSelected.sizeIndex];
  const qty           = _modalSelected.qty;

  const colorName = selectedColor ? selectedColor.name : 'Default';
  const sizeName  = selectedSize  || 'Standard';

  // Check if same product + same size + same color already in cart
  const existingItem = SENORA_STATE.cart.find(
    item => item.id === product.id && item.size === sizeName && item.color === colorName
  );

  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    SENORA_STATE.cart.push({
      id:       product.id,
      title:    product.title,
      price:    product.price,
      size:     sizeName,
      color:    colorName,
      quantity: qty,
      image:    product.image
    });
  }

  renderCart();
  showToast(`Added "${product.title}" (${sizeName}, ${colorName} × ${qty}) to your Shopping Bag.`);
  closeProductModal();
  openCart();
}

function initProductModal() {
  _productModalBackdrop = document.getElementById('productModalBackdrop');
  _productModal         = document.getElementById('productModal');
  _productModalClose    = document.getElementById('productModalClose');
  _productModalBody     = document.getElementById('productModalBody');

  // Close button
  if (_productModalClose) {
    _productModalClose.addEventListener('click', closeProductModal);
  }

  // Backdrop click
  if (_productModalBackdrop) {
    _productModalBackdrop.addEventListener('click', closeProductModal);
  }

  // Event delegation on modal body (all interactive controls)
  if (_productModalBody) {
    _productModalBody.addEventListener('click', (e) => {
      const el     = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.getAttribute('data-action');

      // Thumbnail switcher
      if (action === 'modal-thumb') {
        const src = el.getAttribute('data-src');
        const mainImg = document.getElementById('modalMainImg');
        if (mainImg && src && mainImg.src !== src) {
          mainImg.style.opacity = '0.35';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 120);
        }
        _productModalBody.querySelectorAll('[data-action="modal-thumb"]').forEach(t => t.classList.remove('is-active'));
        el.classList.add('is-active');
        return;
      }

      // Color selection
      if (action === 'modal-color') {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        _modalSelected.colorIndex = idx;

        _productModalBody.querySelectorAll('[data-action="modal-color"]').forEach((pill, i) => {
          pill.classList.toggle('is-active', i === idx);
          pill.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
        });

        const colorNameEl = document.getElementById('modalColorName');
        if (colorNameEl && _modalProduct) {
          colorNameEl.textContent = _modalProduct.colors[idx]?.name || '';
        }
        return;
      }

      // Size selection
      if (action === 'modal-size') {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        _modalSelected.sizeIndex = idx;

        _productModalBody.querySelectorAll('[data-action="modal-size"]').forEach((btn, i) => {
          btn.classList.toggle('is-active', i === idx);
          btn.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
        });
        return;
      }

      // Quantity decrease
      if (action === 'modal-qty-dec') {
        if (_modalSelected.qty > 1) {
          _modalSelected.qty--;
          const display = document.getElementById('modalQtyDisplay');
          if (display) display.textContent = _modalSelected.qty;
        }
        return;
      }

      // Quantity increase
      if (action === 'modal-qty-inc') {
        if (_modalSelected.qty < 10) {
          _modalSelected.qty++;
          const display = document.getElementById('modalQtyDisplay');
          if (display) display.textContent = _modalSelected.qty;
        }
        return;
      }

      // Add to bag
      if (action === 'modal-add-to-bag') {
        addToCartFromModal();
        return;
      }

      // Toggle wishlist from modal
      if (action === 'modal-toggle-wishlist') {
        if (!_modalProduct) return;
        const id = _modalProduct.id;
        if (SENORA_STATE.wishlist.has(id)) {
          SENORA_STATE.wishlist.delete(id);
          showToast(`Removed "${_modalProduct.title}" from your Wishlist.`);
        } else {
          SENORA_STATE.wishlist.add(id);
          showToast(`Added "${_modalProduct.title}" to your Wishlist.`);
        }
        syncProductWishlistButtons();
        updateWishlistBadge();
        renderWishlist();
        // Re-render the wishlist button inside the modal
        const wlBtn = el;
        const isNowWishlisted = SENORA_STATE.wishlist.has(id);
        wlBtn.classList.toggle('is-wishlisted', isNowWishlisted);
        wlBtn.setAttribute('aria-pressed', isNowWishlisted ? 'true' : 'false');
        wlBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${isNowWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${isNowWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
        `;
        return;
      }
    });
  }
}

/* ==========================================================================
   7c. Reusable Product Card Template & Global Card Event Delegation
   ========================================================================== */

// Exact replica of SENORA homepage New Arrivals card structure
function createProductCardHTML(product, index = 0) {
  const isWishlisted = SENORA_STATE.wishlist.has(product.id);
  const staggerClass = `stagger-${(index % 4) + 1}`;
  const swatchesHtml = (product.colors || []).map((c, i) => `
    <span class="swatch${i === 0 ? ' active' : ''}" style="background-color: ${c.hex};" title="${c.name}"></span>
  `).join('');

  return `
    <article class="product-card reveal-fade is-revealed ${staggerClass}" data-product-id="${product.id}">
      <div class="product-media" data-action="open-detail" data-product-id="${product.id}" style="cursor: pointer;" title="View ${product.title} details">
        <span class="product-badge">${(product.tag || product.category).toUpperCase()}</span>
        <button class="product-wishlist-btn${isWishlisted ? ' is-active' : ''}" type="button" data-action="toggle-wishlist" data-product-id="${product.id}" aria-label="${isWishlisted ? 'Remove' : 'Save'} ${product.title} ${isWishlisted ? 'from' : 'to'} wishlist" aria-pressed="${isWishlisted ? 'true' : 'false'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        <img 
          src="${product.image}" 
          alt="${product.title}" 
          class="product-img"
          loading="lazy"
          onerror="handleImageError(this)"
        >
        <img 
          src="${product.hoverImage}" 
          alt="${product.title} alternate view" 
          class="product-img-hover"
          loading="lazy"
          onerror="handleImageError(this)"
        >

        <div class="product-quick-add">
          <button class="btn-quick-add" type="button" data-action="quick-add" data-product-id="${product.id}">
            Quick Add
          </button>
          <button class="btn-quick-view" type="button" data-action="open-detail" data-product-id="${product.id}">
            View Details
          </button>
        </div>
      </div>

      <div class="product-details">
        <span class="product-category-tag">${product.categoryTag || product.category}</span>
        <h3 class="product-title"><a href="#productDetail" data-action="open-detail" data-product-id="${product.id}">${product.title}</a></h3>
        <div class="product-meta-row">
          <span class="product-price">${formatPKR(product.price)}</span>
          <div class="product-swatches" aria-label="Color options">
            ${swatchesHtml}
          </div>
        </div>
      </div>
    </article>
  `;
}

// Global delegated listener for product cards (supports both static and dynamically filtered cards)
function initProductCardDelegation() {
  document.addEventListener('click', (e) => {
    // 1. Wishlist Heart Toggle
    const wishlistBtn = e.target.closest('[data-action="toggle-wishlist"]');
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = wishlistBtn.getAttribute('data-product-id');
      if (id) {
        const item = SENORA_CATALOG.find(p => p.id === id);
        const itemTitle = item ? item.title : 'piece';

        if (SENORA_STATE.wishlist.has(id)) {
          SENORA_STATE.wishlist.delete(id);
          showToast(`Removed "${itemTitle}" from your Wishlist.`);
        } else {
          SENORA_STATE.wishlist.add(id);
          showToast(`Added "${itemTitle}" to your Wishlist.`);
        }

        syncProductWishlistButtons();
        updateWishlistBadge();
        renderWishlist();
      }
      return;
    }

    // 2. Quick Add
    const quickAddBtn = e.target.closest('[data-action="quick-add"]');
    if (quickAddBtn) {
      e.preventDefault();
      e.stopPropagation();
      const productId = quickAddBtn.getAttribute('data-product-id');
      if (productId) addToCart(productId);
      return;
    }

    // 3. Open Detail Modal
    const detailTrigger = e.target.closest('[data-action="open-detail"]');
    if (detailTrigger) {
      if (e.target.closest('[data-action="toggle-wishlist"]') || e.target.closest('[data-action="quick-add"]')) {
        return;
      }
      e.preventDefault();
      const productId = detailTrigger.getAttribute('data-product-id');
      if (productId) openProductModal(productId, detailTrigger);
      return;
    }

    // 4. Color Swatches
    const swatch = e.target.closest('.product-swatches .swatch');
    if (swatch) {
      e.preventDefault();
      e.stopPropagation();
      const group = swatch.closest('.product-swatches');
      if (group) {
        group.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const colorTitle = swatch.getAttribute('title') || 'Selected shade';
        showToast(`Selected shade: ${colorTitle}`);
      }
      return;
    }
  });
}

/* ==========================================================================
   7d. Shop All / Collection Page Controller
   ========================================================================== */
function initShopPage() {
  const shopGrid = document.getElementById('shopProductsGrid');
  if (!shopGrid) return; // Only executes on shop.html

  const filterPills = document.querySelectorAll('.filter-pill');
  const sortSelect = document.getElementById('collectionSortSelect');
  const countDisplay = document.getElementById('collectionCount');
  const emptyState = document.getElementById('collectionEmptyState');
  const resetBtn = document.getElementById('resetFiltersBtn');

  let activeCategory = 'all';
  let activeSort = 'featured';

  function parseHashCategory() {
    const raw = window.location.hash.replace('#', '').toLowerCase();
    if (!raw) return 'all';
    if (raw === 'abayas' || raw === 'abaya') return 'abayas';
    if (raw === 'coords' || raw === 'co-ords' || raw === 'coord') return 'coords';
    if (raw === 'dresses' || raw === 'dress') return 'dresses';
    if (raw === 'outerwear' || raw === 'layers') return 'outerwear';
    return 'all';
  }

  function renderFilteredCollection() {
    // 1. Filter by category
    let list = SENORA_CATALOG.filter(item => {
      if (activeCategory === 'all') return true;
      const cat = item.category.toLowerCase().replace(/[^a-z]/g, '');
      const filterKey = activeCategory.replace(/[^a-z]/g, '');
      return cat === filterKey;
    });

    // 2. Sort
    if (activeSort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      // 'featured' maintains catalogue curated sequence
      list.sort((a, b) => {
        return SENORA_CATALOG.findIndex(p => p.id === a.id) - SENORA_CATALOG.findIndex(p => p.id === b.id);
      });
    }

    // 3. Update count display
    if (countDisplay) {
      countDisplay.textContent = `Showing ${list.length} ${list.length === 1 ? 'Piece' : 'Pieces'}`;
    }

    // 4. Update empty state or render grid
    if (list.length === 0) {
      shopGrid.innerHTML = '';
      shopGrid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      shopGrid.style.display = 'grid';
      shopGrid.innerHTML = list.map((item, idx) => createProductCardHTML(item, idx)).join('');
    }

    // 5. Update active filter pills UI
    filterPills.forEach(pill => {
      const cat = pill.getAttribute('data-category');
      const isActive = cat === activeCategory;
      pill.classList.toggle('is-active', isActive);
      pill.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // 6. Sync wishlist hearts & trigger reveals
    syncProductWishlistButtons();
    initScrollReveals();
  }

  // Filter click handlers
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.getAttribute('data-category') || 'all';
      if (activeCategory !== 'all') {
        history.replaceState(null, '', `#${activeCategory}`);
      } else {
        history.replaceState(null, '', window.location.pathname);
      }
      renderFilteredCollection();
    });
  });

  // Sort dropdown handler
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      renderFilteredCollection();
    });
  }

  // Empty state reset filters button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeCategory = 'all';
      if (sortSelect) sortSelect.value = 'featured';
      activeSort = 'featured';
      history.replaceState(null, '', window.location.pathname);
      renderFilteredCollection();
    });
  }

  // Listen for hash changes (e.g. from footer links or browser navigation)
  window.addEventListener('hashchange', () => {
    activeCategory = parseHashCategory();
    renderFilteredCollection();
  });

  // Initial load
  activeCategory = parseHashCategory();
  renderFilteredCollection();
}

/* ==========================================================================
   8. Global Keyboard Handler (Escape Key & Focus Trap)

   ========================================================================== */
function initKeyboardAccessibility() {
  window.addEventListener('keydown', (e) => {
    // Escape Key: close whichever overlay is currently open
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (SENORA_STATE.isProductModalOpen) {
        closeProductModal();
      } else if (SENORA_STATE.isCartOpen) {
        closeCart();
      } else if (SENORA_STATE.isWishlistOpen) {
        closeWishlist();
      } else if (SENORA_STATE.isSearchOpen) {
        closeSearch();
      } else if (SENORA_STATE.isMobileNavOpen) {
        closeMobileNav();
      }
    }

    // Tab Key: Trap focus inside active dialogs
    if (e.key === 'Tab') {
      if (SENORA_STATE.isProductModalOpen && _productModal) {
        trapFocus(_productModal, e);
      } else if (SENORA_STATE.isCartOpen && cartDrawer) {
        trapFocus(cartDrawer, e);
      } else if (SENORA_STATE.isWishlistOpen && wishlistDrawer) {
        trapFocus(wishlistDrawer, e);
      } else if (SENORA_STATE.isSearchOpen && searchModal) {
        trapFocus(searchModal, e);
      } else if (SENORA_STATE.isMobileNavOpen && mobileNavDrawer) {
        trapFocus(mobileNavDrawer, e);
      }
    }
  });
}

/* ==========================================================================
   9. Validated Newsletter ("The Salon Privé" — Demo Only)
   ========================================================================== */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const input = document.getElementById('newsletterEmail');
  const feedback = document.getElementById('newsletterFeedback');

  if (!form || !input || !feedback) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();

    if (!value) {
      feedback.textContent = 'Please provide an email address.';
      feedback.className = 'newsletter-feedback error';
      input.focus();
      return;
    }

    if (!emailRegex.test(value)) {
      feedback.textContent = 'Please enter a valid email format (e.g., name@domain.com).';
      feedback.className = 'newsletter-feedback error';
      input.focus();
      return;
    }

    // Success State (Client-Side Demo: Clearly transparent that no data was submitted)
    feedback.textContent = 'Demo preview: Thank you for your interest. In this frontend demo, no email is stored or sent to a server.';
    feedback.className = 'newsletter-feedback success';
    input.value = '';
    
    showToast('Demo preview: Email format validated.');
  });
}

/* ==========================================================================
   10. Intersection Observer for Scroll Reveals
   ========================================================================== */
function initScrollReveals() {
  const elements = document.querySelectorAll('.reveal-fade');
  if (!elements.length) return;

  // Reduced motion compliance: reveal instantly without animations
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  // Immediately reveal hero section elements for a crisp first-viewport appearance
  document.querySelectorAll('.hero-section .reveal-fade').forEach(el => {
    el.classList.add('is-revealed');
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   11. Image Error Fallback Handler
   ========================================================================== */
function handleImageError(img) {
  if (!img) return;
  img.onerror = null; // Prevent recursion
  
  // High-fashion minimalist SVG fallback placeholder
  const svgPlaceholder = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
      <rect width="600" height="800" fill="#F4F0E9"/>
      <rect x="20" y="20" width="560" height="760" fill="none" stroke="#E5E0D8" stroke-width="1"/>
      <text x="300" y="380" font-family="Georgia, serif" font-size="28" fill="#111111" letter-spacing="6" text-anchor="middle">SENORA</text>
      <text x="300" y="420" font-family="-apple-system, sans-serif" font-size="12" fill="#8B8985" letter-spacing="4" text-anchor="middle">MODEST ATELIER</text>
      <line x1="260" y1="440" x2="340" y2="440" stroke="#8B8985" stroke-width="1"/>
    </svg>
  `;
  
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgPlaceholder);
}
window.handleImageError = handleImageError;

/* ==========================================================================
   12. Application Initialization
   ========================================================================== */

/* ==========================================================================
   Navigation active-state (page + in-page section tracking)
   ========================================================================== */
function initNavActiveState() {
  const links = document.querySelectorAll('[data-nav]');
  if (!links.length) return;

  const setActive = (key) => {
    links.forEach(a => {
      const on = a.getAttribute('data-nav') === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  };

  if (document.body.classList.contains('page-shop')) { setActive('shop'); return; }
  if (document.body.classList.contains('page-collections')) { setActive('collections'); return; }
  if (document.body.classList.contains('page-lookbook')) { setActive('lookbook'); return; }
  if (document.body.classList.contains('page-story')) { setActive('story'); return; }
  if (document.body.classList.contains('page-info')) { setActive(''); return; }

  const marks = [
  ].filter(m => m[1]);

  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.35;
    let current = 'home';
    // Sections are ordered top-to-bottom; the last one whose top has passed the line wins
    marks.sort((a, b) => a[1].offsetTop - b[1].offsetTop).forEach(([key, el]) => {
      if (el.getBoundingClientRect().top <= line) current = key;
    });
    setActive(current);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ==========================================================================
   Collections page: product rows, Shop-the-Look hotspots, side index
   ========================================================================== */
function initCollectionsPage() {
  if (!document.body.classList.contains('page-collections') && !document.body.classList.contains('page-lookbook')) return;

  // 1. Product rows under each collection (same card as homepage / shop)
  document.querySelectorAll('[data-collection-products]').forEach(row => {
    const ids = (row.getAttribute('data-collection-products') || '').split(',').map(s => s.trim());
    const items = ids.map(id => SENORA_CATALOG.find(p => p.id === id)).filter(Boolean);
    row.innerHTML = items.map((item, idx) => createProductCardHTML(item, idx)).join('');
  });
  syncProductWishlistButtons();

  // 2. Shop-the-Look tooltips
  document.querySelectorAll('.look-tip').forEach(tip => {
    const item = SENORA_CATALOG.find(p => p.id === tip.getAttribute('data-look-product'));
    if (!item) { tip.remove(); return; }
    tip.innerHTML = `
      <span class="look-tip-cat">${item.categoryTag || item.category}</span>
      <strong class="look-tip-title">${item.title}</strong>
      <span class="look-tip-price">${formatPKR(item.price)}</span>
      <span class="look-tip-actions">
        <button type="button" data-action="quick-add" data-product-id="${item.id}">Add To Bag</button>
        <button type="button" data-action="open-detail" data-product-id="${item.id}">Details</button>
      </span>`;
  });

  const spots = Array.from(document.querySelectorAll('.look-spot'));
  const closeAll = (except) => spots.forEach(s => {
    if (s !== except) {
      s.classList.remove('is-open');
      const b = s.querySelector('.look-dot');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  });
  spots.forEach(spot => {
    const dot = spot.querySelector('.look-dot');
    if (!dot) return;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !spot.classList.contains('is-open');
      closeAll(spot);
      spot.classList.toggle('is-open', open);
      dot.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.look-spot')) closeAll(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

  // 3. Side index: highlight the collection currently in view
  const links = document.querySelectorAll('[data-coll-link]');
  const blocks = Array.from(document.querySelectorAll('[data-coll]'));
  const index = document.querySelector('.coll-index');
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.4;
    let current = null;
    blocks.forEach(b => { const r = b.getBoundingClientRect(); if (r.top <= line && r.bottom > line) current = b.id; });
    links.forEach(a => a.classList.toggle('is-active', a.getAttribute('data-coll-link') === current));
    if (index) index.classList.toggle('is-visible', !!current);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ==========================================================================
   Lookbook page: full-screen viewer, occasion filter, film
   ========================================================================== */
function initLookbookPage() {
  if (!document.body.classList.contains('page-lookbook')) return;

  const viewer = document.getElementById('lbViewer');
  if (!viewer) return;
  const $ = (id) => document.getElementById(id);
  const img = $('lbViewerImg'), titleEl = $('lbViewerTitle'), subEl = $('lbViewerSub');
  const countEl = $('lbViewerCount'), priceEl = $('lbViewerPrice'), noteEl = $('lbViewerNote');
  const noteOnly = $('lbViewerNoteOnly'), shopBox = $('lbViewerShop');
  const addBtn = $('lbViewerAdd'), detBtn = $('lbViewerDetails'), saveBtn = $('lbViewerSave');
  const closeBtn = $('lbClose'), prevBtn = $('lbPrev'), nextBtn = $('lbNext'), copyBtn = $('lbViewerCopy');

  let list = [], pos = 0, lastFocus = null;

  const big = (src) => src.replace(/w=\d+/, 'w=1600');
  const visibleItems = (group) => Array.from(document.querySelectorAll(`[data-lb-group="${group}"] [data-lb]`))
    .filter(el => !el.hidden && el.offsetParent !== null);

  function render() {
    const el = list[pos];
    if (!el) return;
    const src = el.querySelector('img').getAttribute('src');
    img.src = big(src);
    img.alt = el.querySelector('img').alt;
    titleEl.textContent = el.getAttribute('data-lb-title');
    subEl.textContent = el.getAttribute('data-lb-sub');
    countEl.textContent = `${String(pos + 1).padStart(2, '0')} of ${String(list.length).padStart(2, '0')}`;
    const note = el.getAttribute('data-lb-note') || '';
    const pid = el.getAttribute('data-lb-product');
    const product = pid ? SENORA_CATALOG.find(p => p.id === pid) : null;

    if (product) {
      shopBox.hidden = false; noteOnly.hidden = true;
      priceEl.textContent = `${product.title}  ·  ${formatPKR(product.price)}`;
      noteEl.textContent = note;
      [addBtn, detBtn, saveBtn].forEach(b => b.setAttribute('data-product-id', pid));
      syncProductWishlistButtons();
    } else {
      shopBox.hidden = true; noteOnly.hidden = false;
      noteOnly.textContent = note;
    }
    const multi = list.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;
    // Preload neighbours
    [pos + 1, pos - 1].forEach(i => {
      const n = list[(i + list.length) % list.length];
      if (n) { const im = new Image(); im.src = big(n.querySelector('img').getAttribute('src')); }
    });
  }

  function open(el) {
    const group = el.closest('[data-lb-group]');
    list = visibleItems(group ? group.getAttribute('data-lb-group') : 'chapters');
    pos = Math.max(0, list.indexOf(el));
    lastFocus = document.activeElement;
    render();
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lb-open');
    history.replaceState(null, '', '#' + el.getAttribute('data-lb-id'));
    closeBtn.focus();
  }

  function close() {
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lb-open');
    history.replaceState(null, '', window.location.pathname);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  const step = (d) => {
    if (list.length < 2) return;
    pos = (pos + d + list.length) % list.length;
    img.classList.add('is-changing');
    setTimeout(() => { render(); img.classList.remove('is-changing'); }, 160);
  };

  // Open from any look (mouse: whole photo; keyboard: expand button)
  document.addEventListener('click', (e) => {
    if (viewer.contains(e.target)) return;
    if (e.target.closest('.look-spot')) return;
    const item = e.target.closest('[data-lb]');
    if (item) open(item);
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.classList.contains('lb-v-stage')) close(); });

  document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('is-open')) return;
    if (SENORA_STATE.isProductModalOpen || SENORA_STATE.isCartOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      const f = Array.from(viewer.querySelectorAll('button')).filter(b => !b.hidden && b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe
  let tx = 0;
  viewer.addEventListener('touchstart', (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Copy link
  copyBtn.addEventListener('click', async () => {
    const el = list[pos];
    const url = window.location.href.split('#')[0] + '#' + (el ? el.getAttribute('data-lb-id') : '');
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link to this look copied.');
    } catch (err) {
      showToast('Copy is not available in this browser.');
    }
  });

  // Deep link: lookbook.html#f3 opens that look
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const target = document.querySelector(`[data-lb-id="${CSS.escape(hash)}"]`);
    if (target) setTimeout(() => open(target), 400);
  }

  // Occasion filter
  const pills = document.querySelectorAll('[data-occasion-filter]');
  const cards = document.querySelectorAll('#lbGrid [data-lb]');
  const count = document.getElementById('lbCount');
  pills.forEach(p => p.addEventListener('click', () => {
    const f = p.getAttribute('data-occasion-filter');
    let n = 0;
    cards.forEach(c => {
      const show = f === 'all' || (c.getAttribute('data-occasion') || '').split(' ').includes(f);
      c.hidden = !show;
      if (show) n++;
    });
    pills.forEach(x => { const on = x === p; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (count) count.textContent = `Showing ${n} ${n === 1 ? 'look' : 'looks'}`;
  }));

  // Film
  const film = document.getElementById('film');
  const play = document.getElementById('lbPlay');
  if (film && play) play.addEventListener('click', () => {
    const src = film.getAttribute('data-video-src');
    if (!src) { showToast('The campaign film premieres soon.'); return; }
    const stage = document.getElementById('lbFilmStage');
    const v = document.createElement('video');
    v.src = src; v.controls = true; v.autoplay = true; v.playsInline = true;
    v.className = 'lb-film-video';
    stage.innerHTML = '';
    stage.appendChild(v);
  });
}

/* ==========================================================================
   Story page: timeline progress + number counters
   ========================================================================== */
function initStoryPage() {
  if (!document.body.classList.contains('page-story')) return;

  // Timeline: gold line fills as the section scrolls past
  const line = document.getElementById('storyLine');
  if (line) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = line.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      line.style.setProperty('--progress', p.toFixed(3));
      line.querySelectorAll('.story-step').forEach(step => {
        step.classList.toggle('is-reached', step.getBoundingClientRect().top < vh * 0.62);
      });
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Counters: only animate when a real number has been provided via data-count
  const counters = document.querySelectorAll('.story-count');
  const run = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    const suffix = el.getAttribute('data-suffix') || '';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { el.textContent = target.toLocaleString() + suffix; return; }
    const start = performance.now(), dur = 1600;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  } else {
    counters.forEach(run);
  }
}

/* ==========================================================================
   Help pages: contents highlight, FAQ search/filter, concierge booking form
   ========================================================================== */
function initInfoPages() {
  if (!document.body.classList.contains('page-info')) return;

  // Placeholder contact links should not jump to the top of the page
  document.querySelectorAll('[data-placeholder-link]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  // Table of contents: highlight the section being read
  const tocLinks = Array.from(document.querySelectorAll('[data-toc]'));
  if (tocLinks.length > 1) {
    const targets = tocLinks.map(a => document.getElementById(a.getAttribute('data-toc'))).filter(Boolean);
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.3;
      let current = targets[0] && targets[0].id;
      targets.forEach(t => { if (t.getBoundingClientRect().top <= line) current = t.id; });
      tocLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('data-toc') === current));
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // FAQ: live search + topic filter
  const search = document.getElementById('faqSearch');
  const items = Array.from(document.querySelectorAll('.faq-item'));
  if (search && items.length) {
    const pills = document.querySelectorAll('[data-faq-cat]');
    const empty = document.getElementById('faqEmpty');
    let cat = 'all';
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(it => {
        const okCat = cat === 'all' || it.getAttribute('data-cat') === cat;
        const okText = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !(okCat && okText);
        if (!it.hidden) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    };
    search.addEventListener('input', apply);
    pills.forEach(p => p.addEventListener('click', () => {
      cat = p.getAttribute('data-faq-cat');
      pills.forEach(x => { const on = x === p; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      apply();
    }));
  }

  initConciergeForm();
}

function initConciergeForm() {
  const form = document.getElementById('apptForm');
  if (!form) return;
  const $ = (id) => document.getElementById(id);

  // Earliest bookable date is tomorrow
  const dateEl = $('apptDate');
  const t = new Date(); t.setDate(t.getDate() + 1);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  dateEl.min = iso(t);

  const setError = (id, msg) => {
    const input = $(id), err = $('err-' + id);
    if (!input || !err) return;
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  };
  ['apptName', 'apptPhone', 'apptEmail', 'apptCity', 'apptDate'].forEach(id => {
    const n = $(id);
    n.addEventListener('input', () => setError(id, ''));
    n.addEventListener('change', () => setError(id, ''));
  });

  document.querySelectorAll('.appt-slot input').forEach(r => r.addEventListener('change', () => {
    document.querySelectorAll('.appt-slot').forEach(l => l.classList.toggle('is-selected', l.querySelector('input').checked));
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('apptName').value.trim();
    const email = $('apptEmail').value.trim();
    const phone = $('apptPhone').value.replace(/\D/g, '');
    const city = $('apptCity').value;
    const date = $('apptDate').value;

    setError('apptName', name.length < 2 ? 'Please enter your full name.' : '');
    setError('apptPhone', !phone ? 'Please enter a mobile number.' : (phone.length >= 10 && phone.length <= 13 ? '' : 'Please enter a valid number, like 0300 1234567.'));
    setError('apptEmail', !email ? 'Please enter your email address.' : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : 'Please enter a valid email, like name@example.com.'));
    setError('apptCity', city ? '' : 'Please choose a salon.');
    setError('apptDate', !date ? 'Please choose a date.' : (date < dateEl.min ? 'Please choose a date from tomorrow onwards.' : ''));

    const bad = ['apptName', 'apptPhone', 'apptEmail', 'apptCity', 'apptDate'].map($).find(n => n.getAttribute('aria-invalid') === 'true');
    if (bad) { bad.focus(); return; }

    const slot = (form.querySelector('input[name="slot"]:checked') || {}).value || 'Morning';
    const pretty = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    $('apptThanks').textContent = name.split(' ')[0] + '.';
    $('apptSummary').textContent = `We have noted a ${$('apptPurpose').value.toLowerCase()} visit at our ${city} salon on ${pretty}, in the ${slot.toLowerCase()}.`;
    form.hidden = true;
    const ok = $('apptSuccess');
    ok.hidden = false;
    ok.focus({ preventScroll: true });
    $('apptCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('apptAgain').addEventListener('click', () => {
    form.reset();
    document.querySelectorAll('.appt-slot').forEach(l => l.classList.toggle('is-selected', l.querySelector('input').checked));
    $('apptSuccess').hidden = true;
    form.hidden = false;
    $('apptName').focus();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavActiveState();
  initInfoPages();
  initCollectionsPage();
  initLookbookPage();
  initStoryPage();
  initHeaderScroll();
  initCartDrawer();
  initWishlist();
  initSearchModal();
  initProductModal();
  initProductCardDelegation();
  initShopPage();
  initMobileNav();
  initKeyboardAccessibility();
  initNewsletter();
  initScrollReveals();
  
  // Attach fallback handlers to all images on page
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => handleImageError(img));
  });

  console.log('SENORA — Luxury Modest Fashion Atelier initialized successfully.');
});
