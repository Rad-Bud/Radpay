
import { db } from '../../dist/config/firebase.js';

const games = [
    {
        name: 'Free Fire',
        description: 'شحن جواهر فري فاير (ID)',
        packages: [
            { name: '100 + 10 Gems', price: 250, costPrice: 200 },
            { name: '210 + 21 Gems', price: 500, costPrice: 420 },
            { name: '530 + 53 Gems', price: 1250, costPrice: 1050 },
            { name: '1080 + 108 Gems', price: 2500, costPrice: 2100 },
        ]
    },
    {
        name: 'PUBG Mobile',
        description: 'شحن شدات ببجي موبايل (ID)',
        packages: [
            { name: '60 UC', price: 150, costPrice: 130 },
            { name: '325 UC', price: 750, costPrice: 650 },
            { name: '660 UC', price: 1500, costPrice: 1300 },
            { name: '1800 UC', price: 3900, costPrice: 3500 },
        ]
    }
];

async function seed() {
    console.log('Seeding games directly to Firestore (via dist)...');

    for (const game of games) {
        try {
            console.log(`Creating game: ${game.name}`);
            const gameData = {
                name: game.name,
                description: game.description,
                createdAt: new Date().toISOString()
            };

            const gameRef = await db.collection('games').add(gameData);
            console.log(`Game created with ID: ${gameRef.id}`);

            // Create Packages
            for (const pkg of game.packages) {
                console.log(`  Adding package: ${pkg.name}`);
                const pkgData = {
                    ...pkg,
                    active: true,
                    createdAt: new Date().toISOString()
                };
                await gameRef.collection('packages').add(pkgData);
            }
        } catch (error) {
            console.error(`Error processing ${game.name}:`, error);
        }
    }
    console.log('Done!');
    process.exit(0);
}

seed();
