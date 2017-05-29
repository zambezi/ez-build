#!/usr/bin/env bats

load test-util

setup() {
  load_fixture bare-project
}

teardown() {
  unload_fixture bare-project
}

@test "should not include coverage instrumentation by default" {
  ez-build
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "should include coverage instrumentation when --coverage is specified" {
  ez-build --coverage
  assert_success
  assert_contains "statementMap" "$(cat lib/index.js)"
}

@test "should include coverage instrumentation for production builds when --coverage is specified" {
  ez-build --production --coverage
  assert_success
  assert_contains "statementMap" "$(cat lib/index.js)"
}
