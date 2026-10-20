const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../index');
const provinceIndex = require('../api/v1/index/provinces-index.json').index;
const districtSearch = require('../api/v1/search/districts.json');
const expectedCounts = [14, 8, 13, 11, 12, 10, 9];

test('all seven provinces expose 77 unique districts with consistent parent mappings', () => {
  const provinces = api.getProvinces();
  assert.equal(provinces.length, 7);
  const ids = new Set();
  for (const province of provinces) {
    const file = require(`../api/v1/${provinceIndex[province.id]}`);
    const districts = api.getDistricts(province.id);
    assert.equal(districts.length, expectedCounts[province.id - 1], province.name);
    assert.equal(file.meta.total, districts.length);
    assert.equal(province.districts_count, districts.length);
    for (const district of districts) {
      assert.equal(district.province_id, province.id);
      assert.ok(district.name && district.name_np);
      assert.ok(!ids.has(district.id), `duplicate district ${district.id}`);
      ids.add(district.id);
      const searchable = districtSearch.find(row => row.id === district.id);
      assert.ok(searchable, `district ${district.id} missing from search`);
      assert.equal(searchable.name, district.name);
      assert.equal(searchable.province_id, province.id);
    }
  }
  assert.equal(ids.size, 77);
  assert.equal(districtSearch.length, 77);
});

test('full dataset exposes every province and district without losing existing IDs', () => {
  const full = api.getFullData();
  assert.equal(full.provinces.length, 7);
  for (const province of api.getProvinces()) {
    const combined = full.provinces.find(row => row.id === province.id);
    assert.ok(combined, `missing province ${province.name}`);
    assert.equal(combined.name, province.name);
    assert.equal(combined.name_np, province.name_np);
    assert.deepEqual(combined.districts.map(({ municipalities, ...district }) => district), api.getDistricts(province.id));
  }
});
