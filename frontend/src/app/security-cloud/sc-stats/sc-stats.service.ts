import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScStatService {
    constructor (private http: HttpClient) {
    }

    stats(bgn: number, end: number, profilePath: string) {
        const params = new HttpParams()
            .set('bgn', String(Math.floor(bgn / 1000)))
            .set('end', String(Math.floor(end / 1000)))
            .set('profile', profilePath);

        return this.http.get('/scgui/stats', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
