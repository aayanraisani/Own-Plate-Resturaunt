const Store = (() => {
  const read = (key) => {
    try {
      return JSON.parse(localStorage.getItem(NS + key));
    } catch {
      return null;
    }
  };
  const write = (key, value) => localStorage.setItem(NS + key, JSON.stringify(value));
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const collection = (name, seed = []) => {
    const all = () => {
      const rows = read(name);
      if (Array.isArray(rows)) {
        const valid = rows.filter((row) => row && typeof row === 'object' && !Array.isArray(row));
        if (valid.length === rows.length) return valid;
        const recovered = valid.length ? valid : rows.length ? seed : valid;
        write(name, recovered);
        return recovered;
      }
      write(name, seed);
      return seed;
    };

    return {
      list: async () => all(),
      get: async (id) => all().find((row) => row.id === id),
      create: async (data) => {
        const row = { id: uid(name), createdAt: new Date().toISOString(), ...data };
        write(name, [row, ...all()]);
        return row;
      },
      update: async (id, patch) => write(name, all().map((row) => (row.id === id ? { ...row, ...patch } : row))),
      remove: async (id) => write(name, all().filter((row) => row.id !== id)),
    };
  };

  return {
    menu: collection('menu', MENU),
    deals: collection('deals', DEALS),
    coupons: collection('coupons', COUPONS),
    orders: collection('orders'),
    reservations: collection('reservations'),
    messages: collection('messages'),
    users: collection('users'),
    settings: {
      get: () => {
        const saved = read('settings');
        return { ...SETTINGS, ...(saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}) };
      },
      save: (patch) => write('settings', { ...Store.settings.get(), ...patch }),
    },
  };
})();
