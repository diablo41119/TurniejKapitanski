import { db, ref, get } from "./firebase.js";

const codeInput = document.getElementById("code");
const button = document.getElementById("loginBtn");
const status = document.getElementById("status");

button.addEventListener("click", async (e) => {
  e.preventDefault();

  const code = codeInput.value.trim();
  console.log("Wpisany kod:", code);

  if (!code) {
    status.textContent = "Wpisz kod";
    return;
  }

  status.textContent = "Sprawdzanie...";

  try {
    const snapshot = await get(ref(db, "pairs"));

    console.log("Czy snapshot istnieje:", snapshot.exists());
    console.log("Dane pairs z bazy:", snapshot.val());

    if (!snapshot.exists()) {
      status.textContent = "Brak zapisanych par";
      return;
    }

    const pairs = snapshot.val();
    let foundPairId = null;

    for (const pairId in pairs) {
      console.log("Sprawdzam parę:", pairId, pairs[pairId]);

      if (String(pairs[pairId].code).trim() === code) {
        foundPairId = pairId;
        break;
      }
    }

    console.log("Znalezione pairId:", foundPairId);

    if (!foundPairId) {
      status.textContent = "Nieprawidłowy kod";
      return;
    }

    status.textContent = "Logowanie...";

    const targetUrl = `./score.html?pair=${encodeURIComponent(foundPairId)}`;
    console.log("REDIRECT:", targetUrl);

    window.location.href = targetUrl;
  } catch (error) {
    console.error("Błąd logowania:", error);
    status.textContent = "Błąd: " + error.message;
  }
});