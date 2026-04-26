const provinces = require('./api/v1/provinces.json');
const provincesIndex = require('./api/v1/index/provinces-index.json');
const districtsIndex = require('./api/v1/index/districts-index.json');
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
        const filePath = provincesIndex.index[provinceId];
        if (!filePath) return [];
        return require(`./api/v1/${filePath}`).districts;
    },

    /**
     * Get all municipalities in a district
     * @param {number} districtId 
     */
    getMunicipalities: (districtId) => {
        const filePath = districtsIndex.index[districtId];
        if (!filePath) return [];
        return require(`./api/v1/${filePath}`).municipalities;
    },

    /**
     * Search for districts or municipalities
     * @param {string} query 
     */
    search: (query) => {
        const q = query.toLowerCase();
        const districts = searchDistricts.filter(d => d.name.toLowerCase().includes(q));
        const municipalities = searchMunicipalities.filter(m => m.name.toLowerCase().includes(q));
        return { districts, municipalities };
    },

    /**
     * Get the raw full dataset (Caution: Large file)
     */
    getFullData: () => require('./api/v1/full/nepal-full.json')
};

module.exports = NepalAddress;
