const provinces = require('./api/v1/provinces.json');
const provincesIndex = require('./api/v1/index/provinces-index.json');
const districtsIndex = require('./api/v1/index/districts-index.json');
const municipalitiesIndex = require('./api/v1/index/municipalities-index.json');
const searchDistricts = require('./api/v1/search/districts.json');
const searchMunicipalities = require('./api/v1/search/municipalities.json');
const path = require('path');
const fs = require('fs');

/**
 * Nepal Address API - Node Module
 */
const NepalAddress = {
    /**
     * Get all provinces
     */
    getProvinces: () => provinces.provinces,

    /**
     * Get all districts in a province
     * @param {number} provinceId 
     */
    getDistricts: (provinceId) => {
        const filePath = Object.hasOwn(provincesIndex.index, provinceId) && provincesIndex.index[provinceId];
        if (!filePath) return [];
        return require(`./api/v1/${filePath}`).districts;
    },

    /**
     * Get all municipalities in a district
     * @param {number} districtId 
     */
    getMunicipalities: (districtId) => {
        const filePath = Object.hasOwn(districtsIndex.index, districtId) && districtsIndex.index[districtId];
        if (!filePath) return [];
        return require(`./api/v1/${filePath}`).municipalities;
    },

    /**
     * Search for districts or municipalities
     * @param {string} query 
     */
    search: (query) => {
        const q = String(query ?? '').trim().toLowerCase();
        if (!q) return { districts: [], municipalities: [] };
        const matches = row => [row.name, row.name_np, ...(row.aliases || [])]
            .some(name => name && name.toLowerCase().includes(q));
        const districts = searchDistricts.filter(matches);
        const municipalities = searchMunicipalities.filter(matches);
        return { districts, municipalities };
    },

    /** Get verified ward numbers and available (incomplete) village/tole suggestions. */
    getWards: (municipalityId) => {
        const filePath = Object.hasOwn(municipalitiesIndex.index, municipalityId)
            && municipalitiesIndex.index[municipalityId];
        return filePath ? require(`./api/v1/${filePath}`).wards : [];
    },

    /**
     * Get the raw full dataset (Caution: Large file)
     */
    getFullData: () => require('./api/v1/full/nepal-full.json')
};

module.exports = NepalAddress;
