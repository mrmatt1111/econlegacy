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
