export class Pixel {
    constructor(public red: number, public green: number, public blue: number, public alpha: number = 255) {}

    equals(red: number, green: number, blue: number, alpha: number = 255) {
        return red === this.red && green === this.green && blue === this.blue && alpha === this.alpha;
    }
}
