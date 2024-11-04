// server.js
const express = require('express');
const path = require('path');
const { pool } = require('./database');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// Get distinct blocks and constructions for dropdowns
app.get('/api/filters', async (req, res) => {
    try {
        const blocksQuery = `SELECT DISTINCT block FROM components ORDER BY block`;
        const costrQuery = `SELECT DISTINCT costr FROM components ORDER BY costr`;
        
        const [blocks, costrs] = await Promise.all([
            pool.query(blocksQuery),
            pool.query(costrQuery)
        ]);

        res.json({
            blocks: blocks.rows.map(row => row.block),
            constructions: costrs.rows.map(row => row.costr)
        });
    } catch (err) {
        console.error('Error fetching filters:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get components with filters
app.get('/api/components', async (req, res) => {
    try {
        const { block, costr, page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let values = [];
        let valueIndex = 1;
        
        if (block) {
            whereConditions.push(`block = $${valueIndex}`);
            values.push(block);
            valueIndex++;
        }
        
        if (costr) {
            whereConditions.push(`costr = $${valueIndex}`);
            values.push(costr);
            valueIndex++;
        }
        
        if (search) {
            whereConditions.push(`(idn ILIKE $${valueIndex} OR type ILIKE $${valueIndex} OR mat ILIKE $${valueIndex})`);
            values.push(`%${search}%`);
            valueIndex++;
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const dataQuery = `
            SELECT * FROM components
            ${whereClause}
            ORDER BY id
            LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
        `;
        
        const countQuery = `
            SELECT COUNT(*) FROM components ${whereClause}
        `;
        
        const { rows: data } = await pool.query(dataQuery, [...values, limit, offset]);
        const { rows: countResult } = await pool.query(countQuery, values);
        
        res.json({
            data,
            total: parseInt(countResult[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        console.error('Error fetching components:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update component
app.put('/api/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove read-only fields
        delete updates.id;
        delete updates.object_id;
        
        const setClauses = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(', ');
        
        const query = `
            UPDATE components
            SET ${setClauses}
            WHERE id = $${Object.keys(updates).length + 1}
            RETURNING *
        `;
        
        const values = [...Object.values(updates), id];
        const { rows } = await pool.query(query, values);
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating component:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:3000`);
});