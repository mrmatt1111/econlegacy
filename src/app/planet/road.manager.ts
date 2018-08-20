import { Road } from './road';
import { MapManager, Neighbors } from './map.manager';
import { LandTile } from './land-tile';
import { RoadType, Neighbor } from './planet.enums';

export class RoadManager {

    private roads: Road[];
    lookup: number[] = [];

    constructor(public map: MapManager) {
        this.reset();
        this.setupLookup();
    }

    reset() {
        this.roads = [];
    }

    setupLookup() {
        this.lookup[Neighbor.N + Neighbor.S] = RoadType.NS;
        this.lookup[Neighbor.E + Neighbor.W] = RoadType.EW;
        this.lookup[Neighbor.N + Neighbor.E] = RoadType.CornerNE;
        this.lookup[Neighbor.S + Neighbor.E] = RoadType.CornerSE;
        this.lookup[Neighbor.S + Neighbor.W] = RoadType.CornerSW;
        this.lookup[Neighbor.N + Neighbor.W] = RoadType.CornerNW;

        this.lookup[Neighbor.N + Neighbor.NE] = RoadType.EndN;
        this.lookup[Neighbor.N + Neighbor.NW] = RoadType.EndN;

        this.lookup[Neighbor.NE + Neighbor.E] = RoadType.EndE;
        this.lookup[Neighbor.E + Neighbor.SE] = RoadType.EndE;
        this.lookup[Neighbor.SW + Neighbor.W] = RoadType.EndW;
        this.lookup[Neighbor.W + Neighbor.NW] = RoadType.EndW;

        // this.lookup[] = ;
    }

    calcRoadTypes(sx?: number, sy?: number, width?: number, height?: number) {

        let roads = this.roads;

        roads.forEach((road) => {
            let neighbors: Neighbors = this.map.neighbors(road.tile, (tile) => {
                return tile.zone === 5;
            });

            // road.roadType = RoadType.None;

            let lookup = this.lookup[neighbors.neighbors];

            road.roadType = lookup !== undefined ? lookup : RoadType.None;


        });
    }

    verifyRoute(tiles: LandTile[]) {
        return true;
    }

    addRoads(tiles: LandTile[], verifyRoute: boolean = true): void {
        if (!tiles || verifyRoute && !this.verifyRoute(tiles)) {
            return;
        }

        let route: LandTile[] = [];

        let minx = Number.MAX_SAFE_INTEGER, maxx = 0, miny = Number.MAX_SAFE_INTEGER, maxy = 0;

        tiles.forEach((tile) => {
            if (tile.road) {
                return;
            }

            route.push(tile);

            let id = tile.location.tx + tile.location.ty * this.map.height;
            tile.road = new Road(RoadType.None, tile, id);

            if (tile.location.tx < minx) {
                minx = tile.location.tx;
            }
            if (tile.location.tx > maxx) {
                maxx = tile.location.tx;
            }

            if (tile.location.ty < miny) {
                miny = tile.location.ty;
            }
            if (tile.location.ty > maxy) {
                maxy = tile.location.ty;
            }

            this.roads[tile.road.id] = tile.road;
        });


        if (route.length > 0) {
            this.calcRoadTypes(minx - 1, miny - 1, maxx - minx + 1, maxy - miny + 1);
        }
    }
}
