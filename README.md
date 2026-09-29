live link-https://arafatbinibrahim.github.io/Currency-Converter/
# 💱 Currency Converter

A fast, accessible, real-time currency converter supporting 150+ world currencies — built with vanilla HTML, CSS and JavaScript. No frameworks, no build step.

**Live demo:** (https://arafatbinibrahim.github.io/Currency-Converter/)

## ✨ Features

- 🔄 **Live conversion** — results update as you type (debounced), no need to click a button every time
- 🔁 **One-click swap** between "From" and "To" currencies
- 🌐 **150+ currencies** with country flags, sourced from a free, no-key-required exchange rate API
- 🏷️ **Full currency names** in the dropdown (e.g. `USD — US Dollar`) via the native `Intl.DisplayNames` API
- 📊 Shows both the converted total **and** the unit exchange rate (`1 USD = 109.50 BDT`)
- 🕒 Displays the **date rates were last updated**
- 📋 **Copy result** to clipboard in one click
- 🌗 **Light / dark theme** toggle, remembered across visits
- 💾 Remembers your last-used currencies (`localStorage`)
- ⚡ In-memory rate caching + a fallback API mirror for reliability
- ♿ Accessible: proper labels, `aria-live` result announcements, visible focus states, keyboard support (Enter to convert)
- 📱 Fully responsive, down to small mobile screens

## 🛠️ Tech Stack

- HTML5
- CSS3 (custom properties, native CSS nesting)
- Vanilla JavaScript (ES2020+, no dependencies)
- [Font Awesome](https://fontawesome.com/) icons
- [Currency API by fawazahmed0](https://github.com/fawazahmed0/exchange-api) — free, open-source exchange rate data
- [FlagsAPI](https://flagsapi.com/) — country flag images

## 📁 Project Structure

```
currency-converter/
├── index.html      # markup
├── style.css       # base styles, themes, components
├── media.css       # responsive breakpoints
├── c-code.js       # currency-code → country-code map (for flags)
└── app.js          # app logic: fetching, formatting, events
```

## 🚀 Getting Started

No build tools needed — it's a static site.

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

Then just open `index.html` in your browser, or serve it locally:

```bash
npx serve .
```

## 🌍 Deploying

Works out of the box on any static host:

- **GitHub Pages** — Settings → Pages → select the `main` branch
- **Netlify / Vercel** — drag-and-drop the folder or connect the repo

## 📡 API Reference

Exchange rates are fetched from:

```
https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{from}.json
```

with an automatic fallback to:

```
https://latest.currency-api.pages.dev/v1/currencies/{from}.json
```

No API key is required.

## 📌 Notes

- Currency and country-code data (`c-code.js`) is a static snapshot — a few historical currency codes (e.g. pre-euro or discontinued currencies) are included for completeness but may not return live rates.
- Flag images are loaded from a third-party service (FlagsAPI) and require an internet connection.

## 🙌 Credits

Built as a personal project. Exchange rate data courtesy of [@fawazahmed0](https://github.com/fawazahmed0/exchange-api).
