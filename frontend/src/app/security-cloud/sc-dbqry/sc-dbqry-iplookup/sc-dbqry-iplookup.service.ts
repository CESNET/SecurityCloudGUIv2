import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScDbqryIplookupService {
    constructor (private http: HttpClient) {
    }

    lookup (ipaddr: string) {


        const params = new HttpParams()
            .set('ip', ipaddr);

        return this.http.get<object>('/scgui/query/lookup', {params})
            .pipe(
                catchError(this.handleError)
            );

    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
