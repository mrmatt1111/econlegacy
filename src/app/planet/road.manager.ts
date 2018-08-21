import { Road } from './road';
import { MapManager, Neighbors } from './map.manager';
import { LandTile } from './land-tile';
import { RoadType, Neighbor, Orientation } from './planet.enums';

export class RoadManager {

    private roads: Road[];
    lookup: number[][] = [];

    constructor(public map: MapManager) {
        this.reset();
        this.setupLookup();

        this.map.onRotate.subscribe(() => {
            this.calcRoadTypes();
        });
    }

    reset() {
        this.roads = [];
    }

    setupLookup() {
        let lookup: number[][] = [];

        let rt = RoadType;

        lookup[Neighbor.N] = [rt.EndN, rt.EndE, rt.EndS, rt.EndW];
        lookup[Neighbor.E] = [rt.EndE, rt.EndS, rt.EndW, rt.EndN];
        lookup[Neighbor.S] = [rt.EndS, rt.EndW, rt.EndN, rt.EndE];
        lookup[Neighbor.W] = [rt.EndW, rt.EndN, rt.EndE, rt.EndS];

        lookup[Neighbor.N + Neighbor.S] = [rt.NS, rt.EW, rt.NS, rt.EW];
        lookup[Neighbor.E + Neighbor.W] = [rt.EW, rt.NS, rt.EW, rt.NS];
        lookup[Neighbor.N + Neighbor.E] = [rt.CornerNE, rt.CornerSE, rt.CornerSW, rt.CornerNW];
        lookup[Neighbor.S + Neighbor.E] = [rt.CornerSE, rt.CornerSW, rt.CornerNW, rt.CornerNE];
        lookup[Neighbor.S + Neighbor.W] = [rt.CornerSW, rt.CornerNW, rt.CornerNE, rt.CornerSE];
        lookup[Neighbor.N + Neighbor.W] = [rt.CornerNW, rt.CornerNE, rt.CornerSE, rt.CornerSW];

        lookup[Neighbor.N + Neighbor.NE] = [rt.EndN, rt.EndE, rt.EndS, rt.EndW];
        lookup[Neighbor.N + Neighbor.NW] = [rt.EndN, rt.EndE, rt.EndS, rt.EndW];
        lookup[Neighbor.NE + Neighbor.E] = [rt.EndE, rt.EndS, rt.EndW, rt.EndN];
        lookup[Neighbor.E + Neighbor.SE] = [rt.EndE, rt.EndS, rt.EndW, rt.EndN];
        lookup[Neighbor.S + Neighbor.SE] = [rt.EndS, rt.EndW, rt.EndN, rt.EndE];
        lookup[Neighbor.S + Neighbor.SW] = [rt.EndS, rt.EndW, rt.EndN, rt.EndE];
        lookup[Neighbor.SW + Neighbor.W] = [rt.EndW, rt.EndN, rt.EndE, rt.EndS];
        lookup[Neighbor.W + Neighbor.NW] = [rt.EndW, rt.EndN, rt.EndE, rt.EndS];

        lookup[Neighbor.NW + Neighbor.W + Neighbor.S + Neighbor.SE] = [rt.N, rt.E, rt.S, rt.W];
        lookup[Neighbor.NE + Neighbor.N + Neighbor.W + Neighbor.SW] = [rt.E, rt.S, rt.W, rt.N];
        lookup[Neighbor.NW + Neighbor.N + Neighbor.E + Neighbor.SE] = [rt.S, rt.W, rt.N, rt.E];
        lookup[Neighbor.NE + Neighbor.E + Neighbor.S + Neighbor.SW] = [rt.W, rt.N, rt.E, rt.S];

        lookup[Neighbor.N + Neighbor.E + Neighbor.W] = [rt.TN, rt.TE, rt.TS, rt.TW];
        lookup[Neighbor.N + Neighbor.E + Neighbor.S] = [rt.TE, rt.TS, rt.TW, rt.TN];
        lookup[Neighbor.E + Neighbor.S + Neighbor.W] = [rt.TS, rt.TW, rt.TN, rt.TE];
        lookup[Neighbor.S + Neighbor.W + Neighbor.N] = [rt.TW, rt.TN, rt.TE, rt.TS];

        lookup[Neighbor.N + Neighbor.E + Neighbor.S + Neighbor.W] = [rt.Cross, rt.Cross, rt.Cross, rt.Cross];

        this.lookup = lookup;
    }

    calcRoadTypes(sx?: number, sy?: number, width?: number, height?: number) {
        let roads = this.roads;

        roads.forEach((road) => {
            let neighbors: Neighbors = this.map.neighbors(road.tile, (tile) => {
                return tile.road !== undefined;
            });

            // most likely it will find it
            let lookup = this.lookup[neighbors.neighbors];
            if (lookup) {
                road.roadType = lookup[this.map.orientation] !== undefined ? lookup[this.map.orientation] : RoadType.None;
                return;
            }

            // guess not, looks like we need to do some more work: remove any that we don't care about
            if (neighbors.N) {
                if (!neighbors.E) {
                    neighbors.remove(Neighbor.SE);
                }
                if (!neighbors.W) {
                    neighbors.remove(Neighbor.SW);
                }
            }
            if (neighbors.E) {
                if (!neighbors.N) {
                    neighbors.remove(Neighbor.NW);
                }
                if (!neighbors.S) {
                    neighbors.remove(Neighbor.SW);
                }
            }
            if (neighbors.S) {
                if (!neighbors.E) {
                    neighbors.remove(Neighbor.NE);
                }
                if (!neighbors.W) {
                    neighbors.remove(Neighbor.NW);
                }
            }
            if (neighbors.W) {
                if (!neighbors.N) {
                    neighbors.remove(Neighbor.NE);
                }
                if (!neighbors.S) {
                    neighbors.remove(Neighbor.SE);
                }
            }
            if (neighbors.N && neighbors.E) {
                neighbors.remove(Neighbor.NE);
            }
            if (neighbors.S && neighbors.E) {
                neighbors.remove(Neighbor.SE);
            }
            if (neighbors.S && neighbors.W) {
                neighbors.remove(Neighbor.SW);
            }
            if (neighbors.N && neighbors.W) {
                neighbors.remove(Neighbor.NW);
            }

            // try again
            lookup = this.lookup[neighbors.neighbors];
            road.roadType = lookup && lookup[this.map.orientation] !== undefined ? lookup[this.map.orientation] : RoadType.None;
        });
    }

    verifyRoute(tiles: LandTile[]) {
        return true;
    }

    addRoads(tiles: LandTile[], calcRoads: boolean = true, verifyRoute: boolean = true): void {
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


        if (calcRoads && route.length > 0) {
            this.calcRoadTypes(minx - 1, miny - 1, maxx - minx + 1, maxy - miny + 1);
        }
    }
}
