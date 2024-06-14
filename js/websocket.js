import { processAndRenderData } from './grid.js';
import { updateCaveDetails } from './ui.js';
import { BACKEND_URL } from './constants.js';
import { getCurrentCaveId } from './state.js';

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const reconnectDelay = 10000;

export function connectWebSocket() {
    if (socket !== null) {
        socket.removeEventListener('open', handleSocketOpen);
        socket.removeEventListener('message', handleSocketMessage);
        socket.removeEventListener('close', handleSocketClose);
        socket.removeEventListener('error', handleSocketError);
        socket.close();
    }

    socket = new WebSocket(`ws://${BACKEND_URL}/ws`);

    socket.addEventListener('open', handleSocketOpen);
    socket.addEventListener('message', handleSocketMessage);
    socket.addEventListener('close', handleSocketClose);
    socket.addEventListener('error', handleSocketError);
}

function handleSocketOpen() {
    console.log('Connected to WebSocket');
    reconnectAttempts = 0;
}

function handleSocketMessage(event) {
    const { type, data } = JSON.parse(event.data);
    const currentCaveId = getCurrentCaveId();
    if (type === 'move') {
        if (data.caveId === currentCaveId) {
            console.log('Move message from server ', data);
            processAndRenderData([data]);
            updateCaveDetails(data);
        }
    } else {
        console.log('Message from server ', data);
    }
}

function handleSocketClose() {
    console.error('WebSocket closed, attempting to reconnect...');
    attemptReconnect();
}

function handleSocketError(event) {
    console.error('WebSocket error, attempting to reconnect...', event);
    attemptReconnect();
}

let reconnectTimeout;
function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectWebSocket, reconnectDelay);
    } else {
        console.error('Max reconnect attempts reached. Please check the server.');
    }
}
