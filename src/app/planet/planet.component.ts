import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ImageService } from '../services/image.service';
import { LandTile } from './land-tile';
import { LandType, Direction, Season } from './planet.enums';
import { MapManager } from './map.manager';
import { Mouse } from './mouse';
import { Location, Point } from './location';
import { Pixel, BitMap, CanvasImage } from '../shared';
import { MapRenderer, RenderThe } from './map.renderer';

@Component({
    selector: 'app-planet',
    templateUrl: './planet.component.html',
    styleUrls: ['./planet.component.css']
})
export class PlanetComponent implements OnInit, AfterViewInit {

    @ViewChild('planetCanvas') planetCanvasRef: ElementRef;
    public context: CanvasRenderingContext2D;

    // bufferCanvas: HTMLCanvasElement;
    // buffer: CanvasRenderingContext2D;

    pause: boolean = false;
    slowTile: boolean = false;

    map: MapManager = new MapManager();

    mouse: Mouse;

    // + give visibility to things:
    Direction = Direction;
    MapRenderer = MapRenderer;
    LandTile = LandTile;
    CanvasImage = CanvasImage;
    // -

    diffx;
    diffy;

    center_x: number;
    center_y: number;

    items = [];

    pixelMediumCount = [];

    tick: number = 0;

    planetCanvas: CanvasImage;
    groundLayer: CanvasImage;
    airLayer: CanvasImage;

    mapLoaded: boolean = false;

    lastRendered: Point;

    constructor(private http: HttpClient, private imageService: ImageService) {

    }

    ngOnInit(): void {

    }

    loadPixelData(imageName) {

    }

    // the 4 color image file that is used as the bitmap (water, low, medium, high)
    loadMap(imageUrl: string) {
        this.mapLoaded = false;
        CanvasImage.fetch(imageUrl, (image: CanvasImage) => {
            let width = image.width;
            let y = 0, x = 0;

            this.map.init(image.width, image.height);
            this.map.orientate(this.map.orientation);

            let values = image.getImageData().data.values();

            let matches = [];

            // hmm... pull these magic numbers from a json, i wonder.
            matches[85] = LandType.Water;
            matches[146] = LandType.Low;
            matches[138] = LandType.Medium;
            matches[130] = LandType.High;

            let pixel: Pixel;
            while (pixel = Pixel.next(values)) {
                let tile: LandTile = this.map.getTile(x, y);
                tile.landType = matches[pixel.green];

                if (++x >= width) {
                    x = 0;
                    y++;
                }
            }

            this.map.setupLandTransitions();

            this.map.setupNature();

            this.map.setOrientation(this.map.orientation); // fixme
            this.map.gatherDrawableTiles();

            this.mapLoaded = true;
            this.mapInitialized();
        });
    }

    setupDrawLayers() {
        this.planetCanvas = CanvasImage.createFrom(this.planetCanvasRef);

        let w = this.planetCanvas.width;
        let h = this.planetCanvas.height;

        // the layer that has stuff that doesn't change often
        this.groundLayer = CanvasImage.create(w, h);

        // anything that is off the ground and changes more often, mostly transparent
        this.airLayer = CanvasImage.create(w, h);
    }

    ngAfterViewInit(): void {
        this.http.get('assets/lands.spring.json').subscribe((data: any) => {
            LandTile.loader.init(data, Season.Summer);
        });

        // let landImage: CanvasImage = CanvasImage.fetch('./assets/images/land/earth/L2/land.192.WaterCenter0.gif',
        let landImage: CanvasImage = CanvasImage.fetch('../assets/4ci_testworld50.gif',
            () => {
                let bitmap: BitMap = landImage.getBitMap();
                this.pixelMediumCount = bitmap.tally();
                let debug = bitmap.toString('short');
            }
        );

        this.setupDrawLayers();

        this.mouse = new Mouse(this.planetCanvas.canvas);
        this.mouse.mouseUpEvent.subscribe((delta) => {
            delta = this.map.location.withBoundedDelta(delta, this.map.scale);

            this.map.location.x = delta.x;
            this.map.location.y = delta.y;
        });

        this.map.onZoom.subscribe((scale) => {
            this.lastRendered = undefined;
        });

        this.map.onRotate.subscribe((scale) => {
            this.lastRendered = undefined;
        });

        // this.loadMap('../assets/4ci_testtiny.gif');
        // this.loadMap('../assets/4ci_testworld50.gif');
        this.loadMap('../assets/4ci_testworld.gif');

        this.loop();
    }

    mapInitialized() {
        this.map.gotoTile(92, 65);
        // this.map.gotoTile(24, 24);
        // this.map.gotoTile(30, 7);
        // this.map.gotoTile(13, 1);
        this.map.scale = .5;

        // let tile = this.map.getTile(13, 1);
        // tile.natureIndex = 4;
        // tile = this.map.getTile(2, 0).natureIndex = 0;
        // tile = this.map.getTile(0, 2).natureIndex = 0;
    }

    loop() {
        if (!this.pause) {
            this.drawMap();
            this.tick++;
        }
        setTimeout(() => this.loop(), 50);
    }

    get mouse_mx() {
        return -this.center_x + this.mouse.position.x + this.map.location.x;
    }

    get mouse_my() {
        return -this.center_y + this.mouse.position.y + this.map.location.y;
    }

    drawMap() {
        if (!this.mapLoaded) {
            return;
        }

        let location = this.map.location.withBoundedDelta(<Point>this.mouse.dragDelta, this.map.scale);

        let mx = location.x;
        let my = location.y;

        let width = this.planetCanvas.width;
        let height = this.planetCanvas.height;

        if (!location.isHere(this.lastRendered) || this.tick < 10 && this.tick % 3 === 0) {
            MapRenderer.render(this.map, this.groundLayer.ctx, RenderThe.Ground, location, width, height);
        }

        MapRenderer.render(this.map, this.airLayer.ctx, RenderThe.Air, location, width, height);

        this.planetCanvas.ctx.drawImage(this.groundLayer.canvas, 0, 0);
        this.planetCanvas.ctx.drawImage(this.airLayer.canvas, 0, 0);

        this.lastRendered = <Point>{
            x: location.x,
            y: location.y
        };
    }
}
