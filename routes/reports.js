const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load the Projects sheet from the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Reports.xlsx'));
const projectsSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Projects']);

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

// GET /api/reportProjects
router.get('/', (req, res) => {
  let result = [...projectsSheet];

  // Filter by year
  if (req.query.year) {
    result = result.filter(p => Number(p['Year']) === Number(req.query.year));
  }

  // Filter by location (partial match)
  if (req.query.location) {
    const searchTerm = req.query.location.toLowerCase();
    result = result.filter(p => 
      p['Location'] && p['Location'].toLowerCase().includes(searchTerm)
    );
  }

  // Sorting
  const sortParam = req.query.sort;
  if (sortParam === 'year_asc') {
    result = sortByField(result, 'Year', 'asc');
  } else if (sortParam === 'year_desc') {
    result = sortByField(result, 'Year', 'desc');
  } else if (sortParam === 'record_asc') {
    result = sortByField(result, 'Record Number', 'asc');
  } else if (sortParam === 'record_desc') {
    result = sortByField(result, 'Record Number', 'desc');
  } else if (sortParam === 'location_asc') {
    result = sortByField(result, 'Location', 'asc');
  } else if (sortParam === 'location_desc') {
    result = sortByField(result, 'Location', 'desc');
  }

  res.json(result);
});

module.exports = router;