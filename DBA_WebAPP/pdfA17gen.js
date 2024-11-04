function generateA17Pdf(data, res) {
    // Ensure data is an array
    if (!Array.isArray(data)) {
        console.error('Invalid data format: expected an array');
        return res.status(400).send('Invalid data format');
    }
    console.log(data)
    // Group and summarize data by assembly, subassembly, type, material, COG, and weight
    const groupedData = data.reduce((acc, item) => {
        const assembly = item.Assembly ?? 'MISC';
        const subAssembly = (typeof item.Subassembly === 'string' && item.Subassembly.length > 2) ? item.Subassembly : 'G01';

        console.log(subAssembly)
        if (!acc[assembly]) {
            acc[assembly] = {};
        }
        if (!acc[assembly][subAssembly]) {
            acc[assembly][subAssembly] = {
                totalWeight: 0,
                totalCOGX: 0,
                totalCOGY: 0,
                totalCOGZ: 0,
                items: []
            };
        }
        const weight = parseFloat(item.Weight) || 0;
        const cogx = parseFloat(item.COGX) || 0;
        const cogy = parseFloat(item.COGY) || 0;
        const cogz = parseFloat(item.COGZ) || 0;
        // Add the item's weight and weighted COG values
        acc[assembly][subAssembly].totalWeight += weight;
        acc[assembly][subAssembly].totalCOGX += cogx * weight;
        acc[assembly][subAssembly].totalCOGY += cogy * weight;
        acc[assembly][subAssembly].totalCOGZ += cogz * weight;
        // Push the item itself for detailed rows
        acc[assembly][subAssembly].items.push({
            Weight: weight.toFixed(1),
            COGX: cogx.toFixed(2),
            COGY: cogy.toFixed(2),
            COGZ: cogz.toFixed(2),
        });
        return acc;
    }, {});

    // Process and prepare HTML content for each assembly and subassembly
    let processedData = '';
    let totalWeight = 0;
    let totalCOGX = 0;
    let totalCOGY = 0;
    let totalCOGZ = 0;

    Object.keys(groupedData).sort().forEach(assembly => {
        processedData += `
            <tr class="main-category">
                <td colspan="6">Assembly: ${assembly}</td>
            </tr>
        `;

        let assemblyWeight = 0;
        let assemblyCOGX = 0;
        let assemblyCOGY = 0;
        let assemblyCOGZ = 0;

        Object.keys(groupedData[assembly]).forEach(subAssembly => {
            const subAssemblyData = groupedData[assembly][subAssembly];
            const subAssemblyWeight = subAssemblyData.totalWeight;
            const weightedCOGX = (subAssemblyWeight !== 0) ? (subAssemblyData.totalCOGX / subAssemblyWeight).toFixed(2) : '0';
            const weightedCOGY = (subAssemblyWeight !== 0) ? (subAssemblyData.totalCOGY / subAssemblyWeight).toFixed(2) : '0';
            const weightedCOGZ = (subAssemblyWeight !== 0) ? (subAssemblyData.totalCOGZ / subAssemblyWeight).toFixed(2) : '0';

            // Sort items by Type, with null check
            if (Array.isArray(subAssemblyData.items)) {
                subAssemblyData.items.sort((a, b) => {
                    if (a.Type && b.Type) {
                        return a.Type.localeCompare(b.Type);
                    }
                    return 0;
                });
            }

            processedData += `
                <tr class="sub-category">
                    <td colspan="6">SubAssembly: ${subAssembly}</td>
                </tr>
            `;

            // Generate detailed rows for each item in the subassembly
            if (Array.isArray(subAssemblyData.items)) {
                subAssemblyData.items.forEach(item => {
                    processedData += `
                        <tr class="item-row">
                            <td>${item.Weight} kg</td>
                            <td>${item.COGX}</td>
                            <td>${item.COGY}</td>
                            <td>${item.COGZ}</td>
                        </tr>
                    `;
                });
            }


            assemblyWeight += subAssemblyWeight;
            assemblyCOGX += subAssemblyData.totalCOGX;
            assemblyCOGY += subAssemblyData.totalCOGY;
            assemblyCOGZ += subAssemblyData.totalCOGZ;
        });

        const assemblyWeightedCOGX = (assemblyWeight !== 0) ? (assemblyCOGX / assemblyWeight).toFixed(2) : '0.00';
        const assemblyWeightedCOGY = (assemblyWeight !== 0) ? (assemblyCOGY / assemblyWeight).toFixed(2) : '0.00';
        const assemblyWeightedCOGZ = (assemblyWeight !== 0) ? (assemblyCOGZ / assemblyWeight).toFixed(2) : '0.00';

        processedData += `
            <tr class="assembly-total-row">
                <td colspan="2">Assembly Total</td>
                <td>${assemblyWeight.toFixed(1)}</td>
                <td>${assemblyWeightedCOGX}</td>
                <td>${assemblyWeightedCOGY}</td>
                <td>${assemblyWeightedCOGZ}</td>
            </tr>
        `;

        totalWeight += assemblyWeight;
        totalCOGX += assemblyCOGX;
        totalCOGY += assemblyCOGY;
        totalCOGZ += assemblyCOGZ;
    });

    const totalWeightedCOGX = (totalWeight !== 0) ? (totalCOGX / totalWeight).toFixed(2) : '0.00';
    const totalWeightedCOGY = (totalWeight !== 0) ? (totalCOGY / totalWeight).toFixed(2) : '0.00';
    const totalWeightedCOGZ = (totalWeight !== 0) ? (totalCOGZ / totalWeight).toFixed(2) : '0.00';

    /*processedData += `
        <tr class="total-row">
            <td colspan="2">TOTAL</td>
            <td>${totalWeight.toFixed(1)}</td>
            <td>${totalWeightedCOGX}</td>
            <td>${totalWeightedCOGY}</td>
            <td>${totalWeightedCOGZ}</td>
        </tr>
    `;*/ 

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const computerName = "WORKSTATION-001";
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ship Design Group - A17 Center of Gravity</title>
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
                .total-row {
                    background-color: #f3f4f6;
                    font-weight: bold;
                }
                .assembly-total-row {
                    background-color: #e2e8f0;
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
                    <h1>A17 Center of Gravity</h1>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>

                                    <th>Weight (Kg)</th>
                                    <th>COG X</th>
                                    <th>COG Y</th>
                                    <th>COG Z</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${processedData}
                            </tbody>
                        </table>
                    </div>
                    <div class="footer">
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
        res.setHeader('Content-Disposition', 'attachment; filename=A17_Center_of_Gravity.pdf');
        stream.pipe(res);
    });
}

const htmlPdf = require('html-pdf');

module.exports = {
    generateA17Pdf
};