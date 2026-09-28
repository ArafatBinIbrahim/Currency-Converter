"use strict";

const BASE_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
const FALLBACK_BASE_URL = "https://latest.currency-api.pages.dev/v1/currencies";

// Elements
const form = document.getElementById("converterForm");
const fromSelect = document.getElementById("fromSelect");
const toSelect = document.getElementById("toSelect");
const amountInput = document.getElementById("amountInput");
const amountError = document.getElementById("amountError");
const formError = document.getElementById("formError");
const rateEl = document.querySelector(".rate");
const rateSecondaryEl = document.querySelector(".rate-secondary");
const updatedEl = document.getElementById("updatedAt");
const convertBtn = document.getElementById("convertBtn");
const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");

// In-memory cache so switching "To" or re-typing the amount doesn't refetch
const rateCache = new Map();

let debounceTimer = null;
let lastResultText = "";

/* ---------- Populate dropdowns ---------- */
function getCurrencyFormatter() {
    try {
        return new Intl.DisplayNames(["en"], { type: "currency" });
    } catch {
        return null;
    }
}

function populateDropdowns() {
    const currencyCodes = Object.keys(countryList).sort();
    const nameFormatter = getCurrencyFormatter();

    for (const select of [fromSelect, toSelect]) {
        const fragment = document.createDocumentFragment();
        for (const code of currencyCodes) {
            const option = document.createElement("option");
            option.value = code.toLowerCase();

            let label = code;
            if (nameFormatter) {
                try {
                    const name = nameFormatter.of(code);
                    if (name && name.toUpperCase() !== code) {
                        label = `${code} — ${name}`;
                    }
                } catch {
                    /* code not recognised by Intl, keep plain */
                }
            }
            option.textContent = label;
            fragment.appendChild(option);
        }
        select.appendChild(fragment);
    }

    setSelectValue(fromSelect, localStorage.getItem("currency:from") || "usd");
    setSelectValue(toSelect, localStorage.getItem("currency:to") || "bdt");
}

function setSelectValue(select, value) {
    const exists = [...select.options].some((opt) => opt.value === value);
    select.value = exists ? value : select.options[0]?.value || "";
    updateFlag(select);
}

/* ---------- Flags ---------- */
function updateFlag(select) {
    const currencyCode = select.value.toUpperCase();
    const countryCode = countryList[currencyCode];
    const img = select.closest(".box")?.querySelector("img");
    if (!img) return;

    if (countryCode) {
        img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
        img.alt = `${currencyCode} flag`;
    } else {
        img.removeAttribute("src");
        img.alt = "";
    }
}

/* ---------- Amount handling ---------- */
function sanitizeAmountInput(value) {
    let cleaned = value.replace(/[^\d.]/g, "");
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
        cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
    }
    return cleaned;
}

function getAmount() {
    const raw = amountInput.value.trim();
    if (raw === "") return null;
    const num = parseFloat(raw);
    if (Number.isNaN(num) || num < 0) return null;
    return num;
}

/* ---------- Fetching (cached, with a fallback mirror) ---------- */
async function fetchRateTable(fromCode) {
    if (rateCache.has(fromCode)) {
        return rateCache.get(fromCode);
    }

    const urls = [`${BASE_URL}/${fromCode}.json`, `${FALLBACK_BASE_URL}/${fromCode}.json`];
    let lastErr;

    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = await res.json();
            rateCache.set(fromCode, data);
            return data;
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Unable to fetch exchange rate.");
}

/* ---------- Formatting ---------- */
function formatAmount(value, currencyCode) {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode.toUpperCase(),
            maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 6 : 2,
        }).format(value);
    } catch {
        return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${currencyCode.toUpperCase()}`;
    }
}

/* ---------- Core conversion ---------- */
async function getExchangeRate({ silent = false } = {}) {
    formError.textContent = "";
    amountError.textContent = "";
    amountInput.classList.remove("has-error");

    const amountVal = getAmount();
    if (amountVal === null) {
        amountError.textContent = "Enter a valid, non-negative amount.";
        amountInput.classList.add("has-error");
        return;
    }

    const fromCode = fromSelect.value;
    const toCode = toSelect.value;

    setLoading(true);

    try {
        const table = await fetchRateTable(fromCode);
        const rates = table[fromCode];
        const rate = rates ? rates[toCode] : undefined;

        if (rate === undefined) {
            throw new Error(`No rate available for ${toCode.toUpperCase()} right now.`);
        }

        const totalAmount = rate * amountVal;
        const formattedTotal = formatAmount(totalAmount, toCode);
        const formattedAmount = formatAmount(amountVal, fromCode);

        lastResultText = `${formattedAmount} = ${formattedTotal}`;
        rateEl.textContent = lastResultText;
        rateSecondaryEl.textContent = `1 ${fromCode.toUpperCase()} = ${formatAmount(rate, toCode)}`;

        if (table.date) {
            const date = new Date(table.date);
            if (!Number.isNaN(date.getTime())) {
                updatedEl.textContent = `Rates as of ${date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                })}`;
            }
        }

        localStorage.setItem("currency:from", fromCode);
        localStorage.setItem("currency:to", toCode);
    } catch (err) {
        formError.textContent = err.message || "Something went wrong. Please try again.";
        if (!silent) {
            rateEl.textContent = "";
            rateSecondaryEl.textContent = "";
        }
    } finally {
        setLoading(false);
    }
}

function setLoading(isLoading) {
    convertBtn.disabled = isLoading;
    convertBtn.classList.toggle("is-loading", isLoading);
    swapBtn.classList.toggle("play-animation", isLoading);
    swapBtn.classList.toggle("stop-animation", !isLoading);
}

/* ---------- Debounced live conversion while typing ---------- */
function scheduleConvert() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => getExchangeRate({ silent: true }), 450);
}

/* ---------- Event wiring ---------- */
[fromSelect, toSelect].forEach((select) => {
    select.addEventListener("change", () => {
        updateFlag(select);
        getExchangeRate();
    });
});

amountInput.addEventListener("input", (evt) => {
    const cleaned = sanitizeAmountInput(evt.target.value);
    if (cleaned !== evt.target.value) evt.target.value = cleaned;
    scheduleConvert();
});

amountInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter") {
        evt.preventDefault();
        clearTimeout(debounceTimer);
        getExchangeRate();
    }
});

form.addEventListener("submit", (evt) => {
    evt.preventDefault();
    clearTimeout(debounceTimer);
    getExchangeRate();
});

swapBtn.addEventListener("click", () => {
    const fromVal = fromSelect.value;
    const toVal = toSelect.value;
    fromSelect.value = toVal;
    toSelect.value = fromVal;
    updateFlag(fromSelect);
    updateFlag(toSelect);
    getExchangeRate();
});

copyBtn.addEventListener("click", async () => {
    if (!lastResultText) return;
    try {
        await navigator.clipboard.writeText(lastResultText);
        flashCopied();
    } catch {
        // Clipboard API unavailable (older browser / no HTTPS) — fall back silently
        formError.textContent = "Couldn't copy automatically — please copy the result manually.";
    }
});

function flashCopied() {
    const original = copyBtn.innerHTML;
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied';
    setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.innerHTML = original;
    }, 1500);
}

/* ---------- Theme toggle ---------- */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.innerHTML = theme === "light"
        ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
});

/* ---------- Init ---------- */
(function init() {
    const savedTheme =
        localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    applyTheme(savedTheme);

    populateDropdowns();
    getExchangeRate();
})();
