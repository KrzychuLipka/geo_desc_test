import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBwuyTf2KfVru3VHqIiySlkRDW2a-NF6G8",
    authDomain: "geodesctest.firebaseapp.com",
    projectId: "geodesctest",
    storageBucket: "geodesctest.firebasestorage.app",
    messagingSenderId: "378700591406",
    appId: "1:378700591406:web:efc99c97d016386c7c4abf",
    measurementId: "G-05G022FQ83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
