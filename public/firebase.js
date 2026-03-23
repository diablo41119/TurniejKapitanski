import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCioMDzjJndplwFm3k6-R4EMC-y3zAP9lo",
  authDomain: "turniejkapitanski2026.firebaseapp.com",
  databaseURL: "https://turniejkapitanski2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "turniejkapitanski2026",
  storageBucket: "turniejkapitanski2026.firebasestorage.app",
  messagingSenderId: "741181304483",
  appId: "1:741181304483:web:77365949f03001810b9916"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, onValue, update };