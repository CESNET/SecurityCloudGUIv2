import { Injectable } from '@angular/core';
//import { Http, Headers, RequestOptions, Response, URLSearchParams  } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScGraphService {
    constructor (private http: HttpClient) {
    }

    graph(bgn: number, end: number, profilePath: string, varname: string, points: number) {

        const params = new HttpParams()
            .set('bgn', String(Math.floor(bgn / 1000)))
            .set('end', String(Math.floor(end / 1000)))
            .set('profile', profilePath)
            .set('var', varname)
            .set('points', String(points))
            .set('mode', 'graph');

        return this.http.get('/scgui/graph', {params})
            .pipe(
                catchError(this.handleError)
            );

    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
