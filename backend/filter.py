#!/bin/python3

import os
import json
import subprocess
import shlex
import csv
from liberouterapi import config

FILTER_STORAGE_PATH = config['scgui'].get('filter_storage_path', '/data/filter_storage.csv')

class FilterError(Exception):
    def __init__(self, message):
        super(FilterError, self).__init__(message)

class Filter:
    def __init__(self):
        self.filters = []
        self.__loadFiltersToMemory()

    def __loadFiltersToMemory(self):
        """
        Before any filter is saved, the storage file does not exists. Thus the only
        errors I want to catch are those happening during file parsing.
        """
        if os.path.isfile(FILTER_STORAGE_PATH):
            try:
                with open(FILTER_STORAGE_PATH, newline='') as csvfile:
                    rows = csv.reader(csvfile)
     
                    for row in rows:
                        self.filters.append({'name': row[0], 'value': row[1]})
            except Exception as e:
                print("Filter Load Exception: " + str(e))
                raise FilterError("Could not load filters from disk!")

    def __saveFiltersToDisk(self):
        try:
            with open(FILTER_STORAGE_PATH, "w") as csvfile:
                writer = csv.writer(csvfile)
                
                for filter in self.filters:
                    writer.writerow([filter['name'], filter['value']])
        except Exception as e:
            print("Filter Save Exception: " + str(e))
            raise FilterError("Could not save filters on disk!")

    def getFiltersAsJSON(self):
        """
        Returns self.filters as a JSON string.
        """
        return json.dumps({'filters': self.filters})

    def deleteFilter(self, filterName, filterValue):
        """
        Searches self.filters for a filter with exact name and value, removes it
        from the list and then overwrites the database on the disk.
        """
        filterSize = len(self.filters)
        for i in range(0, filterSize):
            if filterName == self.filters[i]['name'] and filterValue == self.filters[i]['value']:
                self.filters.pop(i)
                break
        self.__saveFiltersToDisk()

    def saveFilter(self, filterName, filterValue):
        """
        Appends new filter expression to self.filters and then overwrites the
        database on the disk.
        """
        self.filters.append({'name': filterName, 'value': filterValue})
        self.__saveFiltersToDisk()