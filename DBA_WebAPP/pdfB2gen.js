const htmlPdf = require('html-pdf');

function generateB2Pdf(data, res) {
    // Group and summarize data by type and material
    const groupedData = data.reduce((acc, item) => {
        const type = item.Type;
        const material = item.Material;
        let mainCategory = 'Stiffeners';
        let subCategory = 'Others';
        
        if (type.includes('THK')) {
            mainCategory = 'Part';
            subCategory = 'List of parts';
        } else {
            const firstChar = type.charAt(0);
            if (['F', 'H', 'T', 'L'].includes(firstChar)) {
                subCategory = firstChar === 'F' ? 'FB' : firstChar === 'H' ? 'HP' : firstChar;
            }
        }
        if (!acc[mainCategory]) {
            acc[mainCategory] = {};
        }
        if (!acc[mainCategory][subCategory]) {
            acc[mainCategory][subCategory] = {};
        }
        if (!acc[mainCategory][subCategory][type]) {
            acc[mainCategory][subCategory][type] = {};
        }
        if (!acc[mainCategory][subCategory][type][material]) {
            acc[mainCategory][subCategory][type][material] = { 
                Type: type, 
                Material: material, 
                TotalLength: 0, 
                TotalWeight: 0 
            };
        }
        
        const length = parseFloat(item["Total Length (mm)"]);
        acc[mainCategory][subCategory][type][material].TotalLength += isNaN(length) ? 0 : length;
        acc[mainCategory][subCategory][type][material].TotalWeight += parseFloat(item.Weight || 0);
        return acc;
    }, {});
    // Process and sort data
    const processedData = Object.entries(groupedData).flatMap(([mainCategory, subCategories]) => 
        Object.entries(subCategories).flatMap(([subCategory, types]) => 
            Object.entries(types).flatMap(([type, materials]) =>
                Object.values(materials).map(group => ({
                    ...group,
                    TotalLength: isNaN(group.TotalLength) || group.TotalLength === 0 ? "NA" : Math.round(group.TotalLength),
                    TotalWeight: parseFloat(group.TotalWeight).toFixed(1),
                    MainCategory: mainCategory,
                    SubCategory: subCategory
                }))
            )
        )
    );
    // Sort data
    const mainCategoryOrder = ['Part', 'Stiffeners'];
    const subCategoryOrder = ['List of parts', 'FB', 'HP', 'T', 'L', 'Others'];
    processedData.sort((a, b) => {
        if (a.MainCategory !== b.MainCategory) {
            return mainCategoryOrder.indexOf(a.MainCategory) - mainCategoryOrder.indexOf(b.MainCategory);
        }
        if (a.SubCategory !== b.SubCategory) {
            return subCategoryOrder.indexOf(a.SubCategory) - subCategoryOrder.indexOf(b.SubCategory);
        }
        if (a.Type !== b.Type) {
            return a.Type.localeCompare(b.Type);
        }
        return a.Material.localeCompare(b.Material);
    });
    // Generate table rows
    const tableRows = processedData.map((item, index, array) => {
        let rowHtml = '';
        if (index === 0 || item.MainCategory !== array[index - 1].MainCategory) {
            rowHtml += `
                <tr class="main-category">
                    <td colspan="4">${item.MainCategory}</td>
                </tr>
            `;
        }
        if (index === 0 || item.SubCategory !== array[index - 1].SubCategory || item.MainCategory !== array[index - 1].MainCategory) {
            rowHtml += `
                <tr class="sub-category">
                    <td colspan="4">${item.SubCategory}</td>
                </tr>
            `;
        }
        rowHtml += `
            <tr class="item-row">
                <td>${item.Type}</td>
                <td>${item.Material}</td>
                <td>${item.TotalLength}</td>
                <td>${item.TotalWeight}</td>
            </tr>
        `;
        return rowHtml;
    }).join('');
    const totalWeight = processedData.reduce((sum, item) => sum + parseFloat(item.TotalWeight), 0).toFixed(1);
    const totalLength = processedData.reduce((sum, item) => {
        const length = item.TotalLength === "NA" ? 0 : parseFloat(item.TotalLength);
        return sum + length;
    }, 0);
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const computerName = "WORKSTATION-001";
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ship Design Group - Requirements :  Lengths and Weights</title>
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
                .page-break {
                    page-break-before: always;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    page-break-inside: avoid; /* Ensure table does not break within a page */
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
                    padding: 8px 36px;
                    text-align: left;
                    border-bottom: 1px solid #E5E7EB;
                    word-wrap: break-word;
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
                .footer {
                    text-align: center;
                    color: var(--light-text);
                    font-size: 12px;
                    margin-top: 40px;
                }
                .item-row {
                    page-break-inside: avoid; /* Ensure rows do not break within a page */
                }
                .main-category {
                    background-color: #bbb;
                    font-weight: bold;
                    font-size: 16px;
                    page-break-inside: avoid; /* Ensure main category rows do not break within a page */
                }
                .sub-category {
                    background-color: #ddd;
                    font-weight: bold;
                    page-break-inside: avoid; /* Ensure sub-category rows do not break within a page */
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
                    <h1>Lengths and Wt</h1>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://visualhull.eu/ViewCapture_Transparent.png" alt="VisualHull Logo" style="border-radius: 8px; width: 570px; height: auto;">
                    </div>
                    <div class="page-break"></div>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Material</th>
                                    <th>Total Length (mm)</th>
                                    <th>Weight (Kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                    <div class="totals">
                        <div class="total-item">Total Weight: ${totalWeight} Kg</div>
                        <div class="total-item">Total Length: ${totalLength} mm</div>
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Ship Design Group. All rights reserved.
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
        res.setHeader('Content-Disposition', 'attachment; filename=B2_Lengths_and_Wt.pdf');
        stream.pipe(res);
    });
}

module.exports = {
    generateB2Pdf
};