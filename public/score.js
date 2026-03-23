import { db, ref, get, set, onValue } from "./firebase.js";

const pairTitle = document.getElementById("pairTitle");
const scoreTable = document.getElementById("scoreTable");
const status = document.getElementById("status");
const player1Header = document.getElementById("player1Header");
const player2Header = document.getElementById("player2Header");
const miniLeaderboard = document.getElementById("miniLeaderboard");

console.log("score.js loaded");
console.log({ pairTitle, scoreTable, status, player1Header, player2Header, miniLeaderboard });

if (!pairTitle || !scoreTable || !status || !player1Header || !player2Header || !miniLeaderboard) {
  console.error("Brakuje elementów HTML wymaganych przez score.js");
} else {
  const params = new URLSearchParams(window.location.search);
  const pairId = params.get("pair");

  let pairData = null;
  let holesData = null;
  let scoresData = {};
  let saveTimers = {};

  let latestPairs = null;
  let latestScores = null;
  let latestHoles = null;

  if (!pairId) {
    pairTitle.textContent = "Nie wybrano pary";
  } else {
    init();
  }

  async function init() {
    try {
      const [pairSnap, holesSnap, scoresSnap] = await Promise.all([
        get(ref(db, `pairs/${pairId}`)),
        get(ref(db, "holes")),
        get(ref(db, `scores/${pairId}`))
      ]);

      if (!pairSnap.exists()) {
        pairTitle.textContent = "Nie znaleziono pary";
        return;
      }

      pairData = pairSnap.val();
      holesData = holesSnap.val() || {};
      scoresData = scoresSnap.val() || {};

      player1Header.textContent = pairData.player1 || "Zawodnik 1";
      player2Header.textContent = pairData.player2 || "Zawodnik 2";
      pairTitle.textContent = `${pairData.pairName} — ${pairData.player1} / ${pairData.player2}`;

      renderTable();
      initMiniLeaderboard();
    } catch (error) {
      status.textContent = "Błąd: " + error.message;
      console.error(error);
    }
  }

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

  function inputColorClass(points) {
    if (points === null || points === undefined) return "";
    if (points >= 4) return "sf-input-purple";
    if (points === 3) return "sf-input-green";
    if (points === 2) return "sf-input-yellow";
    if (points === 1) return "sf-input-orange";
    return "sf-input-red";
  }

  function badgeClass(points) {
    if (points === null || points === undefined) return "sf-empty";
    if (points >= 4) return "sf-purple";
    if (points === 3) return "sf-green";
    if (points === 2) return "sf-yellow";
    if (points === 1) return "sf-orange";
    return "sf-red";
  }

  function badgeHtml(points) {
    const label = points === null || points === undefined ? "–" : points;
    return `<span class="sf-badge ${badgeClass(points)}">${label}</span>`;
  }

  function renderTable() {
    let html = "";

    for (let hole = 1; hole <= 18; hole++) {
      const holeInfo = holesData?.[hole] || {};
      const saved = scoresData?.[hole] || {};

      const p1Pts = stablefordPoints(saved.p1, pairData.hcp1, holeInfo.si, holeInfo.par);
      const p2Pts = stablefordPoints(saved.p2, pairData.hcp2, holeInfo.si, holeInfo.par);
      const teamPts =
        p1Pts === null && p2Pts === null
          ? null
          : Math.max(p1Pts ?? 0, p2Pts ?? 0);

      html += `
        <tr>
          <td>${hole}</td>
          <td>${holeInfo.par || "-"}</td>
          <td>${holeInfo.si || "-"}</td>
          <td><input id="p1_${hole}" type="number" min="1" value="${saved.p1 || ""}" class="${inputColorClass(p1Pts)}"></td>
          <td><input id="p2_${hole}" type="number" min="1" value="${saved.p2 || ""}" class="${inputColorClass(p2Pts)}"></td>
          <td id="teamPts_${hole}">${badgeHtml(teamPts)}</td>
          <td id="rowStatus_${hole}">—</td>
        </tr>
      `;
    }

    scoreTable.innerHTML = html;

    for (let hole = 1; hole <= 18; hole++) {
      const p1Input = document.getElementById(`p1_${hole}`);
      const p2Input = document.getElementById(`p2_${hole}`);

      p1Input.addEventListener("input", () => {
        updateLivePoints(hole);
        queueSave(hole);
      });

      p2Input.addEventListener("input", () => {
        updateLivePoints(hole);
        queueSave(hole);
      });
    }
  }

  function updateLivePoints(hole) {
    const holeInfo = holesData?.[hole] || {};
    const p1Input = document.getElementById(`p1_${hole}`);
    const p2Input = document.getElementById(`p2_${hole}`);

    const p1Pts = stablefordPoints(p1Input.value, pairData.hcp1, holeInfo.si, holeInfo.par);
    const p2Pts = stablefordPoints(p2Input.value, pairData.hcp2, holeInfo.si, holeInfo.par);
    const teamPts =
      p1Pts === null && p2Pts === null
        ? null
        : Math.max(p1Pts ?? 0, p2Pts ?? 0);

    p1Input.className = inputColorClass(p1Pts);
    p2Input.className = inputColorClass(p2Pts);
    document.getElementById(`teamPts_${hole}`).innerHTML = badgeHtml(teamPts);
  }

  function queueSave(hole) {
    const rowStatus = document.getElementById(`rowStatus_${hole}`);
    rowStatus.textContent = "Wpisywanie...";
    rowStatus.className = "row-status-saving";

    if (saveTimers[hole]) clearTimeout(saveTimers[hole]);
    saveTimers[hole] = setTimeout(() => saveHole(hole), 700);
  }

  async function saveHole(hole) {
    const p1Value = document.getElementById(`p1_${hole}`).value;
    const p2Value = document.getElementById(`p2_${hole}`).value;
    const rowStatus = document.getElementById(`rowStatus_${hole}`);

    if (!p1Value || !p2Value) {
      rowStatus.textContent = "Niepełne";
      rowStatus.className = "row-status-incomplete";
      return;
    }

    rowStatus.textContent = "Zapisywanie...";
    rowStatus.className = "row-status-saving";

    try {
      await set(ref(db, `scores/${pairId}/${hole}`), {
        p1: Number(p1Value),
        p2: Number(p2Value)
      });

      rowStatus.textContent = "Zapisano";
      rowStatus.className = "row-status-saved";
      status.textContent = `Dołek ${hole} zapisany`;
    } catch (error) {
      rowStatus.textContent = "Błąd";
      rowStatus.className = "row-status-error";
      status.textContent = "Błąd: " + error.message;
    }
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

  function renderMiniLeaderboard() {
    if (!latestPairs || !latestHoles) {
      miniLeaderboard.innerHTML = "<p>Ładowanie...</p>";
      return;
    }

    const rows = [];

    for (const id in latestPairs) {
      const pair = latestPairs[id];
      if (!pair.player1 && !pair.player2 && !pair.pairName) continue;
      if (pair.active === false) continue;

      const pairScores = latestScores?.[id] || {};
      const result = calcPairTotal(pair, pairScores);

      rows.push({
        id,
        pairName: pair.pairName || "Nienazwana para",
        total: result.total,
        holesPlayed: result.holesPlayed
      });
    }

    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.holesPlayed - a.holesPlayed;
    });

    miniLeaderboard.innerHTML = rows.map((row, index) => `
      <div class="mini-row ${row.id === pairId ? "mini-row-current" : ""}">
        <div class="mini-pos">${index + 1}</div>
        <div class="mini-name">${row.pairName}</div>
        <div class="mini-total">${row.total}</div>
      </div>
    `).join("");
  }

  function initMiniLeaderboard() {
    onValue(ref(db, "pairs"), (snapshot) => {
      latestPairs = snapshot.val() || {};
      renderMiniLeaderboard();
    });

    onValue(ref(db, "scores"), (snapshot) => {
      latestScores = snapshot.val() || {};
      renderMiniLeaderboard();
    });

    onValue(ref(db, "holes"), (snapshot) => {
      latestHoles = snapshot.val() || {};
      renderMiniLeaderboard();
    });
  }
}