const CURRENCIES = {
  USD: { name: "US Dollar",           flag: "🇺🇸" },
  EUR: { name: "Euro",                flag: "🇪🇺" },
  GBP: { name: "British Pound",       flag: "🇬🇧" },
  JPY: { name: "Japanese Yen",        flag: "🇯🇵" },
  CAD: { name: "Canadian Dollar",     flag: "🇨🇦" },
  AUD: { name: "Australian Dollar",   flag: "🇦🇺" },
  CHF: { name: "Swiss Franc",         flag: "🇨🇭" },
  CNY: { name: "Chinese Yuan",        flag: "🇨🇳" },
  INR: { name: "Indian Rupee",        flag: "🇮🇳" },
  MXN: { name: "Mexican Peso",        flag: "🇲🇽" },
  BRL: { name: "Brazilian Real",      flag: "🇧🇷" },
  SGD: { name: "Singapore Dollar",    flag: "🇸🇬" },
  HKD: { name: "Hong Kong Dollar",    flag: "🇭🇰" },
  NOK: { name: "Norwegian Krone",     flag: "🇳🇴" },
  SEK: { name: "Swedish Krona",       flag: "🇸🇪" },
  DKK: { name: "Danish Krone",        flag: "🇩🇰" },
  NZD: { name: "New Zealand Dollar",  flag: "🇳🇿" },
  ZAR: { name: "South African Rand",  flag: "🇿🇦" },
  AED: { name: "UAE Dirham",          flag: "🇦🇪" },
  THB: { name: "Thai Baht",           flag: "🇹🇭" },
  KRW: { name: "South Korean Won",    flag: "🇰🇷" },
  TRY: { name: "Turkish Lira",        flag: "🇹🇷" },
  PLN: { name: "Polish Zloty",        flag: "🇵🇱" },
  IDR: { name: "Indonesian Rupiah",   flag: "🇮🇩" },
  MYR: { name: "Malaysian Ringgit",   flag: "🇲🇾" },
  PHP: { name: "Philippine Peso",     flag: "🇵🇭" },
  PKR: { name: "Pakistani Rupee",     flag: "🇵🇰" },
  EGP: { name: "Egyptian Pound",      flag: "🇪🇬" },
  SAR: { name: "Saudi Riyal",         flag: "🇸🇦" },
  QAR: { name: "Qatari Riyal",        flag: "🇶🇦" },
};

const POPULAR_PAIRS = [
  ["USD", "EUR"],
  ["USD", "GBP"],
  ["USD", "INR"],
  ["EUR", "GBP"],
  ["USD", "JPY"],
  ["GBP", "INR"],
];

const QUICK_AMOUNTS = [1, 10, 50, 100, 500, 1000];

const FALLBACK_RATES = {
  USD: 1,      EUR: 0.9195, GBP: 0.787,  JPY: 144.5,
  CAD: 1.364,  AUD: 1.538,  CHF: 0.8995, CNY: 7.244,
  INR: 83.48,  MXN: 18.1,   BRL: 4.97,   SGD: 1.337,
  HKD: 7.819,  NOK: 10.55,  SEK: 10.42,  DKK: 6.885,
  NZD: 1.632,  ZAR: 18.63,  AED: 3.673,  THB: 35.6,
  KRW: 1325,   TRY: 32.2,   PLN: 3.975,  IDR: 15750,
  MYR: 4.68,   PHP: 56.4,   PKR: 278,    EGP: 30.9,
  SAR: 3.75,   QAR: 3.64,
};

let rates = {};

function init() {
  populateSelects();
  fetchRates();
}

function populateSelects() {
  const codes = Object.keys(CURRENCIES);
  ["from-currency", "to-currency"].forEach((id, i) => {
    const sel = document.getElementById(id);
    codes.forEach(code => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${CURRENCIES[code].flag} ${code}`;
      sel.appendChild(opt);
    });
    sel.value = i === 0 ? "USD" : "INR";
  });
}

async function fetchRates() {
  const btn    = document.getElementById("refresh-btn");
  const status = document.getElementById("rate-status");
  btn.disabled = true;
  status.textContent = "Fetching live rates...";

  const symbols = Object.keys(CURRENCIES).filter(c => c !== "USD").join(",");
  try {
    const res  = await fetch(`https://api.frankfurter.app/latest?base=USD&symbols=${symbols}`);
    const data = await res.json();
    rates = { USD: 1, ...data.rates };
    const now = new Date();
    status.textContent = `Live rates · Updated ${now.toLocaleTimeString()}`;
  } catch (err) {
    rates = { ...FALLBACK_RATES };
    status.textContent = "Using cached rates (no internet)";
  }

  convert();
  buildPopularPairs();
  btn.disabled = false;
}

function getRate(from, to) {
  if (!rates[from] || !rates[to]) return null;
  return rates[to] / rates[from];
}

function fmt(n, code) {
  if (n === null || isNaN(n)) return "—";
  const noDecimals = ["JPY", "KRW", "IDR", "PKR"];
  const decimals   = noDecimals.includes(code) ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function convert() {
  const from = document.getElementById("from-currency").value;
  const to   = document.getElementById("to-currency").value;
  const amt  = parseFloat(document.getElementById("from-amount").value) || 0;
  const rate = getRate(from, to);

  document.getElementById("from-name").textContent = CURRENCIES[from]?.name || "";
  document.getElementById("to-name").textContent   = CURRENCIES[to]?.name   || "";

  if (rate === null) {
    document.getElementById("to-amount").textContent = "—";
    return;
  }

  document.getElementById("to-amount").textContent       = fmt(amt * rate, to);
  document.getElementById("rate-display").textContent    = `1 ${from} = ${fmt(rate, to)} ${to}`;
  document.getElementById("inverse-display").textContent = `1 ${to} = ${fmt(1 / rate, from)} ${from}`;

  buildQuickAmounts(from, to, rate);
}

function buildQuickAmounts(from, to, rate) {
  const el = document.getElementById("quick-amounts");
  el.innerHTML = "";
  QUICK_AMOUNTS.forEach(q => {
    const btn = document.createElement("button");
    btn.className   = "quick-btn";
    btn.textContent = `${q} ${from}`;
    btn.onclick = () => {
      document.getElementById("from-amount").value = q;
      convert();
    };
    el.appendChild(btn);
  });
}

function buildPopularPairs() {
  const el = document.getElementById("popular-pairs");
  el.innerHTML = "";
  POPULAR_PAIRS.forEach(([a, b]) => {
    const rate = getRate(a, b);
    if (rate === null) return;
    const card = document.createElement("div");
    card.className = "pair-card";
    card.innerHTML = `
      <p class="pair-label">${CURRENCIES[a].flag} ${a} → ${CURRENCIES[b].flag} ${b}</p>
      <p class="pair-rate">${fmt(rate, b)}</p>
    `;
    card.onclick = () => {
      document.getElementById("from-currency").value = a;
      document.getElementById("to-currency").value   = b;
      convert();
    };
    el.appendChild(card);
  });
}

function swapCurrencies() {
  const fromSel  = document.getElementById("from-currency");
  const toSel    = document.getElementById("to-currency");
  const toAmount = document.getElementById("to-amount").textContent.replace(/,/g, "");

  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];

  const parsed = parseFloat(toAmount);
  if (!isNaN(parsed) && parsed > 0) {
    document.getElementById("from-amount").value = parsed;
  }
  convert();
}

init();
