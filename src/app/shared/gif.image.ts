// this was modified from https://www.npmjs.com/package/readwrite-gif

import { HttpClient } from '@angular/common/http';
import { CanvasImage } from './canvas-image';

export interface GifFrame {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    has_local_palette: boolean;
    palette_offset: number;
    data_offset: number;
    data_length: number;
    transparent_index: number;
    interlaced: boolean;
    minDelay: number;
    maxDelay: number;
    delay: number;
    disposal: any;
    image: HTMLImageElement;
}

export class GifImage {

    static http: HttpClient;

    static inTheBeginning: Date = new Date();

    maxDelay: number;

    get currentTime() {
        return (<any>new Date() - <any>GifImage.inTheBeginning) % this.maxDelay;
    }

    width: number;
    height: number;

    frames: GifFrame[] = [];

    buffer;

    private constructor() {

    }

    static toBuffer(blob, onload) {
        if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
            throw new Error('first argument must be a Blob');
        }

        if (typeof onload !== 'function') {
            throw new Error('second argument must be a function');
        }

        let reader = new FileReader();

        function onLoadEnd(e) {
            reader.removeEventListener('loadend', onLoadEnd, false);
            if (e.error) {
                onload(e.error);
            } else {
                onload(undefined, reader.result);
            }
        }

        reader.addEventListener('loadend', onLoadEnd, false);
        reader.readAsArrayBuffer(blob);
    }

    static load(url: string, onload: (image: GifImage) => void): GifImage {
        let gif: GifImage = new GifImage();

        let framesToLoad: number;

        GifImage.http.get(url, { responseType: 'blob' }).subscribe((blob) => {
            this.toBuffer(blob, (err, buffer) => {
                gif.loadFromBuffer(new Uint8Array(buffer));

                framesToLoad = gif.numFrames;

                gif.frames.forEach((frame) => {

                    let image: CanvasImage = CanvasImage.create(gif.width, gif.height);

                    let data = image.getImageData();

                    gif.decondAndBlit(frame.index, data.data);
                    image.ctx.putImageData(data, 0, 0);

                    image.press((img) => {
                        // image.frames[frame.index] = i.image;
                        gif.frames[frame.index].image = img.image;

                        if (--framesToLoad === 0) {
                            let relativeDelay = 0;
                            gif.frames.forEach((_frame) => {
                                _frame.minDelay = relativeDelay;
                                relativeDelay += _frame.delay * 10;
                                _frame.maxDelay = relativeDelay;
                            });
                            gif.maxDelay = relativeDelay;

                            gif.buffer = undefined;
                            onload(gif);
                        }
                    });
                });
            });
        });

        return gif;
    }

    private loadFromBuffer(buffer) {
        let i = 0;

        this.buffer = buffer;

        // Verify Header.
        if (buffer[i++] !== 0x47 || buffer[i++] !== 0x49 || buffer[i++] !== 0x46 ||  // GIF
            buffer[i++] !== 0x38 || buffer[i++] !== 0x39 || buffer[i++] !== 0x61) {  // 89a
            throw { Message: 'Invalid header' };
        }

        // Screen Descriptors
        let width = buffer[i++] | buffer[i++] << 8;
        let height = buffer[i++] | buffer[i++] << 8;
        let pf0 = buffer[i++];
        let global_palette_flag = pf0 >> 7;
        let num_global_colors_pow2 = pf0 & 0x7;
        let num_global_colors = 1 << (num_global_colors_pow2 + 1);
        let background = buffer[i++];
        i++;  // Pixel aspect ratio (unused?).

        let global_palette_offset = null;

        if (global_palette_flag) {
            global_palette_offset = i;
            i += num_global_colors * 3;  // Seek past palette.
        }

        let no_eof = true;

        let delay = 0;
        let transparent_index = null;
        let disposal = 0;  // 0 - No disposal specified.
        let loop_count = null;

        this.width = width;
        this.height = height;

        while (no_eof && i < buffer.length) {
            switch (buffer[i++]) {
                case 0x21:  // Graphics Control Extension Block
                    switch (buffer[i++]) {
                        case 0xff:  // Application specific block
                            // Try if it's a Netscape block (with animation loop counter).
                            if (buffer[i] !== 0x0b ||  // 21 FF already read, check block size.
                                // NETSCAPE2.0
                                buffer[i + 1] === 0x4e && buffer[i + 2] === 0x45 && buffer[i + 3] === 0x54 &&
                                buffer[i + 4] === 0x53 && buffer[i + 5] === 0x43 && buffer[i + 6] === 0x41 &&
                                buffer[i + 7] === 0x50 && buffer[i + 8] === 0x45 && buffer[i + 9] === 0x32 &&
                                buffer[i + 10] === 0x2e && buffer[i + 11] === 0x30 &&
                                // Sub-block
                                buffer[i + 12] === 0x03 && buffer[i + 13] === 0x01 && buffer[i + 16] === 0) {
                                i += 14;
                                loop_count = buffer[i++] | buffer[i++] << 8;
                                i++;  // Skip terminator.
                            } else {  // We don't know what it is, just try to get past it.
                                i += 12;
                                while (true) {  // Seek through subblocks.
                                    let block_size = buffer[i++];
                                    if (block_size === 0) {
                                        break;
                                    }
                                    i += block_size;
                                }
                            }
                            break;

                        case 0xf9:  // Graphics Control Extension
                            if (buffer[i++] !== 0x4 || buffer[i + 4] !== 0) {
                                throw { message: 'Invalid graphics extension block.' };
                            }
                            let pf1 = buffer[i++];
                            delay = buffer[i++] | buffer[i++] << 8;
                            transparent_index = buffer[i++];
                            if ((pf1 & 1) === 0) {
                                transparent_index = null;
                            }
                            disposal = pf1 >> 2 & 0x7;
                            i++;  // Skip terminator.
                            break;

                        case 0xfe:  // Comment Extension.
                            while (true) {  // Seek through subblocks.
                                let block_size = buffer[i++];
                                if (block_size === 0) {
                                    break;
                                }
                                // console.log(buf.slice(p, p+block_size).toString('ascii'));
                                i += block_size;
                            }
                            break;

                        default:
                            throw { message: 'Unknown graphic control label: 0x' + buffer[i - 1].toString(16) };
                    }
                    break;

                case 0x2c:  // Image Descriptor.
                    let x = buffer[i++] | buffer[i++] << 8;
                    let y = buffer[i++] | buffer[i++] << 8;
                    let w = buffer[i++] | buffer[i++] << 8;
                    let h = buffer[i++] | buffer[i++] << 8;
                    let pf2 = buffer[i++];
                    let local_palette_flag = pf2 >> 7;
                    let interlace_flag = pf2 >> 6 & 1;
                    let num_local_colors_pow2 = pf2 & 0x7;
                    let num_local_colors = 1 << (num_local_colors_pow2 + 1);
                    let palette_offset = global_palette_offset;
                    let has_local_palette = false;
                    if (local_palette_flag) {
                        has_local_palette = true;
                        palette_offset = i;  // Override with local palette.
                        i += num_local_colors * 3;  // Seek past palette.
                    }

                    let data_offset = i;

                    i++;  // codesize
                    while (true) {
                        let block_size = buffer[i++];
                        if (block_size === 0) {
                            break;
                        }
                        i += block_size;
                    }

                    this.frames.push({
                        index: this.frames.length,
                        x: x, y: y, width: w, height: h,
                        has_local_palette: has_local_palette,
                        palette_offset: palette_offset,
                        data_offset: data_offset,
                        data_length: i - data_offset,
                        transparent_index: transparent_index,
                        interlaced: !!interlace_flag,
                        delay: delay,
                        disposal: disposal,
                        image: undefined,
                        minDelay: undefined,
                        maxDelay: undefined,
                    });
                    break;

                case 0x3b:  // Trailer Marker (end of file).
                    no_eof = false;
                    break;

                default:
                    // throw 'Unknown gif block: 0x' + buf[p-1].toString(16);
                    break;
            }
        }
    }

    get image() {
        let currentTime = this.currentTime;
        for (let frame of this.frames) {
            if (currentTime > frame.minDelay && currentTime <= frame.maxDelay) {
                return frame.image;
            }
        }
        return this.frames[0].image;
    }

    get numFrames() {
        return this.frames.length;
    }

    frameInfo(frame_num) {
        if (frame_num < 0 || frame_num >= this.frames.length) {
            throw { message: 'Frame index out of range.' };
        }
        return this.frames[frame_num];
    }

    private decondAndBlit(frame_num, pixels) {
        let frame = this.frameInfo(frame_num);
        let num_pixels = frame.width * frame.height;
        let index_stream = new Uint8Array(num_pixels);  // At most 8-bit indices.
        this.GifReaderLZWOutputIndexStream(
            this.buffer, frame.data_offset, index_stream, num_pixels);
        let palette_offset = frame.palette_offset;

        // NOTE(deanm): It seems to be much faster to compare index to 256 than
        // to === null.  Not sure why, but CompareStub_EQ_STRICT shows up high in
        // the profile, not sure if it's related to using a Uint8Array.
        let trans = frame.transparent_index;
        if (trans === null) {
            trans = 256;
        }

        // We are possibly just blitting to a portion of the entire frame.
        // That is a subrect within the framerect, so the additional pixels
        // must be skipped over after we finished a scanline.
        let framewidth = frame.width;
        let framestride = this.width - framewidth;
        let xleft = framewidth;  // Number of subrect pixels left in scanline.

        // Output indicies of the top left and bottom right corners of the subrect.
        let opbeg = ((frame.y * this.width) + frame.x) * 4;
        let opend = ((frame.y + frame.height) * this.width + frame.x) * 4;
        let op = opbeg;

        let scanstride = framestride * 4;

        // Use scanstride to skip past the rows when interlacing.  This is skipping
        // 7 rows for the first two passes, then 3 then 1.
        if (frame.interlaced === true) {
            scanstride += (framewidth + framestride) * 4 * 7;  // Pass 1.
        }

        let interlaceskip = 8;  // Tracking the row interval in the current pass.

        for (let i = 0, il = index_stream.length; i < il; ++i) {
            let index = index_stream[i];

            if (xleft === 0) {  // Beginning of new scan line
                op += scanstride;
                xleft = framewidth;
                if (op >= opend) { // Catch the wrap to switch passes when interlacing.
                    scanstride =
                        framestride + (framewidth + framestride) * 4 * (interlaceskip - 1);
                    // interlaceskip / 2 * 4 is interlaceskip << 1.
                    op = opbeg + (framewidth + framestride) * (interlaceskip << 1);
                    interlaceskip >>= 1;
                }
            }

            if (index === trans) {
                pixels[op++] = 0;
                pixels[op++] = 0;
                pixels[op++] = 0;
                pixels[op++] = 0;
                // op += 4;
            } else {
                let r = this.buffer[palette_offset + index * 3];
                let g = this.buffer[palette_offset + index * 3 + 1];
                let b = this.buffer[palette_offset + index * 3 + 2];
                pixels[op++] = r;
                pixels[op++] = g;
                pixels[op++] = b;
                pixels[op++] = 255;
            }
            --xleft;
        }

        return pixels;
    }

    private GifReaderLZWOutputIndexStream(code_stream, p, output, output_length) {
        let min_code_size = code_stream[p++];

        let clear_code = 1 << min_code_size;
        let eoi_code = clear_code + 1;
        let next_code = eoi_code + 1;

        let cur_code_size = min_code_size + 1;  // Number of bits per code.
        // NOTE: This shares the same name as the encoder, but has a different
        // meaning here.  Here this masks each code coming from the code stream.
        let code_mask = (1 << cur_code_size) - 1;
        let cur_shift = 0;
        let cur = 0;

        let op = 0;  // Output pointer.

        let subblock_size = code_stream[p++];

        // TODO(deanm): Would using a TypedArray be any faster?  At least it would
        // solve the fast mode / backing store uncertainty.
        // let code_table = Array(4096);
        let code_table = new Int32Array(4096);  // Can be signed, we only use 20 bits.

        let prev_code = null;  // Track code-1.

        while (true) {
            // Read up to two bytes, making sure we always 12-bits for max sized code.
            while (cur_shift < 16) {
                if (subblock_size === 0) {
                    break;  // No more data to be read.
                }

                cur |= code_stream[p++] << cur_shift;
                cur_shift += 8;

                if (subblock_size === 1) {  // Never let it get to 0 to hold logic above.
                    subblock_size = code_stream[p++];  // Next subblock.
                } else {
                    --subblock_size;
                }
            }

            // TODO(deanm): We should never really get here, we should have received
            // and EOI.
            if (cur_shift < cur_code_size) {
                break;
            }

            let code = cur & code_mask;
            cur >>= cur_code_size;
            cur_shift -= cur_code_size;

            // TODO(deanm): Maybe should check that the first code was a clear code,
            // at least this is what you're supposed to do.  But actually our encoder
            // now doesn't emit a clear code first anyway.
            if (code === clear_code) {
                // We don't actually have to clear the table.  This could be a good idea
                // for greater error checking, but we don't really do any anyway.  We
                // will just track it with next_code and overwrite old entries.

                next_code = eoi_code + 1;
                cur_code_size = min_code_size + 1;
                code_mask = (1 << cur_code_size) - 1;

                // Don't update prev_code ?
                prev_code = null;
                continue;
            } else if (code === eoi_code) {
                break;
            }

            // We have a similar situation as the decoder, where we want to store
            // variable length entries (code table entries), but we want to do in a
            // faster manner than an array of arrays.  The code below stores sort of a
            // linked list within the code table, and then 'chases' through it to
            // construct the dictionary entries.  When a new entry is created, just the
            // last byte is stored, and the rest (prefix) of the entry is only
            // referenced by its table entry.  Then the code chases through the
            // prefixes until it reaches a single byte code.  We have to chase twice,
            // first to compute the length, and then to actually copy the data to the
            // output (backwards, since we know the length).  The alternative would be
            // storing something in an intermediate stack, but that doesn't make any
            // more sense.  I implemented an approach where it also stored the length
            // in the code table, although it's a bit tricky because you run out of
            // bits (12 + 12 + 8), but I didn't measure much improvements (the table
            // entries are generally not the long).  Even when I created benchmarks for
            // very long table entries the complexity did not seem worth it.
            // The code table stores the prefix entry in 12 bits and then the suffix
            // byte in 8 bits, so each entry is 20 bits.

            let chase_code = code < next_code ? code : prev_code;

            // Chase what we will output, either {CODE} or {CODE-1}.
            let chase_length = 0;
            let chase = chase_code;
            while (chase > clear_code) {
                chase = code_table[chase] >> 8;
                ++chase_length;
            }

            let k = chase;

            let op_end = op + chase_length + (chase_code !== code ? 1 : 0);
            if (op_end > output_length) {
                console.log('Warning, gif stream longer than expected.');
                return;
            }

            // Already have the first byte from the chase, might as well write it fast.
            output[op++] = k;

            op += chase_length;
            let b = op;  // Track pointer, writing backwards.

            if (chase_code !== code) { // The case of emitting {CODE-1} + k.
                output[op++] = k;
            }

            chase = chase_code;
            while (chase_length--) {
                chase = code_table[chase];
                output[--b] = chase & 0xff;  // Write backwards.
                chase >>= 8;  // Pull down to the prefix code.
            }

            if (prev_code !== null && next_code < 4096) {
                code_table[next_code++] = prev_code << 8 | k;
                // TODO(deanm): Figure out this clearing vs code growth logic better.  I
                // have an feeling that it should just happen somewhere else, for now it
                // is awkward between when we grow past the max and then hit a clear code.
                // For now just check if we hit the max 12-bits (then a clear code should
                // follow, also of course encoded in 12-bits).
                if (next_code >= code_mask + 1 && cur_code_size < 12) {
                    ++cur_code_size;
                    code_mask = code_mask << 1 | 1;
                }
            }

            prev_code = code;
        }

        if (op !== output_length) {
            console.log('Warning, gif stream shorter than expected.');
        }

        return output;
    }
}
