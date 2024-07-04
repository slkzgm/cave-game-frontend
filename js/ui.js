import { COLORS } from './constants.js';
import { drawGrid, loadCaveData, drawSheep, centerOn } from './grid.js';
import { getCurrentCaveData, setCurrentCaveData, getSheepData, getCurrentCaveId, getCurrentSheepId, setCurrentSheepId, currentSheepId} from './state.js';
import { BACKEND_URL } from './constants.js';

// export function loadColors() {
//     const savedColors = JSON.parse(localStorage.getItem('colors'));
//     if (savedColors) {
//         Object.assign(COLORS, savedColors);
//     }
//     document.getElementById('color-unrevealed').value = COLORS.UNREVEALED;
//     document.getElementById('color-revealed').value = COLORS.REVEALED;
//     document.getElementById('color-actual').value = COLORS.ACTUAL;
//     document.getElementById('color-diggable').value = COLORS.DIGGABLE;
//     document.getElementById('color-digged').value = COLORS.DIGGED;
//     document.getElementById('color-walls').value = COLORS.WALLS;
//     document.getElementById('color-dutyfree').value = COLORS.DUTYFREE;
// }

// export function saveColors() {
//     localStorage.setItem('colors', JSON.stringify(COLORS));
// }

// export function applyColors() {
//     COLORS.UNREVEALED = document.getElementById('color-unrevealed').value;
//     COLORS.REVEALED = document.getElementById('color-revealed').value;
//     COLORS.ACTUAL = document.getElementById('color-actual').value;
//     COLORS.DIGGABLE = document.getElementById('color-diggable').value;
//     COLORS.DIGGED = document.getElementById('color-digged').value;
//     COLORS.WALLS = document.getElementById('color-walls').value;
//     COLORS.DUTYFREE = document.getElementById('color-dutyfree').value;

//     saveColors();

//     const container = d3.select("#map").select("svg").select("g");
//     container.selectAll("rect").remove();
//     drawGrid();
//     if (getCurrentCaveId()) {
//         loadCaveData(getCurrentCaveId());
//     }
// }

// export function resetColors() {
//     Object.assign(COLORS, {
//         UNREVEALED: "#333333",
//         REVEALED: "#cccccc",
//         ACTUAL: "#ffffff",
//         DIGGABLE: "#00fff7",
//         DIGGED: "#0050b7",
//         WALLS: "#ff0000",
//         DUTYFREE: "#956565"
//     });

//     document.getElementById('color-unrevealed').value = COLORS.UNREVEALED;
//     document.getElementById('color-revealed').value = COLORS.REVEALED;
//     document.getElementById('color-actual').value = COLORS.ACTUAL;
//     document.getElementById('color-diggable').value = COLORS.DIGGABLE;
//     document.getElementById('color-digged').value = COLORS.DIGGED;
//     document.getElementById('color-walls').value = COLORS.WALLS;
//     document.getElementById('color-dutyfree').value = COLORS.DUTYFREE;

//     saveColors();

//     const container = d3.select("#map").select("svg").select("g");
//     container.selectAll("rect").remove();
//     drawGrid();
//     if (getCurrentCaveId()) {
//         loadCaveData(getCurrentCaveId());
//     }
// }

export async function fetchLastCaveDetails() {
    try {
        const response = await fetch(`https://${BACKEND_URL}/lastCave`);
        const caveDetails = await response.json();
        const detailsBox = document.getElementById('lastcave-box');

        detailsBox.innerHTML = formatCaveDetails(caveDetails);
    } catch (error) {
        console.error('Error fetching last cave details:', error);
    }
}

function formatCaveDetails(caveDetails) {
    return `
        <h2>Cave Details</h2>
        <div class="info-group">
            <p><strong>ID:</strong> ${caveDetails.id}</p>
            <p><strong>Size:</strong> ${caveDetails.size}</p>
            <p><strong>Starts At:</strong> ${new Date(caveDetails.startsAt).toLocaleString()}</p>
            <p><strong>Ends At:</strong> ${new Date(caveDetails.endsAt).toLocaleString()}</p>
        </div>
        <div class="info-group">
            <p><strong>Cave Closed:</strong> ${caveDetails.caveClosed}</p>
            ${caveDetails.mapFileVisible ? '<p><strong>Map File Visible:</strong> ${caveDetails.mapFileVisible}</p>' : ''}
            <p><strong>Rope Available:</strong> ${caveDetails.ropeAvailable}</p>
        </div>
        <h3>Population</h3>
        <div class="info-group">
            <p><strong>Sheep Population:</strong> ${caveDetails.sheepPopulation}</p>
            <p><strong>Wolf Population:</strong> ${caveDetails.wolfPopulation}</p>
        </div>
        <h3>Loot</h3>
        <div class="info-group">
            <p><strong>Items:</strong> ${caveDetails.items}</p>
            <p><strong>Found Wool:</strong> ${caveDetails.foundWool}</p>
            <p><strong>Cave Points:</strong> ${caveDetails.cavePoints}</p>
        </div>
        <h3>Found Items</h3>
        <ul>
            ${!!caveDetails.found ? Object.entries(caveDetails.found).map(([item, count]) => `<li><strong>${item}:</strong> ${count}</li>`).join('') : ''}
        </ul>
    `;
}

export async function fetchAvailableCaves() {
    try {
        const response = await fetch(`https://${BACKEND_URL}/caves`);
        const caves = await response.json();

        populateCaveSelector(caves);
    } catch (error) {
        console.error('Error fetching available caves:', error);
    }
}

function populateCaveSelector(caves) {
    const caveSelectorDropdown = document.getElementById('cave-selector-dropdown');
    const caveDetails = document.getElementById('caves-box');
    caveSelectorDropdown.innerHTML = '';

    caves.forEach((cave, index) => {
        const option = document.createElement('option');

        option.value = cave.id;
        option.textContent = `Cave ${cave.id}`;
        caveSelectorDropdown.appendChild(option);

        if (index === caves.length - 1) {
            caveDetails.innerHTML = formatCaveDetails(cave);
        }
    });

    caveSelectorDropdown.addEventListener('change', function () {
        const selectedCaveId = this.value;
        const selectedCave = caves.find(cave => cave.id == selectedCaveId);

        caveDetails.innerHTML = formatCaveDetails(selectedCave);
    });
}

export function displayActualCaveDetails() {
    const actualCaveBox = document.getElementById('actual-cave-box');

    const currentCaveData = getCurrentCaveData();
    if (!currentCaveData) {
        actualCaveBox.innerHTML = `<p>No cave is currently being viewed.</p>`;
        return;
    }
    if (!currentCaveData.cave.id) {
        actualCaveBox.innerHTML = `<p>No data available for the selected cave yet. Start playing to load some.</p>`;
        return;
    }

    const { cave } = currentCaveData;
    actualCaveBox.innerHTML = `
    <h2>Actual Cave Details</h2>
    <div class="info-group">
        <p><strong>ID:</strong> ${cave.id}</p>
        <p><strong>Size:</strong> ${cave.size}</p>
        <p><strong>Starts At:</strong> ${new Date(cave.startsAt).toLocaleString()}</p>
        <p><strong>Ends At:</strong> ${new Date(cave.endsAt).toLocaleString()}</p>
    </div>
    <div class="info-group">
        <p><strong>Cave Closed:</strong> ${cave.caveClosed}</p>
        ${cave.mapFileVisible ? '<p><strong>Map File Visible:</strong> ${cave.mapFileVisible}</p>' : ''}
        <p><strong>Rope Available:</strong> ${cave.ropeAvailable}</p>
    </div>
    <h3>Population</h3>
    <div class="info-group">
        <p><strong>Sheep Population:</strong> ${cave.sheepPopulation}</p>
        <p><strong>Wolf Population:</strong> ${cave.wolfPopulation}</p>
    </div>
    <h3>Loot</h3>
    <div class="info-group">
        <p><strong>Items:</strong> ${cave.items}</p>
        <p><strong>Found Wool:</strong> ${cave.foundWool}</p>
        <p><strong>Cave Points:</strong> ${cave.cavePoints}</p>
    </div>
    <h3>Found Items</h3>
    <ul>
        ${!!cave.found ? Object.entries(cave.found).map(([item, count]) => `<li><strong>${item}:</strong> ${count}</li>`).join('') : ''}
    </ul>
`;
}

export function updateSheepSelector() {
    const sheepSelector = document.getElementById('sheep-selector');
    sheepSelector.innerHTML = '<option value="">Select a sheep</option>';

    const sheepData = getSheepData();
    Object.keys(sheepData).forEach(sheepId => {
        const { coordinates: { x, y } } = sheepData[sheepId];
        const option = document.createElement('option');

        drawSheep(x,y);

        option.value = sheepId;
        option.textContent = `Sheep ${sheepId} (x: ${x}, y: ${y})`;
        sheepSelector.appendChild(option);
    });
    const currentSheepId = getCurrentSheepId()
    if(currentSheepId){
        // console.log("setting sheep-selector to:", currentSheepId);
        document.getElementById('sheep-selector').value = currentSheepId;
    }
    
}

export function updateCaveDetails(caveDetails) {
    if (!caveDetails || !caveDetails.cave) {
        setCurrentCaveData({ cave: {} });
    } else {
        setCurrentCaveData({ cave: caveDetails.cave });
    }
    if (document.getElementById('tab2').classList.contains('active')) {
        displayActualCaveDetails();
    }
}

export function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');
}