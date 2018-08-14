import { MapTile } from "./map-tile";
import { Location, Orientation } from './location';

export class MapManager {

    map: MapTile[][];

    width: number;
    height: number;

    orientation: Orientation = Orientation._0;
    location: Location = new Location(0, 0);

    constructor() {

    }

    scale = .5;
    inverseScale = 1 / this.scale;

    init(width: number, height: number) {
        this.map = [];
        this.width = width;
        this.height = height;

        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(
                    new MapTile(new Location(x, y))
                );
            }
            this.map.push(row);
        }
        Location.setBounds(width, height);
    }

    gotoTile(tx: number, ty: number) {
        this.location.gotoTile(this.orientation, tx, ty);
    }

    rotateRight() {
        this.orientation = ++this.orientation % 4;

        let x = this.location.mx;
        let y = this.location.my;

        // todo: move current position to the rotated position
        
        this.setOrientation(this.orientation);
    }

    rotateLeft() {
        if (this.orientation-- === Orientation._0) // fun with --
            this.orientation = Orientation._270;

        let x = this.location.mx;
        let y = this.location.my;

        // todo: move current position to the rotated position

        this.setOrientation(this.orientation);
    }

    setOrientation(orientation: Orientation) {
        this.orientation = orientation;
        this.orientate(this.orientation);
    }

    zoom(into: boolean) {
        if (into) {
            this.scale = this.scale * 2;
            if (this.scale > 4)
                this.scale = 4;
        } else {
            this.scale = this.scale * .5;
            if (this.scale < .24) {
                this.scale = .25;
            }
        }
    }

    orientate(rotation: Orientation) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.map[y][x].location.orientate(rotation);
            }
        }
    }

    inBounds(x: number, y: number) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height
    }

    private _drawableTiles: MapTile[];

    gatherDrawableTiles() {
        this._drawableTiles = [];

        // if (true === true) {
        //     this._drawableTiles.push(this.map[0][0]);
        //     return;
        // }

        
        let row;
        for (let y = 0; y < this.height; y++) {
            row = this.map[y];            
            for (let x = this.width - 1; x >= 0; x--) { 
                this._drawableTiles.push(row[x]);
            }
        }
    }

    get drawableTiles(): MapTile[] {
        return this._drawableTiles;
    }

    getTile(x: number, y: number) {
        if (y >= this.map.length)
            return undefined;
        return this.map[y][x];
    }    
}
