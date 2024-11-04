const express = require('express');
const router = express.Router();
const { pool } = require('./database');

// Serve the main page
router.get('/dbview', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Components Table</title>
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            h1 {
                text-align: center;
            }
            table {
                border-collapse: collapse;
                margin: 20px auto;
                width: 90%;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            tr:hover {
                background-color: #f5f5f5;
            }
            .edit-btn, .delete-btn {
                cursor: pointer;
                color: blue;
                text-decoration: underline;
            }
            .add-btn {
                display: block;
                width: 100px;
                margin: 10px auto;
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                text-align: center;
                text-decoration: none;
                border-radius: 4px;
            }
            .add-btn:hover {
                background-color: #45a049;
            }
            .search-input {
                display: block;
                margin: 20px auto;
                width: 50%;
                padding: 10px;
                font-size: 16px;
            }
            .button-container {
                text-align: center;
            }
        </style>
    </head>
    <body>
        <h1>Components Table</h1>

        <input type="text" id="search-input" class="search-input" placeholder="Search..." oninput="filterTable()">

        <div class="button-container">
            <button onclick="addRow()" class="add-btn">Add New Component</button>
        </div>

        <table id="components-table">
            <thead>
                <tr id="table-header">
                    <!-- Headers will be populated here -->
                </tr>
            </thead>
            <tbody id="table-body">
                <!-- Data will be populated here -->
            </tbody>
        </table>

        <script>
            let allData = [];

            async function fetchComponents() {
                const response = await fetch('/dbview/components');
                const data = await response.json();
                allData = data;
                populateTable(data);
            }

            function populateTable(data) {
                const tableHeader = document.getElementById('table-header');
                const tableBody = document.getElementById('table-body');

                // Clear existing table content
                tableHeader.innerHTML = '';
                tableBody.innerHTML = '';

                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
                    return;
                }

                // Generate table headers
                const headers = Object.keys(data[0]);
                headers.push('Actions');
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    tableHeader.appendChild(th);
                });

                // Generate table rows
                data.forEach(row => {
                    const tr = document.createElement('tr');

                    headers.forEach(header => {
                        const td = document.createElement('td');

                        if (header === 'Actions') {
                            td.innerHTML = \`
                                <span class="edit-btn" onclick="editRow('\${row.id}')">Edit</span> |
                                <span class="delete-btn" onclick="deleteRow('\${row.id}')">Delete</span>
                            \`;
                        } else {
                            td.textContent = row[header];
                        }

                        tr.appendChild(td);
                    });

                    tableBody.appendChild(tr);
                });
            }

            function editRow(id) {
                const component = allData.find(item => item.id === id);
                if (!component) {
                    alert('Component not found');
                    return;
                }

                const editableFields = Object.keys(component).filter(key => key !== 'id');
                let formHtml = '<form id="edit-form">';
                editableFields.forEach(field => {
                    formHtml += \`
                        <label>\${field}:</label><br>
                        <input type="text" name="\${field}" value="\${component[field] || ''}"><br><br>
                    \`;
                });
                formHtml += '</form>';

                const newWindow = window.open('', '', 'width=600,height=600');
                newWindow.document.write(\`
                    <html>
                    <head>
                        <title>Edit Component</title>
                    </head>
                    <body>
                        <h2>Edit Component - ID: \${id}</h2>
                        \${formHtml}
                        <button onclick="submitForm()">Save Changes</button>
                        <script>
                            function submitForm() {
                                const formData = new FormData(document.getElementById('edit-form'));
                                const data = {};
                                formData.forEach((value, key) => data[key] = value);
                                fetch('/dbview/components/' + \${id}, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(data)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    alert(data.message);
                                    window.opener.fetchComponents();
                                    window.close();
                                })
                                .catch(error => {
                                    console.error('Error updating component:', error);
                                    alert('Error updating component');
                                });
                            }
                        <\/script>
                    </body>
                    </html>
                \`);
            }

            function deleteRow(id) {
                if (confirm('Are you sure you want to delete this component?')) {
                    fetch('/dbview/components/' + id, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        fetchComponents();
                    })
                    .catch(error => {
                        console.error('Error deleting component:', error);
                        alert('Error deleting component');
                    });
                }
            }

            function addRow() {
                const newWindow = window.open('', '', 'width=600,height=600');

                // Get column names from existing data or fetch
                let columns = [];
                if (allData.length > 0) {
                    columns = Object.keys(allData[0]).filter(key => key !== 'id');
                } else {
                    alert('No data available to determine columns.');
                    return;
                }

                let formHtml = '<form id="add-form">';
                columns.forEach(field => {
                    formHtml += \`
                        <label>\${field}:</label><br>
                        <input type="text" name="\${field}"><br><br>
                    \`;
                });
                formHtml += '</form>';

                newWindow.document.write(\`
                    <html>
                    <head>
                        <title>Add New Component</title>
                    </head>
                    <body>
                        <h2>Add New Component</h2>
                        \${formHtml}
                        <button onclick="submitForm()">Add Component</button>
                        <script>
                            function submitForm() {
                                const formData = new FormData(document.getElementById('add-form'));
                                const data = {};
                                formData.forEach((value, key) => data[key] = value);
                                fetch('/dbview/components', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(data)
                                })
                                .then(response => response.json())
                                .then(data => {
                                    alert(data.message);
                                    window.opener.fetchComponents();
                                    window.close();
                                })
                                .catch(error => {
                                    console.error('Error adding component:', error);
                                    alert('Error adding component');
                                });
                            }
                        <\/script>
                    </body>
                    </html>
                \`);
            }

            function filterTable() {
                const searchValue = document.getElementById('search-input').value.toLowerCase();
                const filteredData = allData.filter(row => {
                    return Object.values(row).some(value =>
                        String(value).toLowerCase().includes(searchValue)
                    );
                });
                populateTable(filteredData);
            }

            // Fetch components on page load
            fetchComponents();
        </script>
    </body>
    </html>
  `);
});

// Endpoint to get all components
router.get('/dbview/components', async (req, res) => {
    try {
        const client = await pool.connect();
        const componentsQuery = 'SELECT * FROM components ORDER BY id';
        const componentsResult = await client.query(componentsQuery);
        client.release();

        res.json(componentsResult.rows);
    } catch (err) {
        console.error('Error retrieving components:', err.message);
        res.status(500).json({ error: 'Error retrieving components' });
    }
});

// Endpoint to update a component
router.put('/dbview/components/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    if (!id || !updatedData) {
        return res.status(400).json({ error: 'ID and updated data are required' });
    }

    try {
        const client = await pool.connect();

        // Build the SET clause dynamically
        const setClause = Object.keys(updatedData).map((key, idx) => `${key} = $${idx + 1}`).join(', ');
        const values = Object.values(updatedData);

        const updateQuery = `UPDATE components SET ${setClause} WHERE id = $${values.length + 1}`;
        values.push(id);

        await client.query(updateQuery, values);
        client.release();

        res.json({ message: 'Component updated successfully' });
    } catch (err) {
        console.error('Error updating component:', err.message);
        res.status(500).json({ error: 'Error updating component' });
    }
});

// Endpoint to delete a component
router.delete('/dbview/components/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    try {
        const client = await pool.connect();
        const deleteQuery = 'DELETE FROM components WHERE id = $1';
        await client.query(deleteQuery, [id]);
        client.release();

        res.json({ message: 'Component deleted successfully' });
    } catch (err) {
        console.error('Error deleting component:', err.message);
        res.status(500).json({ error: 'Error deleting component' });
    }
});

// Endpoint to add a new component
router.post('/dbview/components', async (req, res) => {
    const newData = req.body;

    if (!newData) {
        return res.status(400).json({ error: 'New component data is required' });
    }

    try {
        const client = await pool.connect();

        // Build the INSERT query dynamically
        const columns = Object.keys(newData);
        const values = Object.values(newData);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`);

        const insertQuery = `INSERT INTO components (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        await client.query(insertQuery, values);
        client.release();

        res.json({ message: 'Component added successfully' });
    } catch (err) {
        console.error('Error adding component:', err.message);
        res.status(500).json({ error: 'Error adding component' });
    }
});

module.exports = router;