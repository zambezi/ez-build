#!/usr/bin/env bats

load test-util

setup() {
  load_fixture scoped-package
}
teardown() {
  unload_fixture scoped-package
}

@test "scope name should not exist in optimized output" {
  ez-build --production
  
  assert_success
  assert_exists pkg-min.js pkg-min.css
}

@test "scope name should exist in optimised-modules.json" {
  ez-build --production

  assert_success
  assert_expected "$(cat expected-modules.json)"
}