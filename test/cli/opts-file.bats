#!/usr/bin/env bats

load test-util

setup() {
  load_fixture bare-project
}

teardown() {
  rm *.opts
  unload_fixture bare-project
}

@test "should read options from file when provided" {
  echo "--flags es2017" > build.opts
  DEBUG=1 ez-build @build.opts

  assert_success
  assert_output_contains "--flags es2017"
}

@test "should read options even if separated by newlines" {
  echo "--flags es2017" > build.opts
  echo "--flags add-module-exports" >> build.opts
  DEBUG=1 ez-build @build.opts

  assert_success
  assert_output_contains "--flags es2017 --flags add-module-exports"
}

@test "should read options from nested files" {
  echo "--flags es2017 @b.opts" > a.opts
  echo "--flags add-module-exports @c.opts" > b.opts
  echo "--flags modules:amd" > c.opts
  DEBUG=1 ez-build @a.opts

  assert_success
  assert_output_contains "--flags es2017 --flags add-module-exports --flags modules:amd"
}

@test "should fail if trying to read a non-existant file" {
  ez-build @does-not-exist

  assert_failure
  assert_output "ENOENT: no such file or directory, open 'does-not-exist'"
}
