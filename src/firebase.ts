import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize firestore with databaseId if it is specified
const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
const db = getFirestore(app, dbId);

export { app, db };
