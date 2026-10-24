const NAV = [
  ['menu.html', 'Menu'],
  ['deals.html', 'Deals'],
  ['locations.html', 'Locations'],
  ['reservations.html', 'Reserve'],
  ['track.html', 'Track order'],
];

const FLOW = {
  delivery: [
    ['new', 'Order received', 'We have your order.'],
    ['preparing', 'Cooking', 'The kitchen is on it.'],
    ['ready', 'Packed', 'Waiting for the rider.'],
    ['out-for-delivery', 'On the way', 'Your rider is heading to you.'],
    ['completed', 'Delivered', 'Enjoy your meal!'],
  ],
  pickup: [
    ['new', 'Order received', 'We have your order.'],
    ['preparing', 'Cooking', 'The kitchen is on it.'],
    ['ready', 'Ready for pickup', 'Come to the counter and quote your order number.'],
    ['completed', 'Collected', 'Enjoy your meal!'],
  ],
};

const HERO_ITEMS = [
  ['burger', { w: '50%', x: '25%', y: '30%', d: '.3s', r: '0deg', t: '5s' }],
  ['pizza', { w: '34%', x: '4%', y: '6%', d: '.5s', r: '-14deg', t: '6s' }],
  ['fries', { w: '30%', x: '64%', y: '6%', d: '.7s', r: '10deg', t: '5.5s' }],
  ['cup', { w: '24%', x: '68%', y: '60%', d: '.9s', r: '8deg', t: '6.5s' }],
  ['chicken', { w: '28%', x: '6%', y: '60%', d: '1.1s', r: '-10deg', t: '5.2s' }],
];

const Motion = globalThis.AOS ?? { init() { }, refreshHard() { } };

const Cart = (() => {
  const key = `${NS}cart`;
  let lines = [];
  try {
    lines = JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    lines = [];
  }
  const commit = () => {
    localStorage.setItem(key, JSON.stringify(lines));
    $(document).trigger('cart:change');
  };

  return {
    lines: () => lines,
    count: () => lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal: () => lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    add(line, qty = 1) {
      const entry = { options: [], ...line, qty };
      entry.key = `${entry.id}|${entry.options.join(',')}`;
      const existing = lines.find((l) => l.key === entry.key);
      if (existing) existing.qty += qty;
      else lines.push(entry);
      commit();
    },
    setQty(lineKey, qty) {
      lines = qty > 0 ? lines.map((l) => (l.key === lineKey ? { ...l, qty } : l)) : lines.filter((l) => l.key !== lineKey);
      commit();
    },
    clear() {
      lines = [];
      commit();
    },
  };
})();

const priceOrder = (lines, { type = 'delivery', coupon = null } = {}) => {
  const { deliveryFee, freeDeliveryOver } = Store.settings.get();
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const discount = { percent: Math.round((subtotal * (coupon?.value ?? 0)) / 100), amount: Math.min(coupon?.value ?? 0, subtotal) }[coupon?.type] ?? 0;
  const charged = type === 'delivery' && subtotal > 0 && subtotal - discount < freeDeliveryOver && coupon?.type !== 'delivery';
  const fee = charged ? deliveryFee : 0;
  return { subtotal, discount, fee, total: subtotal - discount + fee };
};

const findCoupon = async (code, subtotal) => {
  const coupon = (await Store.coupons.list()).find((c) => c.active && c.code === code.trim().toUpperCase());
  if (!coupon) throw new AppError('That code is not valid.');
  if (subtotal < coupon.min) throw new AppError(`Add ${money.format(coupon.min - subtotal)} more to use ${coupon.code}.`);
  return coupon;
};

const canOrder = () => {
  if (Store.settings.get().acceptingOrders) return true;
  toast('Online ordering is paused right now. Please check back soon.');
  return false;
};

const nextUrl = () => {
  const next = new URLSearchParams(location.search).get('next') ?? '';
  return /^[\w-]+\.html(#[\w-]*)?$/.test(next) ? next : null;
};

const bindForm = (selector, handler, { reset = true } = {}) => {
  $(document).on('submit', selector, async function (event) {
    event.preventDefault();
    if (!this.checkValidity()) return $(this).addClass('was-validated');
    const $submit = $(this).find('[type=submit]').prop('disabled', true);
    try {
      await handler(Object.fromEntries(new FormData(this)), this);
      if (reset && document.contains(this)) {
        this.reset();
        $(this).removeClass('was-validated');
      }
    } catch (error) {
      if (!(error instanceof AppError)) console.error(error);
      toast(error instanceof AppError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      $submit.prop('disabled', false);
    }
  });
};

const prefill = (values) =>
  Object.entries(values).forEach(([name, value]) => $(`[name="${name}"]`).val((_, current) => current || value || ''));

const passwordInput = (name, label, autocomplete) => `
  <label class="form-label" for="${name}">${label}</label>
  <div class="input-group">
    <input class="form-control" id="${name}" name="${name}" type="password" minlength="8" autocomplete="${autocomplete}" required>
    <button class="btn" type="button" data-toggle-password aria-label="Show password"><i class="bi bi-eye" aria-hidden="true"></i></button>
    <div class="invalid-feedback">Use at least 8 characters.</div>
  </div>`;

const lineFrom = (item, price = item.price, options = []) =>
  ({ id: item.id, name: item.name, price, options, category: item.category, art: item.art, img: item.img });

const renderLayout = () => {
  const here = location.pathname.split('/').pop() || 'index.html';
  const user = Auth.user();
  const { acceptingOrders, freeDeliveryOver } = Store.settings.get();
  const links = NAV.map(([href, label]) => {
    const current = href === here;
    return `<li class="nav-item"><a class="nav-link${current ? ' active' : ''}" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  }).join('');
  const footerLinks = (items) => `<ul>${items.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul>`;

  $('body')
    .prepend(`
      <a class="visually-hidden-focusable skip-link" href="#main">Skip to content</a>
      <div class="announce" role="status">${acceptingOrders
        ? `Free delivery over ${money.format(freeDeliveryOver)}. <a href="deals.html">See today's deals</a>`
        : 'We are not taking online orders right now. Please check back soon.'}</div>
      <header class="site-header sticky-top">
        <nav class="navbar navbar-expand-lg" aria-label="Primary">
          <div class="container">
            <a class="navbar-brand brand" href="index.html">Own<span>-</span>Plate</a>
            <div class="d-flex align-items-center gap-2 ms-auto ms-lg-0 order-lg-last">
              ${user
        ? `<a class="btn-icon" href="account.html" aria-label="My account (${esc(user.name)})"><i class="bi bi-person-check" aria-hidden="true"></i></a>`
        : '<a class="btn btn-outline-indigo btn-sm" href="login.html">Sign in</a>'}
              <button type="button" class="btn-icon" data-bs-toggle="offcanvas" data-bs-target="#cart" aria-label="Open your order">
                <i class="bi bi-bag" aria-hidden="true"></i><span id="cart-count" class="cart-count">0</span>
              </button>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#primary-nav" aria-controls="primary-nav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
              </button>
            </div>
            <div class="collapse navbar-collapse" id="primary-nav"><ul class="navbar-nav mx-lg-auto gap-lg-3">${links}</ul></div>
          </div>
        </nav>
      </header>`)
    .append(`
      <div class="modal fade" id="item-modal" tabindex="-1" aria-labelledby="item-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content" id="item-content"></div></div>
      </div>
      <aside class="offcanvas offcanvas-end" tabindex="-1" id="cart" aria-labelledby="cart-title">
        <div class="offcanvas-header"><h2 class="h5 mb-0" id="cart-title">Your order</h2><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
        <div class="offcanvas-body d-flex flex-column">
          <ul id="cart-lines" class="list-unstyled mb-3"></ul>
          <div class="mt-auto">
            <p id="cart-hint" class="small text-muted mb-2"></p>
            <div class="d-flex justify-content-between fw-bold mb-3"><span>Subtotal</span><span id="cart-total"></span></div>
            <a class="btn btn-clay w-100" href="checkout.html">Go to checkout</a>
          </div>
        </div>
      </aside>
      <footer class="site-footer">
        <div class="container">
          <div class="row g-4">
            <div class="col-lg-4">
              <a class="brand fs-3" href="index.html">Own<span>-</span>Plate</a>
              <p class="mt-2">Burgers, pizza and desi favourites, cooked to order and sold direct. Halal, always.</p>
              <div class="social"><a href="#" aria-label="Facebook"><i class="bi bi-facebook"></i></a><a href="#" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="#" aria-label="TikTok"><i class="bi bi-tiktok"></i></a><a href="#" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a></div>
            </div>
            <div class="col-6 col-lg-2"><h2>Menu</h2>${footerLinks(CATEGORIES.slice(1, 7).map((c) => [`menu.html#${c.id}`, c.label]))}</div>
            <div class="col-6 col-lg-2"><h2>Company</h2>${footerLinks([['about.html', 'Our story'], ['locations.html', 'Locations'], ['contact.html', 'Contact'], ['faq.html', 'FAQ']])}</div>
            <div class="col-6 col-lg-2"><h2>Account</h2>${footerLinks([['login.html', 'Sign in'], ['signup.html', 'Create account'], ['track.html', 'Track order'], ['terms.html', 'Terms'], ['privacy.html', 'Privacy']])}</div>
            <div class="col-6 col-lg-2"><h2>Say hello</h2><ul><li><a data-tel data-setting="phone"></a></li><li><a data-mail data-setting="email"></a></li><li data-setting="hours"></li></ul></div>
          </div>
          <hr class="border-light opacity-25 my-4">
          <div class="d-flex flex-wrap justify-content-between gap-2 small">
            <span>&copy; <span id="year"></span> Own-Plate. All rights reserved.</span>
            <a href="admin/index.html">Staff sign in</a>
          </div>
        </div>
      </footer>`);
  $('#year').text(new Date().getFullYear());
  const settings = Store.settings.get();
  $('[data-setting]').each((_, el) => { el.textContent = settings[el.dataset.setting]; });
  $('[data-tel]').attr('href', `tel:${settings.phone.replace(/\s/g, '')}`);
  $('[data-mail]').attr('href', `mailto:${settings.email}`);
};

const renderCart = () => {
  const lines = Cart.lines();
  const { freeDeliveryOver } = Store.settings.get();
  const subtotal = Cart.subtotal();
  $('#cart-count').text(Cart.count());
  $('#cart-total').text(money.format(subtotal));
  $('#cart-hint').text(subtotal && subtotal < freeDeliveryOver ? `Add ${money.format(freeDeliveryOver - subtotal)} more for free delivery.` : '');
  $('#cart-lines').html(lines.length
    ? lines.map((l) => `
        <li class="cart-line">
          ${artFigure(l, 'cart-thumb')}
          <div class="grow">
            <div class="fw-bold text-truncate">${esc(l.name)}</div>
            ${l.options.length ? `<small class="text-muted d-block text-truncate">${esc(l.options.join(', '))}</small>` : ''}
            <small class="text-muted">${money.format(l.price)}</small>
          </div>
          <div class="qty">
            <button type="button" data-qty="${esc(l.key)}" data-delta="-1" aria-label="Remove one ${esc(l.name)}">&minus;</button>
            <output>${l.qty}</output>
            <button type="button" data-qty="${esc(l.key)}" data-delta="1" aria-label="Add one ${esc(l.name)}">+</button>
          </div>
        </li>`).join('')
    : '<li class="text-center text-muted py-5">Your order is empty. Pick something tasty from the menu.</li>');
};

const dishCard = (item, index = 0) => {
  const customisable = (OPTION_SETS[item.optionSet] ?? []).length > 0;
  const saved = Boolean(Auth.user()?.favourites.includes(item.id));
  return `
    <div class="col-6 col-lg-4 col-xl-3" data-aos="fade-up" data-aos-delay="${(index % 4) * 70}">
      <article class="dish${item.available ? '' : ' is-sold-out'}">
        ${artFigure(item)}
        <div class="dish-tags">${item.tags.slice(0, 2).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        <button type="button" class="fav${saved ? ' is-on' : ''}" data-fav="${item.id}" aria-pressed="${saved}" aria-label="Save ${esc(item.name)} to favourites"><i class="bi bi-heart${saved ? '-fill' : ''}" aria-hidden="true"></i></button>
        <div class="dish-body">
          <button type="button" class="dish-link" data-open="${item.id}">${esc(item.name)}</button>
          ${item.urdu ? `<span class="urdu small" lang="ur" dir="rtl">${esc(item.urdu)}</span>` : ''}
          <p>${esc(item.desc)}</p>
          <div class="dish-foot">
            <span><span class="price">${money.format(item.price)}</span><span class="kcal">${item.kcal} kcal</span></span>
            <button type="button" class="btn btn-clay btn-sm" ${customisable ? 'data-open' : 'data-add'}="${item.id}" ${item.available ? '' : 'disabled'}>${!item.available ? 'Sold out' : customisable ? 'Customise' : 'Add'}</button>
          </div>
        </div>
      </article>
    </div>`;
};

const dealCard = (deal) => `
  <article class="deal">
    ${deal.was > deal.price ? `<span class="deal-badge">Save ${Math.round((1 - deal.price / deal.was) * 100)}%</span>` : ''}
    ${artFigure(deal)}
    <div class="dish-body">
      <h3 class="h5 mb-1">${esc(deal.name)}</h3>
      <p>${esc(deal.desc)}</p>
      <div class="dish-foot">
        <span><span class="price">${money.format(deal.price)}</span>${deal.was > deal.price ? `<span class="was">${money.format(deal.was)}</span>` : ''}</span>
        <button type="button" class="btn btn-clay btn-sm" data-add-deal="${deal.id}">Add</button>
      </div>
    </div>
  </article>`;

const itemState = { item: null, groups: [], qty: 1 };

const optionGroup = (group) => `
  <fieldset class="opt-group">
    <legend>${esc(group.label)} <small>${group.type === 'single' ? '(choose one)' : '(optional)'}</small></legend>
    ${group.choices.map((c, i) => `
      <label class="opt">
        <input class="form-check-input mt-0" type="${group.type === 'single' ? 'radio' : 'checkbox'}" name="${group.key}" value="${i}" ${group.type === 'single' && i === (group.default ?? 0) ? 'checked' : ''}>
        <span>${esc(c.label)}</span>
        <span class="opt-price">${c.price ? `${c.price > 0 ? '+' : '&minus;'}${money.format(Math.abs(c.price))}` : ''}</span>
      </label>`).join('')}
  </fieldset>`;

const selectedChoices = () =>
  itemState.groups.flatMap((g) => $(`#item-form [name="${g.key}"]:checked`).map((_, el) => g.choices[el.value]).get());
const unitPrice = () => itemState.item.price + selectedChoices().reduce((sum, c) => sum + c.price, 0);
const refreshItem = () => {
  $('#item-qty').text(itemState.qty);
  $('#item-total').text(money.format(unitPrice() * itemState.qty));
};

const openItem = async (id) => {
  const item = await Store.menu.get(id);
  if (!item) return;
  Object.assign(itemState, { item, groups: OPTION_SETS[item.optionSet] ?? [], qty: 1 });
  $('#item-content').html(`
    <div class="modal-header border-0 pb-0">
      <h2 class="modal-title h4" id="item-title">${esc(item.name)}</h2>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      ${artFigure(item, 'dish-art dish-art-lg')}
      <p class="text-muted mt-3 mb-1">${esc(item.desc)}</p>
      <p class="small text-muted">${item.kcal} kcal${item.tags.length ? ` &middot; ${esc(item.tags.join(', '))}` : ''}</p>
      <form id="item-form">${itemState.groups.map(optionGroup).join('')}</form>
    </div>
    <div class="modal-footer border-0">
      <div class="qty"><button type="button" data-item-qty="-1" aria-label="Fewer">&minus;</button><output id="item-qty">1</output><button type="button" data-item-qty="1" aria-label="More">+</button></div>
      <button type="button" class="btn btn-clay flex-grow-1" id="item-add" ${item.available ? '' : 'disabled'}>Add to order &middot; <span id="item-total"></span></button>
    </div>`);
  refreshItem();
  bootstrap.Modal.getOrCreateInstance('#item-modal').show();
};

const confirmAdd = (message) => {
  toast(message);
  $('#cart-count')[0]?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 300 });
};

const initCounters = () => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.filter((e) => e.isIntersecting).forEach(({ target }) => {
      obs.unobserve(target);
      $({ n: 0 }).animate({ n: Number(target.dataset.count) }, {
        duration: 1600,
        step: (n) => { target.textContent = Math.floor(n).toLocaleString('en-PK'); },
      });
    });
  }, { threshold: 0.6 });
  $('[data-count]').each((_, el) => observer.observe(el));
};

const bindGlobalHandlers = () => {
  $(document)
    .on('click', '[data-open]', function () { openItem(this.dataset.open); })
    .on('click', '[data-add]', async function () {
      if (!canOrder()) return;
      const item = await Store.menu.get(this.dataset.add);
      if (!item?.available) return;
      Cart.add(lineFrom(item));
      confirmAdd(`${item.name} added to your order`);
    })
    .on('click', '[data-add-deal]', async function () {
      if (!canOrder()) return;
      const deal = (await Store.deals.list()).find((d) => d.id === this.dataset.addDeal);
      if (!deal) return;
      Cart.add({ id: deal.id, name: deal.name, price: deal.price, art: deal.art, tint: deal.tint });
      confirmAdd(`${deal.name} added to your order`);
    })
    .on('click', '[data-qty]', function () {
      const line = Cart.lines().find((l) => l.key === this.dataset.qty);
      if (line) Cart.setQty(line.key, line.qty + Number(this.dataset.delta));
    })
    .on('click', '[data-item-qty]', function () {
      itemState.qty = Math.min(20, Math.max(1, itemState.qty + Number(this.dataset.itemQty)));
      refreshItem();
    })
    .on('change', '#item-form', refreshItem)
    .on('click', '#item-add', () => {
      if (!canOrder()) return;
      const { item, qty } = itemState;
      Cart.add(lineFrom(item, unitPrice(), selectedChoices().map((c) => c.label)), qty);
      bootstrap.Modal.getInstance('#item-modal').hide();
      confirmAdd(`${item.name} added to your order`);
    })
    .on('click', '[data-fav]', async function () {
      if (!Auth.user()) return toast('Sign in to save your favourites.');
      const saved = await Auth.toggleFavourite(this.dataset.fav);
      $(this).toggleClass('is-on', saved).attr('aria-pressed', saved).find('i').attr('class', `bi bi-heart${saved ? '-fill' : ''}`);
      $(document).trigger('favourites:change');
    })
    .on('click', '[data-copy]', async function () {
      await navigator.clipboard?.writeText(this.dataset.copy).catch(() => { });
      toast(`${this.dataset.copy} copied`);
    })
    .on('click', '[data-toggle-password]', function () {
      const $input = $(this).siblings('input');
      const reveal = $input.attr('type') === 'password';
      $input.attr('type', reveal ? 'text' : 'password');
      $(this).attr('aria-label', reveal ? 'Hide password' : 'Show password').find('i').attr('class', `bi bi-eye${reveal ? '-slash' : ''}`);
    })
    .on('cart:change', renderCart);

  $(window).on('scroll', () => $('.site-header').toggleClass('is-scrolled', window.scrollY > 8)).trigger('scroll');
  $('#primary-nav .nav-link').on('click', () => $('#primary-nav').collapse('hide'));
};

const orderCard = (order) => `
  <article class="panel-card">
    <div class="d-flex flex-wrap justify-content-between gap-2">
      <strong>${shortId(order.id)} <small class="text-muted fw-normal">${when(order.createdAt)}</small></strong>
      <span class="status chip status-${order.status}">${order.status.replace(/-/g, ' ')}</span>
    </div>
    <p class="text-muted my-2">${order.items.map((i) => `${i.qty} &times; ${esc(i.name)}`).join(', ')}</p>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <strong>${money.format(order.total)}</strong>
      <span class="d-flex gap-2">
        <a class="btn btn-sm btn-outline-indigo" href="track.html?id=${order.id}">Track</a>
        <button type="button" class="btn btn-sm btn-clay" data-reorder="${order.id}">Reorder</button>
      </span>
    </div>
  </article>`;

const pages = {
  async home() {
    const [menu, deals] = await Promise.all([Store.menu.list(), Store.deals.list()]);
    $('#hero-stage').html(HERO_ITEMS.map(([name, v]) =>
      `<div class="float" style="--w:${v.w};--x:${v.x};--y:${v.y};--d:${v.d};--r:${v.r};--t:${v.t}">${ART[name]}</div>`).join(''));
    $('#category-tiles').html(CATEGORIES.slice(1).map((c, i) =>
      `<a class="tile" href="menu.html#${c.id}" style="--tint:${c.tint}" data-aos="zoom-in" data-aos-delay="${i * 50}">${ART[c.art]}<span>${c.label}</span></a>`).join(''));
    $('#deal-row').html(deals.filter((d) => d.active).map(dealCard).join(''));
    $('#featured-grid').html(menu.filter((i) => i.featured && i.available).slice(0, 8).map(dishCard).join(''));
    Motion.refreshHard();
  },

  async menu() {
    const items = await Store.menu.list();
    const fromHash = location.hash.slice(1);
    const state = { category: CATEGORIES.some((c) => c.id === fromHash) ? fromHash : 'all', query: '', sort: 'popular' };
    const sorters = { popular: () => 0, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price };
    const grid = (list) => `<div class="row g-3 g-lg-4">${list.map(dishCard).join('')}</div>`;

    const render = () => {
      const query = state.query.trim().toLowerCase();
      const shown = items
        .filter((i) => (state.category === 'all' || i.category === state.category)
          && (!query || `${i.name} ${i.desc} ${i.tags.join(' ')}`.toLowerCase().includes(query)))
        .sort(sorters[state.sort]);
      const grouped = state.category === 'all' && !query && state.sort === 'popular';
      $('#menu-grid').html(!shown.length
        ? '<p class="text-center text-muted py-5">Nothing matches that search. Try another dish or clear the filter.</p>'
        : grouped
          ? CATEGORIES.slice(1).map((c) => {
            const list = shown.filter((i) => i.category === c.id);
            return list.length ? `<section class="mb-5"><h2 class="section-title h3">${c.label}</h2>${grid(list)}</section>` : '';
          }).join('')
          : grid(shown));
      $('#menu-filters .filter-pill').each((_, el) => $(el).attr('aria-pressed', el.dataset.category === state.category));
      Motion.refreshHard();
    };

    $('#menu-filters')
      .html(CATEGORIES.map(({ id, label }) => `<button type="button" class="filter-pill" data-category="${id}" aria-pressed="false">${label}</button>`).join(''))
      .on('click', '.filter-pill', function () {
        state.category = this.dataset.category;
        history.replaceState(null, '', `#${state.category}`);
        render();
      });
    $('#menu-search').on('input', function () { state.query = this.value; render(); });
    $('#menu-sort').on('change', function () { state.sort = this.value; render(); });
    render();
  },

  async deals() {
    const [deals, coupons] = await Promise.all([Store.deals.list(), Store.coupons.list()]);
    $('#deal-grid').html(deals.filter((d) => d.active).map((d) => `<div class="col-md-6 col-lg-4" data-aos="fade-up">${dealCard(d)}</div>`).join(''));
    $('#coupon-grid').html(coupons.filter((c) => c.active).map((c) => `
      <div class="col-md-6 col-lg-4" data-aos="fade-up">
        <div class="coupon d-flex flex-column gap-2"><code>${esc(c.code)}</code><span>${esc(c.desc)}</span>
          <button type="button" class="btn btn-outline-indigo btn-sm align-self-start" data-copy="${esc(c.code)}">Copy code</button></div>
      </div>`).join(''));
    Motion.refreshHard();
  },

  checkout() {
    const user = Auth.user();
    const state = { coupon: null };
    const type = () => $('[name=type]:checked').val();
    const quote = () => priceOrder(Cart.lines(), { type: type(), coupon: state.coupon });
    const shortfall = () => (type() === 'delivery' ? Math.max(0, Store.settings.get().minOrder - Cart.subtotal()) : 0);

    const renderSummary = () => {
      if (state.coupon && Cart.subtotal() < state.coupon.min) {
        state.coupon = null;
        $('#coupon-message').text('Your code was removed because the order is now below its minimum.').attr('class', 'small text-danger mt-1');
      }
      const { subtotal, discount, fee, total } = quote();
      const rows = Cart.lines().map((l) => `<li><span>${l.qty} &times; ${esc(l.name)}${l.options.length ? `<small class="d-block text-muted">${esc(l.options.join(', '))}</small>` : ''}</span><span>${money.format(l.qty * l.price)}</span></li>`).join('');
      $('#order-summary').html(Cart.count()
        ? `<ul class="list-unstyled mb-0">${rows}
            <li><span>Subtotal</span><span>${money.format(subtotal)}</span></li>
            ${discount ? `<li class="saving"><span>Discount (${esc(state.coupon.code)})</span><span>&minus;${money.format(discount)}</span></li>` : ''}
            <li><span>Delivery</span><span>${type() === 'pickup' ? 'Pickup' : fee ? money.format(fee) : 'Free'}</span></li>
            <li class="total"><span>Total</span><span>${money.format(total)}</span></li></ul>`
        : '<p class="text-muted mb-0">Your order is empty. <a href="menu.html">Browse the menu</a>.</p>');
      const blocked = !Cart.count() || shortfall() > 0 || !Store.settings.get().acceptingOrders;
      $('#place-order').prop('disabled', blocked);
      $('#order-note').text(!Store.settings.get().acceptingOrders
        ? 'Online ordering is paused right now.'
        : shortfall() ? `Minimum delivery order is ${money.format(Store.settings.get().minOrder)}. Add ${money.format(shortfall())} more.` : '');
    };

    const syncType = () => {
      const delivery = type() === 'delivery';
      $('#address-group').prop('hidden', !delivery).find('textarea').prop('required', delivery);
      renderSummary();
    };

    if (user) {
      prefill({ name: user.name, phone: user.phone });
      if (user.addresses.length) {
        $('#saved-address-group').prop('hidden', false).find('select').html(
          `<option value="">Choose a saved address</option>${user.addresses.map((a) => `<option value="${esc(a.address)}">${esc(a.label)}: ${esc(a.address)}</option>`).join('')}`);
        $('#saved-address').on('change', function () { $('#address').val(this.value); });
      }
    } else {
      $('#guest-note').prop('hidden', false);
    }

    $('[name=type]').on('change', syncType);
    $(document).on('cart:change', renderSummary);
    $('#apply-coupon').on('click', async () => {
      const $message = $('#coupon-message');
      try {
        state.coupon = await findCoupon($('#coupon').val(), Cart.subtotal());
        $message.text(`${state.coupon.code} applied: ${state.coupon.desc}`).attr('class', 'small text-success mt-1');
      } catch (error) {
        state.coupon = null;
        $message.text(error instanceof AppError ? error.message : 'Could not apply that code.').attr('class', 'small text-danger mt-1');
      }
      renderSummary();
    });
    syncType();

    bindForm('#checkout-form', async ({ name, phone, address, notes }) => {
      if (!canOrder() || !Cart.count() || shortfall()) return;
      const orderType = type();
      const order = await Store.orders.create({
        name: name.trim(), phone, type: orderType, address: orderType === 'delivery' ? address.trim() : '', notes: notes.trim(),
        payment: 'cash', items: Cart.lines(), ...quote(), coupon: state.coupon?.code ?? null,
        userId: user?.id ?? null, status: 'new', history: [{ status: 'new', at: new Date().toISOString() }],
      });
      Cart.clear();
      $('#checkout-view').html(`
        <div class="confirmation">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
          <h1 class="h2 mt-3">Shukriya, ${esc(name.split(' ')[0])}!</h1>
          <p>Order <strong>${shortId(order.id)}</strong> is with the kitchen. Pay ${money.format(order.total)} in cash when it arrives.</p>
          <div class="d-flex flex-wrap justify-content-center gap-2">
            <a class="btn btn-clay" href="track.html?id=${order.id}">Track my order</a>
            <a class="btn btn-outline-indigo" href="menu.html">Order more</a>
          </div>
          ${user ? '' : '<p class="small text-muted mt-4">Want faster checkout next time? <a href="signup.html">Create an account</a>.</p>'}
        </div>`);
    }, { reset: false });
  },

  track() {
    const user = Auth.user();
    const params = new URLSearchParams(location.search);
    const $view = $('#track-view');
    let watching = null;

    const find = async (code) => {
      const key = code.trim().replace(/^#/, '').toLowerCase();
      return key.length >= 5 ? (await Store.orders.list()).find((o) => o.id.toLowerCase().endsWith(key)) : undefined;
    };
    const digits = (phone) => String(phone ?? '').replace(/\D/g, '').slice(-10);
    const allowed = (order, phone) => (user && order.userId === user.id) || (digits(phone) && digits(order.phone) === digits(phone));

    const timeline = (order) => {
      if (order.status === 'cancelled') return '<div class="alert alert-danger mb-0">This order was cancelled. Please call us if you have any questions.</div>';
      const steps = FLOW[order.type] ?? FLOW.delivery;
      const current = steps.findIndex(([key]) => key === order.status);
      const finished = order.status === 'completed';
      return `<ol class="timeline mb-0">${steps.map(([key, label, hint], i) => {
        const at = order.history?.find((h) => h.status === key)?.at;
        const state = finished || i < current ? 'done' : i === current ? 'current' : '';
        return `<li class="${state}"><span class="dot"><i class="bi bi-check-lg" aria-hidden="true"></i></span><strong>${label}</strong><small>${at ? when(at) : hint}</small></li>`;
      }).join('')}</ol>`;
    };

    const render = async ({ code, phone }) => {
      const order = await find(code);
      if (!order || !allowed(order, phone)) {
        $view.html('<div class="alert alert-warning">We could not find that order. Check the order number and the mobile number you ordered with.</div>');
        return;
      }
      $view.html(`
        <div class="form-card">
          <div class="d-flex flex-wrap justify-content-between gap-2 mb-4">
            <div><h2 class="h4 mb-1">Order ${shortId(order.id)}</h2><small class="text-muted">Placed ${when(order.createdAt)} &middot; ${order.type === 'pickup' ? 'Pickup' : 'Delivery'}</small></div>
            <span class="status chip status-${order.status}">${order.status.replace(/-/g, ' ')}</span>
          </div>
          ${timeline(order)}
          <hr>
          <ul class="list-unstyled summary mb-0">
            ${order.items.map((i) => `<li><span>${i.qty} &times; ${esc(i.name)}</span><span>${money.format(i.qty * i.price)}</span></li>`).join('')}
            <li class="total"><span>Total</span><span>${money.format(order.total)}</span></li>
          </ul>
        </div>`);
    };

    const watch = (target) => {
      watching = target;
      return render(target);
    };
    setInterval(() => watching && render(watching), 5000);
    $(window).on('storage', () => watching && render(watching));
    bindForm('#track-form', ({ id, phone }) => watch({ code: id, phone }), { reset: false });

    const id = params.get('id');
    if (id) {
      $('#track-id').val(shortId(id).slice(1));
      if (user) watch({ code: id, phone: '' });
    }
    if (user) prefill({ phone: user.phone });
  },

  login() {
    if (Auth.user()) return location.replace('account.html');
    bindForm('#login-form', async ({ email, password }) => {
      await Auth.login(email, password);
      location.href = nextUrl() ?? 'account.html';
    }, { reset: false });
  },

  signup() {
    if (Auth.user()) return location.replace('account.html');
    $('#password').on('input', function () {
      const score = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) => rule.test(this.value)).length;
      $('#meter').css('--score', score).attr('data-level', score >= 4 ? 'strong' : score >= 3 ? 'ok' : 'weak');
    });
    bindForm('#signup-form', async (data) => {
      if (data.password !== data.confirm) throw new AppError('The two passwords do not match.');
      await Auth.signup(data);
      location.href = nextUrl() ?? 'account.html';
    }, { reset: false });
  },

  forgot() {
    bindForm('#forgot-form', () => $('#forgot-note').prop('hidden', false));
  },

  reservations() {
    const user = Auth.user();
    if (user) prefill({ name: user.name, phone: user.phone });
    $('[name=date]').attr('min', new Date().toLocaleDateString('en-CA'));
    bindForm('#reservation-form', async (data) => {
      await Store.reservations.create({ ...data, guests: Number(data.guests), status: 'pending' });
      toast('Table request received. We will confirm by phone shortly.');
    });
  },

  contact() {
    const user = Auth.user();
    if (user) prefill({ name: user.name, email: user.email });
    bindForm('#contact-form', async (data) => {
      await Store.messages.create({ ...data, read: false });
      toast('Message sent. We usually reply within a day.');
    });
  },

  account() {
    if (!Auth.user()) return location.replace('login.html?next=account.html');
    const myOrders = async () => (await Store.orders.list()).filter((o) => o.userId === Auth.user().id);

    const tabs = {
      async overview() {
        const user = Auth.user();
        const orders = await myOrders();
        const spent = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
        return `
          <h2 class="h4 mb-3">Salaam, ${esc(user.name.split(' ')[0])}</h2>
          <div class="row g-3 mb-3">${[['Orders', orders.length], ['Total spent', money.format(spent)], ['Favourites', user.favourites.length]]
            .map(([label, value]) => `<div class="col-4"><div class="panel-card stat-tile"><span class="text-muted small">${label}</span><strong>${value}</strong></div></div>`).join('')}</div>
          <h3 class="h5 mt-4">Latest order</h3>
          ${orders[0] ? orderCard(orders[0]) : '<div class="panel-card text-muted">No orders yet. <a href="menu.html">Start your first order</a>.</div>'}`;
      },

      async orders() {
        const orders = await myOrders();
        return `<h2 class="h4 mb-3">Order history</h2>${orders.length ? orders.map(orderCard).join('') : '<div class="panel-card text-muted">You have not placed any orders yet.</div>'}`;
      },

      async addresses() {
        const { addresses } = Auth.user();
        return `
          <h2 class="h4 mb-3">Saved addresses</h2>
          <div class="panel-card">${addresses.length ? addresses.map((a) => `
            <div class="d-flex justify-content-between align-items-start gap-3 py-2 border-bottom">
              <div><strong>${esc(a.label)}</strong><div class="text-muted">${esc(a.address)}</div></div>
              <button type="button" class="btn btn-sm btn-outline-danger" data-remove-address="${a.id}" aria-label="Remove ${esc(a.label)} address"><i class="bi bi-trash" aria-hidden="true"></i></button>
            </div>`).join('') : '<p class="text-muted mb-0">No saved addresses yet.</p>'}</div>
          <form id="address-form" class="panel-card" novalidate>
            <h3 class="h6">Add an address</h3>
            <div class="row g-3">
              <div class="col-sm-4"><label class="form-label" for="label">Label</label><select class="form-select" id="label" name="label"><option>Home</option><option>Work</option><option>Other</option></select></div>
              <div class="col-sm-8"><label class="form-label" for="address">Address</label><input class="form-control" id="address" name="address" autocomplete="street-address" required><div class="invalid-feedback">Enter the full address.</div></div>
              <div class="col-12"><button class="btn btn-clay" type="submit">Save address</button></div>
            </div>
          </form>`;
      },

      async favourites() {
        const { favourites } = Auth.user();
        const items = (await Store.menu.list()).filter((i) => favourites.includes(i.id));
        return `<h2 class="h4 mb-3">Favourites</h2>${items.length
          ? `<div class="row g-3">${items.map(dishCard).join('')}</div>`
          : '<div class="panel-card text-muted">Tap the heart on any dish to save it here.</div>'}`;
      },

      async profile() {
        const user = Auth.user();
        return `
          <h2 class="h4 mb-3">Profile and security</h2>
          <form id="profile-form" class="panel-card" novalidate>
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label" for="name">Full name</label><input class="form-control" id="name" name="name" value="${esc(user.name)}" autocomplete="name" required><div class="invalid-feedback">Please enter your name.</div></div>
              <div class="col-md-6"><label class="form-label" for="phone">Mobile number</label><input class="form-control" id="phone" name="phone" type="tel" value="${esc(user.phone)}" pattern="(\\+92|0)3\\d{2}[\\- ]?\\d{7}" autocomplete="tel" required><div class="invalid-feedback">Enter a valid Pakistani mobile number.</div></div>
              <div class="col-12"><label class="form-label" for="email">Email</label><input class="form-control" id="email" value="${esc(user.email)}" disabled></div>
              <div class="col-12"><button class="btn btn-clay" type="submit">Save changes</button></div>
            </div>
          </form>
          <form id="password-form" class="panel-card" novalidate>
            <h3 class="h6">Change password</h3>
            <div class="row g-3"><div class="col-md-6">${passwordInput('current', 'Current password', 'current-password')}</div><div class="col-md-6">${passwordInput('next', 'New password', 'new-password')}</div>
              <div class="col-12"><button class="btn btn-outline-indigo" type="submit">Update password</button></div></div>
          </form>
          <div class="panel-card d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-indigo" id="signout">Sign out</button>
            <button type="button" class="btn btn-outline-danger" id="delete-account">Delete my account</button>
          </div>`;
      },
    };

    const route = async () => {
      const name = location.hash.slice(1) in tabs ? location.hash.slice(1) : 'overview';
      $('.account-nav a').each((_, el) => $(el).toggleClass('active', el.hash === `#${name}`).attr('aria-current', el.hash === `#${name}` ? 'page' : null));
      $('#account-view').html(await tabs[name]());
      Motion.refreshHard();
    };

    $(window).on('hashchange', route);
    $(document)
      .on('favourites:change', () => location.hash === '#favourites' && route())
      .on('click', '[data-reorder]', async function () {
        if (!canOrder()) return;
        const order = await Store.orders.get(this.dataset.reorder);
        order.items.forEach((line) => Cart.add(line, line.qty));
        bootstrap.Offcanvas.getOrCreateInstance('#cart').show();
      })
      .on('click', '[data-remove-address]', async function () {
        await Auth.update({ addresses: Auth.user().addresses.filter((a) => a.id !== this.dataset.removeAddress) });
        route();
      })
      .on('click', '#signout', () => { Auth.logout(); location.href = 'index.html'; })
      .on('click', '#delete-account', async () => {
        if (!confirm('Delete your account and saved details? This cannot be undone.')) return;
        await Auth.remove();
        location.href = 'index.html';
      });

    bindForm('#address-form', async ({ label, address }) => {
      await Auth.update({ addresses: [...Auth.user().addresses, { id: `adr-${Date.now().toString(36)}`, label, address: address.trim() }] });
      toast('Address saved');
      route();
    }, { reset: false });
    bindForm('#profile-form', async ({ name, phone }) => {
      await Auth.update({ name: name.trim(), phone });
      toast('Profile updated');
    }, { reset: false });
    bindForm('#password-form', async ({ current, next }) => {
      await Auth.changePassword(current, next);
      toast('Password updated');
    });

    route();
  },

};

$(async () => {
  await Auth.load();
  renderLayout();
  Motion.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60, disable: matchMedia('(prefers-reduced-motion: reduce)').matches });
  renderCart();
  initCounters();
  bindGlobalHandlers();
  $('[data-art]').each((_, el) => $(el).html(ART[el.dataset.art]));

  try {
    await pages[document.body.dataset.page]?.();
  } catch (error) {
    console.error(error);
    toast('We could not load this page properly. Please refresh.');
  }
});
