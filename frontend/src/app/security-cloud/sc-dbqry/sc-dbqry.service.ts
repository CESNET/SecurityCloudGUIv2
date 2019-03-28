import { Injectable } from '@angular/core';
// import { Http, Headers, RequestOptions, Response, URLSearchParams  } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScDbqryService {
    constructor (private http: HttpClient) {
    }

    fields(): Observable<object> {
        return this.http.get<object>('/scgui/query/fields')
            .pipe(
                catchError(this.handleError)
            );
    }

    queryStart(profilePath: string, instance: string, qFilter: string, qArgs: string, qChannels: string): Observable<object> {
        const body = {
            profile: profilePath,
            instanceID: instance,
            filter: qFilter,
            args: qArgs,
            channels: qChannels
        };

        return this.http.post<object>('/scgui/query/instance', body)
            .pipe(
                catchError(this.handleError)
            );
    }

    queryProgress(instance: string) {

        const params = new HttpParams()
            .set('instanceID', instance);

        return this.http.get<object>('/scgui/query/progress', {params})
            .pipe(
                catchError(this.handleError)
            );

    }

    queryResult(instance: string) {

        const params = new HttpParams()
            .set('instanceID', instance);

        return this.http.get<object>('/scgui/query/instance', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    queryKill(instance: string) {

        const params = new HttpParams()
            .set('instanceID', instance);

        return this.http.delete('/scgui/query/instance', {params})
            .pipe(
                catchError(this.handleError)
            );

    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
