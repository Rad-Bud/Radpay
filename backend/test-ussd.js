
import axios from 'axios';

async function testbackend() {
    console.log("Testing Backend connection...");
    try {
        const response = await axios.post('http://localhost:3000/api/gateway/ussd', {
            slot: 'test-slot-1',
            code: '*222#'
        });
        console.log("Response:", response.data);
    } catch (error) {
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

testbackend();
