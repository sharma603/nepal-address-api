const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const sources = 'data/sources/';
const manifest = read(sources + 'manifest.json');
const outputs = new Map();
const output = (file, value) => outputs.set('api/v1/' + file, JSON.stringify(value, null, 2) + '\n');
const slug = name => name.toLowerCase().replace(/\s+/g, '-');

// Refuse to rebuild if a pinned input has changed without deliberate review.
for (const [file, digest] of Object.entries(manifest.checksums)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(root, sources, file))).digest('hex');
  assert.equal(actual, digest, `Input changed: ${file}; review the source and crosswalk before updating its checksum`);
}
const crosswalk = read(sources + 'crosswalk.json');
const english = read(sources + 'municipalities-en.json');
const nepali = new Map(read(sources + 'municipalities-np.json').map(row => [row.id, row]));
const sourceDistricts = new Map(read(sources + 'districts-en.json').map(row => [row.id, row]));
const categories = new Map(read(sources + 'categories-en.json').map(row => [row.id, row.name]));
const categoriesNp = new Map(read(sources + 'categories-np.json').map(row => [row.id, row.name]));
const postal = new Map(read(sources + 'postal-directory.json').units.map(row => [row.local_code, row]));
const links = new Map(crosswalk.municipalities.map(row => [row.source_id, row]));
const provinces = read('api/v1/provinces.json').provinces;
const provinceIndex = read('api/v1/index/provinces-index.json');
const districtFiles = provinces.map(p => read('api/v1/' + provinceIndex.index[p.id]));
const districts = districtFiles.flatMap(file => file.districts);
const districtMap = new Map(districts.map(row => [row.id, row]));
const provinceMap = new Map(provinces.map(row => [row.id, row]));
const municipalities = [];
const wardFiles = new Map();
const usedIds = new Set(crosswalk.retired_ids);
const usedPostal = new Set();
const counts = {};
let wardCount = 0;
assert.equal(districts.length, 77);
assert.equal(english.length, 753);
assert.equal(nepali.size, 753);
assert.equal(links.size, 753);
assert.equal(postal.size, 753);

for (const source of english) {
  const link = links.get(source.id);
  assert.ok(link, `Missing stable mapping: ${source.id}`);
  assert.ok(!usedIds.has(link.id), `Reused or retired ID: ${link.id}`);
  assert.ok(!usedPostal.has(link.postal_code), `Reused postal code: ${link.postal_code}`);
  usedIds.add(link.id);
  usedPostal.add(link.postal_code);
  const district = districtMap.get(link.district_id);
  const sourceDistrict = sourceDistricts.get(source.district_id);
  assert.equal(crosswalk.district_map[source.district_id], district.id);
  assert.equal(sourceDistrict.province_id, district.province_id);
  const reference = postal.get(link.postal_code);
  assert.ok(reference, `Missing postal reference: ${link.postal_code}`);
  assert.equal(link.postal_code.slice(0, 3), crosswalk.postal_district_map[district.id]);
  const translation = nepali.get(source.id);
  assert.equal(translation.district_id, source.district_id);
  assert.equal(translation.category_id, source.category_id);
  const total = Number(source.wards);
  assert.ok(Number.isInteger(total) && total > 0 && total <= 35);
  assert.equal(total, reference.ward_count, `Ward counts disagree: ${source.name}`);
  assert.equal(Number(translation.wards.replace(/[०-९]/g, digit => '०१२३४५६७८९'.indexOf(digit))), total);
  assert.deepEqual(reference.wards.map(w => w.ward), Array.from({ length: total }, (_, i) => i + 1));
  const municipality = {
    id: link.id, name: source.name, name_np: translation.name,
    type: categories.get(source.category_id), type_np: categoriesNp.get(source.category_id),
    district_id: district.id, province_id: district.province_id, wards: total,
    postal_code: link.postal_code, source_id: source.id,
    aliases: [...new Set(link.legacy_names.filter(name => name !== source.name))],
    website: source.website,
  };
  assert.ok(municipality.type && municipality.type_np && municipality.name_np);
  counts[municipality.type] = (counts[municipality.type] || 0) + 1;
  municipalities.push(municipality);
  wardCount += total;
  wardFiles.set(link.id, {
    meta: {
      municipality_id: link.id, municipality: source.name, district_id: district.id,
      province_id: district.province_id, type: municipality.type, total_wards: total,
      ward_count_sources: ['local-states-nepal', 'postal-directory'],
      village_tole_coverage: 'incomplete',
    },
    wards: reference.wards.map(ward => {
      assert.equal(ward.code, link.postal_code + String(ward.ward).padStart(2, '0'));
      return { ward_no: ward.ward, postal_code: ward.code, villages_toles: [] };
    }),
  });
}
assert.deepEqual(counts, { Municipality: 276, 'Rural Municipality': 460, 'Metropolitan City': 6, 'Sub-Metropolitan City': 11 });
assert.equal(wardCount, 6743);
const provinceCounts = [137, 136, 119, 85, 109, 79, 88];
for (const province of provinces) assert.equal(municipalities.filter(m => m.province_id === province.id).length, provinceCounts[province.id - 1]);

for (const suggestion of read('data/village-suggestions.json').suggestions) {
  const file = wardFiles.get(suggestion.municipality_id);
  const ward = file?.wards.find(row => row.ward_no === suggestion.ward_no);
  assert.ok(ward, 'Suggestion has an invalid parent');
  assert.ok(typeof suggestion.name === 'string' && suggestion.name.trim());
  assert.equal(new URL(suggestion.source_url).protocol, 'https:');
  if (!ward.villages_toles.includes(suggestion.name)) ward.villages_toles.push(suggestion.name);
}

const districtIndex = {};
const municipalityIndex = {};
for (const district of districts) {
  const localLevels = municipalities.filter(m => m.district_id === district.id);
  assert.ok(localLevels.length, `District has no local levels: ${district.name}`);
  const file = crosswalk.district_paths[district.id] || `municipalities/district-${slug(district.name)}.json`;
  districtIndex[district.id] = file;
  output(file, { meta: { district_id: district.id, district: district.name, province_id: district.province_id, total: localLevels.length }, municipalities: localLevels });
}
for (const municipality of municipalities) {
  municipalityIndex[municipality.id] = `wards/${municipality.id}.json`;
  output(municipalityIndex[municipality.id], wardFiles.get(municipality.id));
}
// Keep historical ward URLs working, with corrected counts and without unverified village assignments.
for (const [file, old] of Object.entries(read('data/legacy/unverified-wards.json'))) {
  const wards = wardFiles.get(old.meta.municipality_id);
  assert.ok(wards, `Unresolved legacy ward URL: ${file}`);
  output(file, wards);
}
// Correct a pre-existing broken link without removing the old URL.
output('wards/kathmandu-metro.json', wardFiles.get(30801));
output('index/districts-index.json', { meta: { description: 'Maps all 77 district IDs to municipality files', base: '/api/v1/' }, index: districtIndex });
output('index/municipalities-index.json', { meta: { description: 'Maps all 753 stable municipality IDs to ward files', base: '/api/v1/' }, index: municipalityIndex });
output('search/municipalities.json', municipalities.map(m => ({ ...m, district: districtMap.get(m.district_id).name, province: provinceMap.get(m.province_id).name })));
output('search/districts.json', districts.map(d => ({ ...d, province: provinceMap.get(d.province_id).name })));
output('full/nepal-full.json', {
  meta: { description: 'Nepal provinces, districts, local levels and wards; village/tole coverage is incomplete', version: '1.2.0', total_provinces: 7, total_districts: 77, total_local_levels: 753, total_wards: wardCount },
  provinces: provinces.map(({ districts_count, ...province }) => ({ ...province, districts: districts.filter(d => d.province_id === province.id).map(d => ({ ...d, municipalities: municipalities.filter(m => m.district_id === d.id).map(m => ({ ...m, ward_details: wardFiles.get(m.id).wards })) })) })),
});
output('coverage.json', { provinces: 7, districts: 77, local_levels: 753, wards: wardCount, types: counts, village_tole_coverage: 'incomplete', verified_village_suggestions: read('data/village-suggestions.json').suggestions.length, code_scheme: 'Department of Postal Services postal codes, not census/MoFAGA administrative codes', sources: manifest.sources, known_gaps: manifest.known_gaps });

let differences = 0;
for (const [file, contents] of outputs) {
  const target = path.join(root, file);
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === contents) continue;
  differences++;
  if (!process.argv.includes('--check')) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target + '.tmp', contents);
    fs.renameSync(target + '.tmp', target);
  }
}
if (process.argv.includes('--check')) assert.equal(differences, 0, `${differences} generated files are stale; run npm run data:build`);
console.log(`Validated 7 provinces, 77 districts, 753 local levels, ${wardCount} wards. ${differences} files ${process.argv.includes('--check') ? 'out of date' : 'updated'}.`);
