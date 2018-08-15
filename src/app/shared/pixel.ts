export class Pixel {
    constructor(public red: number, public green: number, public blue: number, public alpha: number = 255) { }

    static fromHex(hex: string) {
        hex = hex.replace('#', '');

        return new Pixel(
            parseInt('0x' + hex.substr(0, 2)),
            parseInt('0x' + hex.substr(2, 2)),
            parseInt('0x' + hex.substr(4, 2)),
        );
    }

    set(red: number, green: number, blue: number, alpha: number = 255) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    equals(red: number, green: number, blue: number, alpha: number = 255) {
        return red === this.red && green === this.green && blue === this.blue && alpha === this.alpha;
    }

    toString(): string {
        let out: string[] = [];
        out.push('rgba(');
        out.push(this.red + ',');
        out.push(this.green + ',');
        out.push(this.blue + ',');
        out.push(this.alpha + ')');
        return out.join('');
    }

    toHex(): string {
        let out: string[] = [];
        out.push('#');
        out.push(this.red.toString(16));
        out.push(this.green.toString(16));
        out.push(this.blue.toString(16));
        return out.join('');
    }
}
