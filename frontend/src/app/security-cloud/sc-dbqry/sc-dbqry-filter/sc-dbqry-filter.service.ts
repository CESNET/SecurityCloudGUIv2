import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams  } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ScDbqryFilterService {
    constructor (private http: Http) {
    }

    getFilters () {
        return this.http.get('/scgui/query/filter').map(
            (response: Response) => {
                return response.json();
            }
        ).catch(this.handleError);
    }

    saveFilter(nameStr : string, valueStr : string) {
        const body = {
            name: nameStr,
            value: valueStr
        };
        
        return this.http.post('scgui/query/filter', body).map(
            (response: Response) => {
                return response.json();
            }
        ).catch(this.handleError);
    }
    
    deleteFilter(name : string, value : string) {
        const params : URLSearchParams = new URLSearchParams();
        params.set('name', name);
        params.set('value', value);
        
        const requestOptions = new RequestOptions();
        requestOptions.search = params;
        
        return this.http.delete('/scgui/query/filter', requestOptions).map(
            (response: Response) => {
                return response.json();
            }
        ).catch(this.handleError);
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
