const htmlPdf = require('html-pdf');

function generateA8Pdf(data, res) {
    console.log(data)
    // Data processing logic
    const compressedData = data.reduce((acc, item) => {
        const netLength = Math.round(parseFloat(item["Net Length (mm)"] || 0));
        if (netLength === 0) return acc; // Skip items with a length of 0
        const key = item.IDN;
        if (acc[key]) {
            acc[key].QTY += 1;
            acc[key].Weight = (parseFloat(acc[key].Weight) + parseFloat(item.Weight || 0)).toFixed(1);
        } else {
            acc[key] = { 
                ...item, 
                QTY: 1,
                Weight: parseFloat(item.Weight || 0).toFixed(1),
                "Net Length (mm)": netLength,
                "Total Length (mm)": Math.round(parseFloat(item["Total Length (mm)"] || item["Net Length (mm)"] || 0))
            };
        }
        return acc;
    }, {});
    const processedData = Object.values(compressedData);
    processedData.sort((a, b) => a.IDN - b.IDN);

    // Group by type
    const groupedByType = processedData.reduce((acc, item) => {
        if (!acc[item.Type]) {
            acc[item.Type] = [];
        }
        acc[item.Type].push(item);
        return acc;
    }, {});


    // Generate table rows with recap
    let tableRows = '';
    for (const [type, items] of Object.entries(groupedByType)) {
        tableRows += `
            <tr>
                <td colspan="8" style="text-align: center; font-weight: bold; font-size: 18px; background-color: #e0e0e0; color: #333; padding: 10px 0; border: 1px solid #ccc;">
                    ${type.toUpperCase()}
                </td>
            </tr>
        `;
        const totalLength = items.reduce((sum, item) => sum + (parseFloat(item["Total Length (mm)"]) * item.QTY), 0);
        tableRows += items.map(row => `
            <tr>
                <td>${row.IDN}</td>
                <td>${row.Type}</td>
                <td>${row.Material}</td>
                <td>${row["Net Length (mm)"]}</td>
                <td>${row["Total Length (mm)"]}</td>
                <td>${row.END1}</td>
                <td>${row.END2}</td>
                <td>${row.QTY}</td>
            </tr>
        `).join('');
        tableRows += `
            <tr style="background-color: #f0f8ff; color: #000; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000;">
                <td colspan="8" style="text-align: right; font-weight: bold;">Total Length for ${type}: ${totalLength} mm</td>
            </tr>
        `;
    }

    const totalWeight = processedData.reduce((sum, item) => sum + parseFloat(item.Weight), 0).toFixed(1);
    const totalQuantity = processedData.reduce((sum, item) => sum + item.QTY, 0);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const computerName = "WORKSTATION-001";
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ship Design Group - A8 Components Report</title>
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
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                th, td {
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid #E5E7EB;
                    word-wrap: break-word;
                }
                th {
                    background: #1E3A8A;
                    color: white;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-size: 14px;
                    letter-spacing: 0.05em;
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
                    <h1>Stiffners List</h1>
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
                                    <th>Net Length (mm)</th>
                                    <th>Total Length (mm)</th>
                                    <th>END1</th>
                                    <th>END2</th>
                                    <th>Quantity</th>
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
                            <span>Total Weight: ${totalWeight} Kg</span>
                        </div>
                        <div class="total-item">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Total Quantity: ${totalQuantity}</span>
                        </div>
                    </div>
                    <div class="footer">
                                                
                        <img src="https://visualhull.eu/logo.jpg" alt="VisualHull Logo" style="border-radius: 8px; height: 350px; width: auto;">
                        <p>&copy; ${new Date().getFullYear()} Ship Design Group S.R.L. All rights reserved.</p>
                        <p>Powered by VisualHull.eu</p>
                    </div>
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
        res.setHeader('Content-Disposition', 'attachment; filename=A8_Components_Report.pdf');
        stream.pipe(res);
    });
}

module.exports = {
    generateA8Pdf
};