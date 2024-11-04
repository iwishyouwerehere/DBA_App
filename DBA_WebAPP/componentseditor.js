const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// PostgreSQL connection configuration
const pool = new Pool({
    connectionString: "postgres://doadmin:AVNS_hslY1VjPHwFma3YI8yV@db-postgresql-lon1-98091-do-user-13881639-0.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// HTML content
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Components Manager</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .edit-mode input { width: 90%; }
        .button-group { margin-top: 20px; }
        button { padding: 5px 10px; margin-right: 5px; }
        .success { background-color: #dff0d8; }
        .error { background-color: #f2dede; }
    </style>
</head>
<body>
    <h1>Components Manager</h1>
    <div id="message"></div>
    <div class="button-group">
        <button onclick="addNewRow()">Add New Component</button>
        <button onclick="refreshData()">Refresh Data</button>
    </div>
    <table id="componentsTable">
        <thead>
            <tr id="headerRow"></tr>
        </thead>
        <tbody id="tableBody"></tbody>
    </table>

    <script>
        let columns = [];
        let editing = null;

        async function loadData() {
            try {
                const response = await fetch('/api/components');
                const data = await response.json();
                if (data.length > 0) {
                    columns = Object.keys(data[0]);
                    renderTable(data);
                }
            } catch (error) {
                showMessage('Error loading data: ' + error.message, 'error');
            }
        }

        function renderTable(data) {
            // Render headers
            const headerRow = document.getElementById('headerRow');
            headerRow.innerHTML = columns.map(col => 
                `<th>${col}</th>`
            ).join('') + '<th>Actions</th>';

            // Render body
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = data.map(row => {
                return `<tr id="row-${row.id}">
                    ${columns.map(col => `<td>${row[col]}</td>`).join('')}
                    <td>
                        <button onclick="editRow(${row.id})">Edit</button>
                        <button onclick="deleteRow(${row.id})">Delete</button>
                    </td>
                </tr>`;
            }).join('');
        }

        async function editRow(id) {
            if (editing) {
                const editingRow = document.getElementById('editing-' + editing);
                if (editingRow) {
                    await cancelEdit(editing);
                }
            }

            const row = document.getElementById('row-' + id);
            const rowData = {};
            columns.forEach((col, index) => {
                rowData[col] = row.cells[index].textContent;
            });

            row.innerHTML = columns.map(col => 
                `<td><input type="text" name="${col}" value="${rowData[col]}"></td>`
            ).join('') + `
            <td>
                <button onclick="saveRow(${id})">Save</button>
                <button onclick="cancelEdit(${id})">Cancel</button>
            </td>`;
            row.id = 'editing-' + id;
            editing = id;
        }

        async function saveRow(id) {
            const row = document.getElementById('editing-' + id);
            const data = {};
            columns.forEach(col => {
                data[col] = row.querySelector(`input[name="${col}"]`).value;
            });

            try {
                const response = await fetch('/api/components/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    showMessage('Component updated successfully', 'success');
                    refreshData();
                } else {
                    throw new Error('Failed to update component');
                }
            } catch (error) {
                showMessage('Error updating component: ' + error.message, 'error');
            }
        }

        async function cancelEdit(id) {
            await refreshData();
            editing = null;
        }

        async function deleteRow(id) {
            if (confirm('Are you sure you want to delete this component?')) {
                try {
                    const response = await fetch('/api/components/' + id, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        showMessage('Component deleted successfully', 'success');
                        refreshData();
                    } else {
                        throw new Error('Failed to delete component');
                    }
                } catch (error) {
                    showMessage('Error deleting component: ' + error.message, 'error');
                }
            }
        }

        async function addNewRow() {
            const newRow = {};
            columns.forEach(col => {
                newRow[col] = '';
            });

            try {
                const response = await fetch('/api/components', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRow)
                });

                if (response.ok) {
                    showMessage('New component added successfully', 'success');
                    refreshData();
                } else {
                    throw new Error('Failed to add new component');
                }
            } catch (error) {
                showMessage('Error adding new component: ' + error.message, 'error');
            }
        }

        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = message;
            messageDiv.className = type;
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = '';
            }, 3000);
        }

        async function refreshData() {
            await loadData();
        }

        // Initial load
        loadData();
    </script>
</body>
</html>
`;

// Routes
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// API Endpoints
app.get('/api/components', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Components');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Components WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Component not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/components', async (req, res) => {
    try {
        const columns = Object.keys(req.body).join(', ');
        const values = Object.values(req.body);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `INSERT INTO Components (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = Object.entries(req.body)
            .map(([key, _], index) => `${key} = $${index + 1}`)
            .join(', ');
        const values = [...Object.values(req.body), id];
        
        const query = `UPDATE Components SET ${updates} WHERE id = $${values.length} RETURNING *`;
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Component not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM Components WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Component not found' });
        } else {
            res.json({ message: 'Component deleted successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});