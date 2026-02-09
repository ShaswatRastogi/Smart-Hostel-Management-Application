// You need to download your Firebase Service Account Key
// Go to Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
// Save the file as 'serviceAccountKey.json' in src/config/
// And import it here like this:

// import serviceAccountKey from './serviceAccountKey.json';
// export const serviceAccount = serviceAccountKey;

// Use fs to read the file to be absolutely sure
import fs from 'fs';
import path from 'path';

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
console.log('Reading Service Account Key from:', keyPath);

let serviceAccountKey;
try {
    const rawData = fs.readFileSync(keyPath, 'utf8');
    serviceAccountKey = JSON.parse(rawData);
} catch (error) {
    console.error('Error reading serviceAccountKey.json:', error);
    process.exit(1);
}

export const serviceAccount = serviceAccountKey;

