export let currentCaveData = { cave: {} };
export let currentCaveId = null;
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