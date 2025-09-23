const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load both sheets from the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Outdoor plants (2).xlsx'));
const sheetNames = workbook.SheetNames;

const outdoorData = sheetNames.flatMap(sheetName =>
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

// GET /api/outdoor-plants
router.get('/', (req, res) => {
  let result = [...outdoorData];

  // Filter by category
  if (req.query.category) {
    result = result.filter(p => p.Category === req.query.category);
  }

  // Sorting
  const sortParam = req.query.sort;
  if (sortParam === 'height_asc') {
    result = sortByField(result, 'Height', 'asc');
  } else if (sortParam === 'height_desc') {
    result = sortByField(result, 'Height', 'desc');
  } else if (sortParam === 'name_asc') {
    result = sortByField(result, 'Common name', 'asc');
  } else if (sortParam === 'name_desc') {
    result = sortByField(result, 'Common name', 'desc');
  }

  res.json(result);
});

module.exports = router;
