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

        Object.keys(RoadType).forEach((type) => {
            if (type === 'None' || type === 'Full') {
                return;
            }

            CanvasImage.fetch('assets/roads/' + roadData[type], (image) => {
                this.roads[RoadType[type]] = image.image;
            });
        });

        CanvasImage.fetch('assets/roads/' + roadData.Full, (image) => {
            this.roads[RoadType.NS] = image.image;

            CanvasImage.load(image.image, true, false).press((img) => {
                this.roads[RoadType.EW] = img.image;
            });
        });
    }
}
