#!/bin/sh -e

WS="159.149.129.94"
DOMAIN="gara.squadre.olinfo.it"

IPTABLES="/sbin/iptables"

$IPTABLES -P INPUT ACCEPT
$IPTABLES -P FORWARD ACCEPT
$IPTABLES -P OUTPUT ACCEPT
$IPTABLES -F
$IPTABLES -X

sed -i "/$DOMAIN/d" /etc/hosts
