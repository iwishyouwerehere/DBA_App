const parse = require('csv-parse/sync');

module.exports.report = function(csvString) {
    // Parse the CSV string into JSON
    const records = parse(csvString, {
        columns: true,           // Use the first row as headers
        skip_empty_lines: true    // Skip empty lines
    });

    return records;  // Return parsed data as JSON
};
