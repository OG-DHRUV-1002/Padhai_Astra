const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyACI2naJAnJod5c4w-zselo8mXWCxboeB4",
    authDomain: "studio-9523266440-84cc2.firebaseapp.com",
    databaseURL: "https://studio-9523266440-84cc2-default-rtdb.firebaseio.com",
    projectId: "studio-9523266440-84cc2",
    storageBucket: "studio-9523266440-84cc2.firebasestorage.app",
    messagingSenderId: "53992168935",
    appId: "1:53992168935:web:9fbc4e771e38c146213142",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestore() {
    console.log("Attempting to write to 'colleges' collection...");
    try {
        const testRef = doc(collection(db, "colleges"), "TEST_COLLEGE_" + Date.now());
        await setDoc(testRef, {
            name: "Test College",
            location: "Test Location",
            adminId: "ADMIN-001",
            createdAt: new Date().toISOString()
        });
        console.log("✅ Firestore write successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Firestore write failed:", error);
        process.exit(1);
    }
}

testFirestore();
