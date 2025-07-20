const Database = require("better-sqlite3");
const db = new Database("bank.db");

// Initialize schema
const fs = require("fs");
const schema = fs.readFileSync("schema.sql", "utf8");
db.exec(schema);

module.exports = db;
