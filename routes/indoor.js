const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load both sheets from the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Indoor plants.xlsx'));
const sheet1 = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
const sheet2 = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]]);

// Create a lookup map from Sheet 1
const plantDefinitions = {};
sheet1.forEach(p => {
  plantDefinitions[p['Plant ID']] = p;
});

// Aggregate quantity and location info from Sheet 2
const placementMap = {};
sheet2.forEach(p => {
  const id = p['Plant ID'];
  const qty = parseInt(p['Quantity'], 10) || 0;

  if (!placementMap[id]) {
    placementMap[id] = {
      Quantity: 0,
      Locations: []
    };
  }

  placementMap[id].Quantity += qty;
  placementMap[id].Locations.push({
    'Location number': p['Location number'],
    'Location name': p['Location name'],
    'Quantity': qty
  });
});

// Final indoor data: one row per plant, enriched with total quantity and locations
const indoorData = Object.entries(plantDefinitions).map(([id, def]) => ({
  ...def,
  Quantity: placementMap[id]?.Quantity || 0,
  Locations: placementMap[id]?.Locations || []
}));

// Helper: sort by field
const sortByField = (data, field, direction = 'asc') => {
  return data.sort((a, b) => {
    if (typeof a[field] === 'number' && typeof b[field] === 'number') {
      return direction === 'asc' ? a[field] - b[field] : b[field] - a[field];
    }
    return direction === 'asc'
      ? String(a[field]).localeCompare(String(b[field]))
      : String(b[field]).localeCompare(String(a[field]));
  });
};

// GET /api/indoor-plants
router.get('/', (req, res) => {
  let result = [...indoorData];

  // Filter by light requirement
  if (req.query.light) {
    result = result.filter(p => p['Light Requirements'] === req.query.light);
  }

  // Sorting
  const sortParam = req.query.sort;
  if (sortParam === 'quantity_asc') {
    result = sortByField(result, 'Quantity', 'asc');
  } else if (sortParam === 'quantity_desc') {
    result = sortByField(result, 'Quantity', 'desc');
  } else if (sortParam === 'name_asc') {
    result = sortByField(result, 'Common name', 'asc');
  } else if (sortParam === 'name_desc') {
    result = sortByField(result, 'Common name', 'desc');
  }

  res.json(result);
});

module.exports = router;
