import { Location, Point } from '../location';
import { Utils, BitMap, Pixel, CanvasImage, Random } from '../../shared';
import { LandType, LandTransition, Direction, Season } from '../planet.enums';
import { NatureDetail } from '../land-tile';
import { Planet } from '../planet';

export class TileLoader {
    static overlayPixel: Pixel[] = [
        new Pixel(0, 0, 0, 0),      // null
        new Pixel(0, 60, 30, 60),   // LRES
        new Pixel(0, 255, 0, 60),   // MRES
        new Pixel(0, 255, 127, 60), // URES
        new Pixel(0, 125, 255, 60), // COM
        new Pixel(0, 0, 255, 60),   // OFFICE
        new Pixel(255, 255, 0, 60), // IND
        new Pixel(255, 255, 255, 60), // no zone
        new Pixel(255, 0, 0, 100),  // RED
        new Pixel(0, 255, 0, 127)   // GREEN
    ];

    static random = new Random(Planet.seed);

    base = [];
    baseLoadCount: number = 4;
    blended = [];
    nature = [];

    // path = 'assets/land/earth/s2/';
    season: Season;

    get imagePath(): string {
        return 'assets/land/earth/s' + this.season + '/';
    }

    overlayCanvas: CanvasImage[] = [];

    init(landData, season: Season) {
        this.baseLoadCount = 4 * 3;

        this.season = season;

        TileLoader.overlayPixel.forEach((overlay) => this.createOverlayCanvas(overlay));

        [LandType.Water, LandType.Low, LandType.Medium, LandType.High]
            .forEach((landType) => {
                this.base[landType] = [];
                this.blended[landType] = [];
                this.nature[landType] = [];
            });

        [0, 1, 2].forEach((index) => {
            this.initBaseImage(LandType.Water, landData.water, index);
            this.initBaseImage(LandType.Low, landData.low, index);
            this.initBaseImage(LandType.Medium, landData.medium, index);
            this.initBaseImage(LandType.High, landData.high, index);
        });
    }

    createOverlayCanvas(overlayPixel: Pixel) {
        let overlay: CanvasImage = CanvasImage.create(64, 32);

        this.overlayCanvas.push(overlay);

        // draw a green box... and then replace any thing that is green :-D
        overlay.ctx.fillStyle = '#00FF00';
        overlay.ctx.beginPath();
        overlay.ctx.moveTo(0, 16);
        overlay.ctx.lineTo(32, 0);
        overlay.ctx.lineTo(64, 16);
        overlay.ctx.lineTo(32, 32);
        overlay.ctx.closePath();
        overlay.ctx.fill();

        let bitmap: BitMap = overlay.getBitMap();

        let alpha = overlayPixel.alpha / 255;

        for (let py: number = 0; py < 32; py++) {
            for (let px: number = 0; px < 64; px++) {
                let pixel = bitmap.pixel[px][py];
                if (pixel.green === 255) {
                    if (pixel.alpha === 255) {
                        pixel.copy(overlayPixel, false);
                    } else {
                        let _alpha = bitmap.pixel[px][py].alpha / 255;
                        pixel.copy(overlayPixel, true);
                        pixel.alpha = Math.floor((_alpha * alpha) * 255);
                    }
                }
            }
        }

        overlay.putBitMap(bitmap);
    }

    initOverlayImage(versionArray: HTMLImageElement[], overlayIndex: number) {
        if (overlayIndex === 0) {
            return;
        }

        let image: CanvasImage = CanvasImage.load(versionArray[0]);
        versionArray.push(image.image);

        image.ctx.drawImage(this.overlayCanvas[overlayIndex].canvas, 0, 0);
        image.press();
    }

    initBaseImage(landType: LandType, landData, version) {
        if (!landData) {
            throw { message: '"landData" is missing, cannot load base image.' };
        }

        let image: CanvasImage = CanvasImage.create(64, 32);
        this.base[landType][version] = [image.image];

        // draw a green box... and then replace any thing that is green :-D
        image.ctx.fillStyle = '#00FF00';
        image.ctx.beginPath();
        image.ctx.moveTo(0, 16);
        image.ctx.lineTo(32, 0);
        image.ctx.lineTo(64, 16);
        image.ctx.lineTo(32, 32);
        image.ctx.closePath();
        image.ctx.fill();

        // now get the pixels we can poke them into what we want them to be
        let bitmap: BitMap = image.getBitMap();

        let colorProbabilities = landData.baseColors[0];

        // fill a bucket with tropical fish and bits of soil and grass
        let bucket = [];
        for (let i = 0; i < colorProbabilities.length; i++) {
            let value: string[] = colorProbabilities[i].split(';'); // e.q. #928c51;127 <- use this hex color about that many times
            let pixel: Pixel = Pixel.fromHex(value[0]);
            let len = Number(value[1]);
            for (let j = 0; j < len; j++) {
                bucket.push(pixel);
            }
        }

        // i know, i know... more than once is pointless
        Utils.shuffle(TileLoader.random, bucket, 3);

        let bucketIndex = 0;

        for (let py: number = 0; py < 32; py++) {
            for (let px: number = 0; px < 64; px++) {
                let pixel = bitmap.pixel[px][py];
                if (pixel.green === 255) {
                    let toPixel = bucket[bucketIndex++ % bucket.length]; // refill the bucket if needed
                    pixel.copy(toPixel, true);
                }
            }
        }

        image.putBitMap(bitmap);

        image.press((img) => {
            this.baseLoadCount--;
            if (this.baseLoadCount === 0) {
                this.blendImages();
            }

            if (version === 0) {
                this.initNatureImages(landType, landData);
            }

            let overlayCount = 0;
            TileLoader.overlayPixel.forEach((overlay) => this.initOverlayImage(this.base[landType][version], overlayCount++));
        });
    }

    blendImages() {
        [LandType.Water, LandType.Low, LandType.Medium].forEach(
            (landType) => {
                this.blend(landType, LandTransition.North);
                this.blend(landType, LandTransition.East);
                this.blend(landType, LandTransition.South);
                this.blend(landType, LandTransition.West);

                this.blend(landType, LandTransition.NE_up);
                this.blend(landType, LandTransition.SE_up);
                this.blend(landType, LandTransition.SW_up);
                this.blend(landType, LandTransition.NW_up);

                this.blend(landType, LandTransition.NE_down);
                this.blend(landType, LandTransition.SE_down);
                this.blend(landType, LandTransition.SW_down);
                this.blend(landType, LandTransition.NW_down);
            }
        );
    }

    initNatureImages(landType: LandType, landData: any) {
        if (!landData.nature) {
            return;
        }

        this.nature[landType] = [];

        landData.nature.forEach((nature) => {

            let detail: NatureDetail = <NatureDetail>{
                groundImage: [],
                airImage: undefined,
                airOffset: nature.air ? nature.air.offset : undefined
            };

            this.nature[landType].push(detail);

            if (nature.ground && nature.ground.file) {
                CanvasImage.fetch('assets/land/earth/s2/' + nature.ground.file,
                    (groundImage) => {
                        let image: CanvasImage = CanvasImage.load(this.base[landType][0][0]);
                        detail.groundImage.push(image.image);

                        image.ctx.drawImage(groundImage.canvas, nature.ground.offset.x, nature.ground.offset.y);

                        image.press((img) => {
                            let overlayCount = 0;
                            TileLoader.overlayPixel.forEach((overlay) => this.initOverlayImage(detail.groundImage, overlayCount++));
                        });
                    }
                );
            }

            if (nature.air && nature.air.file) {
                CanvasImage.fetch('assets/land/earth/s2/' + nature.air.file,
                    (airImage) => {
                        detail.airImage = airImage.image;
                    }
                );
            }
        });
    }

    blend(lowerType: LandType, transition: LandTransition) {
        let w = 64;
        let h = 32;

        // fill with lower land image
        let image = CanvasImage.load(this.base[lowerType][0][0]);
        this.blended[lowerType][transition] = [image.image];

        // fill with upper land image
        let upperImage = CanvasImage.load(this.base[lowerType + 1][0][0]);
        let upperBM = upperImage.getBitMap();

        let maxD = 1 / Math.sqrt(32 * 32 + 16 * 16);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let border: Point;
                let dx, dy, d, d1, d2, borderNorth: Point, borderEast: Point, borderSouth: Point, borderWest: Point, d1x, d1y, d2x, d2y;

                let sparkle = TileLoader.random.next() / 75;

                switch (transition) {
                    case LandTransition.North:
                        border = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 16, 8);

                        dx = x - Math.round(border.x);
                        dy = y - Math.round(border.y + 32);

                        d = Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.East:
                        border = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 64, 32);

                        dx = x - Math.round(border.x);
                        dy = y - Math.round(border.y + 32);

                        d = 1 - Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.West:
                        border = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 48, 24);

                        dx = x - Math.round(border.x);
                        dy = y - Math.round(border.y + 32);

                        d = Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.South:
                        border = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 36, 16);

                        dx = x - Math.round(border.x);
                        dy = y - Math.round(border.y + 32);

                        d = 1 - Math.sqrt(dx * dx + dy * dy) * maxD + sparkle;
                        break;
                    case LandTransition.NE_up:
                        borderNorth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 24, 12); // middle
                        borderEast = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 16, 8);    // middle

                        d1x = x - Math.round(borderNorth.x);
                        d1y = y - Math.round(borderNorth.y + 32);

                        d1 = Math.sqrt(d1x * d1x + d1y * d1y) * maxD;

                        d2x = x - Math.round(borderEast.x);
                        d2y = y - Math.round(borderEast.y + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SE_up:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 24, 12);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 16, 8);

                        d1x = x - Math.round(borderSouth.x);
                        d1x = y - Math.round(borderSouth.y + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.x);
                        d2y = y - Math.round(borderEast.y + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SW_up:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 24, 12);
                        borderWest = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 56, 28);

                        d1x = x - Math.round(borderSouth.x);
                        d1x = y - Math.round(borderSouth.y + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.x);
                        d2y = y - Math.round(borderWest.y + 32);

                        d2 = Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NW_up:
                        borderNorth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 24, 12); // middle
                        borderWest = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 24, 12);

                        d1x = x - Math.round(borderNorth.x);
                        d1x = y - Math.round(borderNorth.y + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.x);
                        d2y = y - Math.round(borderWest.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NE_down:
                        borderNorth = Location.boundPoint(Direction.North, <Location>{ x: x, y: y - 24 }, 48, 24);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 64 + 12, 32 + 6);

                        d1x = x - Math.round(borderNorth.x);
                        d1x = y - Math.round(borderNorth.y + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.x);
                        d2y = y - Math.round(borderEast.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SE_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 48 - 8, 24 + 4);
                        borderEast = Location.boundPoint(Direction.East, <Location>{ x: x, y: y - 24 }, 64 + 12, 32 + 6);

                        d1x = x - Math.round(borderSouth.x);
                        d1x = y - Math.round(borderSouth.y + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderEast.x);
                        d2y = y - Math.round(borderEast.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;

                        if (x === 31 && y === 15) {
                            // debugger;
                        }
                        break;
                    case LandTransition.SW_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 48, 24);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ x: x, y: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderSouth.x);
                        d1x = y - Math.round(borderSouth.y + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.x);
                        d2y = y - Math.round(borderWest.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.SW_down:
                        borderSouth = Location.boundPoint(Direction.South, <Location>{ x: x, y: y - 24 }, 48, 24);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ x: x, y: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderSouth.x);
                        d1x = y - Math.round(borderSouth.y + 32);

                        d1 = 1 - Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.x);
                        d2y = y - Math.round(borderWest.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                    case LandTransition.NW_down:
                        borderNorth = Location.boundPoint(Direction.North, <Location>{ x: x, y: y - 24 }, 64, 32);
                        borderWest = Location.boundPoint(Direction.West, <Location>{ x: x, y: y - 24 }, 48, 24);

                        d1x = x - Math.round(borderNorth.x);
                        d1x = y - Math.round(borderNorth.y + 32);

                        d1 = Math.sqrt(d1x * d1x + d1x * d1x) * maxD;

                        d2x = x - Math.round(borderWest.x);
                        d2y = y - Math.round(borderWest.y + 32);

                        d2 = 1 - Math.sqrt(d2x * d2x + d2y * d2y) * maxD;

                        d = (d1 + d2) / 2 + sparkle;
                        break;
                }


                // *** todo-start: refactor this ***
                if (transition <= 3) {
                    if (d > .60) {
                        d = 1;
                    } else if (d < .50 && d >= .45) {
                        d -= .10;
                    } else if (d < .45 && d >= .35) {
                        d -= .20; // hmm... might want to tweak this some more
                    } else if (d < .35) {
                        d = 0;
                    }
                } else if (transition <= 11) {
                    if (d < .36) {
                        d = 0;
                    } else if (d < .40 && d >= .35) {
                        d -= .10;
                    } else if (d < .46 && d >= .40) {
                        d += .05;
                    } else {
                        d = 1;
                    }
                }
                // *** todo-end: ***

                if (upperBM.pixel[x][y].alpha) {
                    upperBM.pixel[x][y].alpha = Math.floor(255 * d);
                }
            }
        }

        upperImage.putBitMap(upperBM);

        image.ctx.drawImage(upperImage.canvas, 0, 0);

        upperImage.destroyContext();

        image.press((img) => {
            let overlayCount = 0;
            TileLoader.overlayPixel.forEach((overlay) => this.initOverlayImage(this.blended[lowerType][transition], overlayCount));
        });
    }
}
