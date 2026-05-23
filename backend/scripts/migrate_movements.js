require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await pool.query(`DROP TABLE IF EXISTS student_movements CASCADE;`);
    await pool.query(`
      CREATE TABLE student_movements (
          id SERIAL PRIMARY KEY,
          student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
          out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          in_time TIMESTAMP,
          duration_minutes INTEGER,
          recorded_by_out INTEGER REFERENCES users(id),
          recorded_by_in INTEGER REFERENCES users(id)
      );
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
