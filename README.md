# Own-Plate

Multi-page restaurant ordering site (HTML5, CSS3, JavaScript, Bootstrap 5, jQuery) with a staff admin panel.

## Run locally

Serve the folder over localhost or https (accounts use the Web Crypto API):

    npx serve .        # or VS Code Live Server

Public site: `index.html` · Admin: `admin/index.html`
Demo admin login: `admin@own-plate.pk` / `ownplate2026` (client-side placeholder, replaced by real auth in the backend).

## Structure

    *.html            public pages (home, menu, deals, locations, about, reserve, contact, faq,
                      track, checkout, login, signup, forgot, account, terms, privacy, 404)
    admin/            dashboard, orders, menu, deals, promo codes, reservations, messages, customers, settings
    css/styles.css    design tokens, components, animation
    js/data.js        seed menu, deals, coupons, option sets, settings
    js/art.js         built-in dish illustrations
    js/store.js       data layer (localStorage now; swap internals for fetch() calls when the API exists)
    js/auth.js        accounts and sessions (placeholder until server-side auth)
    js/app.js         public site behaviour

## Photos

Dishes use built-in illustrations. To use a real photo, paste any image link into Admin > Menu > edit dish > Photo link.

## Before launch

Replace the placeholder address, phone, email, branches and legal text. Update the storage namespace (`NS` in js/core.js) if you change seed data.
