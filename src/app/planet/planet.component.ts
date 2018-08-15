import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ImageService } from '../services/image.service';
import { LandType, MapTile } from './map-tile';
import { MapManager } from './map.manager';
import { Mouse } from './mouse';
import { Location, Orientation, Direction } from './location';
import { Pixel } from '../shared/pixel';

@Component({
    selector: 'app-planet',
    templateUrl: './planet.component.html',
    styleUrls: ['./planet.component.css']
})
export class PlanetComponent implements OnInit, AfterViewInit {

    @ViewChild('planetCanvas') planetCanvas: ElementRef;
    public context: CanvasRenderingContext2D;

    bufferCanvas: HTMLCanvasElement;
    buffer: CanvasRenderingContext2D;

    pause: boolean = false;
    slowTile: boolean = false;

    map: MapManager = new MapManager();

    mouse: Mouse;

    Direction = Direction;

    diffx;
    diffy;

    center_x: number;
    center_y: number;

    items = [];

    tick: number = 0;

    // location: Location = new Location(0, 0);

    constructor(private imageService: ImageService) {

    }

    ngOnInit(): void {

    }

    ngAfterViewInit(): void {
        MapTile.initBaseImage(LandType.Water);
        MapTile.initBaseImage(LandType.Low);
        MapTile.initBaseImage(LandType.Medium);
        MapTile.initBaseImage(LandType.High);

        this.map.gotoTile(92, 65);
        // this.map.gotoTile(24, 24);
        // this.map.gotoTile(30, 7);
        // this.map.gotoTile(35, 35);
        // this.map.gotoTile(39, 38);
        // this.map.gotoTile(16, 13);
        // this.gotoTile(47, 48);
        // this.location.mx = 20;
        // this.location.my = 67;

        let canvas: HTMLCanvasElement = <HTMLCanvasElement>this.planetCanvas.nativeElement;
        this.context = canvas.getContext('2d');

        this.mouse = new Mouse(canvas);
        this.mouse.mouseUpEvent.subscribe((delta) => {
            delta = this.map.location.withBoundedDelta(delta, this.map.scale);

            this.map.location.mx = delta.mx;
            this.map.location.my = delta.my;
        });

        this.bufferCanvas = document.createElement('canvas');

        this.bufferCanvas.width = canvas.width;
        this.bufferCanvas.height = canvas.height;

        this.buffer = this.bufferCanvas.getContext('2d');

        let image = new Image();

        image.onload = () => {
            this.context.drawImage(image, 0, 0);

            let imageData = this.context.getImageData(0, 0, image.width, image.height);
            let values = imageData.data.values();

            let width = image.width;
            let y = 0;
            let x = 0;
            let position = 0;
            let scale = 1;

            this.map.init(image.width, image.height);
            this.map.orientate(this.map.orientation);

            while (true) {
                let next = values.next();
                if (!next || next.done === true || next.value === undefined) {
                    break;
                }

                let pixel = new Pixel(
                    next.value,
                    values.next().value,
                    values.next().value,
                    values.next().value
                );

                let tile: MapTile = this.map.getTile(x, y);
                if (pixel.equals(66, 130, 126)) {
                    tile.landType = LandType.High;
                } else if (pixel.equals(145, 138, 78)) {
                    tile.landType = LandType.Medium;
                } else if (pixel.equals(164, 146, 92)) {
                    tile.landType = LandType.Low;
                } else {
                    tile.landType = LandType.Water;
                }
                if (++x >= width) {
                    x = 0;
                    y++;
                }
            }

            this.map.setupLandTransitions();

            this.map.setOrientation(this.map.orientation); // fixme
            this.map.gatherDrawableTiles();

            setTimeout(() => this.loop());
        };
        image.src = '../assets/images/maps/4ci_testworld.gif';
        // image.src = '../assets/images/maps/4ci_testworld50.gif';
        // image.src = '../assets/images/maps/4ci_testtiny.gif';
    }

    loop() {
        if (!this.pause) {
            this.drawMap();
            this.tick++;
        }
        setTimeout(() => this.loop(), 50);
    }

    get mouse_mx() {
        return -this.center_x + this.mouse.position.mx + this.map.location.mx;
    }

    get mouse_my() {
        return -this.center_y + this.mouse.position.my + this.map.location.my;
    }

    drawPixel(x: number, y: number, fillStyle?: string, size: number = 1) {
        if (fillStyle) {
            this.buffer.fillStyle = fillStyle;
        }
        size = size / this.map.scale;
        this.buffer.fillRect(x, y, size, size);
    }

    // drawLine

    drawMap() {
        if (!this.buffer) {
            return;
        }

        this.buffer.save();

        let width = this.bufferCanvas.width;
        let height = this.bufferCanvas.height;

        let location = this.map.location.withBoundedDelta(<Location>this.mouse.dragDelta, this.map.scale);
        (<any>this.map.location).exitDirection = (<any>location).exitDirection;

        let mx = location.mx;
        let my = location.my;

        this.buffer.fillStyle = 'black';
        this.buffer.fillRect(0, 0, width, height);

        this.center_x = width * .5;
        this.center_y = height * .5;

        this.buffer.translate(this.center_x - mx * this.map.scale, this.center_y - my * this.map.scale);
        this.buffer.scale(this.map.scale, this.map.scale);

        let count: number = 0;

        for (let tile of this.map.drawableTiles) {
            if (!tile.baseImageLoaded) {
                continue;
            }

            if (this.slowTile && ++count > this.tick % (this.map.width * this.map.height)) {
                continue;
            }

            let image = tile.image;
            if (this.map.orientation !== Orientation._0) {
                image = null; // todo!
            }

            this.buffer.drawImage(image ? image : tile.baseImage, tile.location.mx, tile.location.my);

            if (!image && tile.landTrasition !== undefined && tile.landTrasition !== -1) { // && tile.landTrasition >= 0) {
                // this.buffer.fillStyle = "White";
                if (tile.landType === 0) {
                    this.buffer.fillStyle = 'White';
                } else {
                    this.buffer.fillStyle = 'Black';
                }

                this.buffer.fillText(tile.landTrasition.toString(), tile.location.mx + 28, tile.location.my + 20);
            }
        }

        // let dx, dy;

        let w = this.map.width * 32;
        let h_div2 = this.map.width * 16;

        // this.diffx = dx;
        // this.diffy = dy;

        // draw some lines... yes, yes i know i could just use 2d line draw, but i was using them to figure out the calcs :-D
        let length = 32 * this.map.width;
        for (let i = 0; i < length; i++) {
            if (i % 4 !== 0) {
                continue;
            }

            this.drawPixel(i, -i / 2, 'Cyan');                  // north
            this.drawPixel(w + i, i / 2 - h_div2, 'Orange');    // east
            this.drawPixel(w + i, -i / 2 + h_div2, 'Red');      // south
            this.drawPixel(i, i / 2, 'Lime');                   // west
        }

        this.items = [];
        for (let i = 0; i < 25; i++) {
            if (i % 2 === 0) {
                this.drawPixel(mx + 2 * i, my + i, 'Cyan');     // perp north
                this.drawPixel(mx - 2 * i, my + i, 'Orange');   // perp east
                this.drawPixel(mx - 2 * i, my - i, 'Red');      // perp sout
                this.drawPixel(mx + 2 * i, my - i, 'Lime');     // perp west
            }
        }

        let north = Location.boundPoint(Direction.North, location);
        this.drawPixel(north.mx - 1, north.my - 1, 'Cyan', 3);

        let east = Location.boundPoint(Direction.East, location);
        this.drawPixel(east.mx - 1, east.my - 1, 'Orange', 3);

        let south = Location.boundPoint(Direction.South, location);
        this.drawPixel(south.mx - 1, south.my - 1, 'Red', 3);

        let west = Location.boundPoint(Direction.West, location);
        this.drawPixel(west.mx - 1, west.my - 1, 'Lime', 3);

        this.buffer.restore();
        this.buffer.save();

        this.buffer.fillStyle = 'Red';
        this.buffer.fillRect(width / 2 - 1, height / 2 - 1, 3, 3);

        this.buffer.restore();

        this.context.drawImage(this.bufferCanvas, 0, 0);
    }
}
