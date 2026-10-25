const ADMIN = { email: 'admin@own-plate.pk', password: 'ownplate2026' };

const STATUS = {
  orders: ['new', 'preparing', 'ready', 'out-for-delivery', 'completed', 'cancelled'],
  reservations: ['pending', 'confirmed', 'seated', 'cancelled'],
};

const artChoices = () => Object.keys(ART).map((key) => [key, key]);

const SCHEMAS = {
  menu: {
    noun: 'dish',
    defaults: { category: 'burgers', available: true, featured: false, tags: [], urdu: '', img: '' },
    prepare: (data, existing) => ({ ...data, optionSet: existing?.optionSet === 'none' ? 'none' : data.category }),
    fields: [
      { name: 'name', label: 'Name', required: true, col: 6 },
      { name: 'urdu', label: 'Urdu name', col: 6 },
      { name: 'category', label: 'Category', type: 'select', options: () => CATEGORIES.slice(1).map((c) => [c.id, c.label]), required: true, col: 4 },
      { name: 'price', label: 'Price (PKR)', type: 'number', min: 0, required: true, col: 4 },
      { name: 'kcal', label: 'Calories', type: 'number', min: 0, col: 4 },
      { name: 'tags', label: 'Tags', type: 'tags', hint: 'Comma separated, for example Spicy, Bestseller.' },
      { name: 'img', label: 'Photo link (optional)', type: 'url', hint: 'Paste any image link from Unsplash, Pexels or your own site. Leave empty to use the built-in illustration.' },
      { name: 'desc', label: 'Description', type: 'textarea', required: true },
      { name: 'available', label: 'Available to order', type: 'switch', col: 6 },
      { name: 'featured', label: 'Show on home page', type: 'switch', col: 6 },
    ],
  },
  deals: {
    noun: 'deal',
    defaults: { art: 'burger', active: true },
    prepare: (data) => ({ ...data, tint: CATEGORIES.find((c) => c.art === data.art)?.tint ?? '#dfe3f0' }),
    fields: [
      { name: 'name', label: 'Deal name', required: true },
      { name: 'desc', label: 'What is included', type: 'textarea', required: true },
      { name: 'price', label: 'Deal price (PKR)', type: 'number', min: 1, required: true, col: 4 },
      { name: 'was', label: 'Normal price (PKR)', type: 'number', min: 1, required: true, col: 4 },
      { name: 'art', label: 'Illustration', type: 'select', options: artChoices, col: 4 },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
  },
  coupons: {
    noun: 'promo code',
    defaults: { type: 'percent', value: 10, min: 0, active: true },
    fields: [
      { name: 'code', label: 'Code', required: true, upper: true, col: 6 },
      { name: 'type', label: 'Type', type: 'select', options: () => [['percent', 'Percent off'], ['amount', 'Amount off (PKR)'], ['delivery', 'Free delivery']], col: 6 },
      { name: 'value', label: 'Value', type: 'number', min: 0, col: 6, hint: 'Percent or rupees. Ignored for free delivery.' },
      { name: 'min', label: 'Minimum order (PKR)', type: 'number', min: 0, col: 6 },
      { name: 'desc', label: 'Description shown to customers', required: true },
      { name: 'active', label: 'Active', type: 'switch' },
    ],
  },
  settings: {
    fields: [
      { name: 'phone', label: 'Phone', required: true, col: 6 },
      { name: 'email', label: 'Email', type: 'email', required: true, col: 6 },
      { name: 'address', label: 'Main address', required: true },
      { name: 'hours', label: 'Opening hours', required: true },
      { name: 'deliveryFee', label: 'Delivery fee (PKR)', type: 'number', min: 0, col: 4 },
      { name: 'freeDeliveryOver', label: 'Free delivery over (PKR)', type: 'number', min: 0, col: 4 },
      { name: 'minOrder', label: 'Minimum delivery order (PKR)', type: 'number', min: 0, col: 4 },
      { name: 'acceptingOrders', label: 'Accepting online orders', type: 'switch' },
    ],
  },
};

const $view = $('#view');
const recordModal = new bootstrap.Modal('#record-modal');
const editor = { collection: null, id: null };

const fieldHtml = (field, value) => {
  const id = `f-${field.name}`;
  const rules = `${field.required ? 'required' : ''} ${field.min !== undefined ? `min="${field.min}"` : ''}`;
  const control = {
    textarea: () => `<textarea class="form-control" id="${id}" name="${field.name}" rows="3" ${rules}>${esc(value)}</textarea>`,
    select: () => `<select class="form-select" id="${id}" name="${field.name}" ${rules}>${field.options().map(([v, label]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(label)}</option>`).join('')}</select>`,
    tags: () => `<input class="form-control" id="${id}" name="${field.name}" value="${esc((value ?? []).join(', '))}">`,
  }[field.type]?.() ?? `<input class="form-control" id="${id}" name="${field.name}" type="${field.type ?? 'text'}" value="${esc(value)}" ${rules}>`;

  return field.type === 'switch'
    ? `<div class="col-md-${field.col ?? 12}"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="${id}" name="${field.name}" ${value ? 'checked' : ''}><label class="form-check-label" for="${id}">${field.label}</label></div></div>`
    : `<div class="col-md-${field.col ?? 12}"><label class="form-label" for="${id}">${field.label}</label>${control}${field.hint ? `<div class="form-text">${field.hint}</div>` : ''}<div class="invalid-feedback">This field is required.</div></div>`;
};

const readForm = (fields, form) => Object.fromEntries(fields.map((field) => {
  const input = form.elements[field.name];
  const raw = field.type === 'switch' ? input.checked : input.value.trim();
  const value = {
    number: () => Number(raw) || 0,
    tags: () => raw.split(',').map((tag) => tag.trim()).filter(Boolean),
  }[field.type]?.() ?? (field.upper ? raw.toUpperCase() : raw);
  return [field.name, value];
}));

const table = (columns, rows, empty) => rows.length
  ? `<div class="panel"><div class="table-responsive"><table class="table align-middle admin-table mb-0">
      <thead><tr>${columns.map((c) => `<th scope="col">${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${columns.map((c) => `<td data-label="${esc(c.label)}">${c.cell(row)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div></div>`
  : `<p class="empty panel">${empty}</p>`;

const statusSelect = (collection, row) => `
  <select class="form-select form-select-sm status status-${row.status}" data-collection="${collection}" data-id="${row.id}" aria-label="Status">
    ${STATUS[collection].map((s) => `<option value="${s}"${s === row.status ? ' selected' : ''}>${s.replace(/-/g, ' ')}</option>`).join('')}
  </select>`;

const rowActions = (collection, row, label) => `
  <div class="d-flex gap-2">
    <button type="button" class="btn btn-sm btn-outline-indigo" data-edit="${row.id}" data-collection="${collection}" aria-label="Edit ${esc(label)}"><i class="bi bi-pencil" aria-hidden="true"></i></button>
    <button type="button" class="btn btn-sm btn-outline-danger" data-remove="${row.id}" data-collection="${collection}" aria-label="Delete ${esc(label)}"><i class="bi bi-trash" aria-hidden="true"></i></button>
  </div>`;

const removeButton = (collection, id) =>
  `<button type="button" class="btn btn-sm btn-outline-danger" data-remove="${id}" data-collection="${collection}" aria-label="Delete"><i class="bi bi-trash" aria-hidden="true"></i></button>`;

const toolbar = (collection, text) => `
  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
    <p class="text-muted mb-0">${text}</p>
    <button type="button" class="btn btn-clay" data-edit="" data-collection="${collection}"><i class="bi bi-plus-lg" aria-hidden="true"></i> Add ${SCHEMAS[collection].noun}</button>
  </div>`;

const switchCell = (collection, field, row) =>
  `<div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" data-toggle="${field}" data-collection="${collection}" data-id="${row.id}" aria-label="${field}" ${row[field] ? 'checked' : ''}></div>`;

const ordersTable = (orders) => table([
  { label: 'Order', cell: (o) => `<strong>${shortId(o.id)}</strong><div class="small text-muted">${when(o.createdAt)}</div>` },
  { label: 'Customer', cell: (o) => `${esc(o.name)}<div class="small text-muted">${esc(o.phone)} &middot; ${esc(o.type)}</div>${o.address ? `<div class="small text-muted">${esc(o.address)}</div>` : ''}` },
  { label: 'Items', cell: (o) => `${o.items.map((i) => `${i.qty} &times; ${esc(i.name)}${i.options?.length ? ` <small class="text-muted">(${esc(i.options.join(', '))})</small>` : ''}`).join('<br>')}${o.notes ? `<div class="small text-muted fst-italic">${esc(o.notes)}</div>` : ''}` },
  { label: 'Total', cell: (o) => `<strong>${money.format(o.total)}</strong>${o.coupon ? `<div class="small text-muted">${esc(o.coupon)}</div>` : ''}` },
  { label: 'Status', cell: (o) => statusSelect('orders', o) },
], orders, 'No orders yet. They show up here the moment a customer checks out.');

const views = {
  async dashboard() {
    const [orders, reservations, messages, users] = await Promise.all([Store.orders.list(), Store.reservations.list(), Store.messages.list(), Store.users.list()]);
    const live = orders.filter((o) => o.status !== 'cancelled');
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const daily = days.map((d) => ({
      label: d.toLocaleDateString('en-PK', { weekday: 'short' }),
      total: live.filter((o) => new Date(o.createdAt).toDateString() === d.toDateString()).reduce((sum, o) => sum + o.total, 0),
    }));
    const peak = Math.max(...daily.map((d) => d.total), 1);
    const sold = {};
    live.forEach((o) => o.items.forEach((i) => { sold[i.name] = (sold[i.name] ?? 0) + i.qty; }));
    const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const stats = [
      ['bi-cash-coin', 'Revenue', money.format(live.reduce((sum, o) => sum + o.total, 0))],
      ['bi-bag-check', 'Orders', `${orders.length} (${orders.filter((o) => o.status === 'new').length} new)`],
      ['bi-calendar-check', 'Bookings to confirm', reservations.filter((r) => r.status === 'pending').length],
      ['bi-envelope', 'Unread messages', messages.filter((m) => !m.read).length],
      ['bi-people', 'Customers', users.length],
    ];
    return `
      <div class="row g-3 mb-4">${stats.map(([icon, label, value]) => `<div class="col-6 col-xl"><div class="stat-card"><i class="bi ${icon}" aria-hidden="true"></i><span class="d-block text-muted small mt-2">${label}</span><strong>${value}</strong></div></div>`).join('')}</div>
      <div class="row g-3 mb-4">
        <div class="col-lg-8"><div class="panel panel-pad h-100"><h2 class="h6 mb-3">Revenue, last 7 days</h2>
          <div class="bars">${daily.map((d) => `<div class="bar" title="${money.format(d.total)}"><i style="--h:${(d.total / peak) * 100}%"></i><small>${d.label}</small></div>`).join('')}</div></div></div>
        <div class="col-lg-4"><div class="panel panel-pad h-100"><h2 class="h6 mb-3">Top sellers</h2>
          ${top.length ? `<ol class="rank">${top.map(([name, qty]) => `<li><span>${esc(name)}</span><strong>${qty}</strong></li>`).join('')}</ol>` : '<p class="text-muted mb-0">Sales will show up here.</p>'}</div></div>
      </div>
      <h2 class="h5 mb-3">Recent orders</h2>${ordersTable(orders.slice(0, 5))}`;
  },

  async orders() {
    return ordersTable(await Store.orders.list());
  },

  async menu() {
    const items = await Store.menu.list();
    return toolbar('menu', `${items.length} dishes. Changes appear on the public menu straight away.`) + table([
      { label: 'Dish', cell: (i) => `<div class="d-flex align-items-center gap-3">${artFigure(i, 'cart-thumb')}<div><strong>${esc(i.name)}</strong>${i.urdu ? `<div class="small urdu" lang="ur" dir="rtl">${esc(i.urdu)}</div>` : ''}</div></div>` },
      { label: 'Category', cell: (i) => esc(CATEGORIES.find((c) => c.id === i.category)?.label ?? i.category) },
      { label: 'Price', cell: (i) => money.format(i.price) },
      { label: 'Available', cell: (i) => switchCell('menu', 'available', i) },
      { label: 'Featured', cell: (i) => switchCell('menu', 'featured', i) },
      { label: '', cell: (i) => rowActions('menu', i, i.name) },
    ], items, 'The menu is empty. Add your first dish.');
  },

  async deals() {
    const deals = await Store.deals.list();
    return toolbar('deals', 'Bundles shown on the home page and the deals page.') + table([
      { label: 'Deal', cell: (d) => `<div class="d-flex align-items-center gap-3">${artFigure(d, 'cart-thumb')}<div><strong>${esc(d.name)}</strong><div class="small text-muted">${esc(d.desc)}</div></div></div>` },
      { label: 'Price', cell: (d) => `${money.format(d.price)} <span class="was">${money.format(d.was)}</span>` },
      { label: 'Active', cell: (d) => switchCell('deals', 'active', d) },
      { label: '', cell: (d) => rowActions('deals', d, d.name) },
    ], deals, 'No deals yet. Add your first bundle.');
  },

  async coupons() {
    const coupons = await Store.coupons.list();
    return toolbar('coupons', 'Codes customers can apply at checkout.') + table([
      { label: 'Code', cell: (c) => `<strong>${esc(c.code)}</strong>` },
      { label: 'Offer', cell: (c) => esc(c.desc) },
      { label: 'Minimum', cell: (c) => money.format(c.min) },
      { label: 'Active', cell: (c) => switchCell('coupons', 'active', c) },
      { label: '', cell: (c) => rowActions('coupons', c, c.code) },
    ], coupons, 'No promo codes yet.');
  },

  async reservations() {
    return table([
      { label: 'Guest', cell: (r) => `<strong>${esc(r.name)}</strong><div class="small text-muted">${esc(r.phone)}</div>` },
      { label: 'When', cell: (r) => `${esc(r.date)}<div class="small text-muted">${esc(r.time)}</div>` },
      { label: 'Party', cell: (r) => `${r.guests} guests` },
      { label: 'Notes', cell: (r) => esc(r.notes || '-') },
      { label: 'Status', cell: (r) => statusSelect('reservations', r) },
      { label: '', cell: (r) => removeButton('reservations', r.id) },
    ], await Store.reservations.list(), 'No table requests yet.');
  },

  async messages() {
    const messages = await Store.messages.list();
    return messages.length ? messages.map((m) => `
      <article class="message-card${m.read ? '' : ' is-unread'}">
        <header><strong>${esc(m.subject)}</strong><small class="text-muted">${when(m.createdAt)}</small></header>
        <p class="my-2">${esc(m.message)}</p>
        <footer class="d-flex flex-wrap align-items-center gap-2 small">
          <span>${esc(m.name)} &middot; <a href="mailto:${esc(m.email)}">${esc(m.email)}</a></span>
          <span class="ms-auto d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-indigo" data-read="${m.id}" data-value="${!m.read}">Mark as ${m.read ? 'unread' : 'read'}</button>
            ${removeButton('messages', m.id)}
          </span>
        </footer>
      </article>`).join('') : '<p class="empty panel">No messages yet.</p>';
  },

  async customers() {
    const [users, orders] = await Promise.all([Store.users.list(), Store.orders.list()]);
    return table([
      { label: 'Customer', cell: (u) => `<strong>${esc(u.name)}</strong><div class="small text-muted">${esc(u.email)}</div>` },
      { label: 'Mobile', cell: (u) => esc(u.phone) },
      { label: 'Joined', cell: (u) => when(u.createdAt) },
      { label: 'Orders', cell: (u) => orders.filter((o) => o.userId === u.id).length },
      { label: 'Spent', cell: (u) => money.format(orders.filter((o) => o.userId === u.id && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)) },
    ], users, 'No customer accounts yet.');
  },

  async settings() {
    const settings = Store.settings.get();
    return `<form id="settings-form" class="panel panel-pad" novalidate><div class="row g-3">
      ${SCHEMAS.settings.fields.map((f) => fieldHtml(f, settings[f.name])).join('')}
      <div class="col-12"><button class="btn btn-clay" type="submit">Save settings</button></div></div></form>`;
  },
};

const route = async () => {
  const name = location.hash.slice(1) in views ? location.hash.slice(1) : 'dashboard';
  $('.admin-nav a').each((_, el) => $(el).toggleClass('active', el.hash === `#${name}`).attr('aria-current', el.hash === `#${name}` ? 'page' : null));
  $('#view-title').text($(`.admin-nav a[href="#${name}"]`).text().trim());
  try {
    $view.html(await views[name]());
    loadUrduFont();
  } catch (error) {
    console.error(error);
    $view.html('<p class="empty panel">This section failed to load. Refresh and try again.</p>');
  }
};

const openRecord = async (collection, id) => {
  const schema = SCHEMAS[collection];
  const record = id ? await Store[collection].get(id) : schema.defaults;
  Object.assign(editor, { collection, id });
  $('#record-title').text(`${id ? 'Edit' : 'Add'} ${schema.noun}`);
  $('#record-fields').html(schema.fields.map((f) => fieldHtml(f, record[f.name])).join(''));
  $('#record-form').removeClass('was-validated');
  recordModal.show();
};

const authed = () => sessionStorage.getItem(`${NS}admin`) === '1';
const gate = () => {
  $('#login').toggleClass('d-none', authed());
  $('#shell').toggleClass('d-none', !authed());
  if (authed()) route();
};

$('#login-form').on('submit', function (event) {
  event.preventDefault();
  const { email, password } = Object.fromEntries(new FormData(this));
  if (email === ADMIN.email && password === ADMIN.password) {
    sessionStorage.setItem(`${NS}admin`, '1');
    gate();
  } else {
    $('#login-error').removeClass('d-none');
  }
});

$('#logout').on('click', () => {
  sessionStorage.removeItem(`${NS}admin`);
  gate();
});

$('#record-form').on('submit', async function (event) {
  event.preventDefault();
  if (!this.checkValidity()) return $(this).addClass('was-validated');
  const { collection, id } = editor;
  const schema = SCHEMAS[collection];
  try {
    const existing = id ? await Store[collection].get(id) : null;
    const data = readForm(schema.fields, this);
    const record = schema.prepare ? schema.prepare(data, existing) : data;
    await (id ? Store[collection].update(id, record) : Store[collection].create(record));
    recordModal.hide();
    toast(`${schema.noun[0].toUpperCase()}${schema.noun.slice(1)} saved`);
    route();
  } catch (error) {
    console.error(error);
    toast('Could not save. Please try again.');
  }
});

$view
  .on('submit', '#settings-form', function (event) {
    event.preventDefault();
    if (!this.checkValidity()) return $(this).addClass('was-validated');
    Store.settings.save(readForm(SCHEMAS.settings.fields, this));
    toast('Settings saved');
  })
  .on('change', '.status', async function () {
    const { collection, id } = this.dataset;
    const patch = { status: this.value };
    if (collection === 'orders') {
      const order = await Store.orders.get(id);
      patch.history = [...(order.history ?? []), { status: this.value, at: new Date().toISOString() }];
    }
    await Store[collection].update(id, patch);
    toast('Status updated');
    route();
  })
  .on('change', '[data-toggle]', async function () {
    await Store[this.dataset.collection].update(this.dataset.id, { [this.dataset.toggle]: this.checked });
  })
  .on('click', '[data-edit]', function () { openRecord(this.dataset.collection, this.dataset.edit); })
  .on('click', '[data-read]', async function () {
    await Store.messages.update(this.dataset.read, { read: this.dataset.value === 'true' });
    route();
  })
  .on('click', '[data-remove]', async function () {
    if (!confirm('Delete this entry permanently?')) return;
    await Store[this.dataset.collection].remove(this.dataset.remove);
    route();
  });

$(window).on('hashchange storage', () => authed() && route());
gate();
