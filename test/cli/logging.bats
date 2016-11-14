#!/usr/bin/env bats

load test-util

setup() {
  load_fixture logging
}

teardown() {
  unload_fixture logging
}

@test "'ez-build' should produce normal log output" {
  ez-build

  assert_failure
  assert_expected "${output}"
}

@test "'ez-build --log json' should produce valid JSON output" {
  ez-build --log json

  assert_failure
  echo "${output}" > build.log

  while read record
  do
    echo "${record}" > record.json
    run "node_modules/.bin/jsonlint" record.json
    rm record.json
    assert_success
  done < build.log

  rm build.log
}