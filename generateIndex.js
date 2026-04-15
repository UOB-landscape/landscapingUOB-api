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

function extractTextFromPage(filename, selectors = ['main', 'article', 'section', 'h1', 'h2', 'h3', 'p']) {
    const filePath = path.join(frontendPath, filename);
    if (!fs.existsSync(filePath)) return '';
    const html = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove unwanted elements
    document.querySelectorAll('script, style, nav, footer, button, a, input, select, label').forEach(el => el.remove());

    // Extract text only from specified selectors
    const texts = selectors
        .flatMap(sel => Array.from(document.querySelectorAll(sel)))
        .map(el => el.textContent.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    return [...new Set(texts)].join(' ').substring(0, 5000);
}

async function generateIndex() {
    const index = [];

    // Static pages
    const pages = [
        { title: 'Home', url: 'home.html', selectors: ['h1', 'h2', 'p', '.stat-mini-label'] },
        { title: 'Our Plants', url: 'ourPlants.html', selectors: ['h1', 'p'] },
        { title: 'Projects', url: 'projects.html', selectors: ['h1', 'h2', 'h3', 'p', '.project-title'] },
        { title: 'Locations', url: 'Buildings.html', selectors: ['h1', 'h2', 'h3', 'p'] },
        { title: 'Statistics', url: 'statistics.html', selectors: ['h1', 'h2', 'p', '.stat-label'] },
        { title: 'About', url: 'about.html', selectors: ['h1', 'h2', 'h3', 'p'] },
    ];

    pages.forEach(page => {
        const content = extractTextFromPage(page.url, page.selectors);
        index.push({ title: page.title, url: page.url, content });
        console.log(`✓ Indexed page: ${page.title}`);
    });

    // Indoor plants
    try {
        console.log('Fetching indoor plants...');
        const indoorPlants = await fetchAPI('https://landscapinguob-api.onrender.com/api/indoor-plants');
        indoorPlants.forEach(plant => {
            index.push({
                title: `${plant['Common name'] || ''} ${plant['Scientific name'] || ''}`.trim(),
                displayTitle: `${plant['Scientific name'] || ''} ${plant['Common name'] || ''}`.trim(),
                subtitle: plant['Scientific name'] || '',
                type: 'indoor-plant',
                url: `ourPlants.html?search=${encodeURIComponent(plant['Common name'] || '')}&tab=indoor`,
                content: `${plant['Common name'] || ''} ${plant['Scientific name'] || ''}`
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
                title: `${plant['Common name'] || ''} ${plant['Scientific name'] || ''}`.trim(),
                displayTitle: `${plant['Scientific name'] || ''} ${plant['Common name'] || ''}`.trim(),
                subtitle: plant['Scientific name'] || '',
                type: 'outdoor-plant',
                url: `ourPlants.html?search=${encodeURIComponent(plant['Common name'] || '')}&tab=outdoor`,
                content: `${plant['Common name'] || ''} ${plant['Scientific name'] || ''}`
            });
        });
        console.log(`✓ Indexed ${outdoorPlants.length} outdoor plants`);
    } catch (err) {
        console.error('Failed to fetch outdoor plants:', err.message);
    }

    // Save index
    fs.writeFileSync(
        path.join(__dirname, '../LANDSCAPE-WEBSITE/searchIndex.json'),
        JSON.stringify(index, null, 2)
    );

    console.log(`\n✅ searchIndex.json generated with ${index.length} entries.`);
}

generateIndex();