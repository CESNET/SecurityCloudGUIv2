import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operator/map';
import { debounceTime } from 'rxjs/operator/debounceTime';
import { distinctUntilChanged } from 'rxjs/operator/distinctUntilChanged';

@Component({
    selector: 'sc-dbqry-filter',
    templateUrl: './sc-dbqry-filter.component.html',
    styleUrls: ['./sc-dbqry-filter.component.css']
})
export class ScDbqryFilterComponent implements OnInit {
    @Input() filter : string;
    // TODO: Filter db

    constructor() { }

    ngOnInit() {
    }

    getFilter() : string {
        return this.filter;
    }
}
