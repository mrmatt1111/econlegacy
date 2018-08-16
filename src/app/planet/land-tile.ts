import { Location, Direction, Orientation } from './location';
import { TileLoader } from './loaders/tile.loader';
import { LandType, LandTransition } from './map.enums';

export class LandTile {

    static loader: TileLoader = new TileLoader();

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

    baseImageIndex = Math.floor(3 * Math.random());
    constructor(public location: Location) {
    }

    get image() {
        if (this.landTrasition >= 0) {
            let landTrasition = this.landTrasition;
            if (Location.orientation !== Orientation._0) {
                if (landTrasition <= 3) {
                    landTrasition = (landTrasition + Location.orientation) % 4;
                } else if (landTrasition <= 7) {
                    landTrasition = (landTrasition + Location.orientation) % 4 + 4;
                } else {
                    landTrasition = (landTrasition + Location.orientation) % 4 + 8;
                }
            }

            let blend = LandTile.loader.blended[this.landType][landTrasition];
            if (blend) {
                return blend;
            }
        }
        return undefined;
    }

    get baseImage() {
        return LandTile.loader.base[this.landType][this.baseImageIndex];
    }
}
