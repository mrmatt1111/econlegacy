import { Location } from './location';
import { MapManager } from './map.manager';
import { Direction } from './planet.enums';
import { ContextRect } from '../shared/canvas-image';
import { map } from 'rxjs/operators';
import { Pixel } from '../shared';

export class MapRenderer {
    static renderGroundCount: number = 0;
    static tilesRendered: number = 0;

    static renderGround(manager: MapManager, ctx: CanvasRenderingContext2D, location: Location, width: number, height: number): void {
        MapRenderer.renderGroundCount++;

        let mx = location.x;
        let my = location.y;

        let center_x = width * .5;
        let center_y = height * .5;

        let scale = manager.scale;

        ctx.save();

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        ctx.translate(center_x - mx * scale, center_y - my * scale);
        ctx.scale(scale, scale);

        let rect: ContextRect = new ContextRect(mx, my, ctx.canvas.width, ctx.canvas.height, (1 / manager.scale));

        MapRenderer.tilesRendered = 0;
        let count: number = -1;
        for (let tile of manager.drawableTiles) {
            count++;
            if (!tile.baseImageLoaded || tile.location === undefined) {
                continue;
            }

            // let tileRect = tile.getContextRect();
            // if (
            //     tileRect.bottom < rect.top ||
            //     tileRect.top > rect.bottom ||
            //     tileRect.left > rect.right ||
            //     tileRect.right < rect.left
            // ) {
            //     continue;
            // }

            if (tile.location.y + 32 < rect.top ||
                tile.location.y > rect.bottom ||
                tile.location.x > rect.right ||
                tile.location.x + 64 < rect.left
            ) {
                continue;
            }

            // if (this.slowTile && count > this.tick % (width * height)) {
            //     continue;
            // }

            MapRenderer.tilesRendered++;

            let image = tile.image ? tile.image : tile.baseImage;

            // if (image.height === 0)
            //     continue;

            ctx.drawImage(image ? image : tile.baseImage, tile.location.x, tile.location.y);
        }

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

        rect.draw(ctx, 'White');

        ctx.restore();
        ctx.save();



        // prove things line up correctly
        ctx.fillStyle = 'Red';
        ctx.fillRect(width / 2 - 1, height / 2 - 1, 3, 3);

        ctx.restore();
    }
}
