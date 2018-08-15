export enum Orientation {
    _0,
    _90,
    _180,
    _270
}

export enum Direction {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
}

export class Location {
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

    private static orientation: Orientation = Orientation._0;

    static setBounds(width: number, height: number) {
        Location.tw = width;
        Location.th = height;
        Location.mw = 32 * width;
        Location.mh = 32 * height;
    }

    static boundPoint(direction: Direction, location: Location, mw: number = Location.mw, mh: number = Location.mh): Location {

        // let realDirection = (direction + Location.orientation) % 4;

        switch (direction) {
            case Direction.North:
                return <any>{
                    // |x = -2y <=> y=-.5x| north line
                    // |y= .5(x - mx) + my| perpendictular line from current position

                    // solve x:
                    // -.5x = .5x -.5mx + my
                    mx: .5 * location.mx - location.my,

                    // solve y:
                    // y = .5(-2y - mx) +my
                    // y = -y -.5mx + my
                    my: (-.5 * location.mx + location.my) * .5
                };
            case Direction.East:
                return <any>{
                    // |y= .5x - .5w - .5h <=> x = 2y + w + h| east line
                    // |y = -.5 (x - mx) + my <=> x = -2y + mx + 2my| perpendictular line from current position

                    // solve for x:
                    // .5x - .5w - .5h = -.5x + .5mx + my
                    mx: .5 * location.mx + location.my + .5 * mw + .5 * mh,

                    // solve for y:
                    // 2y + w + h = -2y + mx + 2my
                    my: (location.mx + 2 * location.my - mw - mh) * .25
                };
            case Direction.South:
                return <Location>{
                    // |y = -.5(x - w) + .5h <=> x = -2y + w + h| south line
                    // |y = .5(x - mx)  + my <=> x = 2y + mx - 2my| perpendictular line from current position

                    // solve x:
                    // -.5(x - w) + .5h = .5(x - mx)  + my
                    // x - w - h = -x + mx - 2my
                    my: -(location.mx - 2 * location.my - mw - mh) * .25,

                    // solve y:
                    // -2y + w + h = 2y + mx - 2my
                    mx: (location.mx - 2 * location.my + mw + mh) * .50
                };
            case Direction.West:
                return <Location>{
                    // [x = 2y] <-- west line
                    // 2y = -x + mx + 2my
                    // [x = mx + 2my - 2y] <-- perpendictular line from current position
                    // 2y = mx + 2my - 2y;
                    // y = (mx + 2my) / 4
                    mx: .5 * location.mx + location.my,
                    my: .25 * location.mx + .5 * location.my
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

    constructor(private _tx: number, private _ty: number, public mx: number = 0, public my: number = 0) {
        this.mx = 0;
        this.my = 0;
    }

    round() {
        this.mx = Math.round(this.mx);
        this.my = Math.round(this.my);
        return this;
    }

    toString() {
        return 't(' + this.tx + ',' + this.ty + ');m(' + this.mx + ',' + this.my + ')';
    }

    gotoTile(rotation: Orientation, tx: number, ty: number) {
        this.mx = Location.calcMx(rotation, tx, ty) + 32;
        this.my = Location.calcMy(rotation, tx, ty);

        // let bounds = this.withBoundedDelta(this);
        // this.mx = bounds.mx;
        // this.my = bounds.my;
    }

    orientate(rotation: Orientation) {
        this.mx = Location.calcMx(rotation, this.tx, this.ty);
        this.my = Location.calcMy(rotation, this.tx, this.ty) - 16;
    }

    withBoundedDelta(delta: Location, scale: number): Location {
        if (!delta) {
            return this;
        }

        let location = <Location>{
            mx: this.mx + delta.mx / scale,
            my: this.my + delta.my / scale
        };

        if (
            Location.orientation === Orientation._90 ||
            Location.orientation === Orientation._180 ||
            Location.orientation === Orientation._270
        ) {
            return location;
        }

        let exitBound;
        let exitDirections = [];

        // north border
        let northBound = Location.boundPoint(Direction.North, location);
        if (location.mx < northBound.mx && location.my < northBound.my) {
            exitDirections.push(Direction.North);
            exitBound = northBound;
            exitBound.exitDirection = Direction.North; // temp
        }

        // east border
        let eastBoundPoint = Location.boundPoint(Direction.East, location);
        if (location.mx > eastBoundPoint.mx && location.my < eastBoundPoint.my) {
            exitDirections.push(Direction.East);
            exitBound = eastBoundPoint;
            exitBound.exitDirection = Direction.East; // temp
        }

        // south border
        let southBoundPoint = Location.boundPoint(Direction.South, location);
        if (location.mx > southBoundPoint.mx && location.my > southBoundPoint.my) {
            exitDirections.push(Direction.South);
            exitBound = southBoundPoint;
            exitBound.exitDirection = Direction.South; // temp
        }

        // west border
        let westBoundPoint = Location.boundPoint(Direction.West, location);
        if (location.mx < westBoundPoint.mx && location.my > westBoundPoint.my) {
            exitDirections.push(Direction.West);
            exitBound = westBoundPoint;
            exitBound.exitDirection = Direction.West; // temp
        }

        // oopsies
        if (exitDirections.length > 1) {
            // NW corner
            if (exitDirections[0] === Direction.North && exitDirections[1] === Direction.West) {
                return <Location>{ mx: 0, my: 0 };
            }
            // NE corner
            if (exitDirections[0] === Direction.North && exitDirections[1] === Direction.East) {
                return <Location>{ mx: Location.mw, my: -.5 * Location.mh };
            }
            // SW corner
            if (exitDirections[0] === Direction.South && exitDirections[1] === Direction.West) {
                return <Location>{ mx: Location.mw, my: .5 * Location.mh };
            }
            // SW corner
            if (exitDirections[0] === Direction.East && exitDirections[1] === Direction.South) {
                return <Location>{ mx: 2 * Location.mw, my: 0 };
            }
        }

        return exitBound ? exitBound : location;
    }
}
