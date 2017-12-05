#!/usr/bin/env bats

load test-util

setup() {
  load_fixture typical-project
}

teardown() {
  unload_fixture typical-project
}

@test "should update relative path URLs in CSS" {
  ez-build --production

  assert_contains "url(local-image.png)" "$(cat lib/common.css)"
  assert_contains "url(lib/local-image.png)" "$(cat typical-project-min.css)"

  assert_contains "url(deep-image.png)" "$(cat lib/deep/bar.css)"
  assert_contains "url(deep/deep-image.png)" "$(cat lib/common.css)"
  assert_contains "url(lib/deep/deep-image.png)" "$(cat typical-project-min.css)"
}

@test "should not update absolute path URLs in CSS" {
  ez-build --production

  assert_contains "url(/absolute-image.png)" "$(cat lib/common.css)"
  assert_contains "url(/absolute-image.png)" "$(cat typical-project-min.css)"
}

@test "should not update share path URLs in CSS" {
  ez-build --production

  assert_contains "url(//foo/share-image.png)" "$(cat lib/common.css)"
  assert_contains "url(//foo/share-image.png)" "$(cat typical-project-min.css)"
}

@test "should not update external path URLs in CSS" {
  ez-build --production

  assert_contains "url(http://www.google.com/external-image.png)" "$(cat lib/common.css)"
  assert_contains "url(http://www.google.com/external-image.png)" "$(cat typical-project-min.css)"
}

@test "should not update \"data:\" path URLs in CSS" {
  ez-build --production

  assert_contains "url(data:image/png;base64,iVBO==)" "$(cat lib/common.css)"
  assert_contains "url(data:image/png;base64,iVBO==)" "$(cat typical-project-min.css)"
}
