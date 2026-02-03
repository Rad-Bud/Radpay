import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDjaX40QIoWUcniK0JntjgIhg9ePzPGutc",
    authDomain: "tasshil-pay.firebaseapp.com",
    projectId: "tasshil-pay",
    storageBucket: "tasshil-pay.firebasestorage.app",
    messagingSenderId: "69098056750",
    appId: "1:69098056750:web:931d0ad34ff548583f83bf",
    measurementId: "G-E41745Z5K3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
