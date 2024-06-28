export let currentCaveData = { cave: {} };
export let currentCaveId = null;
export let currentSheepId = null;
export let sheepData = {};


export function setCurrentCaveData(newData) {
    currentCaveData = newData;
}

export function getCurrentCaveData() {
    return currentCaveData;
}

export function setCurrentCaveId(newId) {
    currentCaveId = newId;
}

export function getCurrentCaveId() {
    return currentCaveId;
}

export function setSheepData(newData) {
    sheepData = newData;
}

export function getSheepData() {
    return sheepData;
}

export function setCurrentSheepId(newId) {
    currentSheepId = newId;
    console.log("setting current sheep id:", currentSheepId)
}

export function getCurrentSheepId() {
    return currentSheepId;
}