
import { EventEmitter } from 'events';

// ANSI Colors for realistic terminal output
const COLORS = {
    RESET: "\x1b[0m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    CYAN: "\x1b[36m",
    RED: "\x1b[31m",
    GRAY: "\x1b[90m",
    MAGENTA: "\x1b[35m"
};

const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 23);

const log = (component: string, message: string, color: string = COLORS.RESET) => {
    console.log(`${COLORS.GRAY}[${timestamp()}]${COLORS.RESET} ${color}[${component}]${COLORS.RESET} ${message}`);
};

class SimulatedModem extends EventEmitter {
    public port: string;
    constructor(port: string) {
        super();
        this.port = port;
    }

    send(command: string) {
        log('GSM-PORT', `Sending Command: ${command} to ${this.port}`, COLORS.MAGENTA);
        setTimeout(() => {
            if (command.startsWith("AT+CUSD")) {
                log('GSM-PORT', `Response: OK`, COLORS.MAGENTA);
                setTimeout(() => {
                    this.emit('ussd_response', "Crédit: 1500.00 DA. Validité: 20/12/2026");
                }, 1500); // Network latency
            } else {
                log('GSM-PORT', `Response: OK`, COLORS.MAGENTA);
            }
        }, 300); // Serial port latency
    }
}

class TransactionQueue {
    process(job: any) {
        log('QUEUE', `Processing Job #${job.id} | Type: ${job.type} | Target: ${job.phone}`, COLORS.YELLOW);
        return new Promise((resolve) => setTimeout(resolve, 500)); // Queue processing time
    }
}

async function runSimulation() {
    console.log(`${COLORS.CYAN}=== STARTING AUTOMATED RECHARGE SIMULATION ===${COLORS.RESET}\n`);

    const queue = new TransactionQueue();
    const modem = new SimulatedModem("/dev/ttyUSB0");
    const amount = 500;
    const phone = "0661123456";

    // 1. Backend receives request
    log('BACKEND', `Received Recharge Request for ${phone}, Amount: ${amount} DZD`, COLORS.BLUE);
    await new Promise(r => setTimeout(r, 200));

    // 2. Validation
    log('BACKEND', `Validating user balance and permissions...`, COLORS.BLUE);
    await new Promise(r => setTimeout(r, 400));
    log('BACKEND', `Validation Successful. Enqueuing transaction.`, COLORS.GREEN);

    // 3. Queueing
    log('QUEUE', `Job #84922 added to Priority Queue (High)`, COLORS.YELLOW);
    await new Promise(r => setTimeout(r, 800));

    // 4. Processing
    await queue.process({ id: 84922, type: 'RECHARGE', phone });

    // 5. GSM Operation
    log('WORKER', `Allocating GSM Port for carrier 'Mobilis'`, COLORS.CYAN);
    await new Promise(r => setTimeout(r, 300));

    log('WORKER', `Locking Port ${modem.port}...`, COLORS.CYAN);
    modem.send(`AT+CUSD=1,"*600*${amount}*${phone}*0000#",15`);

    // Listen for response
    await new Promise(resolve => {
        modem.on('ussd_response', (msg) => {
            log('GSM-PORT', `+CUSD: 0, "${msg}", 15`, COLORS.MAGENTA);
            resolve(null);
        });
    });

    // 6. Finalization
    log('WORKER', `USSD Response Parsed: SUCCESS`, COLORS.GREEN);
    log('BACKEND', `Transaction #84922 Completed. Status: SUCCESS`, COLORS.BLUE);
    log('BACKEND', `User Wallet Updated. New Balance Logged.`, COLORS.BLUE);

    console.log(`\n${COLORS.CYAN}=== SIMULATION COMPLETE ===${COLORS.RESET}`);
}

runSimulation();
