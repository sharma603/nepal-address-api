# 🇳🇵 Nepal Address API

A clean, high-performance static API and Node.js module for Nepal's administrative hierarchy (Provinces, Districts, Municipalities, and Wards).

---

## 🚀 1. Using it as a Static API (Frontend)

You can fetch data directly from the browser using these URLs:

**Base URL:** `https://sharma603.github.io/nepal-address-api/api/v1`

### Examples:
- **All Provinces:** `GET /provinces.json`
- **Districts in Province 1:** `GET /districts/province-1.json`
- **Municipalities in Kathmandu:** `GET /municipalities/district-kathmandu.json`
- **Wards in Biratnagar:** `GET /wards/biratnagar.json`

### Javascript Code Example:
```javascript
fetch('https://sharma603.github.io/nepal-address-api/api/v1/provinces.json')
  .then(res => res.json())
  .then(data => console.log(data.provinces));
```

---

## 📦 2. Using it as a Node Module (Backend)

### Installation:
```bash
npm install github:sharma603/nepal-address-api
```

### Usage:
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

---

## 🎨 3. Live Demo
See the API in action with the cascading dropdown demo:
👉 **[Live Demo](https://sharma603.github.io/nepal-address-api/demo.html)**
