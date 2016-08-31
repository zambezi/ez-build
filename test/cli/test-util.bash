#!/usr/bin/env bash

project_dirname=$(readlink -m ./)
bin="${project_dirname}/bin/ez-build.js"

ez-build() {
  echo "argc: ${bin}"
  echo "argv: ${@}"
	${bin} ${@}
}

assert_equal() {
  if [[ "${1}" == "--eval" ]]; then
    shift
    expected=(${!1})
    actual=(${!2})
  else
    expected="${1}"
    actual="${2}"
  fi
  
  diff=$(echo ${expected[@]} ${actual[@]} | tr ' ' '\n' | sort | uniq -u)

  if [[ -z "${diff}" ]]; then
  	return 0
  else
    echo "-- not equal"
		echo "expected : ${expected[@]}"
		echo "actual   : ${actual[@]}"
		echo "diff     : ${diff[@]}"
    echo "--"
  	return 1
  fi
}

assert_exists() {
  for file in ${@}; do
    if [[ ! -e ${file} ]]; then
      echo "-- file does not exist: ${file}"
      return 1
    fi
  done
}

load_fixture() {
  fixture="${project_dirname}/test/fixtures/${1}"

  if [[ -d "${fixture}" ]]; then
    pushd "${fixture}"
  else
    echo "unknown fixture: ${fixture}"
    return 1
  fi
}

unload_fixture() {
  fixture="${project_dirname}/test/fixtures/${1}"

  if [[ -d "${fixture}" ]]; then
    rm -rf "${fixture}"/{lib,optimised-modules.json,*-min.js,*-min.css}
    popd
  else
    echo "unknown fixture: ${fixture}"
    return 1
  fi
}