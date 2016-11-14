#!/usr/bin/env bats

load test-util

setup() {
  load_fixture babelrc
}

teardown() {
  unload_fixture babelrc
}

@test "should print deprecation notice when building" {
  ez-build

  assert_success
  assert_expected "${output}"
}

@test "should include link to create issues" {
  ez-build

  assert_success
  assert_output_contains "https://github.com/zambezi/ez-build/issues/new"
}

@test "should include comments on babelrc configuration" {
  ez-build

  assert_success
  assert_output_contains "Comments on the detected babel configuration:"
  assert_output_contains "- es2015 support is always enabled"
  assert_output_contains "- es2016 support is always enabled"
  assert_output_contains "- To enable es2017 support, use: --flags es2017"
  assert_output_contains "- To enable react support, use: --flags react"
  assert_output_contains "- Unsupported preset: behance"
  assert_output_contains "- To enable amd modules, use: --flags modules:amd"
  assert_output_contains "- Unsupported plugin: typecheck"
  assert_output_contains "- babel.env: NODE_ENV is respected by ez-build"
}