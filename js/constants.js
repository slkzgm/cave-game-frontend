export const BACKEND_URL = '172.18.32.103:9080';

export const COLORS = {
    UNREVEALED: "#333333",
    REVEALED: "#cccccc",
    ACTUAL: "#ffffff",
    DIGGABLE: "#00fff7",
    DIGGED: "#0050b7",
    WALLS: "#ff0000",
    DUTYFREE: "#956565"
};

export const CELL_TYPE = {
    2: { top: true, right: true, bottom: true },
    4: { left: true, top: true, bottom: true },
    6: { top: true, bottom: true },
    8: { left: true, bottom: true, right: true },
    10: { right: true, bottom: true },
    12: { left: true, bottom: true },
    14: { bottom: true },
    16: { left: true, right: true, top: true },
    18: { top: true, right: true },
    20: { left: true, top: true },
    22: { top: true },
    24: { left: true, right: true },
    26: { right: true },
    28: { left: true },
    30: {},
    50: { right: true, bottom: true, top: true },
    52: { left: true, bottom: true, top: true },
    54: { top: true, bottom: true },
    56: { left: true, bottom: true, right: true },
    58: { right: true, bottom: true },
    60: { left: true, bottom: true },
    62: { bottom: true },
    64: { left: true, right: true, top: true },
    66: { top: true, right: true },
    68: { left: true, top: true },
    70: { top: true },
    72: { left: true, right: true },
    74: { right: true },
    76: { left: true },
    78: {}
};
