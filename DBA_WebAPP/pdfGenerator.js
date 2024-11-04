const htmlPdf = require('html-pdf');

function generateBomPdf(data, res) {
    // Data processing logic
    const compressedData = data.reduce((acc, item) => {
        const key = item.IDN;
        const side = item.COGY >= 0 ? 'SB' : 'PS';
        
        if (acc[key]) {
            acc[key].QTY += 1;
            acc[key].Weight = (parseFloat(acc[key].Weight) + parseFloat(item.Weight || 0)).toFixed(1);
            acc[key].Sides.add(side);
        } else {
            acc[key] = { 
                ...item, 
                QTY: 1,
                Weight: parseFloat(item.Weight || 0).toFixed(1),
                Sides: new Set([side])
            };
        }
        return acc;
    }, {});
    const processedData = Object.values(compressedData).map(item => ({
        ...item,
        Side: Array.from(item.Sides).join('/')
    }));
    processedData.sort((a, b) => a.IDN - b.IDN);
    const totalWeight = processedData.reduce((sum, item) => sum + parseFloat(item.Weight), 0).toFixed(1);
    const totalQuantity = processedData.reduce((sum, item) => sum + item.QTY, 0);

    // Group data by Assembly and Subassembly
    const groupedData = processedData.reduce((acc, item) => {
        const assembly = item.Assembly || 'Misc';
        const subAssembly = item.Subassembly || 'G01';
        
        if (!acc[assembly]) {
            acc[assembly] = {};
        }
        if (!acc[assembly][subAssembly]) {
            acc[assembly][subAssembly] = [];
        }
        acc[assembly][subAssembly].push(item);
        return acc;
    }, {});

    // Generate table rows with hierarchy
    let tableRows = '';
    Object.keys(groupedData).sort().forEach(assembly => {
        tableRows += `
            <tr class="main-category">
                <td colspan="8">Assembly: ${assembly}</td>
            </tr>
        `;
        
        Object.keys(groupedData[assembly]).sort().forEach(subAssembly => {
            tableRows += `
                <tr class="sub-category">
                    <td colspan="8">Subassembly: ${subAssembly}</td>
                </tr>
            `;
            
            groupedData[assembly][subAssembly].forEach(row => {
                tableRows += `
                    <tr>
                        <td>${row.IDN}</td>
                        <td>${row.Type}</td>
                        <td>${row.Material}</td>
                        <td>${row.Assembly}</td>
                        <td>${row.Location}</td>
                        <td>${row.Weight}</td>
                        <td>${row.Side}</td>
                        <td>${row.QTY}</td>
                    </tr>
                `;
            });
        });
    });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const computerName = "WORKSTATION-001";
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title style="color: rgb(0, 48, 73);">Ship Design Group - Bill of Materials</title>
            <link href="https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #1E3A8A;
                    --secondary: #3B82F6;
                    --accent: #F59E0B;
                    --background: #F3F4F6;
                    --text: #1F2937;
                    --light-text: #6B7280;
                }
                body {
                    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    line-height: 1.5;
                    color: var(--text);
                    margin: 0;
                    padding: 0;
                    background-color: var(--background);
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 24px;
                    margin-bottom: 24px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--primary);
                }
                .logo img {
                    display: block;
                    margin: 0 auto;
                    border-radius: 8px;
                }
                .document-info {
                    text-align: right;
                    color: var(--light-text);
                }
                h1 {
                    color: var(--primary);
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 16px;
                    text-align: center;
                }
                .page-break {
                    page-break-before: always;
                }
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }
                th, td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid #E5E7EB;
                }
                th {
                    background: #AEC6CF; /* Pastel blue */
                    color: white;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 16px; /* Increased font size */
                    letter-spacing: 0.05em;
                    position: sticky;
                    top: 0;
                }
                tr:nth-child(even) {
                    background-color: #F9FAFB;
                }
                .totals {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 24px;
                    font-weight: 600;
                }
                .total-item {
                    display: flex;
                    align-items: center;
                    background: var(--secondary);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                }
                .total-item svg {
                    margin-right: 8px;
                }
                .footer {
                    text-align: center;
                    color: var(--light-text);
                    font-size: 12px;
                    margin-top: 40px;
                }
                .main-category {
                    background-color: #bbb;
                    font-weight: bold;
                    font-size: 16px;
                }
                .sub-category {
                    background-color: #ddd;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="header">
                        <div class="logo">Ship Design Group</div>
                        <div class="document-info">
                            <div>Date: ${today}</div>
                            <div>Generated by: ${computerName}</div>
                        </div>

                    </div>
                    <h1>Bill of Materials (BOM)</h1>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://visualhull.eu/ViewCapture_Transparent.png" alt="VisualHull Logo" style="border-radius: 8px; width: 570px; height: auto;">
                    </div>
                    <div class="page-break"></div>
                    <div style="overflow-x: auto;">
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
                                    <th>QTY</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                    <div class="totals">
                        <div class="total-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Total Quantity: ${totalQuantity}
                        </div>
                        <div class="total-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M19 21H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Total Weight: ${totalWeight} Kg
                        </div>
                    </div>
                </div>
                <div class="footer">
                                            
                    <img src="https://visualhull.eu/logo.jpg" alt="VisualHull Logo" style="border-radius: 8px; height: 350px; width: auto;">
                    <p>&copy; ${new Date().getFullYear()} Ship Design Group S.R.L. All rights reserved.</p>
                    <p>Powered by VisualHull.eu</p>
                </div>
            </div>
        </body>
        </html>
    `;
    const options = {
        format: 'A4',
        orientation: 'landscape',
        border: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    };
    htmlPdf.create(htmlContent, options).toStream((err, stream) => {
        if (err) {
            console.error('Error generating PDF:', err.message);
            return res.status(500).send('Error generating PDF');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=ShipDesignGroup_BOM.pdf');
        stream.pipe(res);
    });
}

module.exports = {
    generateBomPdf
};