const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

async function run() {
  try {
    await client.connect();
    
    // Update expenses for Ratnagiri trip (ID 6) to have the Ratnagiri destination (ID 26)
    const res = await client.query(`
      UPDATE expenses
      SET destination_id = 26
      WHERE trip_id = 6 AND destination_id IS NULL;
    `);
    console.log(`Updated ${res.rowCount} expenses for Ratnagiri trip.`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

run();
