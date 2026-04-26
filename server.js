const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static JSON files from the api directory
app.use('/api', express.static(path.join(__dirname, 'api')));

// Serve the docs folder (for the demo)
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Documentation / Home Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nepal Address API</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #2563eb;
                --bg: #0f172a;
                --card-bg: #1e293b;
                --text: #f8fafc;
                --text-muted: #94a3b8;
                --accent: #38bdf8;
            }
            body {
                font-family: 'Outfit', sans-serif;
                background-color: var(--bg);
                color: var(--text);
                margin: 0;
                line-height: 1.6;
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
                padding: 4rem 2rem;
            }
            header {
                text-align: center;
                margin-bottom: 4rem;
            }
            h1 {
                font-size: 3.5rem;
                font-weight: 700;
                margin-bottom: 1rem;
                background: linear-gradient(to right, var(--primary), var(--accent));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            p.subtitle {
                font-size: 1.25rem;
                color: var(--text-muted);
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
            }
            .card {
                background: var(--card-bg);
                padding: 2rem;
                border-radius: 1rem;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: transform 0.3s ease, border-color 0.3s ease;
            }
            .card:hover {
                transform: translateY(-5px);
                border-color: var(--primary);
            }
            .card h3 {
                margin-top: 0;
                color: var(--accent);
            }
            code {
                background: rgba(0, 0, 0, 0.3);
                padding: 0.2rem 0.5rem;
                border-radius: 0.4rem;
                font-family: monospace;
                color: var(--accent);
            }
            .endpoint {
                display: block;
                margin-top: 1rem;
                text-decoration: none;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
            .endpoint:hover {
                color: var(--text);
            }
            footer {
                text-align: center;
                margin-top: 6rem;
                padding-bottom: 2rem;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🇳🇵 Nepal Address API</h1>
                <p class="subtitle">A lightweight, static-ready API for Nepal's administrative structure.</p>
            </header>

            <div class="grid">
                <div class="card">
                    <h3>Provinces Index</h3>
                    <p>Get a mapping of all provinces to their district data paths.</p>
                    <a href="/api/v1/index/provinces-index.json" class="endpoint"><code>GET /api/v1/index/provinces-index.json</code></a>
                </div>

                <div class="card">
                    <h3>Districts</h3>
                    <p>Get all districts within a specific province.</p>
                    <a href="/api/v1/districts/province-1.json" class="endpoint"><code>GET /api/v1/districts/province-{id}.json</code></a>
                </div>

                <div class="card">
                    <h3>Municipalities</h3>
                    <p>List of municipalities within a district.</p>
                    <a href="/api/v1/municipalities/district-kathmandu.json" class="endpoint"><code>GET /api/v1/municipalities/district-{name}.json</code></a>
                </div>

                <div class="card">
                    <h3>Wards</h3>
                    <p>Detailed ward information for major metropolitan cities.</p>
                    <a href="/api/v1/wards/kathmandu-metro.json" class="endpoint"><code>GET /api/v1/wards/{city}.json</code></a>
                </div>

                <div class="card">
                    <h3>Search Districts</h3>
                    <p>A unified file for searching across all districts.</p>
                    <a href="/api/v1/search/districts.json" class="endpoint"><code>GET /api/v1/search/districts.json</code></a>
                </div>

                <div class="card">
                    <h3>Search Municipalities</h3>
                    <p>A unified file for searching across municipalities.</p>
                    <a href="/api/v1/search/municipalities.json" class="endpoint"><code>GET /api/v1/search/municipalities.json</code></a>
                </div>
            </div>

            <footer>
                Built with ❤️ for the Nepal Developer Community
            </footer>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
