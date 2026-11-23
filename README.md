# Own-Plate

Multi-page restaurant ordering site (HTML5, CSS3, JavaScript, Bootstrap 5, jQuery) with a staff admin panel.

## Run locally

Serve the folder over localhost or https (accounts use the Web Crypto API):

    npx serve .        # or VS Code Live Server

Public site: `index.html` · Admin: `admin/index.html`

The first visit to the admin page asks you to create a staff account (stored hashed in that browser only). Real server-side authentication arrives with the backend.

## Structure

    *.html            public pages (home, menu, deals, locations, about, reserve, contact, faq,
                      track, checkout, login, signup, forgot, account, terms, privacy, 404)
    admin/            dashboard, orders, menu, deals, promo codes, reservations, messages, customers, settings
    css/styles.css    design tokens, components, animation
    js/data.js        business settings, menu, deals, promo codes, option sets, Unsplash photo ids
    js/store.js       data layer (localStorage now; swap internals for fetch() calls when the API exists)
    js/auth.js        accounts and sessions (placeholder until server-side auth)
    js/app.js         public site behaviour

## Before launch

- `whatsapp` in `SETTINGS`: number with country code and no plus, e.g. `923001234567`. When set, checkout ends with a "Send order on WhatsApp" button and order tracking is hidden (the kitchen cannot update statuses without a backend).
- Google sign-in: create an OAuth Web client ID in Google Cloud Console (APIs & Services > Credentials), add `https://own-plate.vercel.app` (and your local origin) under Authorized JavaScript origins, then paste it into `googleClientId`. Empty means the button is hidden. The token is only checked in the browser, so verify it server-side once the backend exists.
- Fill in `SETTINGS` in `js/data.js`: `phone`, `email`, `address`, `hours` and the `social` links. Empty values are hidden on the site. Add extra branches to `BRANCHES`.
- Dish photos are Unsplash images referenced by id in `PHOTOS` (`js/data.js`). Dishes without an entry show a plain tinted block until a photo is added there or in Admin > Menu > Photo link.
- Bump the storage namespace (`NS` in `js/core.js`) whenever you change seed data, otherwise returning visitors keep the old menu.
- Review the Terms and Privacy pages with the restaurant owner. They are generic.
- Orders, accounts and admin changes live in each visitor's own browser until the backend exists.
