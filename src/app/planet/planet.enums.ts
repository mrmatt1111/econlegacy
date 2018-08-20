export enum LandType {
    Water = 0,
    Low = 1,
    Medium = 2,
    High = 3
}

export enum Season {
    Winter = 0,
    Spring = 1,
    Summer = 2,
    Fall = 3
}

export enum LandTransition {
    None = -1,  // open ground/water
    North = 0,      // 1 touching
    East = 1,
    South = 2,
    West = 3,
    NE_up = 4,      // 2 touching
    SE_up = 5,
    SW_up = 6,
    NW_up = 7,
    NE_down = 8,    // 0 touching
    SE_down = 9,
    SW_down = 10,
    NW_down = 11
}

export enum Neighbor {
    NW = 1 << 0,
    N = 1 << 1,
    NE = 1 << 2,
    W = 1 << 3,
    E = 1 << 4,
    SW = 1 << 5,
    S = 1 << 6,
    SE = 1 << 7
}

export enum RoadType {
    None,
    // road ends
    EndN,
    EndE,
    EndS,
    EndW,
    // full road
    NS,
    EW,
    // edge roaad
    N,
    S,
    E,
    W,
    // Corners
    CornerNE,
    CornerSE,
    CornerSW,
    CornerNW,
    // three way intersection (T)
    TN,
    TE,
    TS,
    TW,
    // cross
    Cross
}

export enum Orientation {
    _0,
    _90,
    _180,
    _270
}

export enum Direction {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
}
