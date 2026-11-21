const NS = 'op4:';

class AppError extends Error {}

const money = new Intl.NumberFormat(SETTINGS.currency.locale, {
  style: 'currency',
  currency: SETTINGS.currency.code,
  maximumFractionDigits: 0,
});

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const when = (iso) => new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
const shortId = (id) => `#${id.slice(-5).toUpperCase()}`;

const toast = (message) => {
  const $host = $('#toasts').length
    ? $('#toasts')
    : $('<div id="toasts" class="toast-container position-fixed bottom-0 end-0 p-3"></div>').appendTo('body');
  const $toast = $(`
    <div class="toast toast-indigo border-0" role="status" aria-live="polite" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${esc(message)}</div>
        <button type="button" class="btn-close btn-close-white m-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`).appendTo($host);
  $toast.on('hidden.bs.toast', () => $toast.remove());
  new bootstrap.Toast($toast[0], { delay: 2800 }).show();
};

const loadUrduFont = (() => {
  let loaded = false;
  return () => {
    if (loaded || !document.querySelector('.urdu')) return;
    loaded = true;
    $('<link rel="stylesheet">')
      .attr('href', 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500&display=swap')
      .appendTo('head');
  };
})();

const hashPassword = async (password, salt) => {
  if (!globalThis.crypto?.subtle) throw new AppError('Accounts need a secure page. Open the site on localhost or https.');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 210000 }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const sized = (url, width) => (url.startsWith('https://images.unsplash.com/') ? `${url}&w=${width}` : url);

const figure = (item, className = 'dish-art', width = 640) => `
  <figure class="${className}">${item.img ? `<img src="${esc(sized(item.img, width))}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}</figure>`;
