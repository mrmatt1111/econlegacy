import { Orientation, Direction } from './planet.enums';

export interface Point {
    x: number;
    y: number;
}

export class Location implements Point {
    get tx(): number {
        return this._tx;
    }

    get ty(): number {
        return this._ty;
    }

    private static tw: number;
    private static th: number;
    public static mw: number;
    public static mh: number;

    public static orientation: Orientation = Orientation._0;

    static fromPoint(point: Point, tx: number = 0, ty: number = 0) {
        return new Location(tx, ty, point.x, point.y);
    }

    static setBounds(width: number, height: number) {
        Location.tw = width;
        Location.th = height;
        Location.mw = 32 * width;
        Location.mh = 32 * height;
    }

    static boundPoint(direction: Direction, location: Location, mw: number = Location.mw, mh: number = Location.mh): Point {

        // let realDirection = (direction + Location.orientation) % 4;

        switch (direction) {
            case Direction.North:
                return <Point>{
                    // |x = -2y <=> y=-.5x| north line
                    // |y= .5(x - mx) + my| perpendictular line from current position

                    // solve x:
                    // -.5x = .5x -.5mx + my
                    x: .5 * location.x - location.y,

                    // solve y:
                    // y = .5(-2y - mx) +my
                    // y = -y -.5mx + my
                    y: (-.5 * location.x + location.y) * .5
                };
            case Direction.East:
                return <Point>{
                    // |y= .5x - .5w - .5h <=> x = 2y + w + h| east line
                    // |y = -.5 (x - mx) + my <=> x = -2y + mx + 2my| perpendictular line from current position

                    // solve for x:
                    // .5x - .5w - .5h = -.5x + .5mx + my
                    x: .5 * location.x + location.y + .5 * mw + .5 * mh,

                    // solve for y:
                    // 2y + w + h = -2y + mx + 2my
                    y: (location.x + 2 * location.y - mw - mh) * .25
                };
            case Direction.South:
                return <Point>{
                    // |y = -.5(x - w) + .5h <=> x = -2y + w + h| south line
                    // |y = .5(x - mx)  + my <=> x = 2y + mx - 2my| perpendictular line from current position

                    // solve x:
                    // -.5(x - w) + .5h = .5(x - mx)  + my
                    // x - w - h = -x + mx - 2my
                    y: -(location.x - 2 * location.y - mw - mh) * .25,

                    // solve y:
                    // -2y + w + h = 2y + mx - 2my
                    x: (location.x - 2 * location.y + mw + mh) * .50
                };
            case Direction.West:
                return <Point>{
                    // [x = 2y] <-- west line
                    // 2y = -x + mx + 2my
                    // [x = mx + 2my - 2y] <-- perpendictular line from current position
                    // 2y = mx + 2my - 2y;
                    // y = (mx + 2my) / 4
                    x: .5 * location.x + location.y,
                    y: .25 * location.x + .5 * location.y
                };
        }
    }

    static calcMx(rotation: Orientation, tx: number, ty: number) {
        switch (rotation) {
            case Orientation._0: return tx * 32 + ty * 32;
            case Orientation._90: return Location.mw - 32 + tx * 32 - ty * 32;
            case Orientation._180: return Location.mw * 2 - 64 - tx * 32 - ty * 32;
            case Orientation._270: return Location.mw - 32 - tx * 32 + ty * 32;
        }
        return 0;
    }

    static calcMy(rotation: Orientation, tx: number, ty: number) {
        switch (rotation) {
            case Orientation._0: return ty * 16 - tx * 16;
            case Orientation._90: return -Location.mh / 2 + 16 + tx * 16 + ty * 16;
            case Orientation._180: return tx * 16 - ty * 16;
            case Orientation._270: return Location.mh * .5 - 16 - tx * 16 - ty * 16;
        }
        return 0;
    }

    static distance(x0: number, y0: number, x1: number, y1: number) {
        return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    }

    constructor(private _tx: number, private _ty: number, public x: number = 0, public y: number = 0) {
        // this.x = 0;
        // this.y = 0;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }

    isHere(place: Point): boolean {
        if (!place) {
            return false;
        }
        return this.x === place.x && this.y === place.y;
    }

    toString() {
        return 't(' + this.tx + ',' + this.ty + ');m(' + this.x + ',' + this.y + ')';
    }

    gotoTile(rotation: Orientation, tx: number, ty: number) {
        this.x = Location.calcMx(rotation, tx, ty) + 32;
        this.y = Location.calcMy(rotation, tx, ty);

        // let bounds = this.withBoundedDelta(this);
        // this.mx = bounds.mx;
        // this.my = bounds.my;
    }

    orientate(rotation: Orientation) {
        this.x = Location.calcMx(rotation, this.tx, this.ty);
        this.y = Location.calcMy(rotation, this.tx, this.ty) - 16;
    }

    withBoundedDelta(delta: Point, scale: number): Location {
        if (!delta) {
            return this;
        }

        let location = new Location(
            this.tx,
            this.ty,
            this.x + delta.x / scale,
            this.y + delta.y / scale
        );

        // if (
        //     Location.orientation === Orientation._90 ||
        //     Location.orientation === Orientation._180 ||
        //     Location.orientation === Orientation._270
        // ) {
        //     return location;
        // }

        let exitBound;
        let exitDirections = [];

        // north border
        let northBound = Location.boundPoint(Direction.North, location);
        if (location.x < northBound.x && location.y < northBound.y) {
            exitDirections.push(Direction.North);
            exitBound = northBound;
        }

        // east border
        let eastBoundPoint = Location.boundPoint(Direction.East, location);
        if (location.x > eastBoundPoint.x && location.y < eastBoundPoint.y) {
            exitDirections.push(Direction.East);
            exitBound = eastBoundPoint;
        }

        // south border
        let southBoundPoint = Location.boundPoint(Direction.South, location);
        if (location.x > southBoundPoint.x && location.y > southBoundPoint.y) {
            exitDirections.push(Direction.South);
            exitBound = southBoundPoint;
        }

        // west border
        let westBoundPoint = Location.boundPoint(Direction.West, location);
        if (location.x < westBoundPoint.x && location.y > westBoundPoint.y) {
            exitDirections.push(Direction.West);
            exitBound = westBoundPoint;
        }

        // oopsies
        if (exitDirections.length > 1) {
            let exit = new Location(0, 0, 0, 0);
            // NW corner
            if (exitDirections[0] === Direction.North && exitDirections[1] === Direction.West) {
                // return <Location>{ mx: 0, my: 0 };
            }
            // NE corner
            if (exitDirections[0] === Direction.North && exitDirections[1] === Direction.East) {
                // return <Location>{ mx: Location.mw, my: -.5 * Location.mh };
                exit.x = Location.mw;
                exit.y = -.5 * Location.mh;
            }
            // SW corner
            if (exitDirections[0] === Direction.South && exitDirections[1] === Direction.West) {
                // return <Location>{ mx: Location.mw, my: .5 * Location.mh };
                exit.x = Location.mw;
                exit.y = .5 * Location.mh;
            }
            // SE corner
            if (exitDirections[0] === Direction.East && exitDirections[1] === Direction.South) {
                // return <Location>{ mx: 2 * Location.mw, my: 0 };
                exit.x = 2 * Location.mw;
                // exit.y = 0;
            }

            return exit;
        }

        return exitBound ? Location.fromPoint(exitBound) : location;
    }
}
