#!/bin/zsh
set -eu
HERE="${0:A:h}"
if [[ ! -x /usr/bin/ruby ]]; then
  print "The built-in Ruby interpreter is unavailable. Nothing has been changed."
  exit 1
fi
/usr/bin/ruby "$HERE/organizer.rb"
