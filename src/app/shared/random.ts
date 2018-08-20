import * as Alea from 'alea';

export class Random {
    private generator;

    constructor(seed?) {
        this.generator = seed ? new Alea(seed) : new Alea();
    }

    next(): number {
        return this.generator();
    }

    nextInt(exclusiveMax?: number) {
        return Math.floor(this.next() * (exclusiveMax ? exclusiveMax : Number.MAX_SAFE_INTEGER));
    }
}
