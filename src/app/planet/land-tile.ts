import { Location } from './location';
import { TileLoader } from './loaders/tile.loader';
import { LandType, LandTransition, Orientation } from './planet.enums';

export class LandTile {

    static loader: TileLoader = new TileLoader();
    static showZones = false;

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

    zone = Math.floor(Math.random()*9+1);

    baseImageIndex = Math.floor(3 * Math.random());
    constructor(public location: Location) {
    }

    getContextRect(): ClientRect {
        return <ClientRect>{
            width: 32,
            height: 32,
            top: this.location.y,
            bottom: this.location.y + 32,
            left: this.location.x,
            right: this.location.x + 64
        };
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

            let blend = LandTile.loader.blended[this.landType][landTrasition][LandTile.showZones && this.landType !== LandType.Water ? this.zone : 0];
            if (blend) {
                return blend;
            }
        }
        return undefined;
    }

    get baseImage() {
        if (!LandTile.loader.base[this.landType]) {
            return undefined;
        }
        let images = LandTile.loader.base[this.landType][this.baseImageIndex]

        if (images.length > 0) {
            // debugger;
        }

        if (this.landType !== LandType.Water) {
            return images[LandTile.showZones ? this.zone : 0];
        }
        return images[0];
    }
}