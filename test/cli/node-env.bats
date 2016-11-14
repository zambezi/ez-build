#!/usr/bin/env bats

load test-util

setup() {
  load_fixture node-env
}

teardown() {
  unload_fixture node-env
}

expected_production="$(cat <<PROD
"production" === "development";
"production" === "production";

export default {};
//# sourceMappingURL=index.js.map
PROD
)"

expected_development="$(cat <<DEV
"development" === "development";
"development" === "production";

export default {};
//# sourceMappingURL=index.js.map
DEV
)"

expected_overriden="$(cat <<OVERRIDE
"wibble" === "development";
"wibble" === "production";

export default {};
//# sourceMappingURL=index.js.map
OVERRIDE
)"

opts="--flags modules:ecmascript"

@test "'ez-build --production' should set NODE_ENV=production" {
  unset NODE_ENV
  ez-build --production "${opts}"

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=production ez-build' should enable production mode" {
  NODE_ENV=production ez-build "${opts}"

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
  ez-build "${opts}"

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=wibble ez-build' should not override NODE_ENV" {
  NODE_ENV=wibble ez-build "${opts}"

  assert_success
  assert_expected "$(cat lib/index.js)"
}

@test "'NODE_ENV=wibble ez-build --production' should not override NODE_ENV" {
  NODE_ENV=wibble ez-build --production "${opts}"

  assert_success
  assert_expected "$(cat lib/index.js)"
}