const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const htmlPdf = require('html-pdf');

const app = express();
const port = 3000;

const connectionString = "postgres://doadmin:AVNS_hslY1VjPHwFma3YI8yV@db-postgresql-lon1-98091-do-user-13881639-0.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/a8', async (req, res) => {
    try {
        const client = await pool.connect();

        // Fetch available constructions
        const constructionsQuery = 'SELECT id, name FROM constructions';
        const constructionsResult = await client.query(constructionsQuery);

        client.release();

        const constructionsOptions = constructionsResult.rows.map(construction =>
            `<option value="${construction.id}">${construction.name}</option>`
        ).join('');

        res.send(`
            <form id="mainForm" action="/view" method="get">
                <label for="construction_id">Construction:</label>
                <select id="construction_id" name="construction_id" required>
                    <option value="">Select Construction</option>
                    ${constructionsOptions}
                </select>
                <br>
                <label for="block_name">Block Name:</label>
                <select id="block_name" name="block_name" required>
                    <option value="">Select Block</option>
                </select>
                <br>
                <div id="attributes" style="display: none;">
                    <label>Select Attributes:</label>
                    <div id="attributesList"></div>
                </div>
                <br>
                <button type="submit">View Components</button>
                <button type="button" id="generateBom">Generate BOM PDF</button>
            </form>
            <script>
                document.getElementById('construction_id').addEventListener('change', async function() {
                    const constructionId = this.value;
                    const blockSelect = document.getElementById('block_name');
                    blockSelect.innerHTML = '<option value="">Select Block</option>'; // Reset block options

                    if (constructionId) {
                        try {
                            const response = await fetch(\`/blocks?construction_id=\${constructionId}\`);
                            const blocks = await response.json();

                            blocks.forEach(block => {
                                const option = document.createElement('option');
                                option.value = block.name;
                                option.textContent = block.name;
                                blockSelect.appendChild(option);
                            });
                        } catch (err) {
                            console.error('Error fetching blocks:', err);
                        }
                    }
                });

                document.getElementById('block_name').addEventListener('change', async function() {
                    const blockName = this.value;
                    const constructionId = document.getElementById('construction_id').value;
                    const attributesDiv = document.getElementById('attributes');
                    const attributesList = document.getElementById('attributesList');
                    attributesList.innerHTML = ''; // Reset attributes list

                    if (blockName && constructionId) {
                        try {
                            const response = await fetch(\`/attributes?construction_id=\${constructionId}&block_name=\${blockName}\`);
                            const attributes = await response.json();

                            attributes.forEach(attribute => {
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.name = 'attributes';
                                checkbox.value = attribute;
                                checkbox.id = attribute;

                                const label = document.createElement('label');
                                label.htmlFor = attribute;
                                label.textContent = attribute;

                                const div = document.createElement('div');
                                div.appendChild(checkbox);
                                div.appendChild(label);

                                attributesList.appendChild(div);
                            });

                            attributesDiv.style.display = 'block';
                        } catch (err) {
                            console.error('Error fetching attributes:', err);
                        }
                    } else {
                        attributesDiv.style.display = 'none';
                    }
                });

                document.getElementById('generateBom').addEventListener('click', function() {
                    const constructionId = document.getElementById('construction_id').value;
                    const blockName = document.getElementById('block_name').value;
                    if (constructionId && blockName) {
                        window.location.href = \`/a8-details?construction_id=\${constructionId}&block_name=\${blockName}\`;
                    } else {
                        alert('Please select both construction and block');
                    }
                });
            </script>
        `);
    } catch (err) {
        console.error('Error retrieving constructions:', err.message);
        res.status(500).send('Error retrieving constructions');
    }
});


// Serve the HTML form with available constructions and blocks
app.get('/billofmaterials', async (req, res) => {
    try {
        const client = await pool.connect();

        // Fetch available constructions
        const constructionsQuery = 'SELECT id, name FROM constructions';
        const constructionsResult = await client.query(constructionsQuery);

        client.release();

        const constructionsOptions = constructionsResult.rows.map(construction =>
            `<option value="${construction.id}">${construction.name}</option>`
        ).join('');

        res.send(`
            <form id="mainForm" action="/view" method="get">
                <label for="construction_id">Construction:</label>
                <select id="construction_id" name="construction_id" required>
                    <option value="">Select Construction</option>
                    ${constructionsOptions}
                </select>
                <br>
                <label for="block_name">Block Name:</label>
                <select id="block_name" name="block_name" required>
                    <option value="">Select Block</option>
                </select>
                <br>
                <div id="attributes" style="display: none;">
                    <label>Select Attributes:</label>
                    <div id="attributesList"></div>
                </div>
                <br>
                <button type="submit">View Components</button>
                <button type="button" id="generateBom">Generate BOM PDF</button>
            </form>
            <script>
                document.getElementById('construction_id').addEventListener('change', async function() {
                    const constructionId = this.value;
                    const blockSelect = document.getElementById('block_name');
                    blockSelect.innerHTML = '<option value="">Select Block</option>'; // Reset block options

                    if (constructionId) {
                        try {
                            const response = await fetch(\`/blocks?construction_id=\${constructionId}\`);
                            const blocks = await response.json();

                            blocks.forEach(block => {
                                const option = document.createElement('option');
                                option.value = block.name;
                                option.textContent = block.name;
                                blockSelect.appendChild(option);
                            });
                        } catch (err) {
                            console.error('Error fetching blocks:', err);
                        }
                    }
                });

                document.getElementById('block_name').addEventListener('change', async function() {
                    const blockName = this.value;
                    const constructionId = document.getElementById('construction_id').value;
                    const attributesDiv = document.getElementById('attributes');
                    const attributesList = document.getElementById('attributesList');
                    attributesList.innerHTML = ''; // Reset attributes list

                    if (blockName && constructionId) {
                        try {
                            const response = await fetch(\`/attributes?construction_id=\${constructionId}&block_name=\${blockName}\`);
                            const attributes = await response.json();

                            attributes.forEach(attribute => {
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.name = 'attributes';
                                checkbox.value = attribute;
                                checkbox.id = attribute;

                                const label = document.createElement('label');
                                label.htmlFor = attribute;
                                label.textContent = attribute;

                                const div = document.createElement('div');
                                div.appendChild(checkbox);
                                div.appendChild(label);

                                attributesList.appendChild(div);
                            });

                            attributesDiv.style.display = 'block';
                        } catch (err) {
                            console.error('Error fetching attributes:', err);
                        }
                    } else {
                        attributesDiv.style.display = 'none';
                    }
                });

                document.getElementById('generateBom').addEventListener('click', function() {
                    const constructionId = document.getElementById('construction_id').value;
                    const blockName = document.getElementById('block_name').value;
                    if (constructionId && blockName) {
                        window.location.href = \`/bom?construction_id=\${constructionId}&block_name=\${blockName}\`;
                    } else {
                        alert('Please select both construction and block');
                    }
                });
            </script>
        `);
    } catch (err) {
        console.error('Error retrieving constructions:', err.message);
        res.status(500).send('Error retrieving constructions');
    }
});

// Endpoint to fetch blocks based on construction ID
app.get('/blocks', async (req, res) => {
    const { construction_id } = req.query;

    if (!construction_id) {
        return res.status(400).send('Construction ID is required');
    }

    try {
        const client = await pool.connect();
        const blocksQuery = 'SELECT id, name FROM blocks WHERE construction_id = $1';
        const blocksResult = await client.query(blocksQuery, [construction_id]);
        client.release();

        res.json(blocksResult.rows);
    } catch (err) {
        console.error('Error retrieving blocks:', err.message);
        res.status(500).send('Error retrieving blocks');
    }
});

// Endpoint to fetch attributes based on construction ID and block name
app.get('/attributes', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Both construction_id and block_name are required');
    }

    try {
        const client = await pool.connect();

        // Fetch the first component to get its attributes
        const attributesQuery = `
            SELECT * FROM components 
            WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
            LIMIT 1
        `;
        const attributesResult = await client.query(attributesQuery, [block_name, construction_id]);

        client.release();

        if (attributesResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        const attributes = Object.keys(attributesResult.rows[0]);
        res.json(attributes);
    } catch (err) {
        console.error('Error retrieving attributes:', err.message);
        res.status(500).send('Error retrieving attributes');
    }
});

// Endpoint for viewing components of a selected block and construction with selected attributes
app.get('/view', async (req, res) => {
    const { construction_id, block_name, attributes } = req.query;

    if (!construction_id || !block_name || !attributes) {
        return res.status(400).send('Construction ID, block name, and attributes are required');
    }

    const selectedAttributes = Array.isArray(attributes) ? attributes : [attributes];

    try {
        const client = await pool.connect();

        // Fetch components with selected attributes
        const componentsQuery = `
            SELECT ${selectedAttributes.join(', ')} FROM components 
            WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        const componentsResult = await client.query(componentsQuery, [block_name, construction_id]);

        client.release();

        if (componentsResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        // Format the data into a beautiful HTML table
        const tableRows = componentsResult.rows.map(row => {
            return `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`;
        }).join('');

        const htmlContent = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 18px;
                        text-align: left;
                    }
                    th, td {
                        padding: 12px;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #4CAF50;
                        color: white;
                    }
                    tr:hover {
                        background-color: #f5f5f5;
                    }
                    .container {
                        width: 90%;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #4CAF50;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Components</h1>
                    <table>
                        <thead>
                            <tr>${selectedAttributes.map(attr => `<th>${attr}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        // Send the HTML content to the browser
        res.send(htmlContent);
    } catch (err) {
        console.error('Error retrieving components:', err.message);
        res.status(500).send('Error retrieving components');
    }
});

// Endpoint for generating the BOM as PDF
app.get('/bom', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Construction ID and Block Name are required');
    }

    try {
        const client = await pool.connect();

        // Fetch BOM data for the PDF
        const bomQuery = `
            SELECT idn AS "IDN", type AS "Type", mat AS "Material", assieme AS "Assembly", 
            locazione AS "Location", weight AS "Weight (Kg)", nested AS "Side"
            FROM components
            WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        const bomResult = await client.query(bomQuery, [block_name, construction_id]);

        client.release();

        if (bomResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        // Generate HTML for the BOM
        const tableRows = bomResult.rows.map(row => {
            return `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`;
        }).join('');

        const htmlContent = `
            <html>
            <head>
                <style>
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    h1 { text-align: center; color: #4CAF50; }
                </style>
            </head>
            <body>
                <h1>Bill of Materials (BOM)</h1>
                <table>
                    <thead>
                        <tr>
                            <th>IDN</th>
                            <th>Type</th>
                            <th>Material</th>
                            <th>Assembly</th>
                            <th>Location</th>
                            <th>Weight (Kg)</th>
                            <th>Side</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Convert HTML to PDF and send it as a response
        htmlPdf.create(htmlContent).toStream((err, stream) => {
            if (err) {
                console.error('Error generating PDF:', err.message);
                return res.status(500).send('Error generating PDF');
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=bom.pdf');
            stream.pipe(res);
        });
    } catch (err) {
        console.error('Error retrieving BOM:', err.message);
        res.status(500).send('Error retrieving BOM');
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
