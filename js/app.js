// ===== AUTH SYSTEM =====
function getUsers() {
  return JSON.parse(localStorage.getItem('vf_users') || '[]');
}
function saveUsers(users) {
  localStorage.setItem('vf_users', JSON.stringify(users));
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const errEl = document.getElementById('reg-error');

  if (!name || !email || !password || !confirm) {
    errEl.textContent = 'Vui lòng điền đầy đủ thông tin';
    return;
  }
  if (password !== confirm) {
    errEl.textContent = 'Mật khẩu xác nhận không khớp';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Mật khẩu phải ít nhất 6 ký tự';
    return;
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    errEl.textContent = 'Email đã được sử dụng';
    return;
  }
  const user = { name, email, password, id: Date.now() };
  users.push(user);
  saveUsers(users);
  AppState.setUser({ name, email, id: user.id });
  localStorage.setItem('vf_session', email);
  closeAuthModal();
  updateUserUI();
  showToast('Đăng ký thành công! Chào mừng ' + name);
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    errEl.textContent = 'Email hoặc mật khẩu không đúng';
    return;
  }
  AppState.setUser({ name: user.name, email: user.email, id: user.id });
  localStorage.setItem('vf_session', email);
  closeAuthModal();
  updateUserUI();
  showToast('Chào mừng, ' + user.name + '!');
}

function handleLogout() {
  AppState.clearUser();
  updateUserUI();
  showToast('Đã đăng xuất');
}

function openAuthModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('active');
  switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('reg-form').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent = '';
}

function updateUserUI() {
  const user = AppState.user;
  const loginBtn = document.getElementById('nav-login-btn');
  const regBtn = document.getElementById('nav-reg-btn');
  const userMenu = document.getElementById('nav-user-menu');
  const userName = document.getElementById('nav-username');
  
  const mobLoginBtn = document.getElementById('mob-login-btn');
  const mobRegBtn = document.getElementById('mob-reg-btn');
  const mobUserActions = document.getElementById('mob-user-actions');

  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userName) userName.textContent = user.name;
    
    const avatarLetter = document.getElementById('user-avatar-letter');
    if (avatarLetter && user.name) {
      avatarLetter.textContent = user.name.charAt(0).toUpperCase();
    }
    
    if (mobLoginBtn) mobLoginBtn.style.display = 'none';
    if (mobRegBtn) mobRegBtn.style.display = 'none';
    if (mobUserActions) mobUserActions.style.display = 'flex';
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (regBtn) regBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
    
    if (mobLoginBtn) mobLoginBtn.style.display = '';
    if (mobRegBtn) mobRegBtn.style.display = '';
    if (mobUserActions) mobUserActions.style.display = 'none';
  }
}

// ===== HEADER / NAV SCROLL =====
function initHeader() {
  const header = document.getElementById('main-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });

  // Mobile menu toggle
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }
}

// ===== CART SIDEBAR =====
function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCart();
}
function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCart() {
  const body = document.getElementById('cart-body');
  const totalEl = document.getElementById('cart-total-price');
  if (!body) return;

  if (AppState.cart.length === 0) {
    body.innerHTML = `<div class="cart-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13l-1-4M10 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/></svg><p data-i18n="cart_empty">${t('cart_empty')}</p></div>`;
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  let total = 0;
  body.innerHTML = AppState.cart.map((item, i) => {
    const subtotal = item.unitPrice * item.qty;
    total += subtotal;
    const colorInfo = AppState.lang === 'vi' ? item.color : item.color;
    const batteryInfo = AppState.lang === 'vi' ? item.battery : item.batteryEn;
    return `
    <div class="cart-item" data-index="${i}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name} <span class="cart-item-version">${item.version}</span></div>
        <div class="cart-item-meta">
          <span class="color-dot" style="background:${item.colorHex}"></span>${colorInfo}
        </div>
        <div class="cart-item-meta">${batteryInfo}</div>
        <div class="cart-item-price">${formatPrice(item.unitPrice)}</div>
        <div class="cart-item-actions">
          <div class="qty-ctrl">
            <button onclick="AppState.updateQty(${i}, ${item.qty - 1}); renderCart()">−</button>
            <span>${item.qty}</span>
            <button onclick="AppState.updateQty(${i}, ${item.qty + 1}); renderCart()">+</button>
          </div>
          <button class="cart-remove-btn" onclick="AppState.removeFromCart(${i})" data-i18n="cart_remove">${t('cart_remove')}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  if (totalEl) totalEl.textContent = formatPrice(total);
  updateCartBadge();
}

function updateCartUI() {
  renderCart();
  updateCartBadge();
}

// ===== PRODUCTS SECTION =====
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = VEHICLES.map(v => `
    <div class="product-card" data-id="${v.id}">
      <div class="product-card-badge">${v.category}</div>
      <div class="product-card-img-wrap">
        <img src="${v.image}" alt="${v.name}" class="product-card-img" loading="lazy">
      </div>
      <div class="product-card-body">
        <h3 class="product-card-name">${v.name}</h3>
        <div class="product-card-price">${v.priceLabel}</div>
        <div class="product-card-specs">
          <div class="spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span>${v.range}</span>
          </div>
          <div class="spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            <span>${AppState.lang === 'vi' ? v.power : v.powerEn}</span>
          </div>
          <div class="spec-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="18" height="11" rx="2"/><path d="M22 11v4"/></svg>
            <span>${v.battery}</span>
          </div>
        </div>
        <div class="product-card-actions">
          <button class="btn btn-outline" onclick="openConfigurator('${v.id}')" data-i18n="btn_configure">${t('btn_configure')}</button>
          <button class="btn btn-primary" onclick="quickAddToCart('${v.id}')" data-i18n="btn_add_cart">${t('btn_add_cart')}</button>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="AppState.addToCompare('${v.id}')" data-i18n="btn_add_compare">${t('btn_add_compare')}</button>
      </div>
    </div>
  `).join('');
}

function quickAddToCart(vId) {
  const vehicle = VEHICLES.find(v => v.id === vId);
  if (!vehicle) return;
  AppState.addToCart(
    vehicle,
    vehicle.colors[0],
    vehicle.versions[0],
    vehicle.battery_options[1]
  );
}

// ===== CONFIGURATOR =====
let configState = {
  vehicleId: null,
  colorIdx: 0,
  versionIdx: 0,
  batteryIdx: 1
};

function openConfigurator(vId) {
  configState.vehicleId = vId;
  configState.colorIdx = 0;
  configState.versionIdx = 0;
  configState.batteryIdx = 1;
  renderConfigurator();
  document.getElementById('configurator-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeConfigurator() {
  document.getElementById('configurator-modal').classList.remove('active');
  document.body.style.overflow = '';
}

function renderConfigurator() {
  const v = VEHICLES.find(x => x.id === configState.vehicleId);
  if (!v) return;
  const lang = AppState.lang;

  document.getElementById('config-car-name').textContent = v.name;
  const img = document.getElementById('config-car-img');
  img.src = v.colors[configState.colorIdx].img;

  // ── Vehicle description
  const descEl = document.getElementById('config-desc-text');
  if (descEl) {
    descEl.textContent = lang === 'vi' ? (v.desc_vi || '') : (v.desc_en || '');
  }

  // ── Highlights
  const hlWrap = document.getElementById('config-highlights-list');
  if (hlWrap) {
    const items = lang === 'vi' ? (v.highlights_vi || []) : (v.highlights_en || []);
    hlWrap.innerHTML = items.map(h => `
      <li class="config-highlight-item">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        <span>${h}</span>
      </li>`).join('');
  }

  // ── Quick specs
  const specsEl = document.getElementById('config-specs-grid');
  if (specsEl) {
    specsEl.innerHTML = `
      <div class="config-spec-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <div><div class="config-spec-val">${v.range}</div><div class="config-spec-key">${t('compare_range')}</div></div>
      </div>
      <div class="config-spec-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        <div><div class="config-spec-val">${lang === 'vi' ? v.power : v.powerEn}</div><div class="config-spec-key">${t('compare_power')}</div></div>
      </div>
      <div class="config-spec-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        <div><div class="config-spec-val">${v.seats}${lang === 'vi' ? ' chỗ' : ' seats'}</div><div class="config-spec-key">${t('config_seats')}</div></div>
      </div>
      <div class="config-spec-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <div><div class="config-spec-val">${v.topSpeed}</div><div class="config-spec-key">${t('config_top_speed')}</div></div>
      </div>
    `;
  }

  // ── Version description
  const verDescEl = document.getElementById('config-version-desc');
  const curVer = v.versions[configState.versionIdx];
  if (verDescEl && curVer) {
    verDescEl.textContent = lang === 'vi' ? (curVer.desc_vi || '') : (curVer.desc_en || '');
    verDescEl.style.display = (curVer.desc_vi || curVer.desc_en) ? 'block' : 'none';
  }

  // ── Color swatches
  const colorWrap = document.getElementById('config-colors');
  colorWrap.innerHTML = v.colors.map((c, i) => `
    <button class="color-swatch ${i === configState.colorIdx ? 'active' : ''}" 
      style="background:${c.hex}" title="${c.name}"
      onclick="setConfigColor(${i})"></button>
  `).join('');

  // ── Version select
  const verWrap = document.getElementById('config-versions');
  verWrap.innerHTML = v.versions.map((ver, i) => `
    <button class="version-btn ${i === configState.versionIdx ? 'active' : ''}"
      onclick="setConfigVersion(${i})">${ver.name}
      <span class="version-price">${ver.price > 0 ? '+' + formatPrice(ver.price) : lang === 'vi' ? 'Cơ bản' : 'Base'}</span>
    </button>
  `).join('');

  // ── Battery options
  const batWrap = document.getElementById('config-battery');
  batWrap.innerHTML = v.battery_options.map((b, i) => `
    <label class="battery-option ${i === configState.batteryIdx ? 'active' : ''}">
      <input type="radio" name="battery" value="${i}" ${i === configState.batteryIdx ? 'checked' : ''}
        onchange="setConfigBattery(${i})">
      ${lang === 'vi' ? b.label_vi : b.label_en}
    </label>
  `).join('');

  // ── Price
  const totalPrice = v.basePrice + v.versions[configState.versionIdx].price + v.battery_options[configState.batteryIdx].price;
  document.getElementById('config-price').textContent = formatPrice(totalPrice);

  // ── Color name label
  const colorLabel = document.getElementById('config-color-name');
  if (colorLabel) colorLabel.textContent = v.colors[configState.colorIdx].name;
}

function setConfigColor(i) {
  configState.colorIdx = i;
  renderConfigurator();
}
function setConfigVersion(i) {
  configState.versionIdx = i;
  renderConfigurator();
}
function setConfigBattery(i) {
  configState.batteryIdx = i;
  renderConfigurator();
}
function addConfigToCart() {
  const v = VEHICLES.find(x => x.id === configState.vehicleId);
  AppState.addToCart(
    v,
    v.colors[configState.colorIdx],
    v.versions[configState.versionIdx],
    v.battery_options[configState.batteryIdx]
  );
  closeConfigurator();
}

// ===== COMPARE =====
function updateCompareBar() {
  const bar = document.getElementById('compare-bar');
  if (!bar) return;
  if (AppState.compareList.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  const list = document.getElementById('compare-bar-list');
  list.innerHTML = AppState.compareList.map(id => {
    const v = VEHICLES.find(x => x.id === id);
    return `<div class="compare-bar-item">
      <img src="${v.image}" alt="${v.name}">
      <span>${v.name}</span>
      <button onclick="removeFromCompareBar('${id}')">✕</button>
    </div>`;
  }).join('');
}

function removeFromCompareBar(id) {
  AppState.compareList = AppState.compareList.filter(x => x !== id);
  localStorage.setItem('vf_compare', JSON.stringify(AppState.compareList));
  updateCompareBar();
}

function goCompare() {
  if (AppState.compareList.length < 2) {
    showToast('Chọn ít nhất 2 xe để so sánh');
    return;
  }
  // Scroll to compare sectiondòng thôi
  document.getElementById('compare-section').scrollIntoView({ behavior: 'smooth' });
  renderCompareTable();
}

function renderCompareTable() {
  const section = document.getElementById('compare-section');
  if (!section) return;
  const vehicles = AppState.compareList.map(id => VEHICLES.find(v => v.id === id)).filter(Boolean);
  if (vehicles.length < 2) return;

  const table = document.getElementById('compare-table');
  const lang = AppState.lang;

  const rows = [
    { key: 'compare_price', vals: vehicles.map(v => v.priceLabel) },
    { key: 'compare_range', vals: vehicles.map(v => v.range) },
    { key: 'compare_power', vals: vehicles.map(v => lang === 'vi' ? v.power : v.powerEn) },
    { key: 'compare_battery', vals: vehicles.map(v => v.battery) },
    { key: 'compare_seats', vals: vehicles.map(v => v.seats + (lang === 'vi' ? ' chỗ' : ' seats')) },
    { key: 'compare_speed', vals: vehicles.map(v => v.topSpeed) },
    { key: 'compare_charge', vals: vehicles.map(v => v.fastCharge) },
  ];

  table.innerHTML = `
    <tr>
      <th></th>
      ${vehicles.map(v => `<th><img src="${v.image}" alt="${v.name}" class="compare-thumb"><br>${v.name}</th>`).join('')}
    </tr>
    ${rows.map(row => `
      <tr>
        <td class="compare-label" data-i18n="${row.key}">${t(row.key)}</td>
        ${row.vals.map(val => `<td>${val}</td>`).join('')}
      </tr>
    `).join('')}
  `;
  section.style.display = 'block';
}

function initCompareSection() {
  const select = document.getElementById('compare-select');
  if (!select) return;
  select.innerHTML = `<option value="">${t('compare_select')}</option>` +
    VEHICLES.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  select.addEventListener('change', e => {
    if (e.target.value) AppState.addToCompare(e.target.value);
    e.target.value = '';
  });
}

// ===== TEST DRIVE FORM =====
function initTestDriveForm() {
  const form = document.getElementById('testdrive-form');
  if (!form) return;

  const carSelect = document.getElementById('td-car');
  if (carSelect) {
    carSelect.innerHTML = `<option value="">${t('testdrive_car')}</option>` +
      VEHICLES.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.getElementById('td-success');
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = t('testdrive_success');
      form.reset();
      setTimeout(() => msg.style.display = 'none', 5000);
    }
  });
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.getElementById('contact-success');
    if (msg) {
      msg.style.display = 'block';
      msg.textContent = t('contact_success');
      form.reset();
      setTimeout(() => msg.style.display = 'none', 5000);
    }
  });
}

// ===== SMOOTH SCROLL HERO =====
function initHeroParallax() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const bg = hero.querySelector('.hero-bg');
    if (bg) bg.style.transform = `translateY(${y * 0.3}px)`;
  });
}

// ===== INTERSECTION OBSERVER ANIMATIONS =====
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ===== COUNTER ANIMATION =====
function animateCounters() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString() + (el.dataset.suffix || '');
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// Init counter animation on scroll
function initCounters() {
  const statsSection = document.getElementById('stats-section');
  if (!statsSection) return;
  let animated = false;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      animateCounters();
    }
  }, { threshold: 0.3 });
  obs.observe(statsSection);
}

// ===== MAIN INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check persisted session
  const session = localStorage.getItem('vf_session');
  if (session) {
    const users = getUsers();
    const user = users.find(u => u.email === session);
    if (user) AppState.setUser({ name: user.name, email: user.email, id: user.id });
  }

  initHeader();
  updateUserUI();
  updateCartBadge();
  renderProducts();
  initCompareSection();
  updateCompareBar();
  initTestDriveForm();
  initContactForm();
  initHeroParallax();
  initAnimations();
  initCounters();
  applyTranslations();

  // Auth modal events
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('auth-modal')) closeAuthModal();
  });
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  document.getElementById('reg-form')?.addEventListener('submit', handleRegister);

  // Configurator close
  document.getElementById('configurator-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('configurator-modal')) closeConfigurator();
  });

  // Cart overlay close
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

  // Language toggle
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    AppState.setLang(AppState.lang === 'vi' ? 'en' : 'vi');
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        // Close mobile menu if open
        document.getElementById('mobile-menu')?.classList.remove('open');
        document.getElementById('hamburger-btn')?.classList.remove('active');
      }
    });
  });

  // Close chat menu when clicking outside
  document.addEventListener('click', e => {
    const menu = document.getElementById('chat-menu');
    const fab = document.querySelector('.chat-fab');
    if (menu && menu.classList.contains('active')) {
      // If click is not inside menu and not on the fab
      if (!menu.contains(e.target) && !fab.contains(e.target)) {
        menu.classList.remove('active');
      }
    }
  });
});

// ===== CHAT WIDGET =====
function toggleChatMenu() {
  const menu = document.getElementById('chat-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}
