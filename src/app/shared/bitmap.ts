import { Pixel } from './pixel';

export class BitMap {
    height: number;
    width: number;

    pixel: Pixel[][];

    constructor(imageData: ImageData) {
        this.width = imageData.width;
        this.height = imageData.height;
        this.pixel = BitMap.getPixelMap(imageData);
    }

    static getPixelMap(imageData: ImageData): Pixel[][] {
        let x = 0;
        let y = 0;
        let w = imageData.width;
        let h = imageData.height;

        let values = imageData.data.values();
        let map: Pixel[][] = [];
        // give a space for 'y'
        for (let xx = 0; xx < w; xx++) {
            map[xx] = [];
        }

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

            map[x][y] = pixel;

            if (++x === w) {
                x = 0;
                y++;
            }
        }
        return map;
    }

    static toImageData(pixelMap: Pixel[][]): ImageData {
        let w = pixelMap.length;
        let h = pixelMap[0].length;

        let imageData = new ImageData(w, h);
        let data = imageData.data;
        let offset = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let pixel = pixelMap[x][y];
                data[offset] = pixel.red;
                data[offset + 1] = pixel.green;
                data[offset + 2] = pixel.blue;
                data[offset + 3] = pixel.alpha;
                offset += 4;
            }
        }

        return imageData;
    }

    export(): ImageData {
        return BitMap.toImageData(this.pixel);
    }
}


