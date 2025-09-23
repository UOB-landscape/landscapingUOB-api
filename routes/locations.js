const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load all sheets from the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Locations 1 (3).xlsx'));
const sheetNames = workbook.SheetNames;

const locationData = sheetNames.flatMap(sheetName =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
);

// Helper: sort by field
const sortByField = (data, field, direction = 'asc') => {
  return data.sort((a, b) => {
    return direction === 'asc'
      ? String(a[field]).localeCompare(String(b[field]))
      : String(b[field]).localeCompare(String(a[field]));
  });
};

// GET /api/locations
router.get('/', (req, res) => {
  let result = [...locationData];

  // Filter by location type
  if (req.query.type) {
    result = result.filter(loc => loc['Location Type'] === req.query.type);
  }

  // Sort by location number
  const sortParam = req.query.sort;
  if (sortParam === 'location_asc') {
    result = sortByField(result, 'Location Number', 'asc');
  } else if (sortParam === 'location_desc') {
    result = sortByField(result, 'Location Number', 'desc');
  }

  res.json(result);
});

// Dynamic endpoints for each location type
const locationTypes = [
  'Building', 'Gate', 'Roadside', 'Residential',
  'Infrastructure', 'Facilities', 'Car park'
];

locationTypes.forEach(type => {
  router.get(`/${type.toLowerCase()}`, (req, res) => {
    const filtered = locationData.filter(loc => loc['Location Type'] === type);
    res.json(filtered);
  });
});

module.exports = router;
