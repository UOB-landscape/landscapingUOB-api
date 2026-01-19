const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'UOB Landscape API is running! 🌿',
    endpoints: {
      indoorPlants: '/api/indoor-plants',
      outdoorPlants: '/api/outdoor-plants',
      locations: '/api/locations',
      creators: '/api/creators',
      proposals: '/api/proposals',
      beforeAfter: '/api/before-after',
      reportImages: '/api/reportImages',
      reports: '/api/reports'
    }
  });
});

// Modular route imports
app.use('/api/indoor-plants', require('./routes/indoor'));
app.use('/api/outdoor-plants', require('./routes/outdoor'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/before-after', require('./routes/BeforeAndAfter'));
app.use('/api/reports', require('./routes/reports'));

// Report images route
app.use('/api/reportImages', require('./routes/reportImages'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 Landscaping API running on port ${PORT}`);
});
