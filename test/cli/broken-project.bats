#!/usr/bin/env bats

load test-util

setup() {
  load_fixture broken-project
}

teardown() {
  unload_fixture broken-project
}

@test "should exit with a non-zero exit status when builds fail" {
  ez-build
  assert_equal 1 "${status}"
}