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
  assert_success

  run node lib/index.js
  assert_success
  assert_output "OK"
}