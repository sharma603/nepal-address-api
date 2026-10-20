const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../index');
const crosswalk = require('../data/sources/crosswalk.json');
const source = require('../data/sources/municipalities-en.json');
const postal = require('../data/sources/postal-directory.json');

test('all 77 districts contain 753 current local levels in the correct categories', () => {
  const expected = [137, 136, 119, 85, 109, 79, 88];
  const types = {};
  const ids = new Set();
  for (const province of api.getProvinces()) {
    let count = 0;
    for (const district of api.getDistricts(province.id)) {
      const municipalities = api.getMunicipalities(district.id);
      assert.ok(municipalities.length, `missing district ${district.name}`);
      for (const m of municipalities) {
        assert.equal(m.district_id, district.id);
        assert.equal(m.province_id, province.id);
        assert.ok(m.name && m.name_np);
        assert.ok(!ids.has(m.id), `reused ID ${m.id}`);
        ids.add(m.id);
        types[m.type] = (types[m.type] || 0) + 1;
      }
      count += municipalities.length;
    }
    assert.equal(count, expected[province.id - 1], province.name);
  }
  assert.equal(ids.size, 753);
  assert.deepEqual(types, {
    'Municipality': 276, 'Rural Municipality': 460,
    'Metropolitan City': 6, 'Sub-Metropolitan City': 11,
  });
  for (const id of crosswalk.retired_ids) assert.ok(!ids.has(id), `retired ID reused: ${id}`);
});

test('every local level exposes wards matching both pinned sources, totalling 6743', () => {
  const wardCodes = new Set();
  for (const link of crosswalk.municipalities) {
    const m = api.getMunicipalities(link.district_id).find(row => row.id === link.id);
    assert.ok(m, `missing municipality ${link.id}`);
    const original = source.find(row => row.id === link.source_id);
    const reference = postal.units.find(row => row.local_code === link.postal_code);
    assert.equal(m.wards, Number(original.wards));
    assert.equal(m.wards, reference.ward_count);
    const wards = api.getWards(m.id);
    assert.deepEqual(wards.map(row => row.ward_no), Array.from({ length: m.wards }, (_, i) => i + 1));
    assert.deepEqual(wards.map(row => row.postal_code), reference.wards.map(row => row.code));
    for (const ward of wards) {
      assert.ok(!wardCodes.has(ward.postal_code));
      wardCodes.add(ward.postal_code);
      assert.ok(Array.isArray(ward.villages_toles));
    }
  }
  assert.equal(wardCodes.size, 6743);
});

test('existing supported municipality IDs remain stable and old spellings remain searchable', () => {
  const old = require('../data/legacy/municipalities.json');
  for (const row of old) {
    if (crosswalk.retired_ids.includes(row.id)) continue;
    const correction = crosswalk.id_corrections.find(c => c.old_id === row.id && c.district_id === row.district_id);
    const id = correction ? correction.new_id : row.id;
    const current = api.getMunicipalities(row.district_id).find(m => m.id === id);
    assert.ok(current, `lost existing ID ${row.id}`);
    assert.ok(api.search(row.name).municipalities.some(m => m.id === id), row.name);
  }
  assert.deepEqual(api.getWards('invalid'), []);
});
