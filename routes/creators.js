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



// GET /api/creators/biologists
router.get('/biologists', (req, res) => {
  const biologists = creatorsData
    .filter(c => c["Creator type"] === "Biologist")
    .sort((a, b) => a.Name.localeCompare(b.Name));
  res.json(biologists);
});

// GET /api/creators/landscape-engineers
router.get('/landscape-engineers', (req, res) => {
  const engineers = creatorsData
    .filter(c => c["Creator type"] === "Landscape Engineer")
    .sort((a, b) => a.Name.localeCompare(b.Name));
  res.json(engineers);
});

// GET /api/creators/software-engineers
router.get('/software-engineers', (req, res) => {
  const software = creatorsData
    .filter(c => c["Creator type"] === "Software Engineer")
    .sort((a, b) => a.Name.localeCompare(b.Name));
  res.json(software);
});
