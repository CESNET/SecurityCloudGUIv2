import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScDbqryFilterService {
    constructor (private http: HttpClient) {
    }

    getFilters () {
        return this.http.get<object>('/scgui/query/filter')
            .pipe(
                catchError(this.handleError)
            );
    }

    saveFilter(nameStr : string, valueStr : string) {
        const body = {
            name: nameStr,
            value: valueStr
        };
        
        return this.http.post<object>('scgui/query/filter', body)
            .pipe(
                catchError(this.handleError)
            );
    }
    
    deleteFilter(name : string, value : string) {
        const params = new HttpParams()
            .set('name', name)
            .set('value', value);
        
        return this.http.delete('/scgui/query/filter', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
