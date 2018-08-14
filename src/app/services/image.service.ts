
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, ResponseContentType } from '@angular/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable()
export class ImageService {

    public static imageBase = "assets/images/"

    constructor(private http: Http) { }

    loadImageBytes(filename: string): Promise<any> {

        let args: RequestOptionsArgs = <RequestOptionsArgs>{};

        args.responseType = ResponseContentType.ArrayBuffer;

        return this.http.get(ImageService.imageBase + filename).pipe(
            map(this.extractArrayBuffer),
            catchError(this.handleError('loadImage', []))
        ).toPromise();
    }

    private _arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    private extractArrayBuffer(res: Response) {

        let body = this._arrayBufferToBase64(res.arrayBuffer());

        //let first = new Uint8Array(body);

        //debugger;
        return body || {};
    }

    private extractData(res: Response) {
        let body = res.json();
        return body.data || {};
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(error); // log to console instead

            console.log(`${operation} failed: ${error.message}`);
            return of(result as T);
        };
    }
}