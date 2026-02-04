
import { db } from '../../dist/config/firebase.js';

const googlePlay = {
    name: 'Google Play',
    description: 'بطاقات جوجل بلاي (كود)',
    packages: [
        { name: '5 USD', price: 1000, costPrice: 900 },
        { name: '10 USD', price: 2000, costPrice: 1800 },
        { name: '25 USD', price: 5000, costPrice: 4500 },
        { name: '50 USD', price: 10000, costPrice: 9000 },
    ]
};

async function seed() {
    console.log('Seeding Google Play...');
    try {
        console.log(`Creating: ${googlePlay.name}`);
        const gameData = {
            name: googlePlay.name,
            description: googlePlay.description,
            createdAt: new Date().toISOString()
        };

        const gameRef = await db.collection('games').add(gameData);
        console.log(`Created with ID: ${gameRef.id}`);

        for (const pkg of googlePlay.packages) {
            console.log(`  Adding: ${pkg.name}`);
            const pkgData = {
                ...pkg,
                active: true,
                createdAt: new Date().toISOString()
            };
            await gameRef.collection('packages').add(pkgData);
        }
    } catch (error) {
        console.error(`Error:`, error);
    }
    console.log('Done!');
    process.exit(0);
}

seed();
