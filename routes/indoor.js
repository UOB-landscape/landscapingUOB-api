const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load both sheets from the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Indoor plants (1).xlsx'));
const sheetNames = workbook.SheetNames;

const indoorData = sheetNames.flatMap(sheetName =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
);

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
