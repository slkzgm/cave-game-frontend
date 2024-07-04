import { changeCave, changeSheep, centerOn  } from './grid.js';
import { connectWebSocket } from './websocket.js';
import {
    // loadColors,
    // applyColors,
    // resetColors,
    displayActualCaveDetails,
    fetchAvailableCaves,
    fetchLastCaveDetails,
    showTab
} from './ui.js';
import { getSheepData } from './state.js';

document.addEventListener('DOMContentLoaded', () => {

    if (!window.socket) {
        connectWebSocket();
    }

    document.getElementById('center-btn').addEventListener('click', () => {
        const x = parseInt(document.getElementById('x-coord').value);
        const y = parseInt(document.getElementById('y-coord').value);
        centerOn(x, y);
    });

    document.getElementById('sheep-selector').addEventListener('change', function() {
        const sheepId = this.value;
        changeSheep(sheepId);
    });

    document.getElementById('cave-btn').addEventListener('click', () => {
        const caveId = parseInt(document.getElementById('cave-number').value);
        changeCave(caveId);
    });

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
                resultContainer.innerHTML = formatResult(result);
            } catch (error) {
                resultContainer.innerHTML = `Error: ${error.message}`;
            }
        });

        function formatResult(result) {
            const explanation = `
                <h4>Calculation Explanation:</h4>
            <p>
                The gold estimation is calculated as follows:
                <ol>
                    <li>Total number of CRACKED caves is retrieved (87 caves).</li>
                    <li>The total percentage looted across all caves is calculated (5792.775%).</li>
                    <li>The average percentage looted per cave is calculated (5792.775% / 87 ≈ 66.5836%).</li>
                    <li>The total golds available (450,000) are divided by the average percentage looted to get the effective gold pool (450,000 / 0.665836 ≈ 676,157.14 golds).</li>
                    <li>The effective gold pool (676,157.14) is divided by the total number of CRACKED caves (87) to determine the golds per cave that reaches 100% looted (676,157.14 / 87 ≈ 7,768.30 golds per cave).</li>
                    <li>For each cave, the percentage looted is used to determine the golds allocated to the cave.</li>
                    <li>The leaderboard for each cave is retrieved.</li>
                    <li>For each player in the leaderboard, the golds allocated to the cave are multiplied by the player's share percentage in that cave.</li>
                </ol>
            </p>
            <p>
                Mathematical formula:
                <br>
                    <strong>Total Golds Allocated to a Player in a Cave = (Golds per 100% Cave) * (% Looted / 100) * (Player's Share / 100)</strong>
            </p>
            <p>
                For example, if there are 87 caves, each cave will have up to 7,768.30 golds if it reaches 100%. If a cave is 50% looted, then 3,884.15 golds are distributed. If a player in this cave has 10% of the shares, then they will receive 388.42 golds for that cave.
            </p>
            <p>
                Note: For display purposes, the average looted percentage is rounded to 67%, and the maximum gold per cave is rounded to 7,720 to be conservative.
            </p>
            <p>
                Special thanks to @castorinho and @nftbeliever for their explanations and support!
            </p>
            `

            let html = `<h3>Total Gold: ${result.total.toFixed(2)}</h3>`;
            html += `<table><tr><th>Cave ID</th><th>Points</th><th>Gold</th></tr>`;
            for (const caveId in result.details) {
                const detail = result.details[caveId];
                html += `<tr><td>${caveId}</td><td>${detail.pts}</td><td>${detail.gold.toFixed(2)}</td></tr>`;
            }
            html += `</table>`;
            html += explanation;
            return html;
        }
    });
});