import { query } from '../config/db';

const createHostelInfoTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS hostel_info (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) DEFAULT 'Smart Hostel',
                description TEXT DEFAULT 'Welcome to Smart Hostel, a premium living space designed for comfort, community, and convenience.',
                image_url TEXT,
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50),
                address TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default row if not exists
        await query(`
            INSERT INTO hostel_info (id, name, description, image_url)
            SELECT 1, 'Smart Hostel', 'Welcome to Smart Hostel, a premium living space designed for comfort, community, and convenience.', 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            WHERE NOT EXISTS (SELECT 1 FROM hostel_info WHERE id = 1);
        `);

        console.log('✅ Hostel Info table created and initialized');
    } catch (error) {
        console.error('❌ Error creating hostel_info table:', error);
    } finally {
        process.exit();
    }
};

createHostelInfoTable();
