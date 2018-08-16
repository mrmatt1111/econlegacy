import { BitMap } from './bitmap';

export class CanvasImage {

    hasLoaded: boolean = false;
    private needsImage: boolean = false;
    private contextDestroyed = false;   // only can draw once: 1. fetch image, draw, and load 2. create image and load

    private _image: HTMLImageElement;   // don't always need an image
    get image(): HTMLImageElement {
        if (!this._image) {
            this._image = new Image();
            this._image.onload = () => this.doOnLoad();
            this._image.onerror = () => this.doOnError();
        }

        return this._image;
    }

    private _context: CanvasRenderingContext2D;
    get ctx() {
        if (this.needsImage && !this.hasLoaded) {
            throw new Error('get ctx: Map Image has yet to complete loading.');
        }
        if (!this._context) {
            this.createContext(this.image.width, this.image.height);
        }
        return this._context;
    }

    get canvas(): HTMLCanvasElement {
        return this.ctx.canvas;
    }

    get width(): number {
        return this._context ? this._context.canvas.width : this.image.width;
    }

    get height(): number {
        return this._context ? this._context.canvas.height : this.image.height;
    }

    private _onload: () => void;
    set onload(handler: () => void) {
        this._onload = handler;
    }

    private _onerror: () => void;
    set onerror(handler: () => void) {
        this._onerror = handler;
    }

    private constructor() {

    }

    static create(width: number, height: number): CanvasImage {
        let image = new CanvasImage();

        image.createContext(width, height);

        return image;
    }

    static load(img: HTMLImageElement): CanvasImage {
        let image = CanvasImage.create(img.width, img.height);

        image.ctx.drawImage(img, 0, 0, img.width, img.height);

        return image;
    }

    static fetch(url: string, onload?: () => void, onerror?: () => void): CanvasImage {
        let image = new CanvasImage();

        image.needsImage = true;
        image.onload = onload;
        image.onerror = onerror;

        image.image.src = url;

        return image;
    }

    private createContext(width: number, height: number) {
        if (this.contextDestroyed) {
            throw { message: 'This canvas image has already been built, please create a new one.' };
        }

        let canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        this._context = canvas.getContext('2d');
    }

    getImageData(x?: number, y?: number, width?: number, height?: number) {
        if (!this._context) {
            throw { message: 'Map Image has yet to complete loading.' };
        }

        if (width === undefined) {
            width = this.ctx.canvas.width;
        }
        if (height === undefined) {
            height = this.ctx.canvas.height;
        }

        return this.ctx.getImageData(
            x ? x : 0,
            y ? y : 0,
            width !== undefined ? width : this.width,
            height !== undefined ? height : this.height,
        );
    }

    getBitMap() {
        return new BitMap(this.getImageData());
    }

    putBitMap(bitmap: BitMap, x?: number, y?: number) {
        this.ctx.putImageData(bitmap.export(), x ? x : 0, x ? x : 0);
    }

    send() {
        this.hasLoaded = false;
        this.needsImage = true;
        this.image.src = this._context.canvas.toDataURL();
        this.contextDestroyed = true;
        this._context = undefined; // kill the context cause we don't need it any more
    }

    doOnLoad() {
        this.hasLoaded = true;
        if (this._onload) {
            this._onload.call(this.image);
        }
    }

    doOnError() {
        if (this._onerror) {
            this._onerror.call(this.image);
        }
    }
}
