import { drawGrid, changeCave, centerOnSheep } from './grid.js';
import { connectWebSocket } from './websocket.js';
import { loadColors, applyColors, resetColors, displayActualCaveDetails, fetchAvailableCaves, fetchLastCaveDetails } from './ui.js';
import { getSheepData } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    drawGrid();
    loadColors();

    if (!window.socket) {
        connectWebSocket();
    }

    document.getElementById('center-btn').addEventListener('click', () => {
        const x = parseInt(document.getElementById('x-coord').value);
        const y = parseInt(document.getElementById('y-coord').value);
        centerOnSheep(x, y);
    });

    document.getElementById('sheep-selector').addEventListener('change', function() {
        const sheepId = this.value;
        if (sheepId) {
            const sheepData = getSheepData();
            const { coordinates: { x, y } } = sheepData[sheepId];
            centerOnSheep(x, y);
        }
    });

    document.getElementById('cave-btn').addEventListener('click', () => {
        const caveId = parseInt(document.getElementById('cave-number').value);
        changeCave(caveId);
    });

    document.getElementById('apply-colors-btn').addEventListener('click', applyColors);
    document.getElementById('reset-colors-btn').addEventListener('click', resetColors);
    document.querySelector('.tab-button:nth-child(2)').addEventListener('click', displayActualCaveDetails);
    document.querySelector('.tab-button:nth-child(3)').addEventListener('click', fetchAvailableCaves);
    document.querySelector('.tab-button:nth-child(4)').addEventListener('click', fetchLastCaveDetails);
});