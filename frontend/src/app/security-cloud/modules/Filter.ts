/**
 * \brief Class for storing filter data in the dbqry-filter component
 */
export class Filter {
    name: string;
    value: string;
    
    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }
};