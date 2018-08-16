import { BitMap } from './bitmap';
import { ElementRef } from '@angular/core';

export class ContextRect implements ClientRect {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;

    constructor(x: number, y: number, w: number, h: number, scale: number) {
        this.width = w * scale;
        this.height = h * scale;

        this.top = y - this.height / 2;
        this.bottom = y + this.height / 2;

        this.left = x - this.width / 2;
        this.right = x + this.width / 2;
    }

    draw(ctx: CanvasRenderingContext2D, strokeStyle?: string) {
        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.right, this.top);
        ctx.lineTo(this.right, this.bottom);
        ctx.lineTo(this.left, this.bottom);
        ctx.closePath();
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
        }
        ctx.stroke();
    }
}

export class CanvasImage {

    hasLoaded: boolean = false;
    private needsImage: boolean = false;
    private contextDestroyed = false;   // only can draw once: 1. fetch image, draw, and load 2. create image and load
    private drawImageOnCreateContext = false;

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

    private _onload: (image: CanvasImage) => void;
    set onload(handler: (image: CanvasImage) => void) {
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

    static createFrom(ref: ElementRef): CanvasImage {
        let image = new CanvasImage();

        image._context = (<HTMLCanvasElement>ref.nativeElement).getContext('2d');

        return image;
    }

    static load(img: HTMLImageElement): CanvasImage {
        let image = CanvasImage.create(img.width, img.height);

        image.ctx.drawImage(img, 0, 0, img.width, img.height);

        return image;
    }

    static fetch(url: string, onload?: (image: CanvasImage) => void, onerror?: () => void): CanvasImage {
        let image = new CanvasImage();

        image.needsImage = true;
        image.onload = onload;
        image.onerror = onerror;

        image.image.src = url;

        return image;
    }

    private createContext(width: number, height: number) {
        if (this.contextDestroyed) {
            throw new Error('This canvas image has already been built, please create a new one.');
        }

        let canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        this._context = canvas.getContext('2d');

        if (this.drawImageOnCreateContext) {
            this._context.drawImage(this.image, 0, 0, this.width, this.height);
            this.drawImageOnCreateContext = false;
        }
    }

    getImageData(x?: number, y?: number, width?: number, height?: number) {
        if (!this.ctx) {
            throw new Error('Map Image has yet to complete loading.');
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
        this.drawImageOnCreateContext = true;
        if (this._onload) {
            this._onload.call(this.image, this);
        }
    }

    doOnError() {
        if (this._onerror) {
            this._onerror.call(this.image);
        }
    }
}
