import { auth } from '../config/firebase.js';
const setRole = async (uid, role) => {
    try {
        await auth.setCustomUserClaims(uid, { role });
        console.log(`Successfully set role '${role}' for user ${uid}`);
    }
    catch (error) {
        console.error('Error setting custom claims:', error);
    }
};
// Usage: ts-node src/scripts/setRole.ts <uid> <role>
const args = process.argv.slice(2);
if (args.length === 2 && args[0] && args[1]) {
    setRole(args[0], args[1]);
}
else {
    console.log('Usage: ts-node src/scripts/setRole.ts <uid> <role>');
}
