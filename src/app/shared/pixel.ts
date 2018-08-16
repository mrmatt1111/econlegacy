export class Pixel {
    constructor(public red: number, public green: number, public blue: number, public alpha: number = 255) { }

    static fromHex(hex: string) {
        hex = hex.replace('#', '');

        return new Pixel(
            parseInt(hex.substr(0, 2), 16),
            parseInt(hex.substr(2, 2), 16),
            parseInt(hex.substr(4, 2), 16),
        );
    }

    static next(values: IterableIterator<number>) {
        let next = values.next();
        if (!next || next.done === true || next.value === undefined) {
            return undefined;
        }

        return new Pixel(
            next.value,
            values.next().value,
            values.next().value,
            values.next().value
        );
    }

    set(red: number, green: number, blue: number, alpha: number = 255) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    copy(pixel: Pixel, retainCurrentAlpha: boolean = false): void {
        this.red = pixel.red;
        this.green = pixel.green;
        this.blue = pixel.blue;

        if (!retainCurrentAlpha) {
            this.alpha = pixel.alpha;
        }
    }

    equals(red: number, green: number, blue: number, alpha: number = 255) {
        return red === this.red && green === this.green && blue === this.blue && alpha === this.alpha;
    }

    toString(format: string = 'rgba'): string {
        let out: string[] = [];
        if (format === 'rgba') {
            out.push('rgba(');
            out.push(this.red + ',');
            out.push(this.green + ',');
            out.push(this.blue + ',');
            out.push(this.alpha + ')');
        } else if (format === 'hex') {
            out.push('#');
            out.push(this.red.toString(16));
            out.push(this.green.toString(16));
            out.push(this.blue.toString(16));
        }
        return out.join('');
    }
}
