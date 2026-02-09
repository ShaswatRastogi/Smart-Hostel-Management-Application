import { pool } from '../config/db';

const testReorder = async () => {
    try {
        console.log('Fetching initial facilities...');
        const initialRes = await pool.query('SELECT id, position FROM facilities ORDER BY position ASC');
        console.log('Initial State:', initialRes.rows);

        const ids = initialRes.rows.map(r => r.id);
        if (ids.length < 2) {
            console.log('Not enough facilities to reorder.');
            return;
        }

        // Reverse the order
        const newOrder = [...ids].reverse();
        console.log('Reordering to:', newOrder);

        for (let i = 0; i < newOrder.length; i++) {
            await pool.query('UPDATE facilities SET position = $1 WHERE id = $2', [i + 1, newOrder[i]]);
        }

        console.log('Reorder update complete.');

        const finalRes = await pool.query('SELECT id, position FROM facilities ORDER BY position ASC');
        console.log('Final State:', finalRes.rows);

    } catch (error) {
        console.error('Error during test reorder:', error);
    } finally {
        pool.end();
    }
};

testReorder();
