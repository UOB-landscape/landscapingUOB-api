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
// Now accepts optional query parameter: ?type=Building
router.get('/:locationNumber/indoor-plants', (req, res) => {
  const locationNumber = req.params.locationNumber;
  const locationType = req.query.type; // Optional: filter by location type

  // Filter location entries for this specific location number
  let locationsForPlants = indoorSheet2.filter(p => p['Location number'] === locationNumber);

  // If location type is specified, filter by that too
  if (locationType) {
    locationsForPlants = locationsForPlants.filter(p => {
      const pType = (p['Location type'] || '').trim();
      return pType === locationType;
    });
  }

  // Get unique plant IDs
  const plantIds = [...new Set(locationsForPlants.map(p => p['Plant ID']))];

  // Get full plant data
  const result = plantIds.map(plantId => {
    const plantDef = indoorPlantDefinitions[plantId];
    
    // Get all location entries for this plant that match the filter
    let plantLocations = locationsForPlants.filter(loc => loc['Plant ID'] === plantId);
    
    // Calculate total quantity for this specific location
    const totalQuantity = plantLocations.reduce((sum, loc) => {
      return sum + (parseInt(loc['Quantity']) || 0);
    }, 0);

    return {
      ...plantDef,
      Locations: plantLocations,
      Quantity: totalQuantity
    };
  });

  res.json(result);
});

// GET /api/locations/:locationNumber/outdoor-plants
// Now accepts optional query parameter: ?type=Building
router.get('/:locationNumber/outdoor-plants', (req, res) => {
  const locationNumber = req.params.locationNumber;
  const locationType = req.query.type; // Optional: filter by location type

  // Filter location entries for this specific location number
  let locationsForPlants = outdoorSheet2.filter(p => p['Location number'] === locationNumber);

  // If location type is specified, filter by that too
  if (locationType) {
    locationsForPlants = locationsForPlants.filter(p => {
      const pType = (p['Location type'] || '').trim();
      return pType === locationType;
    });
  }

  // Get unique plant IDs (outdoor uses 'Plants categories' as the plant identifier)
  const plantIds = [...new Set(locationsForPlants.map(p => p['Plants categories']))].filter(Boolean);

  // Get full plant data
  const result = plantIds.map(plantId => {
    const plantDef = outdoorPlantDefinitions[plantId];
    
    // Get all location entries for this plant that match the filter
    let plantLocations = locationsForPlants.filter(loc => loc['Plants categories'] === plantId);
    
    // Calculate total quantity for this specific location
    const totalQuantity = plantLocations.reduce((sum, loc) => {
      return sum + (parseInt(loc['Quantity']) || 0);
    }, 0);

    return {
      ...plantDef,
      Locations: plantLocations,
      Quantity: totalQuantity
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