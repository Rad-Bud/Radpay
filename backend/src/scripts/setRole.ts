import { auth } from '../config/firebase.js';
import type { UserRole } from '../models/types.js';

const setRole = async (identifier: string, role: UserRole) => {
    try {
        let uid = identifier;

        // If identifier looks like an email, fetch the UID
        if (identifier.includes('@')) {
            console.log(`Looking up user by email: ${identifier}...`);
            try {
                const user = await auth.getUserByEmail(identifier);
                uid = user.uid;
                console.log(`Found user ${identifier} with UID: ${uid}`);
            } catch (error) {
                console.error(`Error: User with email ${identifier} not found.`);
                return;
            }
        }

        await auth.setCustomUserClaims(uid, { role });
        console.log(`✅ Successfully set role '${role}' for user ${identifier} (${uid})`);

    } catch (error) {
        console.error('❌ Error setting custom claims:', error);
    }
};

// Usage: npm run set-role <email_or_uid> <role>
const args = process.argv.slice(2);
if (args.length === 2 && args[0] && args[1]) {
    setRole(args[0], args[1] as UserRole);
} else {
    console.log('Usage: npm run set-role <email_or_uid> <role>');
    console.log('Example: npm run set-role admin@radpay.com super_admin');
}
