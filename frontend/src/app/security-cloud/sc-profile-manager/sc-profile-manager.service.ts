import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ScProfileManagerService {
    constructor (private http: HttpClient) {
    }

    get() {
        const params = new HttpParams()
            .set('profile', 'all');

        return this.http.get('/scgui/profiles', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    create(parentPath: string, profileName: string, profileType: string, channelsStr: string) {
        const body = {
            profile: parentPath,
            pname: profileName,
            ptype: profileType,
            channels: channelsStr
        };

        return this.http.post<object>('/scgui/profiles', body)
            .pipe(
                catchError(this.handleError)
            );
    }

    delete(profilePath: string) {
        const params = new HttpParams()
            .set('profile', profilePath);

        return this.http.delete('/scgui/profiles', {params})
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError(err: Response | any) {
        return Promise.reject(err);
    }
}
