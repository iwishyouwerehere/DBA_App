function mainForm(constructionsOptions) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Construction Details</title>
    <style>
        /* Existing styles remain unchanged */
        :root {
            --system-blue: #007AFF;
            --system-green: #34C759;
            --system-orange: #FF9500;
            --system-red: #FF3B30;
            --system-yellow: #FFCC00;
            --system-gray: #8E8E93;
            --background-color: #F2F2F7;
            --card-background: #FFFFFF;
            --text-primary: #000000;
            --text-secondary: #6C6C70;
            --border-color: #C6C6C8;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--background-color);
            color: var(--text-primary);
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: var(--card-background);
            border-radius: 18px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        
        .form-header {
            background-color: var(--system-blue);
            color: white;
            padding: 24px;
            font-size: 22px;
            font-weight: 600;
            text-align: center;
        }
        
        .form-content {
            padding: 24px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--text-secondary);
        }
        
        select, button, textarea {
            width: 100%;
            padding: 12px 16px;
            font-size: 17px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            background-color: var(--card-background);
            color: var(--text-primary);
            appearance: none;
            -webkit-appearance: none;
            transition: all 0.3s ease;
        }
        
        select {
            background-image: url("data:image/svg+xml,%3Csvg width='14' height='8' viewBox='0 0 14 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L7 7L13 1' stroke='%238E8E93' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            padding-right: 40px;
        }
        
        select:focus, button:focus, textarea:focus {
            outline: none;
            border-color: var(--system-blue);
            box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
        }
        
        button {
            background-color: var(--system-blue);
            color: white;
            border: none;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 12px;
        }
        
        button:hover {
            background-color: #0056b3;
        }
        
        #attributes {
            display: none;
        }
        
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
        }
        
        .checkbox-item input[type="checkbox"] {
            margin-right: 8px;
            width: 20px;
            height: 20px;
            border-radius: 6px;
            border: 2px solid var(--system-gray);
            appearance: none;
            -webkit-appearance: none;
            outline: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .checkbox-item input[type="checkbox"]:checked {
            background-color: var(--system-blue);
            border-color: var(--system-blue);
            background-image: url("data:image/svg+xml,%3Csvg width='12' height='9' viewBox='0 0 12 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4L4.5 7.5L11 1' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: center;
        }
        
        .checkbox-item label {
            font-size: 16px;
            color: var(--text-primary);
        }
        
        .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        #generateBom { background-color: var(--system-green); }
        #generateA8 { background-color: var(--system-yellow); color: var(--text-primary); }
        #generateB2 { background-color: var(--system-orange); }
        #generateA17 { background-color: var(--system-red); }
        #generateCustomReport { background-color: var(--system-gray); }
        
        @media (max-width: 480px) {
            .button-group {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="form-header">
            Construction Details
        </div>
        <div class="form-content">
            <form id="mainForm" action="/view" method="get">
                <div class="form-group">
                    <label for="construction_id">Construction</label>
                    <select id="construction_id" name="construction_id" required>
                        <option value="">Select Construction</option>
                        ${constructionsOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="block_name">Block Name</label>
                    <select id="block_name" name="block_name" required>
                        <option value="">Select Block</option>
                    </select>
                </div>
                <!-- New section for Custom Report Request -->
                <div class="form-group">
                    <label for="custom_report_request">Custom Report Request (Natural Language)</label>
                    <textarea id="custom_report_request" name="custom_report_request" rows="4" placeholder="Enter your custom report request here"></textarea>
                </div>
                <div class="button-group">
                    <button type="submit">View Components</button>
                    <button type="button" id="generateBom">Generate BOM PDF</button>
                    <button type="button" id="generateA8">Generate A8 Details</button>
                    <button type="button" id="generateB2">Generate B2 Report</button>
                    <button type="button" id="generateA17">Generate A17 Report</button>
                    <!-- New button for Custom Report -->
                    <button type="button" id="generateCustomReport">Generate Custom Report</button>
                </div>
            </form>
        </div>
    </div>
    <script>
        // Existing JavaScript code remains unchanged
        document.getElementById('construction_id').addEventListener('change', async function() {
            const constructionId = this.value;
            const blockSelect = document.getElementById('block_name');
            blockSelect.innerHTML = '<option value="">Select Block</option>';
    
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
    
        ['generateBom', 'generateA8', 'generateB2', 'generateA17'].forEach(id => {
            document.getElementById(id).addEventListener('click', function() {
                const constructionId = document.getElementById('construction_id').value;
                const blockName = document.getElementById('block_name').value;
                if (constructionId && blockName) {
                    const reportType = id.replace('generate', '').toLowerCase();
                    window.location.href = \`/\${reportType}-details?construction_id=\${constructionId}&block_name=\${blockName}\`;
                } else {
                    alert('Please select both construction and block');
                }
            });
        });
    
        document.getElementById('generateCustomReport').addEventListener('click', function() {
            var constructionId = document.getElementById('construction_id').value;
            var blockName = document.getElementById('block_name').value;
            var customRequest = document.getElementById('custom_report_request').value.trim();
            
            if (constructionId && blockName && customRequest) {
                var queryString = 'construction_id=' + encodeURIComponent(constructionId) +
                                '&block_name=' + encodeURIComponent(blockName) +
                                '&custom_request=' + encodeURIComponent(customRequest);

                fetch('/custom-report?' + queryString, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/csv'  // Expecting CSV response
                    }
                })
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('HTTP error! status: ' + response.status);
                    }
                    return response.text();
                })
                .then(function(csvString) {
                    // Create a Blob from the CSV string
                    var blob = new Blob([csvString], { type: 'text/csv' });
                    var url = URL.createObjectURL(blob);

                    // Create a temporary <a> element to trigger the download
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'custom_report.csv';  // Name of the file to download
                    document.body.appendChild(a);
                    a.click();

                    // Clean up
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                })
                .catch(function(error) {
                    console.error('Error generating custom report:', error);
                    alert('Error generating custom report: ' + error.message);
                });
            } else {
                alert('Please select construction, block, and enter a custom report request');
            }
        });




    </script>
</body>
</html>
    `;
}

const fs = require('fs');
const path = require('path');

function componentsTable(selectedAttributes, rows, csvString) {
    // Convert rows to CSV string if not provided
    if (!csvString && Array.isArray(rows)) {
        csvString = rows.map(row => Object.values(row).join(',')).join('\n');
    }

    // Generate a unique filename
    const filename = `data_${Date.now()}.csv`;
    const downloadsDir = path.join(__dirname, 'downloads');
    const filepath = path.join(downloadsDir, filename);

    // Ensure the downloads directory exists
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir);
    }

    // Write the CSV content to a file
    fs.writeFileSync(filepath, csvString);

    console.log(`CSV file has been saved as ${filename}`);

    // Return an HTML string with a download button and instructions
    return `
        <div>
            <p>Your CSV file is ready for download.</p>
            <button onclick="window.location.href='/download/${filename}'">Download CSV</button>
            <p>If the download doesn't start automatically, click the button above.</p>
        </div>
    `;
}




module.exports = {
    mainForm,
    componentsTable
};
