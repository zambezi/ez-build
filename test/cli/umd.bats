#!/usr/bin/env bats

load test-util

setup() {
  load_fixture umd
}

teardown() {
  unload_fixture umd
}

@test "should correctly resolve UMD imports" {
  ez-build
  assert_equal 0 "${status}"

  run node lib/index.js
  assert_equal 0 "${status}"
  assert_equal "OK" "${output}"
}