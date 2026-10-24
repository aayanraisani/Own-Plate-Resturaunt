const NS = 'op3:';

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
