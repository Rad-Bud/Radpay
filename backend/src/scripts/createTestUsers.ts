import { auth } from '../config/firebase.js';
import type { UserRole } from '../models/types.js';

const createTestUser = async (email: string, password: string, role: UserRole, displayName: string) => {
    try {
        // 1. Check if user exists
        try {
            const existingUser = await auth.getUserByEmail(email);
            console.log(`User ${email} already exists. Updating role...`);
            await auth.setCustomUserClaims(existingUser.uid, { role });
            console.log(`Updated role for ${email} to ${role}`);
            return;
        } catch (e) {
            // User doesn't exist, proceed to create
        }

        // 2. Create user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName,
        });

        // 3. Set Custom Claims (Role)
        await auth.setCustomUserClaims(userRecord.uid, { role });

        console.log(`Created user: ${email} | Role: ${role} | Password: ${password}`);
    } catch (error) {
        console.error(`Error creating ${email}:`, error);
    }
};

const main = async () => {
    console.log('Creating Test Users...');

    await createTestUser('admin@radpay.com', 'admin123', 'super_admin', 'Super Admin');
    await createTestUser('super@radpay.com', 'super123', 'super_wholesaler', 'Super Wholesaler');
    await createTestUser('agent@radpay.com', 'agent123', 'wholesaler', 'Wholesaler Agent');
    await createTestUser('shop@radpay.com', 'shop123', 'retailer', 'Retail Shop');

    console.log('Done!');
    process.exit(0);
};

main();
