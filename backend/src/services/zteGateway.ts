import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'debug_ussd.log');

const logToFile = (message: string) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
};

// Common ZTE Modem Endpoints
// Note: These may vary by model (MF831, MF79, etc.)
const ENDPOINTS = {
    CMD_PROCESS: '/goform/goform_set_cmd_process',
    GET_CMD_PROCESS: '/goform/goform_get_cmd_process'
};

export class ZteGateway {

    /**
     * Sends a USSD code using the modem's HTTP API.
     * @param ip The IP address of the modem (e.g., 192.168.0.1)
     * @param code The USSD code (e.g., *222#)
     */
    public async sendUSSD(ip: string, code: string): Promise<{ success: boolean; message: string }> {
        const baseUrl = `http://${ip}`;

        try {
            // 0. Cancel any existing session (best practice from modem source)
            await this.cancelUSSD(baseUrl);

            // 1. Send USSD Request
            const params = new URLSearchParams();
            params.append('isTest', 'false');
            params.append('goformId', 'USSD_PROCESS');
            params.append('USSD_operator', 'ussd_send'); // Found via analysis of js_service.js logic
            params.append('USSD_send_number', code);
            params.append('notCallback', 'true');

            // Log the request for debugging
            logToFile(`[ZTE] Sending USSD '${code}' (step 1)...`);

            await axios.post(`${baseUrl}${ENDPOINTS.CMD_PROCESS}`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': `${baseUrl}/index.html`
                },
                timeout: 5000
            });

            // 2. Poll for Status (ussd_write_flag)
            for (let i = 0; i < 20; i++) { // Increase attempts, USSD can take 10-15s
                await new Promise(r => setTimeout(r, 1000));

                const flagResponse = await axios.get(`${baseUrl}${ENDPOINTS.GET_CMD_PROCESS}`, {
                    params: { cmd: 'ussd_write_flag', multi_data: 1 },
                    headers: { 'Referer': `${baseUrl}/index.html` }
                });

                const flagData = flagResponse.data;
                const flag = flagData.ussd_write_flag;

                console.log(`[ZTE] Polling flag... Result: ${flag}`);
                logToFile(`[ZTE] Polling flag... Result: ${flag}`);

                if (flag === '16') {
                    // Success! Fetch data
                    return await this.fetchUSSDData(baseUrl);
                } else if (flag === '4' || flag === 'unknown') {
                    return { success: false, message: 'USSD Timeout' };
                } else if (flag === '1') {
                    return { success: false, message: 'No Service' };
                }
                // Flags 10 (Retry), 15 (Waiting) -> Continue polling
            }

            return { success: false, message: 'Timeout: Modem stuck in processing' };

        } catch (error: any) {
            console.error('[ZTE] Error:', error.message);
            logToFile(`[ZTE] Error: ${error.message}`);
            return {
                success: false,
                message: `Modem Connection Error: ${error.message}`
            };
        }
    }

    private decodeUSSD(content: string): string {
        // Simple heuristic: if it looks like a long hex string, try to decode it
        // Check for UCS2 hex (e.g. "00310032") -> often used by ZTE
        if (/^([0-9A-Fa-f]{4})+$/.test(content)) {
            let str = '';
            for (let i = 0; i < content.length; i += 4) {
                str += String.fromCharCode(parseInt(content.substr(i, 4), 16));
            }
            return str;
        }
        // Check for 8-bit hex (e.g. "3132")
        if (/^([0-9A-Fa-f]{2})+$/.test(content) && content.length > 4) {
            let str = '';
            for (let i = 0; i < content.length; i += 2) {
                str += String.fromCharCode(parseInt(content.substr(i, 2), 16));
            }
            return str;
        }
        return content;
    }

    private async fetchUSSDData(baseUrl: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axios.get(`${baseUrl}${ENDPOINTS.GET_CMD_PROCESS}`, {
                params: { cmd: 'ussd_data_info' }, // No multi_data needed usually for this specific call logic in js_service
                headers: { 'Referer': `${baseUrl}/index.html` }
            });

            const data = response.data;
            logToFile(`[ZTE] Data Info: ${JSON.stringify(data)}`);

            // js_service.js: content.data = data.ussd_data
            if (data && (data.ussd_data || data.ussd_data_info)) {
                const rawContent = data.ussd_data || data.ussd_data_info || "";
                const decoded = this.decodeUSSD(rawContent);
                return { success: true, message: decoded };
            }

            return { success: true, message: "Empty Response" };
        } catch (e: any) {
            return { success: false, message: "Failed to fetch content" };
        }
    }

    private async cancelUSSD(baseUrl: string) {
        try {
            // Adapted from USSDReplyCancel in js_service.js
            const params = new URLSearchParams();
            params.append('isTest', 'false');
            params.append('goformId', 'USSD_PROCESS');
            params.append('USSD_operator', 'ussd_cancel');
            params.append('notCallback', 'true');

            await axios.post(`${baseUrl}${ENDPOINTS.CMD_PROCESS}`, params, {
                headers: { 'Referer': `${baseUrl}/index.html` }
            });
            // We don't strictly wait for the cancel to finish confirming, just fire and forget or short delay
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.log('[ZTE] Warning: Cancel USSD failed (ignoring)');
        }
    }
}

export const zteGateway = new ZteGateway();
