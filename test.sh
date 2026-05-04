#!/usr/bin/env bash
set -euo pipefail

BUNDLE=$(mktemp /tmp/ags-test-XXXXX.js)
trap "rm -f '$BUNDLE'" EXIT

CLEAN='sed s/^Gjs-Console-Message:\ [0-9:.]*\ // \
  | grep -v ^(gjs:[0-9]*):\ Gjs-CRITICAL.*JS\ ERROR.*failed \
  | grep -v ^(gjs:[0-9]*):\ Gjs-CRITICAL.*threw\ an\ exception'

run() {
  local entry=$1
  echo "=== $entry ==="
  ags bundle --gtk 4 "$entry" "$BUNDLE"
  bash "$BUNDLE" 2>&1 | sed \
    's/^Gjs-Console-Message: [0-9:.]* //' \
    | grep -v '^(gjs:[0-9]*): Gjs-CRITICAL.*JS ERROR.*failed' \
    | grep -v '^(gjs:[0-9]*): Gjs-CRITICAL.*threw an exception'
}

run tests/pure.test.ts
run tests/reactive.test.ts
