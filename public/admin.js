import { db, ref, set } from "./firebase.js";

const PASSWORD = "karolinaprzytok2026";

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");

const loginBtn = document.getElementById("loginBtn");
const loginStatus = document.getElementById("loginStatus");

loginBtn?.addEventListener("click", () => {
  const input = document.getElementById("adminPassword").value;

  if (input === PASSWORD) {
    loginScreen.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    loginStatus.textContent = "Błędne hasło";
  }
});

document.getElementById("adminPassword")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

const status = document.getElementById("status");
const holesForm = document.getElementById("holesForm");

let holesHtml = "";
for (let i = 1; i <= 18; i++) {
  holesHtml += `
    <div class="hole-card">
      <strong>Dołek ${i}</strong>
      <div class="hole-inputs">
        <input id="par_${i}" type="number" placeholder="Par">
        <input id="si_${i}" type="number" placeholder="SI">
      </div>
    </div>
  `;
}
holesForm.innerHTML = holesHtml;

document.getElementById("saveTournament").onclick = async () => {
  await set(ref(db, "tournament"), {
    name: document.getElementById("name").value,
    course: document.getElementById("course").value,
    date: document.getElementById("date").value
  });

  status.textContent = "Zapisano turniej";
};

document.getElementById("saveHoles").onclick = async () => {
  const holes = {};

  for (let i = 1; i <= 18; i++) {
    holes[i] = {
      par: Number(document.getElementById(`par_${i}`).value),
      si: Number(document.getElementById(`si_${i}`).value)
    };
  }

  await set(ref(db, "holes"), holes);
  status.textContent = "Zapisano dołki";
};

document.getElementById("addPair").onclick = async () => {
  const pairId = "pair_" + Date.now();

  await set(ref(db, "pairs/" + pairId), {
    pairName: document.getElementById("pairName").value,
    player1: document.getElementById("p1").value,
    player2: document.getElementById("p2").value,
    hcp1: Number(document.getElementById("hcp1").value),
    hcp2: Number(document.getElementById("hcp2").value),
    code: document.getElementById("code").value
  });

  status.textContent = "Dodano parę";
};