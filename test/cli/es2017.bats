#!/usr/bin/env bats

load test-util

setup() {
  load_fixture es2017
}

teardown() {
  unload_fixture es2017
}

@test "should not build es2017 features when --flags 2017 isn't specified" {
  ez-build
  run node -r babel-polyfill lib/async-await
  assert_failure
  assert_output_contains "SyntaxError: Unexpected token function"
}

@test "should build es2017 features when --flags 2017 is specified" {
  ez-build --flags es2017
  run node -r babel-polyfill lib/async-await

  assert_success "A-OK!"
  assert_output "A-OK!"
}