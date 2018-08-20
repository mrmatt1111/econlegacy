import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ImageService } from '../services/image.service';
import { LandTile } from './land-tile';
import { Road } from './road';
import { LandType, Direction, Season, Neighbor, RoadType } from './planet.enums';
import { MapManager, Neighbors } from './map.manager';
import { Mouse } from './mouse';
import { Location, Point } from './location';
import { Pixel, BitMap, CanvasImage, Random } from '../shared';
import { MapRenderer, RenderThe } from './map.renderer';
import { map } from 'rxjs/operators';
import * as stripJsonComments from 'strip-json-comments';
import { RoadManager } from './road.manager';

@Component({
    selector: 'app-planet',
    templateUrl: './planet.component.html',
    styleUrls: ['./planet.component.css']
})
export class PlanetComponent implements OnInit, AfterViewInit {

    @ViewChild('planetCanvas') planetCanvasRef: ElementRef;
    public context: CanvasRenderingContext2D;

    pause: boolean = false;
    slowTile: boolean = false;

    map: MapManager = new MapManager();
    roads = new RoadManager(this.map);

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

    // convertToJson = map(value => (value as any).replace("*", "").json());

    ngAfterViewInit(): void {
        this.http.get('assets/planet.jsonc', { responseType: 'text' }).pipe(
            map((json) => {
                return JSON.parse(stripJsonComments(json));
            })).subscribe((data: any) => {
                LandTile.loader.init(data.seasons.summer, Season.Summer);
                Road.loader.init(data.roads);
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

    roadBox(tx, ty, ...neighbors: Neighbor[]) {
        this.map.forEach((t) => {
            t.zone = 3;
        }, tx - 2, ty - 2, 5);

        this.map.forEach((t) => {
            t.zone = 7;
        }, tx - 1, ty - 1, 3);

        neighbors.forEach((neighbor: Neighbor) => {
            let point = Neighbors.getPoint(tx, ty, neighbor);

            this.map.getTile(point.x, point.y).zone = 5;
        });

        this.roads.addRoads([this.map.getTile(tx, ty)]);
    }

    mapInitialized() {
        this.map.gotoTile(92, 65);
        this.map.gotoTile(4, 24);

        LandTile.showZones = true;
        // LandTile.showNature = false;
        // this.map.gotoTile(30, 7);
        // this.map.gotoTile(13, 1);
        // this.map.scale = .5;

        let tile = this.map.getTile(4, 24);

        let index = 0;
        this.roadBox(2 + (index++) * 4, 12, Neighbor.N);
        this.roadBox(2 + (index++) * 4, 12, Neighbor.E);
        this.roadBox(2 + (index++) * 4, 12, Neighbor.S);
        this.roadBox(2 + (index++) * 4, 12, Neighbor.W);

        index = 0;
        this.roadBox(2 + (index++) * 4, 16, Neighbor.N, Neighbor.S);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.E, Neighbor.W);

        this.roadBox(2 + (index++) * 4, 16, Neighbor.N, Neighbor.E);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.S, Neighbor.E);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.S, Neighbor.W);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.N, Neighbor.W);

        this.roadBox(2 + (index++) * 4, 16, Neighbor.N, Neighbor.NE);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.N, Neighbor.NW);

        this.roadBox(2 + (index++) * 4, 16, Neighbor.NE, Neighbor.E);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.E, Neighbor.SE);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.SW, Neighbor.W);
        this.roadBox(2 + (index++) * 4, 16, Neighbor.W, Neighbor.NW);


        this.roads.calcRoadTypes();


        let nays: Neighbors = this.map.neighbors(tile, (neighbor): boolean => {
            return neighbor.zone === 5;
        });

        let has = nays.areThese(Neighbor.N, Neighbor.E);

        let N = Neighbor;

        // this.map.getTile(6, 26).road = new Road(RoadType.None);

        // this.map.getTile(4, 26).road = new Road(RoadType.TE);
        // this.map.getTile(5, 28).road = new Road(RoadType.EndW);
        // this.map.getTile(4, 29).road = new Road(RoadType.EndS);
        // this.map.getTile(4, 28).road = new Road(RoadType.TS);
        // this.map.getTile(4, 30).road = new Road(RoadType.TW);
        // this.map.getTile(4, 32).road = new Road(RoadType.Cross);


        // this.map.getTile(8, 28).road = new Road(RoadType.N);
        // this.map.getTile(8, 29).road = new Road(RoadType.S);
        // this.map.getTile(9, 29).road = new Road(RoadType.N);

        // this.map.getTile(7, 28).road = new Road(RoadType.EndE);
        // this.map.getTile(9, 30).road = new Road(RoadType.NS);
        // this.map.getTile(7, 32).road = new Road(RoadType.EW);

        // this.map.getTile(9, 31).road = new Road(RoadType.E);
        // this.map.getTile(8, 31).road = new Road(RoadType.W);
        // this.map.getTile(8, 32).road = new Road(RoadType.E);

        // this.map.getTile(4, 34).road = new Road(RoadType.CornerSE);
        // this.map.getTile(5, 34).road = new Road(RoadType.CornerSW);
        // this.map.getTile(4, 35).road = new Road(RoadType.CornerNE);
        // this.map.getTile(5, 35).road = new Road(RoadType.CornerNW);


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
