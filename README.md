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
👉 **[Live Demo](https://sharma603.github.io/nepal-address-api/docs/demo.html)**

---

## 🛠️ 4. Quick Start Demo Code
You can copy this into a single `index.html` file to build a cascading dropdown immediately:

```html
<select id="province"><option value="">Select Province</option></select>
<select id="district" disabled><option value="">Select District</option></select>
<select id="municipality" disabled><option value="">Select Municipality</option></select>

<script>
  const BASE = 'https://sharma603.github.io/nepal-address-api/api/v1';
  
  // 1. Load Provinces
  fetch(`${BASE}/provinces.json`)
    .then(r => r.json())
    .then(d => d.provinces.forEach(p => province.add(new Option(p.name, p.id))));

  // 2. Load Districts
  province.onchange = async () => {
    district.innerHTML = '<option>Select District</option>';
    const d = await fetch(`${BASE}/districts/province-${province.value}.json`).then(r => r.json());
    d.districts.forEach(dist => district.add(new Option(dist.name, dist.name.toLowerCase().replace(/ /g, '-'))));
    district.disabled = false;
  };

  // 3. Load Municipalities
  district.onchange = async () => {
    municipality.innerHTML = '<option>Select Municipality</option>';
    const m = await fetch(`${BASE}/municipalities/district-${district.value}.json`).then(r => r.json());
    m.municipalities.forEach(mun => municipality.add(new Option(mun.name, mun.id)));
    municipality.disabled = false;
  };
</script>
```
