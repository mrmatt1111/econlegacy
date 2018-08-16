// import { initChangeDetectorIfExisting } from "@angular/core/src/render3/instructions";
import { EventEmitter } from '@angular/core';
import { Point } from './location';

// export interface MousePoint {
//     mx: number;
//     my: number;
// }

export class Mouse {

    position: Point = undefined;
    clickPosition: Point = undefined;
    dragDelta: Point = undefined;

    mouseUpEvent: EventEmitter<Point> = new EventEmitter<Point>();

    constructor(private canvas: HTMLCanvasElement) {
        this.init();
    }

    getMousePos(evt): Point {
        let rect = this.canvas.getBoundingClientRect();
        return <Point>{
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    getDragDelta(): Point {
        if (!this.position || !this.clickPosition) {
            return undefined;
        }

        return <Point>{
            x: this.clickPosition.x - this.position.x,
            y: this.clickPosition.y - this.position.y,
        };
    }

    clearClick() {
        this.clickPosition = undefined;
        this.dragDelta = undefined;
    }

    init() {
        this.canvas.addEventListener('mousedown', (evt) => {
            this.clickPosition = this.getMousePos(evt);
        });

        this.canvas.addEventListener('mouseenter', (evt) => {
            this.position = this.getMousePos(evt);
            if (evt.buttons === 1 && evt.button === 0) {
                this.dragDelta = { x: 0, y: 0 };
                this.clickPosition = this.position;
            } else {
                this.clearClick();
            }
        });

        this.canvas.addEventListener('mouseleave', (evt) => {
            if (this.dragDelta) {
                this.mouseUpEvent.emit(this.dragDelta);
            }
            this.position = undefined;
            this.clearClick();
        });

        this.canvas.addEventListener('mousemove', (evt) => {
            if (this.position && this.clickPosition) {
                this.dragDelta = this.getDragDelta();
            } else if (this.dragDelta) {
                this.dragDelta = undefined;
            }
        });

        this.canvas.addEventListener('mouseup', (evt) => {
            if (this.dragDelta) {
                this.mouseUpEvent.emit(this.dragDelta);
            }
            this.clearClick();
        });

        this.canvas.addEventListener('mousemove', (evt) => {
            this.position = this.getMousePos(evt);
        });
    }
}
