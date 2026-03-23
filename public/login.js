import { db, ref, get } from "./public/firebase.js";

const codeInput = document.getElementById("code");
const button = document.getElementById("loginBtn");
const status = document.getElementById("status");

button.addEventListener("click", async () => {
  const code = codeInput.value.trim();

  if (!code) {
    status.textContent = "Wpisz kod";
    return;
  }

  status.textContent = "Sprawdzanie...";

  try {
    const snapshot = await get(ref(db, "pairs"));

    if (!snapshot.exists()) {
      status.textContent = "Brak zapisanych par";
      return;
    }

    const pairs = snapshot.val();
    let foundPairId = null;

    for (const pairId in pairs) {
      if (String(pairs[pairId].code).trim() === code) {
        foundPairId = pairId;
        break;
      }
    }

    if (!foundPairId) {
      status.textContent = "Nieprawidłowy kod";
      return;
    }

    status.textContent = "Logowanie...";
    window.location.href = `./score.html?pair=${encodeURIComponent(foundPairId)}`;
  } catch (error) {
    status.textContent = "Błąd: " + error.message;
  }
});