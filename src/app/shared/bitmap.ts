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

        let values = imageData.data.values();
        let map: Pixel[][] = [];
        // give a space for 'y'
        for (let i = 0; i < w; i++) {
            map[i] = [];
        }

        let pixel: Pixel;
        while (pixel = Pixel.next(values)) {
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

    tally() {
        let tallyThem: { value: string, count: number, hex: string }[] = [];
        let tally = [];

        for (let x: number = 0; x < this.width; x++) {
            for (let y: number = 0; y < this.height; y++) {
                if (this.pixel[x][y].alpha === 0) {
                    continue;
                }

                let pixelString = this.pixel[x][y].toString();

                if (tallyThem[pixelString] === undefined) {
                    tallyThem[pixelString] = {
                        value: pixelString,
                        count: 0,
                        hex: this.pixel[x][y].toString('hex')
                    };
                    tally.push(tallyThem[pixelString]);
                }
                tallyThem[pixelString].count++;
            }
        }

        tally.sort(function (a, b) { return b.count - a.count; });
        return tally;
    }

    toString(format: string = 'full') {
        let out: string[] = [];

        if (format === 'full') {
            this.tally().forEach((value) => {
                if (format === 'full') {
                    out.push('{ "value": "' + value.value + '", "count": ' + value.count + '}');
                }
            });

            return out.join(',');
        } else if (format === 'short') {
            this.tally().forEach((value) => {
                out.push('"' + value.hex + ';' + value.count + '"');
            });

            return '[' + out.join(', ') + ']';
        }

        return 'bitmap: unknown format: ' + format;
    }
}
