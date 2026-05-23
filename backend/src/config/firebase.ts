import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../../../smart-hostel-service-account.json');
let isInitialized = false;

try {
    let serviceAccount: any = null;
    
    // 1. Try reading from environment variable first (Best for Render/Cloud)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } 
    // 2. Fall back to local file if it exists
    else if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }

    if (serviceAccount) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'smart-hostel-27f16.firebasestorage.app'
            });
        }
        isInitialized = true;
        console.log('✅ Firebase Admin SDK initialized globally.');
    } else {
        console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON env var or smart-hostel-service-account.json file not found — Firebase services disabled.');
    }
} catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err);
}

export const firebaseAdmin = admin;
export const firebaseInitialized = isInitialized;
export const getStorageBucket = () => isInitialized ? admin.storage().bucket() : null;
