#!/usr/bin/env bats

load test-util

setup() {
  load_fixture react
}

teardown() {
  unload_fixture react
}

@test "should fail when building JSX without react preset added" {
  mv .babelrc .babelrc-bkup
  run npm run build
  mv .babelrc-bkup .babelrc

  assert_equal 1 "${status}"
  assert_contains "src/App.js: Unexpected token (8:6)" "${output}"
  assert_contains "src/App.test.js: Unexpected token (7:18)" "${output}"
  assert_contains "src/index.js: Unexpected token (7:2)" "${output}"
}


@test "should succeed when building JSX when react preset is added" {
  run npm run build
  echo "${status} ${output}"
  assert_equal 0 "${status}"
}