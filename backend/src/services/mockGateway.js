export class MockGateway {
    constructor() {
        this.sims = new Map();
        this.initializeSims();
    }
    initializeSims() {
        for (let i = 1; i <= 10; i++) {
            // Create generic IDs and phone numbers for simulation
            const id = `sim_${i}`;
            this.sims.set(i, {
                id,
                slotNumber: i,
                phoneNumber: `077000000${i - 1}`,
                operator: i <= 5 ? 'Asiacell' : 'Zain', // Split between operators
                status: 'active',
                balance: 100000, // Initial mock balance
                dailyUsageCount: 0,
                lastUsedAt: new Date()
            });
        }
    }
    getSim(slot) {
        return this.sims.get(slot);
    }
    getAllSims() {
        return Array.from(this.sims.values());
    }
    async sendUSSD(slot, ussdCode) {
        const sim = this.sims.get(slot);
        if (!sim) {
            throw new Error(`SIM slot ${slot} not found`);
        }
        if (sim.status !== 'active') {
            return { success: false, message: 'SIM is busy or inactive' };
        }
        // Simulate network delay
        console.log(`[Gateway] Sending USSD '${ussdCode}' on Slot ${slot}...`);
        sim.status = 'busy';
        return new Promise((resolve) => {
            setTimeout(() => {
                sim.status = 'active';
                sim.dailyUsageCount++;
                sim.lastUsedAt = new Date();

                let responseMessage;
                // Check if it's a balance enquiry
                if (ussdCode.includes('*222#') || ussdCode.includes('*710#') || ussdCode.includes('*200#')) {
                    // AUTO-INCREMENT MOCK BALANCE
                    // To simulate a top-up arriving, we'll just add 5000 DA every time we check in Mock mode.
                    // This allows the user to test the "Verified" flow.
                    sim.balance = (sim.balance || 0) + 5000;
                    responseMessage = `Le solde est de ${sim.balance}.00 DA. Validite 30/12/2030`;
                } else {
                    responseMessage = `Transfer Successful! New balance is ${sim.balance - 1000} DA. Trx ID: 12345`;
                }

                console.log(`[Gateway] Response from Slot ${slot}: ${responseMessage}`);
                resolve({ success: true, message: responseMessage });
            }, 1000);
        });
    }
}
export const gateway = new MockGateway();
