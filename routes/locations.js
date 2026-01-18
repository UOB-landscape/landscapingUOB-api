const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Load all sheets from the Locations Excel file
const workbook = xlsx.readFile(path.join(__dirname, '../data/Locations.xlsx'));
const sheetNames = workbook.SheetNames;

const locationData = sheetNames.flatMap(sheetName =>
  xlsx.utils.sheet_to_json(workbook.Sheets[sheetName])
);

// Load both sheets from Indoor plants file
const indoorWorkbook = xlsx.readFile(path.join(__dirname, '../data/Indoor plants.xlsx'));
const indoorSheet1 = xlsx.utils.sheet_to_json(indoorWorkbook.Sheets[indoorWorkbook.SheetNames[0]]);
const indoorSheet2 = xlsx.utils.sheet_to_json(indoorWorkbook.Sheets[indoorWorkbook.SheetNames[1]]);

// Load both sheets from Outdoor plants file
const outdoorWorkbook = xlsx.readFile(path.join(__dirname, '../data/Outdoor plants.xlsx'));
const outdoorSheet1 = xlsx.utils.sheet_to_json(outdoorWorkbook.Sheets[outdoorWorkbook.SheetNames[0]]);
const outdoorSheet2 = xlsx.utils.sheet_to_json(outdoorWorkbook.Sheets[outdoorWorkbook.SheetNames[1]]);

// Create lookup maps for plant definitions
const indoorPlantDefinitions = {};
indoorSheet1.forEach(p => {
  indoorPlantDefinitions[p['Plant ID']] = p;
});

const outdoorPlantDefinitions = {};
outdoorSheet1.forEach(p => {
  outdoorPlantDefinitions[p['Plant ID']] = p;
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

// GET /api/locations/:locationNumber/indoor-plants
router.get('/:locationNumber/indoor-plants', (req, res) => {
  const locationNumber = req.params.locationNumber;

  // Filter location entries for this specific location
  const locationsForPlants = indoorSheet2.filter(p => p['Location number'] === locationNumber);

  // Get unique plant IDs
  const plantIds = [...new Set(locationsForPlants.map(p => p['Plant ID']))];

  // Get full plant data with all their locations
  const result = plantIds.map(plantId => {
    const plantDef = indoorPlantDefinitions[plantId];
    const allLocations = indoorSheet2.filter(loc => loc['Plant ID'] === plantId);
    
    // Calculate total quantity
    const totalQuantity = allLocations.reduce((sum, loc) => {
      return sum + (parseInt(loc['Quantity']) || 0);
    }, 0);

    return {
      ...plantDef,
      Locations: allLocations,
      Quantity: totalQuantity
    };
  });

  res.json(result);
});

// GET /api/locations/:locationNumber/outdoor-plants
router.get('/:locationNumber/outdoor-plants', (req, res) => {
  const locationNumber = req.params.locationNumber;

  // Filter location entries for this specific location
  const locationsForPlants = outdoorSheet2.filter(p => p['Location number'] === locationNumber);

  // Get unique plant IDs
  const plantIds = [...new Set(locationsForPlants.map(p => p['Plant ID']))];

  // Get full plant data with all their locations
  const result = plantIds.map(plantId => {
    const plantDef = outdoorPlantDefinitions[plantId];
    const allLocations = outdoorSheet2.filter(loc => loc['Plant ID'] === plantId);

    return {
      ...plantDef,
      Locations: allLocations
    };
  });

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