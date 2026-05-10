#!/bin/sh

ags quit -i tshell &>/dev/null

sleep 0.3

ags run . &
disown