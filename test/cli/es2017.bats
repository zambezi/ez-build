#!/usr/bin/env bats

load test-util

setup() {
  load_fixture es2017
}

teardown() {
  unload_fixture es2017
}

@test "should build es2017 features by default" {
  ez-build
  run node -r babel-polyfill lib/async-await

  assert_success "A-OK!"
  assert_output "A-OK!"
}