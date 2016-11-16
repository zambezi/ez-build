#!/usr/bin/env bats

load test-util

setup() {
  load_fixture react
}

teardown() {
  unload_fixture react
}

@test "should fail when building JSX without react flag set" {
  ez-build --production @build.opts
  assert_failure
  assert_output_contains "src/App.js: Unexpected token (8:6)"
  assert_output_contains "src/App.test.js: Unexpected token (7:18)"
  assert_output_contains "src/index.js: Unexpected token (7:2)"
}


@test "should succeed when building JSX with react flag set" {
  ez-build --production @build.opts --flags react
  assert_success
}