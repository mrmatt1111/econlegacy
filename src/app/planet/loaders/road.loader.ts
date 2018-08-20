import { RoadType } from '../planet.enums';
import { CanvasImage } from '../../shared';

export class RoadLoader {

    roads: HTMLImageElement[] = [];

    init(roadData) {

        let none = CanvasImage.create(64, 32);

        let ox = 16;
        let oy = 8;

        none.ctx.beginPath();

        none.ctx.strokeStyle = '#b8b8b8';
        none.ctx.moveTo(0 + ox, 16);
        none.ctx.lineWidth = 3;
        none.ctx.lineTo(32, oy);
        none.ctx.lineTo(64 - ox, 16);
        none.ctx.lineTo(32, 32 - oy);
        none.ctx.closePath();
        none.ctx.fillStyle = '#283028'; // '#282828'; //'#404040';
        none.ctx.stroke();
        none.ctx.fill();

        none.press((img) => {
            this.roads[RoadType.None] = img.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.end, (image) => {
            this.roads[RoadType.EndN] = image.image;

            CanvasImage.load(image.image, true, false).press((img) => {
                this.roads[RoadType.EndE] = img.image;
            });

            CanvasImage.load(image.image, true, true).press((img) => {
                this.roads[RoadType.EndS] = img.image;
            });

            CanvasImage.load(image.image, false, true).press((img) => {
                this.roads[RoadType.EndW] = img.image;
            });
        });

        CanvasImage.fetch('assets/roads/' + roadData.full, (image) => {
            this.roads[RoadType.NS] = image.image;

            CanvasImage.load(image.image, true, false).press((img) => {
                this.roads[RoadType.EW] = img.image;
            });
        });

        CanvasImage.fetch('assets/roads/' + roadData.edgeN, (image) => {
            this.roads[RoadType.N] = image.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.edgeE, (image) => {
            this.roads[RoadType.E] = image.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.edgeS, (image) => {
            this.roads[RoadType.S] = image.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.edgeW, (image) => {
            this.roads[RoadType.W] = image.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.t, (image) => {
            this.roads[RoadType.TN] = image.image;

            CanvasImage.load(image.image, true, false).press((img) => {
                this.roads[RoadType.TE] = img.image;
            });

            CanvasImage.load(image.image, true, true).press((img) => {
                this.roads[RoadType.TS] = img.image;
            });

            CanvasImage.load(image.image, false, true).press((img) => {
                this.roads[RoadType.TW] = img.image;
            });
        });

        CanvasImage.fetch('assets/roads/' + roadData.cross, (image) => {
            this.roads[RoadType.Cross] = image.image;
        });

        CanvasImage.fetch('assets/roads/' + roadData.cornerNE, (image) => {
            this.roads[RoadType.CornerNE] = image.image;

            // CanvasImage.load(image.image, false, true).save((img) => {
            //     this.roads[RoadType.CornerSW] = img.image;
            // });
        });

        CanvasImage.fetch('assets/roads/' + roadData.cornerSE, (image) => {
            this.roads[RoadType.CornerSE] = image.image;

            CanvasImage.load(image.image, true, false).press((img) => {
                this.roads[RoadType.CornerNW] = img.image;
            });
        });

        CanvasImage.fetch('assets/roads/' + roadData.cornerSW, (image) => {
            this.roads[RoadType.CornerSW] = image.image; // looks better
        });

    }
}
