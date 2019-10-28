#!/bin/sh -e

WS="159.149.129.94"
DOMAIN="squadre.olinfo.it"  # usiamo vecchio dominio per retrocompatibilita'
                            # tanto sed cancella lo stesso la cosa giusta

IPTABLES="/sbin/iptables"

$IPTABLES -P INPUT ACCEPT
$IPTABLES -P FORWARD ACCEPT
$IPTABLES -P OUTPUT ACCEPT
$IPTABLES -F
$IPTABLES -X

sed -i "/$DOMAIN/d" /etc/hosts
