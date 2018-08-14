
import { Location } from './location';

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

    public static images = [];

    image; // = new Image();

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

    constructor(public location: Location) {
    }

    get baseImage() {
        return MapTile.images[this.landType];
    }

    static initBaseImage(landType: LandType) {
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

        };
        image.src = canvas.toDataURL();

        MapTile.images[landType] = image;
    }
}
