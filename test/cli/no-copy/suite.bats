#!/usr/bin/env bats

load ../fixture

@test "should copy files by default" {
  ez-build

  expected=(
    lib
    lib/index.html
    lib/index.js
    lib/index.js.map
    lib/style.css
    lib/style.css.map
    lib/deep
    lib/deep/file
  )

  actual=$(find lib)
  assert_equal --eval expected[@] actual[@]
}

@test "should not copy files when --no-copy is specified" {
  ez-build --no-copy
  
  expected=(
    lib
    lib/index.js
    lib/index.js.map
    lib/style.css
    lib/style.css.map
  )

  actual=$(find lib)
  assert_equal --eval expected[@] actual[@]
}