#!/bin/python3

import json
import subprocess

class FieldsError(Exception):
    def __init__(self, message):
        super(FieldsError, self).__init__(message)

class Fields():
    def __init__(self):
        self.data = {
            'aggregate': [],
            'orderby': [],
            'print': []
        }
        self.__buildAggregate()
        self.__buildOrderby()
        self.__buildPrint()
        self.__buildCommonFields()

    def __parseFromLibnf(self):
        """
        This method is deprecated. It was used in the old approach where aggregation, orderby and print fields were the same array.
        """
        cmd = "libnf-info | tail -n +4 | sed -r 's/(\s\s)+/\t/g' | cut -f3,4 | tr '\t' ';' | tr '\n' ':'"
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, shell=True)

        self.data = []

        try:
            buffer = p.communicate(timeout=15)[0].decode('utf-8')
        except TimeoutExpired:
            raise FieldsError('Failed to retrieve libnf-info')

        subbuf = buffer.split(':')
        for row in subbuf:
            if row:
                s = row.split(';')
                self.data.append({'name': s[0], 'hint': s[1]})

    def __buildAggregate(self):
        self.data['aggregate'] = [
            {'name': 'srcip', 'hint': 'Source IP address'},
            {'name': 'dstip', 'hint': 'Destination IP address'},
            {'name': 'ip', 'hint': 'Source or destination ip address (pair field)'},
            {'name': 'srcport', 'hint': 'Source port'},
            {'name': 'dstport', 'hint': 'Destination port'},
            {'name': 'port', 'hint': 'Source or destination port (pair field)'},
            {'name': 'proto', 'hint': 'IP protocol'},
            {'name': 'flags', 'hint': 'TCP flags'},
            {'name': 'flows', 'hint': 'The number of flows (aggregated)'},
            {'name': 'bytes', 'hint': 'The number of bytes'},
            {'name': 'packets', 'hint': 'The number of packets'},
            {'name': 'bps', 'hint': 'Bytes per second'},
            {'name': 'pps', 'hint': 'Packets per second'},
            {'name': 'bpp', 'hint': 'Bytes per packet'},
            {'name': 'first', 'hint': 'Timestamp of the first packet seen (in miliseconds)'},
            {'name': 'last', 'hint': 'Timestamp of the last packet seen (in miliseconds)'},
            {'name': 'received', 'hint': 'Timestamp regarding when the packet was received by collector'},
            {'name': 'duration', 'hint': 'Flow duration (in milliseconds)'}
        ]

    def __buildOrderby(self):
        self.data['orderby'] = [
            {'name': 'Nothing', 'hint': ''},
            {'name': 'first', 'hint': 'Timestamp of the first packet seen (in miliseconds)'},
            {'name': 'flows', 'hint': 'The number of flows (aggregated)'},
            {'name': 'packets', 'hint': 'The number of packets'},
            {'name': 'bps', 'hint': 'Bytes per second'},
            {'name': 'pps', 'hint': 'Packets per second'},
            {'name': 'bpp', 'hint': 'Bytes per packet'},
            {'name': 'bytes', 'hint': 'The number of bytes'},
            {'name': 'last', 'hint': 'Timestamp of the last packet seen (in miliseconds)'},
            {'name': 'received', 'hint': 'Timestamp regarding when the packet was received by collector'},
            {'name': 'duration', 'hint': 'Flow duration (in milliseconds)'},
            {'name': 'flags', 'hint': 'TCP flags'},
            {'name': 'srcip', 'hint': 'Source IP address'},
            {'name': 'dstip', 'hint': 'Destination IP address'},
            {'name': 'srcport', 'hint': 'Source port'},
            {'name': 'dstport', 'hint': 'Destination port'},
            {'name': 'proto', 'hint': 'IP protocol'},
            {'name': 'port', 'hint': 'Source or destination port (pair field)'},
            {'name': 'ip', 'hint': 'Source or destination ip address (pair field)'}
        ]

    def __buildPrint(self):
        self.data['print'] = [
            {'name': 'first', 'hint': 'Timestamp of the first packet seen (in miliseconds)'},
            {'name': 'last', 'hint': 'Timestamp of the last packet seen (in miliseconds)'},
            {'name': 'flows', 'hint': 'The number of flows (aggregated)'},
            {'name': 'packets', 'hint': 'The number of packets'},
            {'name': 'bytes', 'hint': 'The number of bytes'},
            {'name': 'srcip', 'hint': 'Source IP address'},
            {'name': 'dstip', 'hint': 'Destination IP address'},
            {'name': 'srcport', 'hint': 'Source port'},
            {'name': 'dstport', 'hint': 'Destination port'},
            {'name': 'flags', 'hint': 'TCP flags'},
            {'name': 'proto', 'hint': 'IP protocol'},
            {'name': 'bps', 'hint': 'Bytes per second'},
            {'name': 'pps', 'hint': 'Packets per second'},
            {'name': 'bpp', 'hint': 'Bytes per packet'},
            {'name': 'received', 'hint': 'Timestamp regarding when the packet was received by collector'},
            {'name': 'duration', 'hint': 'Flow duration (in milliseconds)'},
            {'name': 'port', 'hint': 'Source or destination port (pair field)'},
            {'name': 'ip', 'hint': 'Source or destination ip address (pair field)'},
        ]

    def __buildCommonFields(self):
        aux = [
            {'name': 'outbytes', 'hint': 'The number of output bytes'},
            {'name': 'outpackets', 'hint': 'The number of output packets'},
            {'name': 'nextip', 'hint': 'IP next hop'},
            {'name': 'srcmask', 'hint': 'Source mask'},
            {'name': 'dstmask', 'hint': 'Destination mask'},
            {'name': 'tos', 'hint': 'Source type of service'},
            {'name': 'dsttos', 'hint': 'Destination type of service'},
            {'name': 'srcas', 'hint': 'Source AS number'},
            {'name': 'dstas', 'hint': 'Destination AS number'},
            {'name': 'nextas', 'hint': 'BGP Next AS'},
            {'name': 'prevas', 'hint': 'BGP Previous AS'},
            {'name': 'bgpnexthop', 'hint': 'BGP next hop'},
            {'name': 'srcvlan', 'hint': 'Source vlan label'},
            {'name': 'dstvlan', 'hint': 'Destination vlan label'},
            {'name': 'insrcmac', 'hint': 'In source MAC address'},
            {'name': 'outsrcmac', 'hint': 'Out source MAC address'},
            {'name': 'indstmac', 'hint': 'In destination MAC address'},
            {'name': 'outdstmac', 'hint': 'Out destination MAC address'},
            {'name': 'mpls', 'hint': 'MPLS labels'},
            {'name': 'inif', 'hint': 'SNMP input interface number'},
            {'name': 'outif', 'hint': 'SNMP output interface number'},
            {'name': 'dir', 'hint': 'Flow directions ingress/egress'},
            {'name': 'fwd', 'hint': 'Forwarding status'},
            {'name': 'routerip', 'hint': 'Exporting router IP'},
            {'name': 'engine-type', 'hint': 'Type of exporter'},
            {'name': 'engine-id', 'hint': 'Internal SysID of exporter'},
            {'name': 'eventtime', 'hint': 'NSEL The time that the flow was created'},
            {'name': 'connid', 'hint': 'NSEL An identifier of a unique flow for the device'},
            {'name': 'icmp-code', 'hint': 'NSEL ICMP code value'},
            {'name': 'icmp-type', 'hint': 'NSEL ICMP type value'},
            {'name': 'xevent', 'hint': 'NSEL Extended event cod'},
            {'name': 'xsrcip', 'hint': 'NSEL Mapped source IPv4 address'},
            {'name': 'xdstip', 'hint': 'NSEL Mapped destination IPv4 address'},
            {'name': 'xsrcport', 'hint': 'NSEL Mapped source port'},
            {'name': 'xdstport', 'hint': 'NSEL Mapped destination port'},
            {'name': 'iacl', 'hint': 'Hash value or ID of the ACL name'},
            {'name': 'iace', 'hint': 'Hash value or ID of the ACL name'},
            {'name': 'ixace', 'hint': 'Hash value or ID of an extended ACE configuration'},
            {'name': 'eacl', 'hint': 'Hash value or ID of the ACL name'},
            {'name': 'eace', 'hint': 'Hash value or ID of the ACL name'},
            {'name': 'exace', 'hint': 'Hash value or ID of an extended ACE configuration'},
            {'name': 'username', 'hint': 'NSEL username'},
            {'name': 'ingressvrfid', 'hint': 'NEL NAT ingress vrf id'},
            {'name': 'egressvrfid', 'hint': 'NAT event flag (always set to 1 by nfdump)'},
            {'name': 'eventflag', 'hint': 'NAT egress VRF ID'},
            {'name': 'blockstart', 'hint': 'NAT pool block start'},
            {'name': 'blockend', 'hint': 'NAT pool block end'},
            {'name': 'blockstep', 'hint': 'NAT pool block step'},
            {'name': 'blocksize', 'hint': 'NAT pool block size'},
            {'name': 'cl', 'hint': 'nprobe latency client_nw_delay_usec'},
            {'name': 'sl', 'hint': 'nprobe latency server_nw_delay_usec'},
            {'name': 'al', 'hint': 'nprobe latency appl_latency_usec'},
            {'name': 'event', 'hint': 'NSEL Extended event code'},
            {'name': 'ingressacl', 'hint': '96 bit value including all items in ACL (iacl, iace, ixace)'},
            {'name': 'egressacl', 'hint': '96 bit value including all items in ACL (eacl, eace, exace)'},
            {'name': 'inetfamily', 'hint': 'IENT family for src/dst IP address (ipv4 or ipv6); platform dependant'},
            {'name': 'exporterip', 'hint': 'Exporter IP address'},
            {'name': 'exporterid', 'hint': 'Exporter Observation Domain ID'},
            {'name': 'exporterversion', 'hint': 'Version of exporter'},
            {'name': 'samplermode', 'hint': 'Sampling mode'},
            {'name': 'samplerinterval', 'hint': 'Sampling interval'},
            {'name': 'samplerid', 'hint': 'Sampler ID assigned by exporting device'},
            {'name': 'pkts', 'hint': 'The number of packets'},
            {'name': 'outpkts', 'hint': 'The number of output packets'},
            {'name': 'nexthop', 'hint': 'IP next hop'},
            {'name': 'router', 'hint': 'Exporting router IP'},
            {'name': 'systype', 'hint': 'Type of exporter'},
            {'name': 'sysid', 'hint': 'Internal SysID of exporter'},
            {'name': 'icmpcode', 'hint': 'NSEL ICMP code value'},
            {'name': 'icmptype', 'hint': 'NSEL ICMP type value'},
            {'name': 'tcpflags', 'hint': 'TCP flags'},
            {'name': 'srcnet', 'hint': 'Source IP address'},
            {'name': 'dstnet', 'hint': 'Destination IP address'},
            {'name': 'brec1', 'hint': 'basic record 1'},
            {'name': 'as', 'hint': 'Source or destination ASn (pair field)'},
            {'name': 'if', 'hint': 'Input or output interface (pair field)'},
            {'name': 'vlan', 'hint': 'Source or destination vlan (pair field)'},
            {'name': 'net', 'hint': 'Source or destination ip address (pair field)'}
        ]
        self.data['aggregate'].extend(aux)
        self.data['orderby'].extend(aux)
        self.data['print'].extend(aux)

    def getJSONString(self):
        return json.dumps(self.data)
