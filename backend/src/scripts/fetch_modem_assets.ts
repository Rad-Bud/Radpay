
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const MODEM_IP = "192.168.0.1";
const OUT_DIR = path.join(process.cwd(), 'modem_dump');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const FILES_TO_FETCH = [
    'js/main.js',
    'js/ussd.js',
    'js/adm/ussd.js',
    'config/global_config.js',
    'js/config.js',
    'js/service.js'
];

async function fetchAsset(file: string) {
    const url = `http://${MODEM_IP}/${file}`;
    try {
        console.log(`Fetching ${url}...`);
        const res = await axios.get(url, { timeout: 3000 });
        const cleanName = file.replace(/\//g, '_');
        fs.writeFileSync(path.join(OUT_DIR, cleanName), res.data);
        console.log(`Saved ${cleanName}`);
    } catch (e: any) {
        console.log(`Failed to fetch ${file}: ${e.message}`);
    }
}

async function run() {
    console.log("Starting Modem Asset Dump...");
    for (const file of FILES_TO_FETCH) {
        await fetchAsset(file);
    }
    console.log("Dump complete. Check 'modem_dump' folder.");
}

run();
