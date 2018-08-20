import { RoadLoader } from './loaders/road.loader';
import { RoadType } from './planet.enums';
import { LandTile } from './land-tile';

export class Road {
    static loader: RoadLoader = new RoadLoader();

    constructor(public roadType: RoadType = RoadType.None, public tile: LandTile, public id: number) {

    }

    get image(): HTMLImageElement {
        return Road.loader.roads[this.roadType];
    }
}
