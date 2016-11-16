#!/usr/bin/env bats

load test-util

setup() {
  load_fixture node-env
}

teardown() {
  unload_fixture node-env
}

@test "'ez-build --production' should set NODE_ENV=production" {
  unset NODE_ENV
  ez-build --production @build.opts

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=production ez-build' should enable production mode" {
  NODE_ENV=production ez-build @build.opts

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'npm run --production build' should enable production mode" {
  run npm run --production build
  
  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'ez-build' should set NODE_ENV=development" {
  unset NODE_ENV
  ez-build @build.opts

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=wibble ez-build' should not override NODE_ENV" {
  NODE_ENV=wibble ez-build @build.opts

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=wibble ez-build --production' should not override NODE_ENV" {
  NODE_ENV=wibble ez-build --production @build.opts

  assert_success
  assert_expected "$(cat lib/index.js)"
}