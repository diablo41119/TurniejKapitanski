import { db, ref, onValue } from "./firebase.js";

const tournamentName = document.getElementById("tournamentName");
const tournamentInfo = document.getElementById("tournamentInfo");

onValue(ref(db, "tournament"), (snapshot) => {
  const tournament = snapshot.val();

  if (!tournament) {
    tournamentName.textContent = "No tournament set";
    tournamentInfo.textContent = "";
    return;
  }

  tournamentName.textContent = tournament.name || "Unnamed tournament";
  tournamentInfo.textContent = `${tournament.course || ""} ${tournament.date ? "• " + tournament.date : ""}`;
});