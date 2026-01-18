const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load the Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Reports Images.xlsx'));
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// GET /api/before-after
router.get('/', (req, res) => {
  res.json(data);
});

module.exports = router;
