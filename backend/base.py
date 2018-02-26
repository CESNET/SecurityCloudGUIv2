from liberouterapi import auth, role, config
from flask import request
import json
import socket
import requests
import shlex
import subprocess

from .profiles import Profiles, ProfilesError
from .graphs import Graphs, GraphsError
from .queryFields import Fields, FieldsError
from .dbqry import Dbqry, DbqryError
from .stats import Stats as Statistics
from .error import SCGUIException
from .notify import Notifier, NotifierError
from .filter import Filter, FilterError

IPFIXCOL_CHECKER = config['scgui'].get('ipfixcol_filter_check', 'ipfixcol-filter-check')

@auth.required()
def getStatistics():
    req = request.args.to_dict()

    try:
        stats = Statistics(req['profile'], req['bgn'], req['end'])
        return stats.getJSONString()
    except KeyError as e:
        raise SCGUIException('Key error: ' + str(e))
    except ProfilesError as e:
        raise SCGUIException(str(e))

@auth.required()
def getProfile():
    req = request.args.to_dict()
    profiles = Profiles()

    try:
        if req['profile'] == 'all':
            return profiles.getJSONString()
        else:
            profile = profiles.getProfile(req['profile'])
            return json.dumps(profile)
    except KeyError as e:
        raise SCGUIException('Key error: ' + str(e))
    except ProfilesError as e:
        raise SCGUIException('Profiles error: ' + str(e))
    except Exception as e:
        raise SCGUIException('UnknownException: ' + str(e))

def fillChannel(channel, data):
    """
    Auxiliary function for createProfile(). This method parses part of url parameters and breaks
    them into a dictionary object representing single profile channel.
    """
    items = data.split(':')
    channel['name'] = items[0]
    channel['filter'] = items[1]
    channel['sources'] = []
    for i in range(2, len(items)):
        channel['sources'].append(items[i])

def validateFilter(filter):
    cmd = IPFIXCOL_CHECKER + ' -x ' + shlex.quote(filter);
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True, universal_newlines=True)
    out, err = p.communicate() # Errors are printed to stdout for internal reasons
    if p.returncode != 0:
        return out
    return None

@auth.required(role.Role.user)
def createProfile():
    req = request.get_json()
    profiles = Profiles()

    try:
        newp = {
            'name': req['pname'],
            'type': req['ptype'],
            'channels': [],
            'subprofiles': {}
        }

        chnls = req['channels']
        items = chnls.split(';')
        i = 0
        for item in items:
            newp['channels'].append({})
            fillChannel(newp['channels'][i], item)
            i += 1

        if i == 0:
            raise KeyError('Missing channels in arguments')
        else:
            alerts = []
            # Validate filters
            for c in newp['channels']:
                result = validateFilter(c['filter'])

                if result is not None:
                    alerts.append({'name': c['name'], 'text': result})

            if len(alerts) != 0:
                return json.dumps({'success': False, 'alerts': alerts})

        if profiles.createSubprofile(req['profile'], newp):
            profiles.exportXML()

            n = Notifier()
            n.notifyIpfixcol()

            return json.dumps({'success': True})

        return json.dumps({'success': False, 'alerts': ['ERROR: Unknown error']})

    except KeyError as e:
        raise SCGUIException('KeyError:' + str(e))
    except TypeError as e:
        raise SCGUIException('TypeError:' + str(e))
    except ProfilesError as e:
        raise SCGUIException(str(e))
    except NotifierError as e:
        raise SCGUIException(str(e))
    except Exception as e:
        raise SCGUIException("Unknown exception: " + str(e))

@auth.required(role.Role.admin)
def deleteProfile():
    req = request.args.to_dict()
    profiles = Profiles()

    try:
        if profiles.delete(req['profile']):
            profiles.exportXML()

            n = Notifier()
            n.notifyIpfixcol()

            return json.dumps({'success': True})

        return json.dumps({'success': False})

    except KeyError as e:
        raise SCGUIException('KeyError:' + str(e))
    except TypeError as e:
        raise SCGUIException('TypeError:' + str(e))
    except ProfilesError as e:
        raise SCGUIException(str(e))
    except NotifierError as e:
        raise SCGUIException(str(e))

def getQueryFields():
    try:
        f = Fields()
        return f.getJSONString()
    except FieldsError as e:
        raise SCGUIException(str(e))

@auth.required(role.Role.user)
def getQuery():
    req = request.args.to_dict()
    sessionID = request.headers.get('Authorization', None)

    try:
        q = Dbqry()
        return q.getResultJSONString(sessionID, req['instanceID'])
    except DbqryError as e:
        raise SCGUIException(str(e))
    except KeyError as e:
        raise SCGUIException('KeyError: ' + str(e))
    except Exception as e:
        raise SCGUIException('UnknownException(GetQuery): ' + str(e))

@auth.required(role.Role.user)
def startQuery():
    req = request.get_json()
    sessionID = request.headers.get('Authorization', None)

    try:
        q = Dbqry()
        return q.runQuery(sessionID, req['instanceID'], req['profile'], req['args'], req['filter'], req['channels'])
    except ProfilesError as e:
        raise SCGUIException(str(e))
    except DbqryError as e:
        raise SCGUIException(str(e))
    except KeyError as e:
        raise SCGUIException('KeyError: ' + str(e))
    except Exception as e:
        raise SCGUIException('UnknownException: ' + str(e))

@auth.required(role.Role.user)
def killQuery():
    req = request.args.to_dict()
    sessionID = request.headers.get('Authorization', None)

    try:
        q = Dbqry()
        q.killQuery(sessionID, req['instanceID'])
        return json.dumps({'success': True})
    except DbqryError as e:
        raise SCGUIException(str(e))
    except KeyError as e:
        raise SCGUIException('KeyError: ' + str(e))
    except Exception as e:
        raise SCGUIException('UnknownException(KillQuery): ' + str(e))

@auth.required(role.Role.user)
def getProgress():
    req = request.args.to_dict()
    sessionID = request.headers.get('Authorization', None)

    try:
        q = Dbqry()
        return q.getProgressJSONString(sessionID, req['instanceID'])
    except KeyError as e:
        raise SCGUIException('KeyError: ' + str(e))
    except Exception as e:
        raise SCGUIException('UnknownException(GetProgress): ' + str(e))

@auth.required(role.Role.user)
def getIpLookup():
    req = request.args.to_dict()

    try:
        revdns = socket.gethostbyname(req['ip'])
        ipinfo = requests.get('http://rest.db.ripe.net/search.json?query-string=' + req['ip'] + '&flags=no-filtering')
        geoinfo = requests.get('http://ip-api.com/json/' + req['ip'])
        return json.dumps({'revdns': revdns, 'ipinfo': json.loads(ipinfo.content.decode('utf-8')), 'geoinfo': json.loads(geoinfo.content.decode('utf-8'))})
    except KeyError as e:
        raise SCGUIException('KeyError: ' + str(e))

@auth.required()
def getGraph():
    req = request.args.to_dict()

    try:
        g = Graphs(req['profile'], req['bgn'], req['end'], req['var'], req['points'], req['mode'])
        return g.getJSONString()
    except KeyError as e:
        raise SCGUIException(str(e))
    except GraphsError as e:
        raise SCGUIException(str(e))
    except ProfilesError as e:
        raise SCGUIException(str(e))

@auth.required(role.Role.user)
def getConfForFrontend():
    """
    Only some portion of the config.ini contents is really needed in the frontend and thus only
    relevant keys are extracted and send.
    """
    result = {}
    result['historicData'] = config['scgui'].getboolean('historic_data', False)
    result['useLocalTime'] = config['scgui'].getboolean('use_local_time', True)
    return json.dumps(result)

def loadFilters():
    """
    Load filter expressions that were stored for later use.
    """
    try:
        fstorage = Filter()
        return fstorage.getFiltersAsJSON()
    except FilterError as e:
        raise SCGUIException("FilterError: " + str(e))

@auth.required(role.Role.admin)
def saveFilter():
    """
    Save filter expression to the database.
    """
    req = request.get_json()

    try:
        fstorage = Filter()
        fstorage.saveFilter(req['name'], req['value'])
        return fstorage.getFiltersAsJSON()
    except FilterError as e:
        raise SCGUIException("FilterError: " + str(e))

@auth.required(role.Role.admin)
def deleteFilter():
    """
    Remove filter from the database.
    """
    req = request.args.to_dict()

    try:
        fstorage = Filter()
        fstorage.deleteFilter(req['name'], req['value'])
        return fstorage.getFiltersAsJSON()
    except FilterError as e:
        raise SCGUIException("FilterError: " + str(e))