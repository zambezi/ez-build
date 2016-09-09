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
    define("bare-project/lib/index", ["module", "exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.bareProjectLibIndex = mod.exports;
  }
})(this, function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {};
  module.exports = exports["default"];
});
//# sourceMappingURL=index.js.map
UMD
)"

expected_amd="$(cat <<AMD
define("bare-project/lib/index", ["module", "exports"], function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {};
  module.exports = exports["default"];
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
module.exports = exports["default"];
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

      module.exports = exports["default"];
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

@test "should only export default value for single export modules when add-module-exports flag is specified" {
  ez-build --flags add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_umd}"
  ez-build --flags modules:umd,add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_umd}"
  ez-build --flags modules:amd,add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_amd}"
  ez-build --flags modules:commonjs,add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_commonjs}"
  ez-build --flags modules:systemjs,add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_systemjs}"
}

@test "should not affect ecmascript exports at all when add-module-exports flag is specified" {
  ez-build --flags modules:ecmascript,add-module-exports
  assert_equal "$(cat lib/index.js)" "${expected_ecmascript}"
}