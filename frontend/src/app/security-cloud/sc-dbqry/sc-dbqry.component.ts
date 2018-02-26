// Global modules
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operator/map';
import { debounceTime } from 'rxjs/operator/debounceTime';
import { distinctUntilChanged } from 'rxjs/operator/distinctUntilChanged';
import { IMultiSelectOption } from 'angular-2-dropdown-multiselect';

// Local modules
import { ProfileMap } from '../modules/Profile';
import { TimeSelection } from '../modules/TimeSpecs';
import { ChannelSettings, ChannelSettingsBuilder } from '../modules/ChannelSettings';
import { AppConfig } from '../modules/AppConfig';

// Services
import { ScDbqryService } from './sc-dbqry.service';
import { ScDbqryFilterComponent } from './sc-dbqry-filter/sc-dbqry-filter.component';
import { ScDbqryIplookupComponent } from './sc-dbqry-iplookup/sc-dbqry-iplookup.component';

const BTN_QUERY_READY = {
    label: 'Start query',
    queryInProgress: false,
    style: "btn btn-outline-dark btn-block"
};

const BTN_QUERY_KILL = {
    label: 'Stop query',
    queryInProgress: true,
    style: "btn btn-outline-danger btn-block"
};

@Component({
    selector: 'sc-dbqry',
    templateUrl: './sc-dbqry.component.html',
    styleUrls: ['./sc-dbqry.component.scss'],
    providers: [ ScDbqryService ]
})
export class ScDbqryComponent implements OnInit, OnChanges {
    /* EXTERNAL VARIABLES */
    @Input() profiles: ProfileMap;
    @Input() selectedProfile: string;
    @Input() sel: TimeSelection;
    @Input() config: AppConfig;
    @Input() filter: string; ///< Filter textarea model
    @Input() channels: ChannelSettings[] = null;
    @ViewChild('DbqryFilter') filterComponent : ScDbqryFilterComponent;
    @ViewChild('IPLookup') iplookupComponent : ScDbqryIplookupComponent;

    limitto = [ ///< LimitTo dropdown model
        {value: '-l 10', desc: '10 records'},
        {value: '-l 20', desc: '20 records'},
        {value: '-l 50', desc: '50 records'},
        {value: '-l 100', desc: '100 records'},
        {value: '-l 200', desc: '200 records'},
        {value: '-l 500', desc: '500 records'},
        {value: '-l 1000', desc: '1000 records'},
        {value: '-l 2000', desc: '2000 records'},
        {value: '-l 5000', desc: '5000 records'},
        {value: '-l 10000', desc: '10000 records'}
    ];
    selectedLimit = '-l 10'; ///< Selection index to limitto
    
    // Orderby
    fieldsOrderby = null;
    selectedOrderBy = 'Nothing';
    selectedOrderDir = '';
    
    // Aggregate
    fieldsAggregate = null;
    selectedAggregation = '';
    
    // Output
    customfields = false;
    fieldsMultiselectSettings = {
        enableSearch: true,
        checkedStyle: 'fontawesome',
        buttonClasses: 'btn btn-default btn-block',
        dynamicTitleMaxItems: 10,
        displayAllSelectedText: true
    };
    fieldsMultiselectOptions = null;
    fieldsMultiselectSelected = [0, 3, 4, 5, 6, 7, 8, 10];
    
    // Output processing
    selectedOutputProcessing = 'kmb';
    nosummary = false; ///< No summary checkbox model
    
    // Custom Options
    customOpts: string = null;

    // Querying
    btnQuery = BTN_QUERY_READY;
    instanceID: string = null; ///< Identifier of the browser tab
    progressStyle; ///< Styler of progress bar
    timer = null; ///< Handle for setInterval trigger

    // Query output
    toPrint_command: string = null; ///< Result text model
    toPrint_stdout = null; ///< Result text model
    toPrint_stdoutRaw = null; ///< Unformatted text model
    toPrint_stderr: string = null; ///< Result text model

    error: any = null;

    /**
     *  @brief Create unique ID for this browser tab
     *
     *  @note https://stackoverflow.com/a/105074/6603609
     */
    private generateInstanceID(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    constructor(private api: ScDbqryService) { }

    ngOnInit() {
        this.api.fields().subscribe(
            (data: Object) => this.processFieldsData(data),
            (error: Object) => this.processError(error)
        );

        this.instanceID = this.generateInstanceID();
    }

    ngOnChanges(changes: SimpleChanges) {}

    /**
     *  @brief Method for changing query button from Start query to Kill query and back with proper
     *  styling and such.
     *
     *  @note Kill query button should have red color (btn-danger) to indicate potential risk for
     *  the user.
     */
    btnQueryChange() {
        if (this.btnQuery.queryInProgress) {
            this.btnQuery = BTN_QUERY_READY;
        }
        else {
            this.btnQuery = BTN_QUERY_KILL;
        }
    }

    /**
     *  @brief Handle method for query button click
     *
     *  @param [in] event
     *
     *  @details If btnQuery.queryInProgress is true, then filter, arguments and channels are formatted as
     *  strings and are send to backend as query parameters. Otherwise, message for killing query
     *  is send. Proper response handles are registered.
     */
    btnQueryClick(event: any) {
        if (!this.btnQuery.queryInProgress) {
            const filter: string = this.getFilter();
            let timeArg : string = this.getArgTime();
            let args: string;

            if (this.customOpts == null) {
                args = this.getArgs();
            }
            else {
                args = this.customOpts;
            }

            const channels: string = this.getSelectedChannels();

            this.api.queryStart(this.selectedProfile, this.instanceID, filter, args, channels).subscribe(
                (data: Object) => this.processQueryStarted(data),
                (error: Object) => this.processError(error)
            );
        }
        else { // Killing query
            this.api.queryKill(this.instanceID).subscribe(
                (data: Object) => this.processQueryKilled(data),
                (error: Object) => this.processError(error)
            );
        }
    }

    /**
     *  @brief Get contents of filter textarea
     *
     *  @return Formatted string
     */
    getFilter(): string {
        return this.filterComponent.getFilter();
    }

    /**
     *  @brief Convert JS timestamp to UNIX one (as string)
     *
     *  @param [in] number JS timestamp
     *  @return String representation of UNIX timestamp
     *
     *  @note Nfcapd files are always 1 hour behind rrdgraphs. i.e.: if you're pointing at 14:00
     *  hours, fdistdump will query file ending with 1300. This is ok when ipfixcol generates the
     *  data, but when using replay, those two times are aligned. Computing additional offset solves
     *  that issue by artificially adjusting the timestamp.
     *
     *  @details Description within the note was copied from old implementation of the SCGUI. It
     *  refers to batch of auxiliary scripts I've written that allows to generate graphs from existing
     *  nfcapd files (since when you have only nfcapd files, there's no way to replay them through
     *  ipfixcol and even if you'll do that, you'll mess original timestamps).
     */
    asUnixTimestamp(time: number): string {
        const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;

        /*if (this.config.historicData) {
            time += MILLISECONDS_PER_HOUR;
        }*/

        return (time / 1000).toString();
    }

    /**
     *  @brief Format graph time selection as fdistdumpt time argument
     *  
     *  @return Formatted string usable as fdistdump argument
     */
    getArgTime() : string {
        let result : string;
        
        if (this.sel.bgn === this.sel.end) {
            result = '-t ' + this.asUnixTimestamp(this.sel.bgn);
        }
        else {
            result = '-T ' + this.asUnixTimestamp(this.sel.bgn) + '#' + this.asUnixTimestamp(this.sel.end);
        }
        
        return result;
    }

    /**
     *  @brief Get options from quick select/custom textarea boxes
     *
     *  @return Formatted string
     *
     *  @details The options are specifying limit, aggregation, orderBy, order direction,
     *  and output format.
     *
     *  @note !!! IMPORTANT !!! fdistdump has three formatting options: pretty, long and csv. First
     *  two have all kinds of output conversions enabled (with long not cutting IPv6 addresses).
     *  Csv is the barbone option with all conversion disabled (but they can be enabled manually).
     *  Since I need to break the fdistdump output down to render it within a table, to place down
     *  buttons, etc, I needed a little hack which maybe can confuse advanced users.
     *  Frontend claims to request pretty format but in reality it requests for csv format with various
     *  prettyfying arguments on. It then loads the request and displays the output as a prettyfied table
     *  as well as a original CSV.
     */
    getArgs(): string {
        let result: string;

        result = this.selectedLimit;

        if (this.selectedAggregation !== '') {
            result += ' -a ';

            // Sanitize aggregation field
            const aux: string = this.selectedAggregation.replace(/ /g, '');
            let bgn = 0;
            let end = aux.length;

            if (aux[bgn] === ',') {
                bgn++;
            }
            else if (aux[end - 1] === ',') {
                end--;
            }

            result += aux.substr(bgn, end - bgn);
        }

        if (this.selectedOrderBy !== 'Nothing') {
            result += ' -o ' + this.selectedOrderBy;

            if (this.selectedOrderDir !== '') {
                result += '#¨' + this.selectedOrderDir;
            }
        }

        if (this.customfields && this.fieldsMultiselectSelected.length > 0) {
            result += ' --fields ' + this.fieldsMultiselectOptions[this.fieldsMultiselectSelected[0]].name;
            for (let i = 1; i < this.fieldsMultiselectSelected.length; i++) {
                result += ',' + this.fieldsMultiselectOptions[this.fieldsMultiselectSelected[i]].name;
            }
        }

        // In reality, backend sends csv output format but user sees it as pretty
        if (this.selectedOutputProcessing === 'raw') {
            result += ' --output-format=csv';
        }
        else if (this.selectedOutputProcessing === 'kmb') {
            result += ' --output-format=pretty --output-ts-conv="%F %R"';
        }
        else if (this.selectedOutputProcessing === 'kimibi') {
            result += ' --output-format=pretty --output-volume-conv=binary-prefix --output-ts-conv="%F %R"';
        }

        result += ' --output-items=r';
        if (!this.nosummary) {
            result += ',m';
        }

        return result;
    }

    /**
     *  @brief Get channels from channel checkboxes
     *
     *  @return Formatted string
     *
     *  @details All selected channels will be inserted into single string as list of their names
     *  with ':' as a delimiter.
     */
    getSelectedChannels(): string {
        let result = '';

        for (const channel of this.channels) {
            if (channel.checked) {
                if (result !== '') {
                    result += ':';
                }

                result += channel.name;
            }
        }

        return result;
    }

    /**
     *  @brief Request retrieval of fdistdump stdout and stderr
     */
    getQueryData() {
        this.api.queryResult(this.instanceID).subscribe(
            (data: Object) => this.processQueryResult(data),
            (error: Object) => this.processError(error)
        );
    }

    /**
     *  @brief Handle method for processing response of started query
     *
     *  @param [in] data Object containing formatted query command
     *
     *  @details If this response is delivered, query was succesfully started, button label should
     *  be changed to allow query killing. Also progress trigger should be started.
     */
    processQueryStarted(data: Object) {
        this.btnQueryChange();

        this.api.queryProgress(this.instanceID).subscribe(
            (data2: Object) => this.processQueryProgress(data2),
            (error: Object) => this.processError(error)
        );

        this.toPrint_command = data['command'];
        this.toPrint_stdout = null;
        this.toPrint_stderr = null;
    }

    /**
     *  @brief Handle method for processing response of query killing
     *
     *  @details If this response is delivered, query was succesfully killed, progress trigger will
     *  not hit and there are maybe some data to be displayed. Because of this, progress trigger has
     *  to be disabled and query results should be retrieved. Also, button can be now changed to its
     *  default caption.
     */
    processQueryKilled(data: Object) {
        this.btnQueryChange();
        this.getQueryData();
    }

    /**
     *  @brief Process fdistdump stdout/stderr
     *
     *  @param [in] data Object consisting of two fields: out and err
     *
     *  @details out and err fields in data are copied totheir corresponding model elements.
     */
    processQueryResult(data: Object) {
        this.toPrint_stdout = data['out'];

        // stdout data must be now processed from CSV to pretty as well
        if (data['out'] !== '') {
            this.toPrint_stdoutRaw = data['out'];

            const sections = data['out'].split('\n\n');

            this.toPrint_stdout = new Array(sections.length);

            for (let i = 0; i < sections.length; i++) {
                const aux = sections[i].split('\n');
                // First item is section identifier, we can strip it
                this.toPrint_stdout[i] = { header: null, data: null };
                this.toPrint_stdout[i].header = aux[0].split(',');
                this.toPrint_stdout[i].data = new Array(aux.length - 1);

                for (let p = 1; p < aux.length; p++) {
                    this.toPrint_stdout[i].data[p - 1] = aux[p].split(',');
                }
            }
        }

        this.toPrint_stderr = data['err'];

        if (this.toPrint_stdout === '') {
            this.toPrint_stdout = null;
        }

        if (this.toPrint_stderr === '') {
            this.toPrint_stderr = null;
        }
    }

    /**
     *  @brief Process fdistdump progress
     *
     *  @param [in] data Object with multiple fields, but only field 'total' is mandatory and needed
     *  by this app
     *
     *  @details If 'total' is 100, clearInterval for progress retrieval and request query data. Also
     *  button label and style should be changed.
     */
    processQueryProgress(data: Object) {
        this.progressStyle = {
            'width': data['total'] + '%'
        };

        if (parseInt(data['total'], 10) === 100) {
            if (this.btnQuery.queryInProgress) {
                this.btnQueryChange();
                this.getQueryData();
            }
        }
        else {
            this.api.queryProgress(this.instanceID).subscribe(
                (data2: Object) => this.processQueryProgress(data2),
                (error: Object) => this.processError(error)
            );
        }
    }

    /**
     *  @brief Handle method for processing response of nf-tool fields
     *
     *  @param [in] data Object containing field names and descriptions. Its and array of objects
     *  with members name and hint.
     *
     *  @details nf-tools fields are retrieved, angular will now automatically display related
     *  inputs. Default orderBy should be selected.
     */
    processFieldsData(data: any) {
        /* NOTE: What data look like
        {
        "aggregate" : [
            {'name': '...', 'hint': '...'}
        ]
        "orderby" : ...,
        "print" : ...
        }
        */
        this.fieldsAggregate = data['aggregate'];
        this.fieldsOrderby = data['orderby'];
        this.fieldsMultiselectOptions = new Array<IMultiSelectOption>();
        let cnt = 0;
        for (let item of data['print']) {
            this.fieldsMultiselectOptions.push({id: cnt, name: item['name']});
            cnt++;
        }
        
        this.selectedOrderBy = this.fieldsOrderby[0].name;
    }

    /**
     *  @brief Log error that occured on an async query
     */
    processError(error: Object) {
        if (error['status'] >= 404) {
            this.error = error;
        }

        console.error('Error on database request');
        console.error(error);
    }

    /**
     *  @brief Watcher function for managing custom options
     *
     *  @param [in] NgbTabChangeEvent Parameter_Description
     *
     *  @details Based on which tab user is trying to access, this.customOpts is either filled
     *  with arguments generated as string or it is emptied.
     */
    beforeTabChange(event: NgbTabChangeEvent) {
        if (event.nextId === 'FastOptions') {
            this.customOpts = null;
        }
        else if (event.nextId === 'CustomOptions') {
            this.customOpts = this.getArgs();
        }
    }

    /*
        Following methods are designed to create typeahead 'multiselect' input.
        It's all based on typeahead from ng-bootstrap which is only supposed to select a single
        item from an array. This resulted into numerous hacks.
        First off: Array containing data that will be hinted is array of objects, even though
        I only need array of simple strings. This is why searchForAggregField() first filters the
        array and then replaces each object with only its name.
        Second: The best idea I've come up with is to use csv format and hint only currently written
        item. This is where formatter and findSearchTermBreakpoint comes into play since they help
        me identify currently typed item and the rest of the string.
    */
    /**
     *  @brief Returns index of first character after last comma within a string
     */
    findSearchTermBreakpoint(term: string): number {
        let bgn = 0;

        for (let i = 0; i < term.length - 1; i++) {
            if (term[i] === ',') {
                bgn = i + 1;
            }
        }

        return bgn;
    }

    /**
     *  @brief Formats hinted strings. Since hinted strings contain user's previous selections,
     *  those has to be cropped.
     */
    formatter = (result: string) => {
        const b = this.findSearchTermBreakpoint(result);
        return result.substr(b, result.length - b - 1); // Also crop trailing comma
    }

    /**
     *  @brief Search function for typeahead multiselect. Returns array of hint strings. Each hint
     *  contains all previously selected values in csv format. This is a hack to allow multiselect
     */
    searchForAggregField = (text: Observable<string>) =>
        map.call(distinctUntilChanged.call(debounceTime.call(text, 200)), term => {
            const b = this.findSearchTermBreakpoint(term);
            const prefix = term.substr(0, b).replace(/ /g, '');
            const suffix = term.substr(b, term.length - b).replace(/ /g, '');

            const result = term.length < 1 ? [] : this.fieldsAggregate.filter(v =>
                v.name.toLowerCase().indexOf(suffix) > -1
            ).slice(0, 10);

            for (let i = 0; i < result.length; i++) {
                result[i] = prefix + result[i].name + ',';
            }

            return result;
        }
    );

    /**
     *  @brief Test whether given column label identifies IP address column
     *
     *  @param [in] header Name of the column
     *  @return TRUE if it is IP address field
     *
     *  @details When displaying dbqry output, following test is used for proper placement of lookup
     *  modal links
     */
    isIpField(header: string): boolean {
        if (header === 'ip' || header === 'srcip' || header === 'dstip' || header === 'xsrcip'
            || header === 'xdstip') {
            return true;
        }

        return false;
    }
}
