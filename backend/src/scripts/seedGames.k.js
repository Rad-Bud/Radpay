
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

const API_URL = 'http://localhost:3000/api';

async function seed() {
    console.log('Seeding games via API...');

    for (const game of games) {
        try {
            console.log(`Creating game: ${game.name}`);
            const gameRes = await fetch(`${API_URL}/games`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: game.name,
                    description: game.description
                })
            });

            if (!gameRes.ok) {
                console.error(`Failed to create game ${game.name}: ${gameRes.statusText}`);
                continue;
            }

            const gameData = await gameRes.json();
            const gameId = gameData.id;
            console.log(`Game created with ID: ${gameId}`);

            // Create Packages
            for (const pkg of game.packages) {
                console.log(`  Adding package: ${pkg.name}`);
                const pkgRes = await fetch(`${API_URL}/games/${gameId}/packages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pkg)
                });

                if (!pkgRes.ok) {
                    console.error(`  Failed to add package ${pkg.name}`);
                }
            }
        } catch (error) {
            console.error(`Error processing ${game.name}:`, error);
        }
    }
    console.log('Done!');
}

seed();
