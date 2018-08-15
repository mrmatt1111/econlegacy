
import { Location, Direction } from './location';
import { Pixel } from '../shared/pixel';
import { BitMap } from '../shared/bitmap';

export enum LandType {
    Water = 0,
    Low = 1,
    Medium = 2,
    High = 3
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

export class MapTile {
    static baseImages = [];
    static baseLoadCount: number = 4;
    static blendedImages = [];

    get baseImageLoaded(): boolean {
        return this.baseImage !== undefined;
    }

    private _landType: LandType;
    set landType(landType: LandType) {
        this._landType = landType;
    }

    get landType(): LandType {
        return this._landType;
    }

    landTrasition: LandTransition;

    static blend(lowerType: LandType, direction: LandTransition) {
        let lower: HTMLImageElement = MapTile.baseImages[lowerType];
        let upper: HTMLImageElement = MapTile.baseImages[lowerType + 1];

        MapTile.blendedImages[lowerType][direction] = new Image();

        let canvas = document.createElement('canvas');
        let image2 = document.createElement('canvas');

        let w = 64;
        let h = 32;

        canvas.width = w;
        canvas.height = h;

        let buffer1: CanvasRenderingContext2D = canvas.getContext('2d');
        let buffer2: CanvasRenderingContext2D = image2.getContext('2d');

        let maxD = 1 / Math.sqrt(32 * 32 + 16 * 16);

        buffer2.drawImage(upper, 0, 0);
        let upperBM = new BitMap(buffer2.getImageData(0, 0, w, h));

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let border, dx, dy, d, d1, d2, borderNorth, borderEast, borderSouth, borderWest, d1x, d1y, d2x, d2y;

                let sparkle = Math.random() / 75;

                switch (direction) {
                    case LandTransition.North:
                        border = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 16, 8);

                        dx = x - Math.round(border.mx);
                        dy = y - Math.round(border.my + 32);

                        d = Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.East:
                        border = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 64, 32);

                        dx = x - Math.round(border.mx);
                        dy = y - Math.round(border.my + 32);

                        d = 1 - Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.West:
                        border = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 48, 24);

                        dx = x - Math.round(border.mx);
                        dy = y - Math.round(border.my + 32);

                        d = Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.South:
                        border = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 36, 16);

                        dx = x - Math.round(border.mx);
                        dy = y - Math.round(border.my + 32);

                        d = 1 - Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.NE_up:
                        borderNorth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 24, 12); // middle
                        borderEast = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 16, 8);    // middle

                        d1x = x - Math.round(borderNorth.mx);
                        d1y = y - Math.round(borderNorth.my + 32);

                        d1 = Math.sqrt(d1x * d1x + d1y * d1y) * maxD;

                        d2x = x - Math.round(borderEast.mx);
                        d2y = y - Math.round(borderEast.my + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SE_up:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 24, 12);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 16, 8);

                        d1x = x - Math.round(borderSouth.mx);
                        d1x = y - Math.round(borderSouth.my + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.mx);
                        d2y = y - Math.round(borderEast.my + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SW_up:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 24, 12);
                        borderWest = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 56, 28);

                        d1x = x - Math.round(borderSouth.mx);
                        d1x = y - Math.round(borderSouth.my + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.mx);
                        d2y = y - Math.round(borderWest.my + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NW_up:
                        borderNorth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 24, 12); // middle
                        borderWest = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 24, 12);

                        d1x = x - Math.round(borderNorth.mx);
                        d1x = y - Math.round(borderNorth.my + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.mx);
                        d2y = y - Math.round(borderWest.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NE_down:
                        borderNorth = Location.boundPoint(Direction.North, <Location>{ mx: x, my: y - 24 }, 48, 24);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 64 + 12, 32 + 6);

                        d1x = x - Math.round(borderNorth.mx);
                        d1x = y - Math.round(borderNorth.my + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.mx);
                        d2y = y - Math.round(borderEast.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SE_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 48 - 8, 24 + 4);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ mx: x, my: y - 24 }, 64 + 12, 32 + 6);

                        d1x = x - Math.round(borderSouth.mx);
                        d1x = y - Math.round(borderSouth.my + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.mx);
                        d2y = y - Math.round(borderEast.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;

                        if (x === 31 && y === 15) {
                            // debugger;
                        }
                        break;
                    case LandTransition.SW_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 48, 24);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ mx: x, my: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderSouth.mx);
                        d1x = y - Math.round(borderSouth.my + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.mx);
                        d2y = y - Math.round(borderWest.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SW_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ mx: x, my: y - 24 }, 48, 24);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ mx: x, my: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderSouth.mx);
                        d1x = y - Math.round(borderSouth.my + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.mx);
                        d2y = y - Math.round(borderWest.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NW_down:
                        borderNorth = Location.boundPoint(Direction.North, <Location>{ mx: x, my: y - 24 }, 64, 32);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ mx: x, my: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderNorth.mx);
                        d1x = y - Math.round(borderNorth.my + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.mx);
                        d2y = y - Math.round(borderWest.my + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                }


                // *** todo-start: refactor this ***
                if (direction <= 3) {
                    if (d > .60) {
                        d = 1;
                    } else if (d < .50 && d >= .45) {
                        d -= .10;
                    } else if (d < .45 && d >= .35) {
                        d -= .20; // hmm... might want to tweak this some more
                    } else if (d < .35) {
                        d = 0;
                    }
                } else if (direction <= 11) {
                    if (d < .36) {
                        d = 0;
                    } else if (d < .40 && d >= .35) {
                        d -= .10;
                    } else if (d < .46 && d >= .40) {
                        d += .05;
                    } else {
                        d = 1;
                    }
                }
                // *** todo-end: ***

                if (upperBM.pixel[x][y].alpha) {
                    upperBM.pixel[x][y].alpha = Math.floor(255 * d);
                }
            }
        }

        buffer2.putImageData(upperBM.export(), 0, 0);

        buffer1.drawImage(lower, 0, 0);
        buffer1.drawImage(image2, 0, 0);

        MapTile.blendedImages[lowerType][direction].src = canvas.toDataURL();
    }

    static blendImages() {
        [LandType.Water, LandType.Low, LandType.Medium].forEach(
            (landType) => {
                MapTile.blend(landType, LandTransition.North);
                MapTile.blend(landType, LandTransition.East);
                MapTile.blend(landType, LandTransition.South);
                MapTile.blend(landType, LandTransition.West);

                MapTile.blend(landType, LandTransition.NE_up);
                MapTile.blend(landType, LandTransition.SE_up);
                MapTile.blend(landType, LandTransition.SW_up);
                MapTile.blend(landType, LandTransition.NW_up);

                MapTile.blend(landType, LandTransition.NE_down);
                MapTile.blend(landType, LandTransition.SE_down);
                MapTile.blend(landType, LandTransition.SW_down);
                MapTile.blend(landType, LandTransition.NW_down);
            }
        );
    }

    static initBaseImage(landType: LandType) {
        MapTile.blendedImages[LandType.Water] = [];
        MapTile.blendedImages[LandType.Low] = [];
        MapTile.blendedImages[LandType.Medium] = [];
        MapTile.blendedImages[LandType.High] = [];

        let image = new Image();

        let canvas = document.createElement('canvas');

        canvas.width = 64;
        canvas.height = 32;

        let buffer: CanvasRenderingContext2D = canvas.getContext('2d');

        buffer.beginPath();
        buffer.moveTo(0, 16);
        buffer.lineTo(32, 0);
        buffer.lineTo(64, 16);
        buffer.lineTo(32, 32);
        buffer.closePath();

        switch (landType) {
            case LandType.High: buffer.fillStyle = 'DarkGreen'; break;
            case LandType.Medium: buffer.fillStyle = 'Green'; break;
            case LandType.Low: buffer.fillStyle = 'Yellow'; break;
            case LandType.Water: buffer.fillStyle = 'DarkBlue'; break;
        }
        buffer.fill();

        // buffer.fillStyle = 'Yellow';
        // buffer.fillRect(0, 0, 1, 1);

        // buffer.fillStyle = 'Red';
        // buffer.fillRect(31, 15, 1, 1);

        // buffer.strokeStyle = 'White';
        // buffer.stroke();

        image.onload = () => {
            MapTile.baseLoadCount--;
            if (MapTile.baseLoadCount === 0) {
                MapTile.blendImages();
            }
        };
        image.src = canvas.toDataURL();

        MapTile.baseImages[landType] = image;
    }

    constructor(public location: Location) {
    }

    get image() {
        if (this.landTrasition >= 0) {
            let blend = MapTile.blendedImages[this.landType][this.landTrasition];
            if (blend) {
                return blend;
            }
        }
        return undefined;
    }

    get baseImage() {
        return MapTile.baseImages[this.landType];
    }
}
