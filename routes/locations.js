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

// Load both sheets from Indoor plants file
const indoorWorkbook = xlsx.readFile(path.join(__dirname, '../data/Indoor plants (1).xlsx'));
const sheet1 = xlsx.utils.sheet_to_json(indoorWorkbook.Sheets[indoorWorkbook.SheetNames[0]]);
const sheet2 = xlsx.utils.sheet_to_json(indoorWorkbook.Sheets[indoorWorkbook.SheetNames[1]]);

// Create a lookup map from Sheet 1
const plantDefinitions = {};
sheet1.forEach(p => {
  plantDefinitions[p['Plant ID']] = p;
});


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
    result = result.filter(loc => loc['Location type'] === req.query.type);
  }

  // Sort by location number
  const sortParam = req.query.sort;
  if (sortParam === 'location_asc') {
    result = sortByField(result, 'Location number', 'asc');
  } else if (sortParam === 'location_desc') {
    result = sortByField(result, 'Location number', 'desc');
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
    const filtered = locationData.filter(loc => loc['Location type'] === type);
    res.json(filtered);
  });
});

module.exports = router;


// GET /api/locations/:locationNumber/indoor-plants
router.get('/:locationNumber/indoor-plants', (req, res) => {
  const locationNumber = req.params.locationNumber;

  const filtered = sheet2
    .filter(p => p['Location number'] === locationNumber)
    .map(p => ({
      ...plantDefinitions[p['Plant ID']],
      ...p
    }));

  res.json(filtered);
});
