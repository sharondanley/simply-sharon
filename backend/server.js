require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());
const port = Number(process.env.PORT || 8081);

const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    connectTimeout: 10000,
    // Enable SSL for hosted DB providers when needed.
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
})

app.get("/blog_articles", (req, res) => {
    const sql = "SELECT * FROM blog_articles";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    })
})

app.get("/health", (req, res) => {
    res.json({ ok: true });
})

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
})