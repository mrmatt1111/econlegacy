import { Location, Point } from './location';
import { TileLoader } from './loaders/tile.loader';
import { LandType, LandTransition, Orientation } from './planet.enums';
import { Random } from '../shared';
import { Road } from './road';

export interface NatureDetail {
    groundImage: HTMLImageElement[];

    airImage: HTMLImageElement;
    airOffset: Point;
}

export class LandTile {

    static loader: TileLoader = new TileLoader();
    static showZones = false;
    static showNature = true;

    static random: Random = new Random();

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
    natureIndex = undefined;

    zone = 0; // LandTile.random.nextInt(8) + 1;

    road: Road = undefined;

    baseImageIndex = LandTile.random.nextInt(3); // probably need to reset random as they drift through the seasons
    constructor(public location: Location) {
    }

    getExtraHeight() {
        let nature = this.getNature();
        if (!LandTile.showNature || !nature || !nature.airImage) {
            return 0;
        }

        let extra = nature.airImage.height - nature.airOffset.y - 32;

        return extra < 0 ? 0 : extra;
    }

    getNature(): NatureDetail {
        if (!LandTile.showNature || this.natureIndex === undefined) {
            return undefined;
        }
        return LandTile.loader.nature[this.landType][this.natureIndex];
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

            let blend = LandTile.loader.blended[this.landType][landTrasition]
            [LandTile.showZones && this.landType !== LandType.Water ? this.zone : 0];
            if (blend) {
                return blend;
            }
        } else if (this.natureIndex !== undefined) {
            let nature = this.getNature();
            if (nature) {
                return nature.groundImage[LandTile.showZones ? this.zone : 0];
            }
        }
        return undefined;
    }

    get baseImage() {
        if (!LandTile.loader.base[this.landType]) {
            return undefined;
        }
        let images = LandTile.loader.base[this.landType][this.baseImageIndex];

        if (images.length > 0) {
            // debugger;
        }

        if (this.landType !== LandType.Water) {
            return images[LandTile.showZones ? this.zone : 0];
        }
        return images[0];
    }
}
