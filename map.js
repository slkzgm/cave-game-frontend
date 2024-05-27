const urlParams = new URLSearchParams(window.location.search);
const COLLECTION_NAME = urlParams.get('cave') || '25';

const BACKEND_URL = 'cavegame.slkzgm.com';

const socket = new WebSocket(`wss://${BACKEND_URL}`);

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    console.log('Message from server ', data);
    processAndRenderData([data]); // Mise à jour de la carte et de la liste des sheep avec les nouvelles données
});

// Dimensions de la grille
const gridWidth = 400;
const gridHeight = 400;
const cellSize = 50;

// Créer le SVG pour la carte
const svg = d3.select("#map")
    .append("svg")
    .attr("width", gridWidth * cellSize)
    .attr("height", gridHeight * cellSize)
    .call(d3.zoom().scaleExtent([0.5, 8]).on("zoom", zoomed))
    .append("g");

function zoomed({transform}) {
    svg.attr("transform", transform);
}

// Initialiser la grille
const grid = [];
for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
        grid.push({ x: x, y: y, revealed: false, diggable: false });
    }
}

// Ajouter les cellules au SVG
svg.selectAll(".cell")
    .data(grid)
    .enter()
    .append("rect")
    .attr("class", "cell unrevealed")
    .attr("x", d => d.x * cellSize)
    .attr("y", d => d.y * cellSize)
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("fill", d => d.revealed ? (d.diggable ? "green" : "#ccc") : "#333")
    .on("click", function(event, d) {
        d3.selectAll(".cell").classed("selected", false);
        d3.select(this).classed("selected", true);
        updateInfo(d);
    });

let sheepData = {};
let lastRevealedCell = null;

// Fonction pour mettre à jour les informations affichées
function updateInfo(cell) {
    const infoDiv = document.getElementById("info");
    infoDiv.innerHTML = `Position: (${cell.x}, ${cell.y})<br>Revealed: ${cell.revealed}<br>Diggable: ${cell.diggable}`;
}

// Fonction pour traiter et rendre les données
function processAndRenderData(data) {
    const select = document.getElementById("sheepId");

    data.forEach(entry => {
        const { sheepId, totalSteps, coordinates: { x, y } } = entry;

        const cell = grid.find(cell => cell.x === x && cell.y === y);
        if (!cell) {
            console.error(`Cell not found for position: ${entry.position} at coordinates (${x}, ${y})`);
            return;
        }

        cell.revealed = true;
        cell.diggable = entry.diggable;

        // Mise à jour des informations du mouton
        if (!sheepData[sheepId] || sheepData[sheepId].totalSteps < totalSteps) {
            sheepData[sheepId] = { totalSteps, coordinates: { x, y }, position: entry.position };
        }

        // Mise à jour du menu déroulant
        if (!Array.from(select.options).some(option => option.value == sheepId)) {
            const option = document.createElement("option");
            option.value = sheepId;
            option.text = `${sheepId} (${x}, ${y})`;
            select.add(option);
        }
    });

    // Mettre à jour les classes des cellules dans le SVG
    svg.selectAll(".cell")
        .data(grid)
        .attr("class", d => d.revealed ? (d.diggable ? "cell revealed diggable" : "cell revealed") : "cell unrevealed")
        .attr("fill", d => d.diggable ? "green" : (d.revealed ? "#ccc" : "#333"));

    // Colorer la dernière case découverte
    if (lastRevealedCell) {
        d3.select(lastRevealedCell).attr("fill", "yellow");
    }
}

// Récupérer les données depuis le serveur lors du chargement de la page
fetch(`https://${BACKEND_URL}/data?collectionName=${COLLECTION_NAME}`)
    .then(response => response.json())
    .then(data => {
        processAndRenderData(data);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

// Gestionnaire pour le changement de sélection du sheep
document.getElementById("sheepId").addEventListener("change", function () {
    const selectedSheepId = this.value;
    if (selectedSheepId && sheepData[selectedSheepId]) {
        const { coordinates: { x, y } } = sheepData[selectedSheepId];

        console.log(`Selected Sheep ID: ${selectedSheepId}, Coordinates: (${x}, ${y})`);

        lastRevealedCell = svg.selectAll(".cell")
            .filter(d => d.x === x && d.y === y)
            .node();

        d3.select(lastRevealedCell).attr("fill", "yellow");

        const [translateX, translateY] = [(gridWidth / 2 - x) * cellSize, (gridHeight / 2 - y) * cellSize];
        console.log(`Translating to: (${translateX}, ${translateY})`);

        svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(1)
        );
    }
});
