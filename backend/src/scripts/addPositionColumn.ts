import { query } from '../config/db';

const addPositionColumn = async () => {
    try {
        console.log('Adding position column to facilities table...');
        await query(`
            ALTER TABLE facilities 
            ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
        `);
        // Initialize position based on created_at if needed, or id
        // For now, default 0 is fine, they will conflict but reordering will fix it.
        // Or we can try to update them:
        // await query(`WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM facilities) UPDATE facilities SET position = numbered.rn FROM numbered WHERE facilities.id = numbered.id`);

        console.log('Position column added successfully.');
    } catch (error) {
        console.error('Error adding position column:', error);
    }
};

addPositionColumn();
