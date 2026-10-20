# Address data sources and coverage

The generated API contains 7 provinces, 77 districts, 753 current local levels and
6,743 wards. Local levels include 6 metropolitan cities, 11 sub-metropolitan
cities, 276 municipalities and 460 rural municipalities. Province totals are
137, 136, 119, 85, 109, 79 and 88, respectively.

## Pinned inputs

The checked-in inputs, upstream commits, SHA-256 hashes and licenses are in
`data/sources/`. See `manifest.json` for the exact revisions.

- [Local States Nepal](https://github.com/sagautam5/local-states-nepal): English
  and Nepali names, municipality types, district/province relationships and
  ward counts. MIT licensed. Its numeric IDs are upstream identifiers, not
  official government administrative codes.
- [Nepal Reference Data](https://github.com/Forgesaroj/nepal-reference-data):
  transcription of the [Department of Postal Services directory](https://gpo.gov.np/pages/postal-code-1259614658/),
  which upstream reports retrieving on 2026-09-27. Provides 753 local-level
  postal codes, 6,743 ward postal codes and a second ward-count reference.
  The primary government site could not be accessed from this environment;
  this is a pinned third-party transcription, not a fresh independent audit
  against the government's page. The upstream software license does not
  assert a separate license for government-derived data.

Every ward count agrees between these two datasets. The importer also checks
English/Nepali source IDs and parents, district-to-province mappings, exact
ward sequences, code uniqueness and national/province/category totals.

The local-level codes in the alternative
`abinrimal/nepal-administrative-divisions-json` dataset were inspected but not
used: repeated values such as `3` do not provide unique local-level identifiers.
No record from that dataset is treated as an official code reference.

## Codes and stable IDs

`id` is the application's stable identifier. `source_id` identifies the record
in Local States Nepal. `postal_code` is the postal directory's code, preserved
as a string. Postal codes are **not labelled as census or MoFAGA administrative
codes**. An independently verified official administrative-code import remains
outstanding; do not substitute source IDs or postal codes for that purpose.

`crosswalk.json` pins each record's source ID, application ID, parent and postal
reference. Runtime imports do not fuzzy-match names or derive identity from
names. `name-variants-reviewed.json` records the spelling/historical-name
variants reconciled during the initial import. Upstream names may contain
historical spellings; code and parent mappings identify records unambiguously.

254 existing supported municipality records were matched. One pre-existing ID
collision required a correction: Buddhabhumi in Kapilvastu used `20503`, which
also belongs to Harion in Sarlahi. Buddhabhumi is now `50910`. Applications
persisting old addresses should migrate **only** `(district_id=509,
municipality_id=20503)` to `50910`; Harion remains `20503`.

39 obsolete/non-local-level entries (36 Panchthar VDC entries and three former
Kaski settlements) are archived in `data/legacy/municipalities.json`, rather
than offered as current municipalities. Their IDs are reserved and are never
reused. Do not delete or silently reassign historical user addresses; retain
their recorded text and flag an archived selection for explicit correction.
All previously existing ward-file URLs are retained with corrected counts.

## Village / Tole coverage

There is **no verified nationwide village/tole database** in these sources.
Previously bundled lists had no supporting citations and include questionable
ward assignments. They are retained for review in
`data/legacy/unverified-wards.json` and excluded from the active suggestions.

`data/village-suggestions.json` accepts verified, individually sourced
suggestions with `municipality_id`, `ward_no`, `name` and `source_url`.
Coverage remains explicitly `incomplete`, even when a ward has suggestions.
The selector supports free text and suggestions saved in that browser, scoped
to the selected municipality and ward. Browser-saved suggestions are user
input, not government-verified data, and are not synchronized across devices.

## Rebuild and update

```sh
npm ci
npm run data:build
npm run data:check
npm test
```

The build works offline from pinned inputs and is idempotent. It validates
inputs and creates all generated contents before writing output files. It
does not delete files or user-address data. `data:check` performs the same
validation and rejects stale outputs without writing anything.

For an upstream update, review new source revisions and licenses, reconcile
names and parent/code changes explicitly in the crosswalk, preserve existing
application IDs and all reserved IDs, then deliberately update source hashes.
Review count changes against official publications before changing expected
totals. Rerun build, data checks and tests before deployment. Do not overwrite
the legacy archive with generated data or merge unverified village lists into
the active suggestions.
