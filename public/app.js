import { db, ref, set } from "./firebase.js";

const button = document.getElementById("testBtn");
const status = document.getElementById("status");

button.addEventListener("click", async () => {
  status.textContent = "Sending...";

  try {
    await set(ref(db, "test/message"), {
      text: "Hello from website",
      time: new Date().toISOString()
    });

    status.textContent = "Data sent to Firebase successfully.";
  } catch (error) {
    status.textContent = "Error: " + error.message;
    alert("Error: " + error.message);
  }
});