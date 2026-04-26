# 🇳🇵 Nepal Address Static API

A high-performance, GitHub-native static API for Nepal's administrative structure. Built for speed, scalability, and ease of use.

## 🎯 Features
- **GitHub Pages Ready**: Host it for free on GitHub.
- **Optimized Performance**: Split data to ensure fast loading and minimal bandwidth.
- **Versioning**: API versioning (`v1/`) to prevent breaking changes.
- **Searchable**: Pre-indexed search files for autocomplete and global search.

## 🗂️ Folder Structure
```text
nepal-address-api/
│
├── api/
│   ├── v1/
│   │   ├── provinces.json
│   │   ├── districts/
│   │   ├── municipalities/
│   │   ├── wards/
│   │   ├── index/
│   │   ├── search/
│   │   └── full/
├── docs/             ← Static Documentation & Demo
└── README.md
```

## 📦 Node Module Usage

```javascript
const nepal = require('nepal-address-api');

// Get all provinces
const provinces = nepal.getProvinces();

// Get districts in Bagmati (ID: 3)
const districts = nepal.getDistricts(3);

// Get municipalities in Kathmandu (ID: 308)
const municipalities = nepal.getMunicipalities(308);

// Global Search
const results = nepal.search('Pokhara');
```

## 🌐 Static API Endpoints (For Frontend)
If hosted on GitHub Pages:

- **Provinces**: `.../api/v1/provinces.json`
- **Districts by Province**: `.../api/v1/districts/province-1.json`
- **Municipalities by District**: `.../api/v1/municipalities/district-kathmandu.json`
- **Wards by City**: `.../api/v1/wards/kathmandu-metro.json`
- **Full Dataset**: `.../api/v1/full/nepal-full.json`

## 🧠 Design Logic
- **Split Data**: Province → District → Municipality hierarchy prevents loading massive files.
- **Index Files**: Helps frontend mapping without hardcoding paths.
- **Naming Rules**: All files use `lowercase-hyphen-separated` naming.

## 🚀 Usage in Apps

## 🛠️ Installation

### As a Node Module (Recommended for Backend/Apps)
Install directly from GitHub:
```bash
npm install github:your-username/nepal-address-api
```

### For Frontend (Static Fetch)
If you are using it in a simple website, you can just use `fetch()` on the raw GitHub URLs.

```javascript
// Fetch Districts when a Province is selected
const getDistricts = async (provinceId) => {
  const response = await fetch(`https://your-user.github.io/nepal-address-api/api/v1/districts/province-${provinceId}.json`);
  const data = await response.json();
  return data.districts;
};
```

---
Built for the Nepal Developer Community.
