#!/usr/bin/env bats

load test-util

setup() {
  load_fixture css-target-browsers
}

teardown() {
  unload_fixture css-target-browsers
}

@test "should work with single, simple target" {
  run "${EZ_BUILD_BIN}" --target-browsers "IE 9"

  assert_success
  assert_expected "$(cat lib/foo.css)"
}

@test "should work with more complex, multiple targets" {
  run "${EZ_BUILD_BIN}" --target-browsers "Firefox <=44,Chrome <=48,IE <=9"

  assert_success
  assert_expected "$(cat lib/foo.css)"
}
