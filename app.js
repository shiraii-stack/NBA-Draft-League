// --- CONFIGURATION ---
// Store the Google Sheet Links for each season here
const SEASONS = {
    s1: {
        standings: 'YOUR_S1_STANDINGS_CSV_LINK', 
        schedule:  'YOUR_S1_SCHEDULE_CSV_LINK',
        rosters:   'YOUR_S1_ROSTERS_CSV_LINK'
    },
    s2: {
        // You can add these links later when Season 2 starts
        standings: '', schedule: '', rosters: ''
    }
};

// --- SEASON CONTROL FUNCTIONS ---

function enterSeason(seasonId) {
    const config = SEASONS[seasonId];
    
    if(!config || !config.standings) {
        alert("Season data not found!");
        return;
    }

    // 1. Hide Landing Page, Show Dashboard
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('current-season-label').innerText = `/ ${seasonId.toUpperCase()}`;

    // 2. Load the specific data for this season
    loadCSV(config.standings, renderStandings);
    loadCSV(config.schedule, renderSchedule);
    loadCSV(config.rosters, renderRosters);
}

function exitSeason() {
    // Reload page to go back to season selector
    location.reload();
}

// --- DATA FETCHING (unchanged) ---
function loadCSV(url, callback) {
    if (!url) return; // Skip if link is empty
    Papa.parse(url, {
        download: true,
        header: true,
        complete: (results) => callback(results.data)
    });
}

// ... (Keep your existing renderStandings, renderSchedule, renderRosters, and showSection functions exactly the same) ...
