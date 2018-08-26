import { Location } from './location';
import { MapManager } from './map.manager';
import { Direction, RoadType } from './planet.enums';
import { ContextRect } from '../shared/canvas-image';
import { LandTile, NatureDetail } from './land-tile';
import { Pixel } from '../shared';

export enum RenderThe {
    Ground = 1,
    Air = 2
}

export class MapRenderer {
    static renderGroundCount: number = 0;
    static debugEllipse: boolean = true;

    static tilesRendered: number = 0;

    static renderAirCount: number = 0;
    static itemsRendered: number = 0;

    static renderScale: number = 1;

    static render(manager: MapManager, ctx: CanvasRenderingContext2D, render: number, location: Location, width: number, height: number): void {
        let RT = RenderThe;

        let mx = location.x;
        let my = location.y;

        let center_x = width * .5;
        let center_y = height * .5;

        let scale = manager.scale;

        let renderGround = render & RenderThe.Ground;
        let renderAir = render & RenderThe.Air;

        ctx.save();

        if (renderGround) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, height);

            MapRenderer.renderGroundCount++;
            MapRenderer.tilesRendered = 0;
        } else {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            MapRenderer.renderAirCount++;
            MapRenderer.itemsRendered = 0;
        }

        ctx.translate(center_x - mx * scale, center_y - my * scale);
        ctx.scale(scale, scale);

        let rect: ContextRect = new ContextRect(mx, my, ctx.canvas.width, ctx.canvas.height, (1 / manager.scale) * MapRenderer.renderScale);

        let count: number = -1;
        for (let tile of manager.drawableTiles) {
            count++;
            if (!tile.baseImageLoaded || tile.location === undefined) {
                continue;
            }

            let x = tile.location.x;
            let y = tile.location.y;

            let extra = tile.getExtraHeight();

            if (y + 32 < rect.top ||
                y - extra > rect.bottom ||
                x > rect.right ||
                x + 64 < rect.left
            ) {
                continue;
            }

            if (renderGround) {
                MapRenderer.tilesRendered++;

                let image = tile.image && !tile.road ? tile.image : tile.baseImage;

                ctx.drawImage(image ? image : tile.baseImage, x, y);
            }
            /* no else */
            if (renderAir) {
                if (tile.road) {
                    let road = tile.road;

                    if (road.image) {
                        ctx.drawImage(road.image, x, y);
                    }

                    continue;
                }

                let detail: NatureDetail = tile.getNature();
                // has nature?
                if (detail && detail.airImage) {
                    ctx.drawImage(detail.airImage, x + detail.airOffset.x, y + detail.airOffset.y);
                    MapRenderer.itemsRendered++;
                }
            }
        }

        if (this.renderScale !== 1) {
            rect.draw(ctx, 'White');
        }

        if (renderGround) {
            MapRenderer.renderDebugLines(manager, ctx, scale, mx, my, location, rect, width, height);
        }

        if (MapRenderer.debugEllipse) {
            MapRenderer.renderDebugEllipse(manager, ctx, scale, location);
        }

        ctx.restore();
    }

    static renderDebugEllipse(manager, ctx, scale, location) {
        let drawPixel = (x: number, y: number, fillStyle?: string, size: number = 1) => {
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
            }
            size = size / scale;
            ctx.fillRect(x, y, size, size);
        };

        let w = manager.width * 32;

        for (let i = 0; i < 360; i++) {
            let s = Math.sin(i * Math.PI / 180);
            let c = Math.cos(i * Math.PI / 180);

            // let x = location.x;
            let xx = location.x;
            let yy = location.y;

            let x = (xx - w) * c - 2 * yy * s + w;
            let y = (xx - w) * s * .5 + yy * c;

            drawPixel(x, y, (i % 90 === 0 ? 'Red' : 'Yellow'));
        }
    }

    static renderDebugLines(manager, ctx, scale, mx, my, location, rect, width, height) {
        let drawPixel = (x: number, y: number, fillStyle?: string, size: number = 1) => {
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
            }
            size = size / scale;
            ctx.fillRect(x, y, size, size);
        };

        let w = manager.width * 32;
        let h_div2 = manager.height * 16;

        // draw some lines... yes, yes i know i could just use 2d line draw, but i was using them to figure out the calcs :-D
        let len = w;
        for (let i = 0; i < len; i++) {
            if (i % 4 !== 0) {
                continue;
            }

            drawPixel(i, -i / 2, 'Cyan');                  // north
            drawPixel(w + i, i / 2 - h_div2, 'Orange');    // east
            drawPixel(w + i, -i / 2 + h_div2, 'Red');      // south
            drawPixel(i, i / 2, 'Lime');                   // west
        }

        for (let i = 0; i < 25; i++) {
            if (i % 2 === 0) {
                drawPixel(mx + 2 * i, my + i, 'Cyan');     // perp north
                drawPixel(mx - 2 * i, my + i, 'Orange');   // perp east
                drawPixel(mx - 2 * i, my - i, 'Red');      // perp sout
                drawPixel(mx + 2 * i, my - i, 'Lime');     // perp west
            }
        }

        let north = Location.boundPoint(Direction.North, location);
        drawPixel(north.x - 1, north.y - 1, 'Cyan', 3);

        let east = Location.boundPoint(Direction.East, location);
        drawPixel(east.x - 1, east.y - 1, 'Orange', 3);

        let south = Location.boundPoint(Direction.South, location);
        drawPixel(south.x - 1, south.y - 1, 'Red', 3);

        let west = Location.boundPoint(Direction.West, location);
        drawPixel(west.x - 1, west.y - 1, 'Lime', 3);

        ctx.restore();
        ctx.save();

        // prove things line up correctly
        ctx.fillStyle = 'Red';
        ctx.fillRect(width / 2 - 1, height / 2 - 1, 3, 3);
    }
}
