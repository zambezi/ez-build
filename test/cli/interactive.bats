#!/usr/bin/env bats
load test-util

setup() {
  load_fixture typical-project

  if [[ "${BATS_TEST_NUMBER}" -eq 1 ]]; then
    {
      kill $(cat ez-build.pid) && wait $(cat ez-build.pid)
    } 2>/dev/null

    ${EZ_BUILD_BIN} --interactive > build.log 2>&1 &
    EZPID=$!
    disown ${EZPID}
    echo ${EZPID} > ez-build.pid
  fi
}

teardown() {
  if [[ "$BATS_TEST_NUMBER" -eq "${#BATS_TEST_NAMES[@]}" ]]; then
    {
      kill $(cat ez-build.pid) && wait $(cat ez-build.pid)
    } 2>/dev/null
    rm *.{pid,log}
  fi

  unload_fixture typical-project
}

@test "'ez-build --interactive' should wait for changes" {
  eventually 'assert_expected "$(cat build.log)"'
}

@test "'ez-build --interactive' should rebuild files when they are modified" {
  touch src/a.js
  eventually 'assert_expected "$(cat build.log)"'
}

@test "'ez-build --interactive' should build files when they are added" {
  refute_exists src/added.js
  touch src/added.js
  eventually 'assert_exists lib/added.js'
  eventually 'assert_exists lib/added.js.map'
  eventually 'assert_expected "$(cat build.log)"'
}
