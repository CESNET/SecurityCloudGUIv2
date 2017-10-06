#!/bin/python3

from liberouterapi import config
import os
import signal

SINGLE_MACHINE = config['scgui'].getboolean('single_machine', True)
IPFIXCOL_PIDFILE = config['scgui'].get('ipfixcol_pidfile', '/data/pidfile.txt')
IPFIXCOL_NOTIFY_FILE = config['scgui'].get('ipfixcol_notify_file', '/data/ipfixcol_notify.txt')

class NotifierError(Exception):
    def __init__(self, message):
        super(NotifierError, self).__init__(message)

class Notifier():
    def __init__(self):
        self.pid = None
        with open(IPFIXCOL_PIDFILE, 'r') as fh:
            self.pid = fh.read()

    def notifyIpfixcol(self):
        """
        If SINGLE_MACHINE is enabled, send SIGUSR1 signal to ipfixcol process. Otherwise open/close
        ipfixcol update file.
        """
        if SINGLE_MACHINE:
            if self.pid is not None:
                os.kill(self.pid, signal.SIGUSR1)
            else:
                raise NotifierError('Could not find ipfixcol pidfile')
        else:
            # Simply open/close file
            with open(IPFIXCOL_NOTIFY_FILE, 'w') as fh:
                fh.close();