const express = require('express');

const router = express.Router();
const { pool } = require('./database');
const views = require('./views');
const pdfGenerator = require('./pdfGenerator');
const pdfA8gen = require('./pdfA8gen');
const pdfB2gen = require('./pdfB2gen');
const pdfA17gen = require('./pdfA17gen');
const csv = require('./csv');
const { createObjectCsvStringifier } = require('csv-writer');



const app = express();

app.use(express.json());

router.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        const constructionsQuery = 'SELECT id, name FROM constructions';
        const constructionsResult = await client.query(constructionsQuery);
        client.release();

        const constructionsOptions = constructionsResult.rows.map(construction =>
            `<option value="${construction.id}">${construction.name}</option>`
        ).join('');

        res.send(views.mainForm(constructionsOptions));
    } catch (err) {
        console.error('Error retrieving constructions:', err.message);
        res.status(500).send('Error retrieving constructions');
    }
});

router.get('/blocks', async (req, res) => {
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

router.get('/attributes', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Both construction_id and block_name are required');
    }

    try {
        const client = await pool.connect();
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

router.get('/view', async (req, res) => {
    const { construction_id, block_name, attributes } = req.query;

    if (!construction_id || !block_name || !attributes) {
        return res.status(400).send('Construction ID, block name, and attributes are required');
    }

    const selectedAttributes = Array.isArray(attributes) ? attributes : [attributes];

    try {
        const client = await pool.connect();
        const componentsQuery = `
            SELECT ${selectedAttributes.join(', ')} FROM components 
            WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        const componentsResult = await client.query(componentsQuery, [block_name, construction_id]);
        client.release();

        if (componentsResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        res.send(views.componentsTable(selectedAttributes, componentsResult.rows));
    } catch (err) {
        console.error('Error retrieving components:', err.message);
        res.status(500).send('Error retrieving components');
    }
});

router.get('/bom-details', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Construction ID and Block Name are required');
    }

    try {
        const client = await pool.connect();
        const bomQuery = `
            SELECT idn AS "IDN", type AS "Type", mat AS "Material", assieme AS "Assembly",
                   locazione AS "Location", weight AS "Weight", nested AS "Side", cog_y AS "COGY",
                   subasm AS "Subassembly"
            FROM components
            WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        const bomResult = await client.query(bomQuery, [block_name, construction_id]);
        client.release();

        if (bomResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        pdfGenerator.generateBomPdf(bomResult.rows, res);
    } catch (err) {
        console.error('Error retrieving BOM:', err.message);
        res.status(500).send('Error retrieving BOM');
    }
});

router.get('/a8-details', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Construction ID and Block Name are required');
    }

    try {
        const client = await pool.connect();
        const a8DetailsQuery = `
        SELECT 
            idn || CASE WHEN sag = true THEN 'M' ELSE '' END AS "IDN",
            type AS "Type",
            mat AS "Material", 
            length::numeric - COALESCE(incr1::numeric, 0) - COALESCE(incr2::numeric, 0) AS "Net Length (mm)", 
            COALESCE(NULLIF(NULLIF(NULLIF(length2, '-'), 'NaN'), '')::numeric, length::numeric) AS "Total Length (mm)", 
            incr1 AS "Increment 1",
            incr2 AS "Increment 2", 
            end1 AS "END1",
            end2 AS "END2"
        FROM components
        WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        
        const a8DetailsResult = await client.query(a8DetailsQuery, [block_name, construction_id]);
        client.release();

        if (a8DetailsResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        pdfA8gen.generateA8Pdf(a8DetailsResult.rows, res);

    } catch (err) {
        console.error('Error retrieving A8 details:', err.message);
        res.status(500).send('Error retrieving A8 details');
    }
});


router.get('/b2-details', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Construction ID and Block Name are required');
    }

    try {
        const client = await pool.connect();
        const b2DetailsQuery = `
        SELECT type AS "Type", mat AS "Material", 
               COALESCE(NULLIF(NULLIF(NULLIF(length2, '-'), 'NaN'), '')::numeric, length::numeric) AS "Total Length (mm)", 
               weight AS "Weight"
        FROM components
        WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2)
    `;
        
        const b2DetailsResult = await client.query(b2DetailsQuery, [block_name, construction_id]);
        client.release();

        if (b2DetailsResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }
        
        pdfB2gen.generateB2Pdf(b2DetailsResult.rows, res);

    } catch (err) {
        console.error('Error retrieving B2 details:', err.message);
        res.status(500).send('Error retrieving B2 details');
    }
});


router.get('/A17-details', async (req, res) => {
    const { construction_id, block_name } = req.query;

    if (!construction_id || !block_name) {
        return res.status(400).send('Construction ID and Block Name are required');
    }

    try {
        const client = await pool.connect();
        const bomQuery = `
            SELECT 
                assieme AS "Assembly", 
                subasm AS "Subassembly",
                cog_x AS "COGX", 
                cog_y AS "COGY", 
                cog_z AS "COGZ", 
                weight AS "Weight"
            FROM components
            WHERE block = $1 
            AND costr = (SELECT name FROM constructions WHERE id = $2)
        `;
        const bomResult = await client.query(bomQuery, [block_name, construction_id]);
        client.release();

        if (bomResult.rows.length === 0) {
            return res.status(404).send('No components found for the specified block and construction');
        }

        // Grouping by Assembly and Subassembly and calculating weighted COG and total weights
        const assemblyData = {};
        bomResult.rows.forEach(item => {
            const { Assembly, Subassembly, COGX, COGY, COGZ, Weight } = item;

            if (!assemblyData[Assembly]) {
                assemblyData[Assembly] = {};
            }

            if (!assemblyData[Assembly][Subassembly]) {
                assemblyData[Assembly][Subassembly] = {
                    totalWeight: 0,
                    totalCOGX: 0,
                    totalCOGY: 0,
                    totalCOGZ: 0
                };
            }

            assemblyData[Assembly][Subassembly].totalWeight += Weight;
            assemblyData[Assembly][Subassembly].totalCOGX += COGX * Weight;
            assemblyData[Assembly][Subassembly].totalCOGY += COGY * Weight;
            assemblyData[Assembly][Subassembly].totalCOGZ += COGZ * Weight;
        });

        // Create an array of assemblies and subassemblies with calculated weighted COG and total weight
        const assemblyRows = [];
        Object.keys(assemblyData).forEach(assembly => {
            Object.keys(assemblyData[assembly]).forEach(subassembly => {
                const data = assemblyData[assembly][subassembly];
                const totalWeight = data.totalWeight;

                // Calculate the weighted average COG for the subassembly
                assemblyRows.push({
                    Assembly: assembly,
                    Subassembly: subassembly,
                    COGX: (data.totalCOGX / totalWeight).toFixed(2),
                    COGY: (data.totalCOGY / totalWeight).toFixed(2),
                    COGZ: (data.totalCOGZ / totalWeight).toFixed(2),
                    Weight: totalWeight.toFixed(2)
                });
            });
        });

        // Calculate total COG (weighted average) for all assemblies and subassemblies combined
        const totalWeightAll = assemblyRows.reduce((sum, item) => sum + parseFloat(item.Weight), 0);
        const totalCOGXAll = assemblyRows.reduce((sum, item) => sum + parseFloat(item.COGX) * parseFloat(item.Weight), 0) / totalWeightAll;
        const totalCOGYAll = assemblyRows.reduce((sum, item) => sum + parseFloat(item.COGY) * parseFloat(item.Weight), 0) / totalWeightAll;
        const totalCOGZAll = assemblyRows.reduce((sum, item) => sum + parseFloat(item.COGZ) * parseFloat(item.Weight), 0) / totalWeightAll;

        // Append the total COG row to the result
        const totalCOGRow = {
            Assembly: 'Total',
            Subassembly: 'Total',
            COGX: totalCOGXAll.toFixed(2),
            COGY: totalCOGYAll.toFixed(2),
            COGZ: totalCOGZAll.toFixed(2),
            Weight: totalWeightAll.toFixed(2)
        };
        assemblyRows.push(totalCOGRow);

        // Pass the grouped data to the PDF generator
        pdfA17gen.generateA17Pdf(assemblyRows, res);
    } catch (err) {
        console.error('Error retrieving BOM:', err.message);
        res.status(500).send('Error retrieving BOM');
    }
});


const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const fetch = require('node-fetch');

router.get('/custom-report', async (req, res) => {
    console.log('Received query parameters:', req.query);

    const { construction_id, block_name, custom_request } = req.query;

    if (!construction_id || !block_name || !custom_request) {
        return res.status(400).send('Construction ID, Block Name, and Custom Report Request are required');
    }

    try {
        const client = await pool.connect();

        // Retrieve column names from the components table
        const columnQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'components'
        `;
        const columnsResult = await client.query(columnQuery);
        const availableColumns = columnsResult.rows.map(row => row.column_name);

        // Build the initial context for the AI
        const context = `
Available columns in the 'components' table are:
${availableColumns.join(', ')}

The 'components' table contains data related to components of constructions.
`;

        // Build the AI prompt
        const prompt = `
You are an assistant that helps generate SQL queries based on user requests.
Using the available columns and the 'components' table, create a safe SQL query that fulfills the following request:

"${custom_request}"
-- Query to retrieve constructions SELECT id, name FROM constructions;

-- Query to retrieve blocks based on construction_id SELECT id, name FROM blocks WHERE construction_id = $1;

-- Query to retrieve attributes based on block_name and construction_id SELECT * FROM components WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2) LIMIT 1;

-- Query to retrieve BOM based on block_name and construction_id SELECT idn AS "IDN", type AS "Type", mat AS "Material", assieme AS "Assembly", locazione AS "Location", weight AS "Weight", nested AS "Side", cog_y AS "COGY", subasm AS "Subassembly" FROM components WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2);

-- Query to retrieve A8 details based on block_name and construction_id SELECT idn AS "IDN", type AS "Type", mat AS "Material", length::numeric - COALESCE(incr1::numeric, 0) - COALESCE(incr2::numeric, 0) AS "Net Length (mm)", COALESCE(NULLIF(NULLIF(NULLIF(length2, '-'), 'NaN'), '')::numeric, length::numeric) AS "Total Length (mm)", incr1 AS "Increment 1", incr2 AS "Increment 2", end1 AS "END1", end2 AS "END2" FROM components WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2);

-- Query to retrieve B2 details based on block_name and construction_id SELECT type AS "Type", mat AS "Material", COALESCE(NULLIF(NULLIF(NULLIF(length2, '-'), 'NaN'), '')::numeric, length::numeric) AS "Total Length (mm)", weight AS "Weight" FROM components WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2);

-- Query to retrieve A17 details based on block_name and construction_id SELECT assieme AS "Assembly", subasm AS "Subassembly", cog_x AS "COGX", cog_y AS "COGY", cog_z AS "COGZ", weight AS "Weight" FROM components WHERE block = $1 AND costr = (SELECT name FROM constructions WHERE id = $2);
The SQL query should:
- Only select data (no updates or deletions).
- Be safe and prevent SQL injection.
- Include WHERE clauses to filter data based on 'block' and 'costr' columns, where:
  - block = '${block_name}'
  - costr = (SELECT name FROM constructions WHERE id = ${construction_id})

Provide only the PostgreSQL query without any explanations or prefixes.
`;

        // Call the AI model to generate the SQL query
        const apiKey = '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';
        if (!apiKey) {
            client.release();
            return res.status(500).send('Server configuration error: API key is missing');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'model': 'nousresearch/hermes-3-llama-3.1-405b:free',
                'messages': [
                    { 'role': 'system', 'content': context },
                    { 'role': 'user', 'content': prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error from OpenAI API: ${response.status} ${errorText}`);
            client.release();
            return res.status(500).send('Error generating custom report');
        }
        const apiResult = await response.json();
        const aiContent = apiResult.choices[0].message.content.trim();

        // Extract the SQL query and remove the "sql" prefix if present
        const sqlQuery = aiContent.replace(/^\s*sql\s*/i, '').replace(/[`;]/g, '').trim();
        console.log(sqlQuery);

        // Validate the query to ensure it starts with "SELECT"
        if (!/^SELECT\s+/i.test(sqlQuery)) {
            client.release();
            return res.status(400).send('Generated query is not a SELECT statement');
        }

        // Check if the query is dangerous or innocent
        const safetyCheckPrompt = `
Analyze the following SQL query and determine if it's potentially dangerous or mostly innocent:

${sqlQuery}

Reply with only "reply1" if it can be dangerous or "reply0" if it's mostly innocent.
`;

        const safetyCheckResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'model': 'meta-llama/llama-3.2-3b-instruct:free',
                'messages': [
                    { 'role': 'user', 'content': safetyCheckPrompt }
                ]
            })
        });

        if (!safetyCheckResponse.ok) {
            const errorText = await safetyCheckResponse.text();
            console.error(`Error from OpenAI API (Safety Check): ${safetyCheckResponse.status} ${errorText}`);
            client.release();
            return res.status(500).send('Error checking query safety');
        }
        console.log("Safety check ok")
        const safetyCheckResult = await safetyCheckResponse.json();
        const safetyCheckContent = safetyCheckResult.choices[0].message.content.trim();

        if (safetyCheckContent === 'reply1') {
            client.release();
            return res.status(400).send('The generated query is potentially dangerous and cannot be executed');
        }

        // Add limit to prevent large data retrieval
        const limitClause = sqlQuery.toLowerCase().includes('limit') ? '' : ' LIMIT 500';
        console.log("limitClause")
        const finalQuery = sqlQuery + limitClause;
        console.log("Final Query: " + finalQuery)
        // Execute the query safely
        const queryResult = await client.query(finalQuery);
        client.release();

        if (queryResult.rows.length === 0) {
            return res.status(404).send('No data found for the specified query');
        }
        console.log(queryResult);
        
        // Prepare data for CSV
        const selectedAttributes = Object.keys(queryResult.rows[0]);
        const csvStringifier = createObjectCsvStringifier({
            header: selectedAttributes.map(attr => ({ id: attr, title: attr }))
        });
        
        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(queryResult.rows);
        

        try {
            // Set the appropriate headers to download the CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="custom_report.csv"');
        
            // Send the CSV data directly to the client
            res.send(csvString);
        
        } catch (err) {
            console.error('Error generating custom report:', err.message);
            res.status(500).send('Error generating custom report');
        }

    } catch (err) {
        console.error('Error generating custom report:', err.message);
        res.status(500).send('Error generating custom report',err.message);
    }


});



// Your route handler
router.post('/add-component', async (req, res) => {
    // Log the request body to see what's being received
    console.log('Received request body:', req.body);

    // Destructure fields from req.body
    const {
        object_id,
        idn,
        costr,
        block,
        component_type,
        mat,
        assieme = null,
        end1 = null,
        end2 = null,
        cog_x = null,
        cog_y = null,
        cog_z = null,
        locazione = null,
        weight = null,
        length = null,
        length2 = null,
        incr1 = null,
        incr2 = null,
        nested = null,
        object_type
    } = req.body;

    // Validate required fields and collect missing ones
    const missingFields = [];
    if (!object_id) missingFields.push('object_id');
    if (!idn) missingFields.push('idn');
    if (!costr) missingFields.push('costr');
    if (!block) missingFields.push('block');
    if (!component_type) missingFields.push('component_type');
    if (!mat) missingFields.push('mat');
    if (!object_type) missingFields.push('object_type');

    if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
    }

    try {
        const client = await pool.connect();

        const insertQuery = `
            INSERT INTO components (
                object_id, idn, costr, block, component_type, mat, assieme, end1, end2,
                cog_x, cog_y, cog_z, locazione, weight, length, length2,
                incr1, incr2, nested, object_type
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20
            ) RETURNING *;
        `;

        const values = [
            object_id,
            idn,
            costr,
            block,
            component_type,
            mat,
            assieme,
            end1,
            end2,
            cog_x,
            cog_y,
            cog_z,
            locazione,
            weight,
            length,
            length2,
            incr1,
            incr2,
            nested,
            object_type
        ];

        const result = await client.query(insertQuery, values);
        client.release();

        res.status(201).json({
            message: 'Component added successfully',
            component: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding component:', err.message);
        res.status(500).send('Error adding component');
    }
});



module.exports = router;