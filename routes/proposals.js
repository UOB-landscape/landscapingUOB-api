const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load proposals from Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Proposals.xlsx'));
const proposalsData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// GET /api/proposals
router.get('/', (req, res) => {
  res.json(proposalsData);
});

module.exports = router;