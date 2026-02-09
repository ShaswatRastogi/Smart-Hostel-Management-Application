import * as fs from 'fs';
import pool from './src/config/db';

async function showPending() {
    try {
        const result = await pool.query(`
      SELECT u.full_name, s.roll_no, s.dues 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      WHERE (s.dues)::numeric > 0 
      ORDER BY s.dues DESC;
    `);

        let output = '--- PENDING PAYMENTS LIST ---\n';
        if (result.rows.length === 0) {
            output += 'STATUS: No pending payments found.\n';
        } else {
            result.rows.forEach(row => {
                output += `- STUDENT: ${row.full_name} | ROLL: ${row.roll_no} | OWE: ₹${parseFloat(row.dues).toLocaleString()}\n`;
            });
        }
        fs.writeFileSync('pending_results.txt', output, 'utf8');
        console.log('Results written to pending_results.txt');
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        await pool.end();
    }
}

showPending();
