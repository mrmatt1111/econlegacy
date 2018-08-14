
import { Location } from './location';

export enum LandType {
    Water,
    Low,
    Medium,
    High
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
            case LandType.High: buffer.fillStyle = "DarkGreen"; break;;
            case LandType.Medium: buffer.fillStyle = "Green"; break;;
            case LandType.Low: buffer.fillStyle = "Yellow"; break;;
            case LandType.Water: buffer.fillStyle = "DarkBlue"; break;;
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