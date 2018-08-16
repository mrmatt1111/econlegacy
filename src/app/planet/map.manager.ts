import { LandTile } from './land-tile';
import { LandTransition } from './map.enums';
import { Location, Orientation, Direction } from './location';

export class MapManager {

    map: LandTile[][];

    width: number;
    height: number;

    orientation: Orientation = Orientation._0;
    location: Location = new Location(0, 0);

    scale = .5;
    inverseScale = 1 / this.scale;

    private _drawableTiles: LandTile[];

    constructor() {

    }

    init(width: number, height: number) {
        this.map = [];
        this.width = width;
        this.height = height;

        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                row.push(
                    new LandTile(new Location(x, y))
                );
            }
            this.map.push(row);
        }
        Location.setBounds(width, height);
    }

    setupLandTransitions() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let tile: LandTile = this.getTile(x, y); // this.map[y][x];

                // let tx = tile.location.tx;
                // let ty = tile.location.ty;

                let neighbor: LandTile;

                let up: LandTransition[] = [];

                // transition up: 1 or 2 are touching up
                neighbor = this.getTile(x, y - 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    up.push(LandTransition.North);
                }

                neighbor = this.getTile(x + 1, y);
                if (neighbor && neighbor.landType > tile.landType) {
                    up.push(LandTransition.East);
                }

                neighbor = this.getTile(x, y + 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    up.push(LandTransition.South);
                }

                neighbor = this.getTile(x - 1, y);
                if (neighbor && neighbor.landType > tile.landType) {
                    up.push(LandTransition.West);
                }

                // (11, 13)

                // if (x === 11 && y === 13) {
                //     debugger;
                // }

                if (up.length > 0) {
                    if (up.length === 1) {
                        tile.landTrasition = <any>up[0];
                    } else {
                        if (up[0] === LandTransition.North && up[1] === LandTransition.West) {
                            tile.landTrasition = LandTransition.NW_up;
                        } else {
                            tile.landTrasition = <any>up[0] + 4;
                        }
                    }
                    continue;
                }

                // transition down: 1 touching down
                let down: LandTransition[] = [];

                neighbor = this.getTile(x + 1, y - 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    down.push(LandTransition.NE_up);
                }

                neighbor = this.getTile(x + 1, y + 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    down.push(LandTransition.SE_up);
                }

                neighbor = this.getTile(x - 1, y + 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    down.push(LandTransition.SW_up);
                }

                neighbor = this.getTile(x - 1, y - 1);
                if (neighbor && neighbor.landType > tile.landType) {
                    down.push(LandTransition.NW_up);
                }

                if (down.length === 1) {
                    tile.landTrasition = down[0] + 4;
                    continue;
                }

                // flat land
                tile.landTrasition = LandTransition.None;
            }
        }
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
        if (this.orientation-- === Orientation._0) { // fun with --
            this.orientation = Orientation._270;
        }

        let x = this.location.mx;
        let y = this.location.my;

        // todo: move current position to the rotated position

        this.setOrientation(this.orientation);
    }

    setOrientation(orientation: Orientation) {
        this.orientation = orientation;
        this.orientate(this.orientation);
        Location.orientation = orientation;
    }

    zoom(into: boolean) {
        if (into) {
            this.scale = this.scale * 2;
            if (this.scale > 4) {
                this.scale = 4;
            }
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
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

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

    get drawableTiles(): LandTile[] {
        return this._drawableTiles;
    }

    getTile(x: number, y: number) {
        if (y < 0 || y >= this.map.length) {
            return undefined;
        }
        return this.map[y][x];
    }
}
