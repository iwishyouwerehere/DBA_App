const { Pool } = require('pg');

const connectionString = "postgres://doadmin:AVNS_hslY1VjPHwFma3YI8yV@db-postgresql-lon1-98091-do-user-13881639-0.b.db.ondigitalocean.com:25060/defaultdb?sslmode=require";

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = { pool };