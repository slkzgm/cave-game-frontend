import { COLORS, CELL_TYPE, BACKEND_URL } from './constants.js';
import { updateSheepSelector, updateCaveDetails } from './ui.js';
import { setCurrentCaveId, setSheepData, getSheepData } from './state.js';

let visibleCells = {};  // Object to store the state of each visible cell
// Initialize a variable to store the current transformation.
let currentTransform = d3.zoomIdentity;


const canvas = document.getElementById('mazeCanvas');
const context = canvas.getContext('2d');
const cellSize = 8;
const gridSize = 600;

// Create an off-screen canvas
const offScreenCanvas = document.createElement('canvas');
offScreenCanvas.width = canvas.width;  // 'canvas' is the on-screen canvas
offScreenCanvas.height = canvas.height;
const offCtx = offScreenCanvas.getContext('2d');

const d3Canvas = d3.select(canvas);

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
        currentTransform = event.transform;
        redrawCanvas();
    });

d3Canvas.call(zoom);

function redrawCanvas() {
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(currentTransform.x, currentTransform.y);
    context.scale(currentTransform.k, currentTransform.k);
    drawGrid();
    // Ensure visible cells are redrawn if they are managed separately
    Object.keys(visibleCells).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        redrawCell(x, y);
    });
    context.restore();
}

export function drawGrid() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            context.fillStyle = COLORS.UNREVEALED;
            context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            context.strokeStyle = COLORS.GRID;
            context.lineWidth = 1;
            context.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
    Object.keys(visibleCells).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        redrawCell(x, y);
    });
}

let heatColor = (movements) => {
    if (movements === 1) return 'green';
    if (movements <= 3) return 'yellow';
    if (movements <= 8) return 'orange';
    if (movements > 8) return 'red';
    return '#fff';  // Default color

};


export function drawVisible(visibleCell) {
    const { x, y, directions, diggable, movements } = visibleCell;
    visibleCells[`${x},${y}`] = visibleCell;  // Store cell state keyed by its coordinates

    redrawCell(x, y);
}

function redrawCell(x, y) {
    const visibleCell = visibleCells[`${x},${y}`];
    const { directions, movements } = visibleCell;
    const canvasX = x * cellSize;
    const canvasY = y * cellSize;
    
    context.fillStyle = heatColor(movements);
    context.fillRect(canvasX, canvasY, cellSize, cellSize);
    context.strokeStyle = COLORS.GRID;
    context.lineWidth = 1;
    context.strokeRect(canvasX, canvasY, cellSize, cellSize);

    drawBorders(canvasX, canvasY, directions);
}

function drawBorders(canvasX, canvasY, directions) {
    context.strokeStyle = COLORS.WALLS;
    context.lineWidth = 1.5;
    const borders = CELL_TYPE[directions];
    if (borders) {
        if (borders.left) {
            context.beginPath();
            context.moveTo(canvasX, canvasY);
            context.lineTo(canvasX, canvasY + cellSize);
            context.stroke();
        }
        if (borders.top) {
            context.beginPath();
            context.moveTo(canvasX, canvasY);
            context.lineTo(canvasX + cellSize, canvasY);
            context.stroke();
        }
        if (borders.right) {
            context.beginPath();
            context.moveTo(canvasX + cellSize, canvasY);
            context.lineTo(canvasX + cellSize, canvasY + cellSize);
            context.stroke();
        }
        if (borders.bottom) {
            context.beginPath();
            context.moveTo(canvasX, canvasY + cellSize);
            context.lineTo(canvasX + cellSize, canvasY + cellSize);
            context.stroke();
        }
    }
}


export function processAndRenderData(data) {
    const sheepData = getSheepData();
    const toDraw = Object.values(data.reduce((acc, currentObj) => {
        const { sheepId, totalSteps, coordinates: { x, y }} = currentObj;
        // const rect = container.select(`rect[coord-x="${x}"][coord-y="${y}"]`);

        sheepData[sheepId] = { totalSteps, coordinates: { x, y } };
        // rect.attr("movements", "1");

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
    // container.selectAll("rect").remove();
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSheepData({});
    drawGrid();
    loadCaveData(caveId);
}

export function centerOn(x, y) {
    // Calculate the new translation based on the sheep's position.
    const translateX = (canvas.width / 2) - (x * cellSize * currentTransform.k);
    const translateY = (canvas.height / 2) - (y * cellSize * currentTransform.k);

    // Update the current transform with the new translation while keeping the current scale.
    currentTransform = d3.zoomIdentity.translate(translateX, translateY).scale(currentTransform.k);

    // Smoothly transition to the new center position.
    d3.select(canvas).transition()
        .duration(750)
        .call(zoom.transform, currentTransform);
}