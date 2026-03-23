import { db, ref, onValue } from "./firebase.js";

const tournamentTitle = document.getElementById("tournamentTitle");
const leaderboardBody = document.getElementById("leaderboardBody");

let latestTournament = null;
let latestPairs = null;
let latestScores = null;
let latestHoles = null;

function shotsReceived(handicap, strokeIndex) {
  const hcp = Number(handicap) || 0;
  const si = Number(strokeIndex) || 0;

  const base = Math.floor(hcp / 18);
  const remainder = hcp % 18;
  const extra = remainder > 0 && si <= remainder ? 1 : 0;

  return base + extra;
}

function stablefordPoints(gross, handicap, strokeIndex, par) {
  const g = Number(gross);
  if (!g) return null;

  const shots = shotsReceived(handicap, strokeIndex);
  const nett = g - shots;
  return Math.max(0, 2 + (Number(par) - nett));
}

function calcPairTotal(pair, pairScores) {
  let total = 0;
  let holesPlayed = 0;

  for (let hole = 1; hole <= 18; hole++) {
    const info = latestHoles?.[hole];
    const holeScore = pairScores?.[hole];

    if (!info || !holeScore) continue;

    const p1 = Number(holeScore.p1);
    const p2 = Number(holeScore.p2);

    if (!p1 || !p2) continue;

    const p1Pts = stablefordPoints(p1, Number(pair.hcp1), info.si, info.par);
    const p2Pts = stablefordPoints(p2, Number(pair.hcp2), info.si, info.par);

    total += Math.max(p1Pts ?? 0, p2Pts ?? 0);
    holesPlayed++;
  }

  return { total, holesPlayed };
}

function render() {
  if (!latestPairs || !latestHoles) return;

  if (latestTournament) {
    tournamentTitle.textContent =
      `${latestTournament.name || ""} — ${latestTournament.course || ""} — ${latestTournament.date || ""}`;
  }

  const rows = [];

  for (const pairId in latestPairs) {
    const pair = latestPairs[pairId];

    if (!pair.player1 && !pair.player2 && !pair.pairName) continue;
    if (pair.active === false) continue;

    const pairScores = latestScores?.[pairId] || {};
    const result = calcPairTotal(pair, pairScores);

    rows.push({
      pairId,
      pairName: pair.pairName || "Unnamed Pair",
      players: `${pair.player1 || "-"} / ${pair.player2 || "-"}`,
      total: result.total,
      holesPlayed: result.holesPlayed
    });
  }

  rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return b.holesPlayed - a.holesPlayed;
  });

  leaderboardBody.innerHTML = "";

  rows.forEach((row, index) => {
    leaderboardBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${row.pairName}</td>
        <td>${row.players}</td>
        <td>${row.total}</td>
        <td>${row.holesPlayed}</td>
      </tr>
    `;
  });
}

onValue(ref(db, "tournament"), (snapshot) => {
  latestTournament = snapshot.val();
  render();
});

onValue(ref(db, "pairs"), (snapshot) => {
  latestPairs = snapshot.val();
  render();
});

onValue(ref(db, "scores"), (snapshot) => {
  latestScores = snapshot.val();
  render();
});

onValue(ref(db, "holes"), (snapshot) => {
  latestHoles = snapshot.val();
  render();
});