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

@test "should set NODE_ENV=production if --production is specified and NODE_ENV is unset" {
  unset NODE_ENV
  ez-build --production "${opts}"

  assert_equal 0 "${status}"
  assert_equal "${expected_production}" "$(cat lib/index.js)"
}

@test "should set NODE_ENV=development if --production is not specified and NODE_ENV is unset" {
  unset NODE_ENV
  ez-build "${opts}"

  assert_equal 0 "${status}"
  assert_equal "${expected_development}" "$(cat lib/index.js)"
}

@test "should not override previously set NODE_ENV values" {
  NODE_ENV=wibble ez-build "${opts}"

  assert_equal 0 "${status}"
  assert_equal "${expected_development}" "$(cat lib/index.js)"
}

@test "should not override previously set NODE_ENV values, even if --production is set" {
  NODE_ENV=wibble ez-build --production "${opts}"

  assert_equal 0 "${status}"
  assert_equal "${expected_development}" "$(cat lib/index.js)"
}