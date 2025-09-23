const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

// Modular route imports
app.use('/api/indoor-plants', require('./routes/indoor'));
app.use('/api/outdoor-plants', require('./routes/outdoor'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/creators', require('./routes/creators'));
app.use('/api/proposals', require('./routes/proposals'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌿 Landscaping API running on port ${PORT}`);
});
