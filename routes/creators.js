const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load all sheets from Creators.xlsx
const workbook = xlsx.readFile(path.join(__dirname, '../data/Creators.xlsx'));
const sheetNames = workbook.SheetNames;

const creatorsData = sheetNames.flatMap(sheetName =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
);

// GET /api/creators
router.get('/', (req, res) => {
  res.json(creatorsData);
});

module.exports = router;
