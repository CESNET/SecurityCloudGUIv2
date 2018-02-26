import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operator/map';
import { debounceTime } from 'rxjs/operator/debounceTime';
import { distinctUntilChanged } from 'rxjs/operator/distinctUntilChanged';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ScDbqryFilterService } from './sc-dbqry-filter.service';
import { Filter } from '../../modules/Filter';

@Component({
    selector: 'sc-dbqry-filter',
    templateUrl: './sc-dbqry-filter.component.html',
    styleUrls: ['./sc-dbqry-filter.component.css'],
    providers: [ScDbqryFilterService]
})
export class ScDbqryFilterComponent implements OnInit {
    error : any;
    filterDB : Filter[] = [];
    @Input() initialFilterValue : string;
    filter : Filter = new Filter(null, "");
    toDelete : Filter = new Filter(null, null);

    constructor(private api: ScDbqryFilterService, public modalService: NgbModal) { }

    ngOnInit() {
        this.api.getFilters().subscribe(
            (data: Object) => this.processData(data),
            (error: Object) => this.processError(error)
        );
        this.filter.value = this.initialFilterValue;
    }

    getFilter() : string {
        return this.filter.value;
    }
    
    deleteFilter() {
        this.api.deleteFilter(this.toDelete.name, this.toDelete.value).subscribe(
            (data: Object) => this.processData(data),
            (error: Object) => this.processError(error)
        );
        this.markForDeletion(null, null);
    }
    
    applyFilter(expression : string) {
        this.filter.value = expression;
    }
    
    clearFilter() {
        this.filter.value = "";
    }
    
    handleSaveFilterConfirmation(event: any) {
        this.saveFilter(this.filter.name, this.filter.value);
        this.filter.name = null;
    }
    
    markForDeletion(name: string, value: string) {
        this.toDelete.name = name;
        this.toDelete.value = value;
    }
    
    saveFilter(name : string, value : string) {
        this.api.saveFilter(name, value).subscribe(
            (data: Object) => this.processData(data),
            (error: Object) => this.processError(error)
        );
    }
    
    processData(data : Object) {
        this.filterDB.length = 0; // equivalent of C++ .clear()
        for (let i in data['filters']) {
            this.filterDB.push(new Filter(data['filters'][i]['name'], data['filters'][i]['value']));
        }
    }
    
    processError(error : Object) {
        if (error['status'] >= 404) {
            this.error = error;
        }
        
        console.error("Error on filter storage request");
        console.error(error);
    }
}
