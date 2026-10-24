#!/bin/zsh
set -eu
HERE="${0:A:h}"
exec /usr/bin/ruby "$HERE/reconcile.rb" finish
