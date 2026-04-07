const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const https = require('https');

const frontendPath = path.join(__dirname, '../LANDSCAPE-WEBSITE');

// Helper to fetch from API
function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Helper to extract text from HTML file
function extractTextFromPage(filename) {
    const filePath = path.join(frontendPath, filename);
    if (!fs.existsSync(filePath)) return '';
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    document.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
    return document.body.textContent.replace(/\s+/g, ' ').trim().substring(0, 5000);
}

async function generateIndex() {
    const index = [];

    // Static pages
    const pages = [
        { title: 'Home', url: 'home.html' },
        { title: 'Our Plants', url: 'ourPlants.html' },
        { title: 'Projects', url: 'projects.html' },
        { title: 'Buildings', url: 'Buildings.html' },
        { title: 'Statistics', url: 'statistics.html' },
        { title: 'About', url: 'about.html' },
    ];

    pages.forEach(page => {
        const content = extractTextFromPage(page.url);
        index.push({ title: page.title, url: page.url, content });
        console.log(`✓ Indexed page: ${page.title}`);
    });

    // Indoor plants
    try {
        console.log('Fetching indoor plants...');
        const indoorPlants = await fetchAPI('https://landscapinguob-api.onrender.com/api/indoor-plants');
        indoorPlants.forEach(plant => {
            index.push({
                title: plant['Common name'] || plant['Scientific name'],
                url: `indoorPlant.html?id=${encodeURIComponent(plant['Plant ID'])}`,
                content: [
                    plant['Common name'],
                    plant['Scientific name'],
                    plant['Type'],
                    plant['Light Requirements'],
                    plant['Watering'],
                    plant['Stable temperature'],
                    plant['Portable']
                ].filter(Boolean).join(' ')
            });
        });
        console.log(`✓ Indexed ${indoorPlants.length} indoor plants`);
    } catch (err) {
        console.error('Failed to fetch indoor plants:', err.message);
    }

    // Outdoor plants
    try {
        console.log('Fetching outdoor plants...');
        const outdoorPlants = await fetchAPI('https://landscapinguob-api.onrender.com/api/outdoor-plants');
        outdoorPlants.forEach(plant => {
            index.push({
                title: plant['Common name'] || plant['Scientific name'],
                url: `outdoorPlant.html?id=${encodeURIComponent(plant['Plant ID'])}`,
                content: [
                    plant['Common name'],
                    plant['Scientific name'],
                    plant['Category'],
                    plant['Water requirement'],
                    plant['Sun requirement'],
                    plant['Drought tolerance'],
                    plant['Heat tolerance'],
                    plant['Portable']
                ].filter(Boolean).join(' ')
            });
        });
        console.log(`✓ Indexed ${outdoorPlants.length} outdoor plants`);
    } catch (err) {
        console.error('Failed to fetch outdoor plants:', err.message);
    }

    // Save index
    fs.writeFileSync(
        path.join(__dirname, '../LANDSCAPE-WEBSITE/search-index.json'),
        JSON.stringify(index, null, 2)
    );

    console.log(`\n✅ searchIndex.json generated with ${index.length} entries.`);
}

generateIndex();