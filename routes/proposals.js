const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load all sheets from Proposals (2).xlsx
const workbook = xlsx.readFile(path.join(__dirname, '../data/Proposals (2).xlsx'));
const sheetNames = workbook.SheetNames;

const proposalsData = sheetNames.flatMap(sheetName =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
);

// GET /api/proposals
router.get('/', (req, res) => {
  res.json(proposalsData);
});

module.exports = router;
