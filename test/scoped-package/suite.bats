#!/usr/bin/env bats

load ../fixture

@test "scope name should not exist in optimized output" {
  ez-build --production
  
  assert_exists pkg-min.js pkg-min.css
}

@test "scope name should exist in optimised-modules.json" {
  ez-build --production

  expected_modules=$(cat expected-modules.json)
  actual_modules=$(cat optimised-modules.json)

  assert_equal --eval expected_modules[@] actual_modules[@]
}