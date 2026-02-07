// 1. YOUR SHEET URL (Make sure it ends in &output=csv or /pub?output=csv)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQpg8qGniOaZerSAblOCFbWgde0-Uwx0bNo1aBUWzeWpAAYrj97D2FjpBE5kwGq501WktCW4bkaYEp/pub?output=csv';

// 2. Fetch Function
function loadData() {
    Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            console.log("Data loaded:", results.data);
            renderStandings(results.data);
            renderSchedule(results.data);
        }
    });
}

// 3. Render Standings Table
function renderStandings(data) {
    const tableBody = document.querySelector("#standings-table tbody");
    // Filter to find rows that have 'Wins' (to avoid empty rows/wrong tabs)
    // NOTE: In a real multi-tab sheet, you usually publish individual tabs as CSVs.
    // For simplicity, verify your row headers match.
    
    data.forEach(row => {
        if(row.Team && row.Wins) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.Team}</td>
                <td>${row.Wins}-${row.Losses}</td>
                <td>${row.TotalDraftScore}</td>
                <td>${row.AvgADP}</td>
            `;
            tableBody.appendChild(tr);
        }
    });
}

// 4. Render Schedule Cards
function renderSchedule(data) {
    const calendar = document.getElementById("calendar-grid");
    data.forEach(row => {
        if(row.GameID) { // Check if it's a schedule row
            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
                <h3>${row.Date} - ${row.Sport}</h3>
                <p><strong>${row.HomeTeam}</strong> vs <strong>${row.AwayTeam}</strong></p>
                <a href="${row.HomeLink}" target="_blank" style="color:#00ff88">View Home Lineup</a><br>
                <a href="${row.AwayLink}" target="_blank" style="color:#00ff88">View Away Lineup</a>
            `;
            calendar.appendChild(card);
        }
    });
}

// 5. Tab Switching Logic
window.showSection = function(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
};

// Run on load
loadData();
