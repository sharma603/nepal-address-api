# 🇳🇵 Nepal Address API

A static JSON API, Node.js module and responsive five-field address selector.

## Coverage

- **7 provinces, 77 districts, 753 current local levels, 6,743 wards**.
- 6 metropolitan cities, 11 sub-metropolitan cities, 276 municipalities and 460 rural municipalities.
- English and Nepali names, stable application IDs and postal codes.
- **Village / tole lists are incomplete.** The selector accepts manual entry and suggestions saved in the current browser. No nationwide village database is claimed.

Names and ward counts are imported from pinned open-source inputs. Every local-level ward count is compared with a second, official-directory-derived dataset. The primary government page was not independently accessible during this import. Postal codes are not census/MoFAGA administrative codes. See [sources, limitations and ID migration notes](docs/DATA_SOURCES.md).

## Run locally

```sh
npm ci
npm start
```

The server uses port 3000 by default; set `PORT` to override it. Open the `/docs/demo.html` path on your running server for the address selector. No database or credentials are required by this existing static/Express workflow.

The selector preserves the navy background and blue accents, filters each field by its parent, clears downstream selections, supports English/Nepali searching, handles request errors with retry, and displays the full selected address. Village/tole suggestions saved in the browser are scoped by municipality and ward; they are not shared or treated as official records.

## Static API

Published base: `https://sharma603.github.io/nepal-address-api/api/v1`.
These paths are served locally by Express too. Newly added data becomes available on the published site only after its normal deployment.

| Path | Contents |
| --- | --- |
| `/provinces.json` | All seven provinces |
| `/districts/province-1.json` | Koshi districts (province IDs 1–7) |
| `/index/districts-index.json` | All 77 district IDs → municipality file paths |
| `/municipalities/district-kathmandu.json` | Kathmandu local levels |
| `/index/municipalities-index.json` | All 753 stable local-level IDs → ward file paths |
| `/wards/30801.json` | Kathmandu wards, with postal codes and available sourced suggestions |
| `/wards/biratnagar.json` | Supported legacy ward URL |
| `/search/districts.json` | All districts for English/Nepali search |
| `/search/municipalities.json` | All local levels with aliases and parents |
| `/full/nepal-full.json` | Full hierarchy; `ward_details` holds each local level's wards |
| `/coverage.json` | Totals, sources and explicit data gaps |

Use the indexes instead of constructing municipality-name slugs: names can repeat across districts or have alternate spellings. Keep `postal_code` as a string. Existing application IDs are preserved except for one documented pre-existing duplicate ID in Buddhabhumi.

```js
const base = '/api/v1';
const index = await fetch(`${base}/index/districts-index.json`).then(r => r.json());
const data = await fetch(`${base}/${index.index[308]}`).then(r => r.json());
console.log(data.municipalities);
```

## Node module

```sh
npm install github:sharma603/nepal-address-api
```

```js
const nepal = require('nepal-address-api');

nepal.getProvinces();          // all seven provinces
nepal.getDistricts(3);         // Bagmati districts
nepal.getMunicipalities(308);  // Kathmandu local levels
nepal.getWards(30801);         // Kathmandu ward numbers, codes and suggestions
nepal.search('Pokhara');       // English, Nepali and historical-name aliases
nepal.search('पोखरा');
nepal.getFullData();           // full hierarchy
```

## Validate and refresh data

```sh
npm run data:build   # deterministic offline rebuild from pinned sources
npm run data:check   # validate integrity, mappings, totals and generated outputs
npm test            # data/API checks and Chromium browser tests
```

Browser tests use `CHROMIUM_PATH`, defaulting to `/usr/bin/chromium`. If that executable is absent, browser tests are explicitly skipped; install Chromium or set the path to run them. Data tests still run.

Verified village/tole contributions go in `data/village-suggestions.json`; every entry needs a valid local-level ID, ward number, name and HTTPS source URL. Existing unsupported village lists and obsolete local-level entries are preserved in `data/legacy/` for review, not offered as verified data. For source updates, preserve the crosswalk's stable IDs and never reuse retired IDs or silently delete old user addresses. See [the update procedure](docs/DATA_SOURCES.md#rebuild-and-update).
