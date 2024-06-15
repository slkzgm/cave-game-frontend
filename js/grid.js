import { COLORS, CELL_TYPE, BACKEND_URL } from './constants.js';
import { updateSheepSelector, updateCaveDetails } from './ui.js';
import { setCurrentCaveId, setSheepData, getSheepData } from './state.js';

const width = 800;
const height = 800;
const cellSize = 2;
const gridSize = 600;

const svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

const container = svg.append("g");

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
        container.attr("transform", event.transform);
    });

svg.call(zoom);

export function drawGrid() {
    const centerX = 300;
    const centerY = 300;
    const halfSize = 10;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const fillColor = (i >= centerX - halfSize && i < centerX + halfSize && j >= centerY - halfSize && j < centerY + halfSize) ? COLORS.DUTYFREE : COLORS.UNREVEALED;

            container.append("rect")
                .attr("x", i * cellSize)
                .attr("y", j * cellSize)
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("stroke", "black")
                .attr("stroke-width", 0.25)
                .attr("fill", fillColor)
                .attr("diggable", "false")
                .attr("revealed", "false")
                .attr("movements", "0")
                .attr("border-drawn", "false")
                .attr("coord-x", i)
                .attr("coord-y", j)
                .on("click", () => {
                    const rect = container.select(`rect[coord-x="${i}"][coord-y="${j}"]`);
                    const revealed = rect.attr("revealed");
                    const diggable = rect.attr("diggable");
                    const movements = rect.attr("movements");

                    document.getElementById('cell-info').innerHTML = `Position: (${i}, ${j})<br>Revealed: ${revealed}<br>Diggable: ${diggable}<br>Movements: ${movements}`;
                });
        }
    }
}

let heatColor = (movements) => {
    if (movements === 1) return 'green';
    if (movements <= 3) return 'yellow';
    if (movements <= 8) return 'orange';
    if (movements > 8) return 'red';
};

export function drawVisible(visibleCell) {
    let { x, y, directions, diggable, movements } = visibleCell;
    const rect = container.select(`rect[coord-x="${x}"][coord-y="${y}"]`);

    rect.attr("revealed", "true");
    rect.attr("diggable", diggable.toString());

    if (!movements) {
        movements = parseInt(rect.attr("movements"));
    }

    if (movements > 0) {
        rect.attr("fill", heatColor(movements));
        rect.attr("movements", movements.toString());
    } else {
        rect.attr("fill", diggable ? COLORS.DIGGABLE : COLORS.REVEALED);
    }

    const borders = CELL_TYPE[directions];

    if (borders) {
        if (borders.left) {
            container.append("line")
                .attr("x1", x * cellSize)
                .attr("y1", y * cellSize)
                .attr("x2", x * cellSize)
                .attr("y2", y * cellSize + cellSize)
                .attr("stroke", COLORS.WALLS)
                .attr("stroke-width", 0.5);
        }
        if (borders.top) {
            container.append("line")
                .attr("x1", x * cellSize)
                .attr("y1", y * cellSize)
                .attr("x2", x * cellSize + cellSize)
                .attr("y2", y * cellSize)
                .attr("stroke", COLORS.WALLS)
                .attr("stroke-width", 0.5);
        }
        if (borders.right) {
            container.append("line")
                .attr("x1", x * cellSize + cellSize)
                .attr("y1", y * cellSize)
                .attr("x2", x * cellSize + cellSize)
                .attr("y2", y * cellSize + cellSize)
                .attr("stroke", COLORS.WALLS)
                .attr("stroke-width", 0.5);
        }
        if (borders.bottom) {
            container.append("line")
                .attr("x1", x * cellSize)
                .attr("y1", y * cellSize + cellSize)
                .attr("x2", x * cellSize + cellSize)
                .attr("y2", y * cellSize + cellSize)
                .attr("stroke", COLORS.WALLS)
                .attr("stroke-width", 0.5);
        }
    }
    rect.attr("border-drawn", "true");
}

export function processAndRenderData(data) {
    const sheepData = getSheepData();
    const toDraw = Object.values(data.reduce((acc, currentObj) => {
        const { sheepId, totalSteps, coordinates: { x, y }} = currentObj;
        const rect = container.select(`rect[coord-x="${x}"][coord-y="${y}"]`);

        sheepData[sheepId] = { totalSteps, coordinates: { x, y } };
        rect.attr("movements", "1");

        currentObj.visible.forEach(element => {
            acc[element.position] = element;
        });
        return acc;
    }, {}));

    setSheepData(sheepData);
    toDraw.forEach(drawVisible);
    updateSheepSelector();
}

export function loadCaveData(caveId) {
    fetch(`https://${BACKEND_URL}/cave?caveId=${caveId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('current-cave').innerText = `Current Cave: ${caveId}`;
            updateCaveDetails(data[data.length - 1]);
            processAndRenderData(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

export function changeCave(caveId) {
    setCurrentCaveId(caveId);
    document.getElementById('current-cave').innerText = `Current Cave: ${caveId}`;
    container.selectAll("rect").remove();
    setSheepData({});
    drawGrid();
    loadCaveData(caveId);
}

export function centerOnSheep(x, y) {
    const currentTransform = d3.zoomTransform(svg.node());
    const scale = currentTransform.k;
    const translateX = width / 2 - x * cellSize * scale;
    const translateY = height / 2 - y * cellSize * scale;
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
    svg.transition().duration(750).call(zoom.transform, transform);
}