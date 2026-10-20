(() => {
  'use strict';
  const BASE = '../api/v1';
  const ids = ['province', 'district', 'municipality', 'ward'];
  const labels = ['Province', 'District', 'Municipality', 'Ward'];
  const selects = ids.map(id => document.getElementById(id));
  const searches = ids.map(id => document.getElementById(id + 'Search'));
  const rows = [[], [], [], []];
  const village = document.getElementById('village');
  const suggestions = document.getElementById('villageSuggestions');
  const save = document.getElementById('saveVillage');
  const villageHelp = document.getElementById('villageHelp');
  const villageError = document.getElementById('villageError');
  const status = document.getElementById('status');
  const retry = document.getElementById('retry');
  const result = document.getElementById('selectionResult');
  const finalText = document.getElementById('finalText');
  let districtIndex = {}, municipalityIndex = {};
  let generation = 0, controller, retryAction;
  const keyFor = row => String(row.id ?? row.ward_no);
  const nameFor = row => row.ward_no
    ? `Ward ${row.ward_no} / वडा ${row.ward_no.toLocaleString('ne-NP')}`
    : `${row.name} (${row.name_np})${row.type ? ' — ' + row.type + ' / ' + row.type_np : ''}`;
  const selected = index => rows[index].find(row => keyFor(row) === selects[index].value);
  const storageKey = () => `nepal-address:tole:${selects[2].value}:${selects[3].value}`;

  async function json(path, signal) {
    const response = await fetch(`${BASE}/${path}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  function clearVillage() {
    village.value = '';
    village.disabled = true;
    save.disabled = true;
    village.setCustomValidity('');
    villageError.textContent = '';
    suggestions.replaceChildren();
    villageHelp.textContent = 'Select a ward to enter a village / tole.';
    result.hidden = true;
  }
  function render(index) {
    const value = selects[index].value;
    const query = searches[index].value.trim().toLocaleLowerCase();
    const filtered = rows[index].filter(row => [nameFor(row), ...(row.aliases || [])]
      .some(name => name.toLocaleLowerCase().includes(query)));
    selects[index].replaceChildren(new Option(filtered.length ? `Choose ${labels[index]}…` : 'No matching options', ''));
    for (const row of filtered) selects[index].add(new Option(nameFor(row), keyFor(row)));
    if (filtered.some(row => keyFor(row) === value)) selects[index].value = value;
    else if (value) changed(index);
  }
  function resetFrom(index) {
    generation++;
    controller?.abort();
    retry.hidden = true;
    retryAction = null;
    status.textContent = '';
    for (let i = index; i < selects.length; i++) {
      rows[i] = [];
      selects[i].replaceChildren(new Option(`Choose ${labels[i]}…`, ''));
      selects[i].disabled = true;
      selects[i].removeAttribute('aria-busy');
      searches[i].value = '';
      searches[i].disabled = true;
    }
    clearVillage();
  }
  async function load(index, path, property) {
    const version = ++generation;
    controller?.abort();
    controller = new AbortController();
    selects[index].disabled = true;
    selects[index].setAttribute('aria-busy', 'true');
    selects[index].replaceChildren(new Option(`Loading ${labels[index].toLowerCase()}…`, ''));
    status.textContent = `Loading ${labels[index].toLowerCase()}…`;
    retry.hidden = true;
    try {
      const data = await json(path, controller.signal);
      if (version !== generation) return;
      if (!Array.isArray(data[property])) throw new Error('Invalid response');
      rows[index] = data[property];
      selects[index].disabled = !rows[index].length;
      searches[index].disabled = !rows[index].length;
      render(index);
      status.textContent = rows[index].length ? '' : `No ${labels[index].toLowerCase()} data is available for this selection.`;
    } catch (error) {
      if (version !== generation || error.name === 'AbortError') return;
      status.textContent = `Unable to load ${labels[index].toLowerCase()}. Please try again.`;
      selects[index].replaceChildren(new Option('Unable to load', ''));
      retryAction = () => load(index, path, property);
      retry.hidden = false;
    } finally {
      if (version === generation) selects[index].removeAttribute('aria-busy');
    }
  }
  function readSaved() {
    const value = JSON.parse(localStorage.getItem(storageKey()) || '[]');
    return Array.isArray(value) ? value.filter(name => typeof name === 'string' && name.length <= 120) : [];
  }
  function refreshSuggestions() {
    const ward = selected(3);
    if (!ward) return;
    let saved = [];
    let storageAvailable = true;
    try { saved = readSaved(); } catch { storageAvailable = false; }
    const verified = ward.villages_toles || [];
    suggestions.replaceChildren();
    for (const name of new Set([...verified, ...saved])) {
      const option = new Option(name, name);
      option.label = verified.includes(name) ? 'Sourced suggestion' : 'Saved in this browser (unverified)';
      suggestions.append(option);
    }
    villageHelp.textContent = verified.length
      ? 'Available sourced suggestions are incomplete. Search or type your village / tole.'
      : 'No verified village / tole list is available for this ward. Type your own name or use a browser-saved suggestion.';
    if (!storageAvailable) villageHelp.textContent += ' Browser storage is unavailable; manual entry still works.';
  }
  function updateResult() {
    const valid = [0, 1, 2, 3].every(index => selected(index));
    const value = village.value.trim();
    const error = value.length > 120 || /[\u0000-\u001f\u007f]/.test(value)
      ? 'Use a village / tole name of up to 120 characters without control characters.' : '';
    villageError.textContent = error;
    village.setCustomValidity(error);
    village.setAttribute('aria-invalid', String(Boolean(error)));
    save.disabled = !valid || !value || Boolean(error);
    result.hidden = !valid || Boolean(error);
    if (!valid || error) return;
    finalText.textContent = [value, nameFor(selected(3)), selected(2).name, selected(1).name, `${selected(0).name} (${selected(0).name_np})`, 'Nepal'].filter(Boolean).join(', ');
  }
  async function changed(index) {
    resetFrom(index + 1);
    const row = selected(index);
    if (!row) return;
    if (index === 0) await load(1, `districts/province-${row.id}.json`, 'districts');
    if (index === 1) await load(2, districtIndex[row.id], 'municipalities');
    if (index === 2) await load(3, municipalityIndex[row.id], 'wards');
    if (index === 3) {
      village.disabled = false;
      refreshSuggestions();
      updateResult();
    }
  }
  selects.forEach((select, index) => select.addEventListener('change', () => changed(index)));
  searches.forEach((search, index) => search.addEventListener('input', () => render(index)));
  village.addEventListener('input', updateResult);
  document.getElementById('addressForm').addEventListener('submit', event => event.preventDefault());
  save.addEventListener('click', () => {
    updateResult();
    if (save.disabled) return;
    try {
      const names = [...new Set([...readSaved(), village.value.normalize('NFC').trim()])].slice(-100);
      localStorage.setItem(storageKey(), JSON.stringify(names));
      refreshSuggestions();
      villageHelp.textContent = 'Suggestion saved in this browser for this municipality and ward. It is not verified official data.';
    } catch {
      villageError.textContent = 'Unable to save in this browser. You can still use the address you entered.';
    }
  });
  retry.addEventListener('click', () => retryAction?.());
  async function init() {
    resetFrom(0);
    status.textContent = 'Loading address indexes…';
    try {
      [districtIndex, municipalityIndex] = await Promise.all([
        json('index/districts-index.json'), json('index/municipalities-index.json'),
      ]).then(results => results.map(data => data.index));
      await load(0, 'provinces.json', 'provinces');
    } catch {
      status.textContent = 'Unable to load address indexes. Please try again.';
      retryAction = init;
      retry.hidden = false;
    }
  }
  init();
})();
