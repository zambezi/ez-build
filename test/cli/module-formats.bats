#!/usr/bin/env bats

load test-util

setup() {
  load_fixture bare-project
}

teardown() {
  unload_fixture bare-project
}

expected_umd="$(cat <<UMD
    (function (global, factory) {
      if (typeof define === "function" && define.amd) {
        define("bare-project/lib/index", ["exports"], factory);
      } else if (typeof exports !== "undefined") {
        factory(exports);
      } else {
        var mod = {
          exports: {}
        };
        factory(mod.exports);
        global.bareProjectLibIndex = mod.exports;
      }
    })(this, function (exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = {};
    });
    //# sourceMappingURL=index.js.map
UMD
)"

expected_amd="$(cat <<AMD
define("bare-project/lib/index", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {};
});
//# sourceMappingURL=index.js.map
AMD
)"

expected_commonjs="$(cat <<COMMONJS
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {};
//# sourceMappingURL=index.js.map
COMMONJS
)"

expected_systemjs="$(cat <<SYSTEMJS
"use strict";

System.register("bare-project/lib/index", [], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", {});
    }
  };
});
//# sourceMappingURL=index.js.map
SYSTEMJS
)"

expected_ecmascript="$(cat <<ECMASCRIPT
export default {};
//# sourceMappingURL=index.js.map
ECMASCRIPT
)"

@test "should output umd modules by default" {
  ez-build
  assert_equal "$(cat lib/index.js)" "${expected_umd}"
}

@test "should output umd modules when specified" {
  ez-build --flags modules:umd
  assert_equal "$(cat lib/index.js)" "${expected_umd}"
}

@test "should output umd modules when invalid module format is specified" {
  ez-build --flags modules:invalid
  assert_equal "$(cat lib/index.js)" "${expected_umd}"
}

@test "should output amd modules when specified" {
  ez-build --flags modules:amd
  assert_equal "$(cat lib/index.js)" "${expected_amd}"
}

@test "should output commonjs modules when specified" {
  ez-build --flags modules:commonjs
  assert_equal "$(cat lib/index.js)" "${expected_commonjs}"
}

@test "should output ecmascript modules when specified" {
  ez-build --flags modules:ecmascript
  assert_equal "$(cat lib/index.js)" "${expected_ecmascript}"
}