import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Filter } from '../../../modules/Filter';

@Component({
    selector: 'sc-dbqry-filter-save',
    templateUrl: './sc-dbqry-filter-save.component.html',
    styleUrls: ['./sc-dbqry-filter-save.component.css']
})
export class ScDbqryFilterSaveComponent implements OnInit {
    @Input() filter : Filter;
    @Output() stateChange = new EventEmitter();
    
    constructor(public modalService: NgbModal) { }
    
    ngOnInit() {
        
    }
    
    emitConfirmation() {
        this.stateChange.emit(this.filter);
    }
}