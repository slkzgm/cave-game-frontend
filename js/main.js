import { changeCave, centerOnSheep } from './grid.js';
import { connectWebSocket } from './websocket.js';
import {
    loadColors,
    applyColors,
    resetColors,
    displayActualCaveDetails,
    fetchAvailableCaves,
    fetchLastCaveDetails,
    showTab
} from './ui.js';
import { getSheepData } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
    loadColors();
    // drawGrid();

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

    document.querySelector('.tab-button:nth-child(1)').addEventListener('click', () => showTab('tab1'));
    document.querySelector('.tab-button:nth-child(2)').addEventListener('click', () => {
        showTab('tab2');
        displayActualCaveDetails();
    });
    document.querySelector('.tab-button:nth-child(3)').addEventListener('click', () => {
        showTab('tab3');
        fetchAvailableCaves();
    });
    document.querySelector('.tab-button:nth-child(4)').addEventListener('click', () => {
        showTab('tab4');
        fetchLastCaveDetails();
    });
    document.querySelector('.tab-button:nth-child(5)').addEventListener('click', () => {
        window.open('https://github.com/slkzgm/cave-game-extension/releases/tag/v1.0.1', '_blank');
    });
    document.querySelector('.tab-button:nth-child(6)').addEventListener('click', () => {
        window.open('https://discord.com/invite/PZyRJh4ntc', '_blank');
    });
    document.querySelector('.tab-button:nth-child(7)').addEventListener('click', () => {
        window.open('https://x.com/cavegamebot', '_blank');
    });
    document.querySelector('.tab-button:nth-child(8)').addEventListener('click', () => {
        showTab('tab5');
        
        const goldEstimationForm = document.getElementById('gold-estimation-form');
        goldEstimationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const twitterHandle = document.getElementById('twitter-handle').value;
            const resultContainer = document.getElementById('gold-estimation-result');
            resultContainer.innerHTML = 'Loading...';

            try {
                const response = await fetch(`https://cavegame.slkzgm.com/estimateGold/${twitterHandle}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result = await response.json();
                resultContainer.innerHTML = `<h3>Total Gold: ${result.total}</h3><pre>${JSON.stringify(result.details, null, 2)}</pre>`;
            } catch (error) {
                resultContainer.innerHTML = `Error: ${error.message}`;
            }
        });
    });
});