import { Injectable } from '@angular/core';
// import { Http, Headers, RequestOptions, Response, URLSearchParams  } from '@angular/http';
// import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScService {
    constructor (private http: HttpClient) {
    }

    profiles() {
        //const params: URLSearchParams = new URLSearchParams();
        //params.set('profile', 'all');

        // const requestOptions = new RequestOptions();
        // requestOptions.search = params;

        const params = new HttpParams()
            .set('profile','all');

        return this.http.get<object>('/scgui/profiles', {params})
            .pipe(
                catchError(this.handleError)
            );

        /*return this.http.get('/scgui/profiles', requestOptions).map(
            (response: Response) => {
                return response.json();
            }).catch(this.handleError);*/
    }

    config() {
        return this.http.get<object>('/scgui/config')
            .pipe(
                catchError(this.handleError)
            );
        /*
        return this.http.get('/scgui/config').map(
            (response: Response) => {
                return response.json();
            }).catch(this.handleError);*/
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
