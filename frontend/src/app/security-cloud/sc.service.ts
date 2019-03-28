import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScService {
    constructor (private http: HttpClient) {
    }

    profiles() {

        const params = new HttpParams()
            .set('profile','all');

        return this.http.get<object>('/scgui/profiles', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    config() {
        return this.http.get<object>('/scgui/config')
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
