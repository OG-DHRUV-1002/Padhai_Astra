const { initializeApp } = require("firebase/app");
const { getDatabase, ref, set, get, child } = require("firebase/database");

const firebaseConfig = {
    apiKey: "AIzaSyACI2naJAnJod5c4w-zselo8mXWCxboeB4",
    authDomain: "studio-9523266440-84cc2.firebaseapp.com",
    databaseURL: "https://studio-9523266440-84cc2-default-rtdb.firebaseio.com",
    projectId: "studio-9523266440-84cc2",
    storageBucket: "studio-9523266440-84cc2.firebasestorage.app",
    messagingSenderId: "53992168935",
    appId: "1:53992168935:web:9fbc4e771e38c146213142",
};

console.log("1. Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testConnection() {
    try {
        console.log("2. Attempting to write to 'test_connection' node...");
        const testRef = ref(db, "test_connection");
        const timestamp = Date.now();
        await set(testRef, {
            status: "connected",
            message: "Hello from Arcpedia verification script!",
            timestamp: timestamp
        });
        console.log("✅ Write successful!");

        console.log("3. Attempting to read 'test_connection' node...");
        const snapshot = await get(testRef);
        if (snapshot.exists()) {
            console.log("✅ Read successful! Data:", snapshot.val());
        } else {
            console.log("⚠️ Read successful but no data found.");
        }

        console.log("4. Attempting to seed dummy memories...");
        const memoriesRef = ref(db, "memories");
        const dummyMemories = {
            "m1": {
                type: "Achievement",
                title: "Firebase Connected!",
                content: "This memory confirms that Arcpedia is successfully connected to Firebase Realtime Database.",
                date: new Date().toISOString().split('T')[0]
            },
            "m2": {
                type: "Goal",
                title: "Explore the Dashboard",
                content: "Check out the new stats ribbon and activity feed to see your data updating in real-time.",
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
            }
        };
        await set(memoriesRef, dummyMemories);
        console.log("✅ Dummy memories seeded successfully!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Connection failed:", error);
        process.exit(1);
    }
}

testConnection();
