#!/bin/sh -e

WS="131.114.2.138"
DOMAIN="squadre.olinfo.it"

IPTABLES="/sbin/iptables"

$IPTABLES -P INPUT ACCEPT
$IPTABLES -P FORWARD ACCEPT
$IPTABLES -P OUTPUT ACCEPT
$IPTABLES -F
$IPTABLES -X

sed -i "/$DOMAIN/d" /etc/hosts
