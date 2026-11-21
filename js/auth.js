const Auth = (() => {
  const SESSION = `${NS}session`;
  let user = null;

  const start = (record) => {
    localStorage.setItem(SESSION, record.id);
    user = record;
    return record;
  };
  const normalise = (email) => email.trim().toLowerCase();

  return {
    user: () => user,

    async load() {
      const id = localStorage.getItem(SESSION);
      user = id ? (await Store.users.get(id)) ?? null : null;
      return user;
    },

    async signup({ name, email, phone, password }) {
      const mail = normalise(email);
      if ((await Store.users.list()).some((u) => u.email === mail)) {
        throw new AppError('An account with this email already exists. Try signing in.');
      }
      const salt = crypto.randomUUID?.();
      return start(await Store.users.create({
        name: name.trim(), email: mail, phone, salt, passwordHash: await hashPassword(password, salt), addresses: [], favourites: [],
      }));
    },

    async login(email, password) {
      const record = (await Store.users.list()).find((u) => u.email === normalise(email));
      if (!record || record.passwordHash !== await hashPassword(password, record.salt)) {
        throw new AppError('Email or password is incorrect.');
      }
      return start(record);
    },

    logout() {
      localStorage.removeItem(SESSION);
      user = null;
    },

    async update(patch) {
      await Store.users.update(user.id, patch);
      user = { ...user, ...patch };
    },

    async changePassword(current, next) {
      if (user.passwordHash !== await hashPassword(current, user.salt)) throw new AppError('Your current password is not correct.');
      await Auth.update({ passwordHash: await hashPassword(next, user.salt) });
    },

    async toggleFavourite(id) {
      const favourites = user.favourites.includes(id) ? user.favourites.filter((f) => f !== id) : [...user.favourites, id];
      await Auth.update({ favourites });
      return favourites.includes(id);
    },

    async remove() {
      await Store.users.remove(user.id);
      Auth.logout();
    },
  };
})();
