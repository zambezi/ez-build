#!/usr/bin/env bash

canonical() {
  local d="$(dirname ${1})"
  local f="$(basename ${1})"
  (
    cd ${d} >/dev/null 2>&1
    while [ -h "${f}" ] ; do
      cd $(dirname $(readlink ${f})) >/dev/null 2>&1
    done
    pwd -P
  )
}

project_dirname=$(canonical ./)
export EZ_BUILD_BIN="${project_dirname}/bin/ez-build.js"

ez-build() {
  echo "argc: ${EZ_BUILD_BIN}"
  echo "argv: ${@}"
  run ${EZ_BUILD_BIN} ${@}
}

assert_success() {
  if [[ "${status}" != 0 ]]; then
    echo "-- command failed but was expected to succeed"
    echo "status : ${status}"
    echo "output : ${output}"
    echo "--"
    return 1
  fi
}

assert_failure() {
  if [[ "${status}" == 0 ]]; then
    echo "-- command succeded but was expected to fail"
    echo "status : ${status}"
    echo "output : ${output}"
    echo "--"
    return 1
  fi
}

counter=0

assert_expected() {
  outdir="${BATS_TEST_DIRNAME}/expected"
  outfile="$(basename ${BATS_TEST_FILENAME} .bats)"
  outtest="$(echo ${BATS_TEST_DESCRIPTION} | sed -e 's/[^A-Za-z0-9._-]/_/g')"

  (( counter+=1 ))

  expected="${outdir}/${outfile}--${outtest}--${counter}"

  if [[ ! -f ${expected} ]]; then
    mkdir -p "${outdir}"
    echo "${1}" > "${expected}"
  else
    assert_equal "$(cat ${expected})" "${1}"
  fi
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

assert_output() {
  if [[ "${1}" == "--eval" ]]; then
    shift
    expected=(${!1})
  else
    expected="${1}"
  fi

  assert_equal "${expected}" "${output}"
}

assert_exists() {
  for file in ${@}; do
    if [[ ! -e ${file} ]]; then
      echo "-- file does not exist"
      echo "expected : ${file}"
      echo "actual   : does not exist"
      echo "--"
      return 1
    fi
  done
}

refute_exists() {
  for file in ${@}; do
    if [[ -e ${file} ]]; then
      echo "-- file exists"
      echo "expected : no file"
      echo "actual   : ${file}"
      echo "--"
      return 1
    fi
  done
}

assert_contains() {
  if [[ "${1}" == "--eval" ]]; then
    shift
    expected=(${!1})
    actual=(${!2})
  else
    expected="${1}"
    actual="${2}"
  fi

  if [[ "${actual}" == *"${expected}"* ]]; then
    return 0
  else
    echo "-- expected string not found"
    echo "expected : ${expected[@]}"
    echo "actual   : ${actual[@]}"
    echo "--"
    return 1
  fi
}

assert_output_contains() {
  if [[ "${1}" == "--eval" ]]; then
    shift
    expected=(${!1})
  else
    expected="${1}"
  fi

  assert_contains "${expected}" "${output}"
}

load_fixture() {
  fixture="${project_dirname}/test/fixtures/${1}"

  if [[ -d "${fixture}" ]]; then
    pushd "${fixture}"

    if [[ ! -d node_modules ]]; then
      npm install
      npm link "${project_dirname}"
    fi
  else
    echo "unknown fixture: ${fixture}"
    return 1
  fi
}

clean_fixture() {
  fixture="${project_dirname}/test/fixtures/${1}"

  if [[ -d "${fixture}" ]]; then
    git clean -dfx -e node_modules -e "*.pid" -e "*.log" -- "${fixture}"
  else
    echo "unknown fixture: ${fixture}"
    return 1
  fi
}

unload_fixture() {
  fixture="${project_dirname}/test/fixtures/${1}"

  if [[ -d "${fixture}" ]]; then
    clean_fixture "${1}"
    popd
  else
    echo "unknown fixture: ${fixture}"
    return 1
  fi
}

eventually() {
  for try in $(seq 1 30); do
    set +e
    output="$(eval ${@})"
    status=$?
    set -e

    if [[ ${status} == 0 ]]; then
      return 0
    fi
    sleep 1
  done

  echo "${output}"
  return ${status}
}
