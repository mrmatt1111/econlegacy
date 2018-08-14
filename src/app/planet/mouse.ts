// import { initChangeDetectorIfExisting } from "@angular/core/src/render3/instructions";
import { EventEmitter } from "@angular/core";

export interface MousePoint {
    mx: number;
    my: number;
}

export class Mouse {
    
    position: MousePoint = undefined;
    clickPosition: MousePoint = undefined;
    dragDelta: MousePoint = undefined;

    mouseUpEvent: EventEmitter<MousePoint> = new EventEmitter<MousePoint>();
    
    constructor(private canvas: HTMLCanvasElement) {
        this.init();
    }
    
    getMousePos(evt): MousePoint {
        let rect = this.canvas.getBoundingClientRect();
        return {
            mx: evt.clientX - rect.left,
            my: evt.clientY - rect.top
        }
    }

    getDragDelta(): MousePoint {
        if (!this.position || !this.clickPosition) {
            return undefined
        }

        return <MousePoint> {
            mx: this.clickPosition.mx - this.position.mx,
            my: this.clickPosition.my - this.position.my,
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
                this.dragDelta = { mx: 0, my: 0 };
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
            }
            else if (this.dragDelta)
                this.dragDelta = undefined;
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