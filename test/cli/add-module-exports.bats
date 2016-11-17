#!/usr/bin/env bats

load test-util

setup() {
  load_fixture bare-project
}

teardown() {
  unload_fixture bare-project
}

@test "UMD should only export default value for single export modules when add-module-exports flag is specified" {
  ez-build --flags add-module-exports
  assert_expected "$(cat lib/index.js)"

  ez-build --flags modules:umd,add-module-exports
  assert_expected "$(cat lib/index.js)"
}

@test "AMD should only export default value for single export modules when add-module-exports flag is specified" {
  ez-build --flags modules:amd,add-module-exports
  assert_expected "$(cat lib/index.js)"
}

@test "CommonJS should only export default value for single export modules when add-module-exports flag is specified" {
  ez-build --flags modules:commonjs,add-module-exports
  assert_expected "$(cat lib/index.js)"
}

@test "SystemJS should only export default value for single export modules when add-module-exports flag is specified" {
  ez-build --flags modules:systemjs,add-module-exports
  assert_expected "$(cat lib/index.js)"
}

@test "should not affect ecmascript exports at all when add-module-exports flag is specified" {
  ez-build --flags modules:ecmascript,add-module-exports
  assert_expected "$(cat lib/index.js)"
}