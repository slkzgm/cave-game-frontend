import { COLORS, CELL_TYPE, BACKEND_URL } from './constants.js';
import { updateSheepSelector, updateCaveDetails } from './ui.js';
import { setCurrentCaveId, setSheepData, getSheepData } from './state.js';

let visibleCells = {};  // Object to store the state of each visible cell

const canvas = document.getElementById('mazeCanvas');
const cellSize = 8;
const gridSize = 600;
canvas.width = cellSize * gridSize;
canvas.height = cellSize * gridSize;
const context = canvas.getContext('2d');

// Create an off-screen canvas
const offScreenCanvas = document.createElement('canvas');
offScreenCanvas.width = canvas.width;  // 'canvas' is the on-screen canvas
offScreenCanvas.height = canvas.height;
const offCtx = offScreenCanvas.getContext('2d');

let zoomLevel = 0.5;
let offsetX = 0, offsetY = 0;
let isDragging = false;
let startDragOffset = {};

canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    startDragOffset.x = e.clientX - offsetX;
    startDragOffset.y = e.clientY - offsetY;
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        offsetX = e.clientX - startDragOffset.x;
        offsetY = e.clientY - startDragOffset.y;
        redrawCanvas();
    }
});

canvas.addEventListener('mouseup', function(e) {
    isDragging = false;
});

canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldZoom = zoomLevel;
    const delta = e.deltaY * -0.01;
    zoomLevel += delta;
    zoomLevel = Math.max(0.1, Math.min(zoomLevel, 10)); // Clamp the zoom level

    // console.log("zoom level:", zoomLevel);

    // Calculate the new offset to keep the mouse position as the center of zoom
    offsetX -= (mouseX - offsetX) * (zoomLevel - oldZoom) / oldZoom;
    offsetY -= (mouseY - offsetY) * (zoomLevel - oldZoom) / oldZoom;

    redrawCanvas();
});



// copy the pre-rendered off-screen canvas to the visible canvas
function redrawCanvas() {
    // console.log("offsetX and offsetY:", offsetX, offsetY);
    // console.log("zoomLevel:", zoomLevel);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(offsetX, offsetY);
    context.scale(zoomLevel, zoomLevel);
    context.drawImage(offScreenCanvas, 0, 0);
    context.restore();
    // console.log("redrawCanvas ends!");
}



// draw grid on off-canvas
export function drawGrid() {
    offCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            offCtx.fillStyle = COLORS.UNREVEALED;
            offCtx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            offCtx.strokeStyle = COLORS.GRID;
            offCtx.lineWidth = 1;
            offCtx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    }
    // Redraw each visible cell stored in the dictionary
    Object.keys(visibleCells).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        redrawCell(x, y); // Pass correct arguments
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
    if (!visibleCell || !visibleCell.x || !visibleCell.y || !visibleCell.directions) {
        console.error("Invalid cell data", visibleCell);
        return; // Skip drawing this cell to avoid errors
    }
    const { x, y, directions, diggable, movements } = visibleCell;
    visibleCells[`${x},${y}`] = visibleCell;  // Store cell state keyed by its coordinates
    redrawCell(x, y);
}

function redrawCell(x, y) {
    const visibleCell = visibleCells[`${x},${y}`];
    if (!visibleCell) {
        console.error("No data available for cell:", x, y);
        return; // Exit if no data is found
    }
    const { directions, movements } = visibleCell;
    const canvasX = x * cellSize;
    const canvasY = y * cellSize;

    offCtx.fillStyle = heatColor(movements);
    offCtx.fillRect(canvasX, canvasY, cellSize, cellSize);
    offCtx.strokeStyle = COLORS.GRID;
    offCtx.lineWidth = 1;
    offCtx.strokeRect(canvasX, canvasY, cellSize, cellSize);

    drawBorders(offCtx, canvasX, canvasY, directions);
}

function drawBorders(ctx, canvasX, canvasY, directions) {
    ctx.strokeStyle = COLORS.WALLS;
    ctx.lineWidth = 2;
    const borders = CELL_TYPE[directions];
    if (borders) {
        if (borders.left) {
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX, canvasY + cellSize);
            ctx.stroke();
        }
        if (borders.top) {
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY);
            ctx.lineTo(canvasX + cellSize, canvasY);
            ctx.stroke();
        }
        if (borders.right) {
            ctx.beginPath();
            ctx.moveTo(canvasX + cellSize, canvasY);
            ctx.lineTo(canvasX + cellSize, canvasY + cellSize);
            ctx.stroke();
        }
        if (borders.bottom) {
            ctx.beginPath();
            ctx.moveTo(canvasX, canvasY + cellSize);
            ctx.lineTo(canvasX + cellSize, canvasY + cellSize);
            ctx.stroke();
        }
    }
}

export function processAndRenderData(data) {
    const sheepData = getSheepData();
    const toDraw = Object.values(data.reduce((acc, currentObj) => {
        const { sheepId, totalSteps, coordinates: { x, y }} = currentObj;
        sheepData[sheepId] = { totalSteps, coordinates: { x, y } };
        currentObj.visible.forEach(element => {
            if (element && element.x !== undefined && element.y !== undefined && element.directions !== undefined) {
                const positionKey = `${element.x},${element.y}`;
                if (!acc[positionKey]) {
                    acc[positionKey] = {...element, movements: 1}; // Set movements to 1 if it's a new element
                } 
            } else {
                console.error("Missing or invalid data for visible element:", element);
            }
        });
        return acc;
    }, {}));

    setSheepData(sheepData);
    toDraw.forEach(drawVisible);
    drawGrid();  // Update the off-screen canvas after processing new data
    updateSheepSelector();
    redrawCanvas();
}

export function drawSheep(x,y){
    const canvasX = x * cellSize;
    const canvasY = y * cellSize;
    offCtx.fillStyle = COLORS.ACTUAL;
    offCtx.fillRect(canvasX, canvasY, cellSize, cellSize);
    // console.log("current sheep here:", canvasX, canvasY);

    // var img = new Image();   // Create a new image object
    // img.src = 'favicon.ico';  // Set the source of the image
    // img.onload = function() {
    //     // Draw the image on the canvas at the desired coordinates
    //     console.log("draw image here:", x, y);
    //     offCtx.drawImage(img, canvasX + 1, canvasY + 1, 6, 6);  
    // };
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSheepData({});
    drawGrid();
    loadCaveData(caveId);
    // zoomLevel = 0.2;
    centerOn(300,300, 0.2);
}

export function centerOn(x, y, targenZoom) {
    // console.log("centerOn Start")
    // console.log("zoomLevel:", zoomLevel);

    let zoomCenterLevel = 0;
    if(!targenZoom){
        zoomCenterLevel = zoomLevel;
    }else{
        zoomCenterLevel = targenZoom;
    }

    // Get the bounding rectangle of the map container
    const mapDiv = document.getElementById('map');
    const rect = mapDiv.getBoundingClientRect();

    // Calculate the pixel position of the center of the target cell
    const targetX = x * cellSize + cellSize / 2;
    const targetY = y * cellSize + cellSize / 2;

    // Center point of the map container
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Adjust offsets for zoom: The canvas coordinate (targetX, targetY) should be at the center of the viewport (400, 400) of div#map
    offsetX = (centerX - targetX * zoomCenterLevel); // 400 is half of 800, which centers the point in the viewport
    offsetY = (centerY - targetY * zoomCenterLevel);

    zoomLevel = zoomCenterLevel;

    // console.log("New offsetX and offsetY calculated to center on cell:", offsetX, offsetY);

    // console.log("centerOn End");
    redrawCanvas();
}
