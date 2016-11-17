#!/usr/bin/env bats

load test-util

setup() {
  load_fixture bare-project
}

teardown() {
  unload_fixture bare-project
}

@test "should output umd modules by default" {
  ez-build
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should output umd modules when specified" {
  ez-build --flags modules:umd
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should output umd modules when invalid module format is specified" {
  ez-build --flags modules:invalid
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should output amd modules when specified" {
  ez-build --flags modules:amd
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should output commonjs modules when specified" {
  ez-build --flags modules:commonjs
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should output ecmascript modules when specified" {
  ez-build --flags modules:ecmascript
  assert_success
  assert_expected "$(cat lib/index.js)"
}