#!/usr/bin/env bats

load test-util

setup() {
  load_fixture logging
}

teardown() {
  unload_fixture logging
}

expected_normal_log="$(cat <<NORMAL
[31mWARNING: ez-build is discontinuing support for .babelrc[39m [33m

Currently ez-build still loads .babelrc files, but this support is
going away before v1.0.0. Please make sure to migrate any relevant
configuration to use flags instead.

Not sure how to migrate? Please open an issue:

https://github.com/zambezi/ez-build/issues/new

[39m
js – src/a.js -> lib/a.js,lib/a.js.map
[31mjs – src/b.js: Unexpected token, expected { (8:7)
  6 | }
  7 | 
> 8 | export all from foo
    |        ^
  9 | export default 'b'[39m
js – src/c.js -> lib/c.js,lib/c.js.map
js – src/d.js -> lib/d.js,lib/d.js.map
js – src/deep/k.js -> lib/deep/k.js,lib/deep/k.js.map
js – src/e.js -> lib/e.js,lib/e.js.map
[33mcss – src/common.css: undefined (undefined:undefined)[39m
[33mcss – src/common.css: undefined (undefined:undefined)[39m
css – src/common.css -> lib/common.css,lib/common.css.map
css – src/deep/bar.css -> lib/deep/bar.css,lib/deep/bar.css.map
[33mcss – src/foo.css: variable '--color' is undefined and used without a fallback (3:3)[39m
css – src/foo.css -> lib/foo.css,lib/foo.css.map
copy-files – src/deep/something -> lib/deep/something
copy-files – src/random.txt -> lib/random.txt

Build failed to due unrecoverable errors.
NORMAL
)"

@test "'ez-build' should produce normal log output" {
  ez-build

  assert_equal 1 "${status}"
  assert_equal "${expected_normal_log}" "${output}"
}

@test "'ez-build --log json' should produce valid JSON output" {
  ez-build --log json

  assert_equal 1 "${status}"
  echo "${output}" > build.log

  while read record
  do
    echo "${record}" > record.json
    run "node_modules/.bin/jsonlint" record.json
    rm record.json
    assert_equal 0 "${status}"
  done < build.log

  rm build.log
}