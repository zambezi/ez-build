#!/usr/bin/env bats

load test-util

setup() {
  load_fixture no-copy
}

teardown() {
  unload_fixture no-copy
}

@test "should copy files by default" {
  ez-build
  assert_success
  assert_expected "$(find lib)"
}

@test "should not copy files when --no-copy is specified" {
  ez-build --no-copy
  assert_success
  assert_expected "$(find lib)"
}