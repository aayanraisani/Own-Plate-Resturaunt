const svg = (body) => `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">${body}</svg>`;

const ART = {
  burger: svg(`<path d="M16 52C16 30 36 18 60 18s44 12 44 34z" fill="#E3A52F"/>
    <g fill="#FFF8E6"><ellipse cx="44" cy="32" rx="4" ry="2" transform="rotate(-15 44 32)"/><ellipse cx="62" cy="26" rx="4" ry="2"/><ellipse cx="78" cy="34" rx="4" ry="2" transform="rotate(15 78 34)"/><ellipse cx="58" cy="42" rx="4" ry="2"/></g>
    <path d="M14 56q7.5 9 15 0t15 0 15 0 15 0 15 0 15 0V52H14z" fill="#5E9B4B"/>
    <rect x="16" y="58" width="88" height="14" rx="7" fill="#5B3A29"/>
    <path d="M18 72h84l-10 10-10-10-10 10-10-10-10 10-10-10z" fill="#F2C94C"/>
    <path d="M16 82h88v6a12 12 0 0 1-12 12H28a12 12 0 0 1-12-12z" fill="#E3A52F"/>`),
  pizza: svg(`<path d="M60 112 14 32Q60 10 106 32z" fill="#F2C94C"/>
    <path d="M10 30Q60 4 110 30l-5 12Q60 20 15 42z" fill="#C98A1E"/>
    <g fill="#B2303F"><circle cx="46" cy="54" r="8"/><circle cx="74" cy="56" r="8"/><circle cx="60" cy="84" r="7"/></g>
    <g fill="#5E9B4B"><ellipse cx="60" cy="64" rx="4" ry="2"/><ellipse cx="36" cy="46" rx="3" ry="1.6"/><ellipse cx="82" cy="46" rx="3" ry="1.6"/></g>`),
  fries: svg(`<g fill="#F2C94C"><rect x="30" y="14" width="11" height="52" rx="3" transform="rotate(-10 35 40)"/><rect x="45" y="8" width="11" height="56" rx="3" transform="rotate(-4 50 36)"/><rect x="60" y="10" width="11" height="56" rx="3"/><rect x="75" y="8" width="11" height="56" rx="3" transform="rotate(5 80 36)"/><rect x="88" y="16" width="11" height="50" rx="3" transform="rotate(12 93 40)"/></g>
    <path d="M24 56h72l-8 54H32z" fill="#B2303F"/><path d="M24 56h72l-2 14H26z" fill="#8F2431"/><circle cx="60" cy="90" r="11" fill="#E3A52F"/>`),
  chicken: svg(`<g transform="rotate(40 60 60)"><rect x="52" y="74" width="16" height="30" rx="5" fill="#F6F3EC"/><circle cx="52" cy="106" r="6.5" fill="#F6F3EC"/><circle cx="68" cy="106" r="6.5" fill="#F6F3EC"/>
    <ellipse cx="60" cy="46" rx="30" ry="36" fill="#C98A1E"/><path d="M40 38q10-14 24-10" stroke="#E3A52F" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#E3A52F"><circle cx="74" cy="52" r="3"/><circle cx="52" cy="62" r="3"/><circle cx="66" cy="70" r="2.5"/></g></g>`),
  wrap: svg(`<g transform="rotate(-25 60 60)"><rect x="18" y="38" width="84" height="44" rx="22" fill="#EBCB92" stroke="#C98A1E" stroke-width="3"/>
    <path d="M18 60h54v22H40a22 22 0 0 1-22-22z" fill="#B2303F"/><ellipse cx="96" cy="60" rx="10" ry="19" fill="#5E9B4B"/><circle cx="95" cy="52" r="4.5" fill="#B2303F"/><circle cx="95" cy="68" r="4.5" fill="#F2C94C"/></g>`),
  bowl: svg(`<path d="M12 60h96a48 44 0 0 1-96 0z" fill="#1F2B5E"/><path d="M18 60a42 26 0 0 1 84 0z" fill="#F6F3EC"/>
    <circle cx="44" cy="46" r="9" fill="#B2303F"/><circle cx="62" cy="38" r="9" fill="#C86A2C"/><circle cx="80" cy="46" r="9" fill="#B2303F"/><ellipse cx="60" cy="54" rx="16" ry="5" fill="#5E9B4B"/>
    <path d="M26 78h68" stroke="#E3A52F" stroke-width="4" stroke-linecap="round"/>`),
  cup: svg(`<path d="M82 26l6-16h14" fill="none" stroke="#1F2B5E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="30" y="22" width="60" height="12" rx="5" fill="#1F2B5E"/><path d="M34 34h52l-6 76H40z" fill="#B2303F"/>
    <path d="M37 62h46l-1.5 20h-43z" fill="#F6F3EC"/><circle cx="60" cy="72" r="6.5" fill="#E3A52F"/>`),
  chai: svg(`<path d="M26 58h60v20a24 24 0 0 1-24 24H50a24 24 0 0 1-24-24z" fill="#F6F3EC" stroke="#1F2B5E" stroke-width="4"/>
    <path d="M86 64h8a10 10 0 0 1 0 20h-9" fill="none" stroke="#1F2B5E" stroke-width="5"/><ellipse cx="56" cy="58" rx="30" ry="6" fill="#E8A3A9"/>
    <path d="M44 40q-6-8 0-14M60 40q-6-8 0-14M76 40q-6-8 0-14" fill="none" stroke="#1F2B5E" stroke-width="3" stroke-linecap="round" opacity=".5"/>`),
  sundae: svg(`<path d="M42 58h36L60 112z" fill="#E3A52F"/><path d="M46 66h28M52 80h16M44 58l16 54M76 58L60 112" stroke="#C98A1E" stroke-width="2"/>
    <circle cx="60" cy="44" r="22" fill="#F4B6C5"/><circle cx="60" cy="26" r="14" fill="#F6F3EC"/><circle cx="68" cy="14" r="5" fill="#B2303F"/>`),
};

const artFigure = (item, className = 'dish-art') => {
  const category = CATEGORIES.find((c) => c.id === item.category);
  const picture = ART[item.art ?? category?.art] ?? ART.bowl;
  const photo = item.img ? `<img src="${esc(item.img)}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<figure class="${className}" style="--tint:${item.tint ?? category?.tint ?? '#dfe3f0'}">${picture}${photo}</figure>`;
};
