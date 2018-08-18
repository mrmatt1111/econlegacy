import { LandTile } from './land-tile';
import { LandTransition, Orientation, LandType } from './planet.enums';
import { Location } from './location';
import { EventEmitter } from '@angular/core';
import { TileLoader } from './loaders/tile.loader';

export class MapManager {

    map: LandTile[][];

    width: number;
    height: number;

    orientation: Orientation = Orientation._0;
    location: Location = new Location(0, 0);

    scale = 1;
    inverseScale = 1 / this.scale;

    onZoom: EventEmitter<number> = new EventEmitter<number>();
    onRotate: EventEmitter<Orientation> = new EventEmitter<Orientation>();

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

    forEach(each: (tile: LandTile, x: number, y: number) => void) {
        for (let y = 0, h = this.height; y < h; y++) {
            for (let x = 0, w = this.width; x < w; x++) {
                each(this.map[y][x], x, y);
            }
        }
    }

    setupLandTransitions() {
        this.forEach((tile: LandTile, x: number, y: number) => {
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
                return;
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
                return;
            }

            // flat land
            tile.landTrasition = LandTransition.None;
        });

        // for (let y = 0; y < this.height; y++) {
        //     for (let x = 0; x < this.width; x++) {
        //         let tile: LandTile = this.getTile(x, y); // this.map[y][x];

        //         // let tx = tile.location.tx;
        //         // let ty = tile.location.ty;

        //         let neighbor: LandTile;

        //         let up: LandTransition[] = [];

        //         // transition up: 1 or 2 are touching up
        //         neighbor = this.getTile(x, y - 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             up.push(LandTransition.North);
        //         }

        //         neighbor = this.getTile(x + 1, y);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             up.push(LandTransition.East);
        //         }

        //         neighbor = this.getTile(x, y + 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             up.push(LandTransition.South);
        //         }

        //         neighbor = this.getTile(x - 1, y);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             up.push(LandTransition.West);
        //         }

        //         // (11, 13)

        //         // if (x === 11 && y === 13) {
        //         //     debugger;
        //         // }

        //         if (up.length > 0) {
        //             if (up.length === 1) {
        //                 tile.landTrasition = <any>up[0];
        //             } else {
        //                 if (up[0] === LandTransition.North && up[1] === LandTransition.West) {
        //                     tile.landTrasition = LandTransition.NW_up;
        //                 } else {
        //                     tile.landTrasition = <any>up[0] + 4;
        //                 }
        //             }
        //             continue;
        //         }

        //         // transition down: 1 touching down
        //         let down: LandTransition[] = [];

        //         neighbor = this.getTile(x + 1, y - 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             down.push(LandTransition.NE_up);
        //         }

        //         neighbor = this.getTile(x + 1, y + 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             down.push(LandTransition.SE_up);
        //         }

        //         neighbor = this.getTile(x - 1, y + 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             down.push(LandTransition.SW_up);
        //         }

        //         neighbor = this.getTile(x - 1, y - 1);
        //         if (neighbor && neighbor.landType > tile.landType) {
        //             down.push(LandTransition.NW_up);
        //         }

        //         if (down.length === 1) {
        //             tile.landTrasition = down[0] + 4;
        //             continue;
        //         }

        //         // flat land
        //         tile.landTrasition = LandTransition.None;
        //     }
        // }
    }

    setupNature() {
        this.forEach((tile: LandTile, x: number, y: number) => {
            if (tile.landTrasition !== LandTransition.None) {
                return;
            }

            // + fixme: grab it from the array size of what is loaded
            let natureSize;

            switch (tile.landType) {
                case LandType.Water: natureSize = 0; break;
                case LandType.Low: natureSize = 2; break;
                case LandType.Medium: natureSize = 4; break;
                case LandType.High: natureSize = 10; break;
            }
            // -

            let index = Math.floor(Math.random() * natureSize);

            if (tile.landType === LandType.High && index === 5) {
                index = 0; // looks weird
            }

            tile.natureIndex = Math.random() < .35 ? index : -1;

        });
    }

    gotoTile(tx: number, ty: number) {
        this.location.gotoTile(this.orientation, tx, ty);
    }

    rotateRight() {
        this.orientation = ++this.orientation % 4;

        let x = this.location.x;
        let y = this.location.y;

        // todo: move current position to the rotated position

        this.setOrientation(this.orientation);
        this.onRotate.emit(this.orientation);
    }

    rotateLeft() {
        if (this.orientation-- === Orientation._0) {
            this.orientation = Orientation._270;
        }

        let x = this.location.x;
        let y = this.location.y;

        // todo: move current position to the rotated position

        this.setOrientation(this.orientation);
        this.onRotate.emit(this.orientation);
    }

    setOrientation(orientation: Orientation) {
        this.orientation = orientation;
        this.orientate(this.orientation);
        Location.orientation = orientation;
    }

    zoom(into: boolean) {
        if (into) {
            this.scale = this.scale * 2;
            if (this.scale > 4.1) {
                this.scale = 4;
            } else {
                this.onZoom.emit(this.scale);
            }
        } else {
            this.scale = this.scale * .5;
            if (this.scale < .24) {
                this.scale = .25;
            } else {
                this.onZoom.emit(this.scale);
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
