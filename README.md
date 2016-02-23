# ez-build

A build tool for the Zambezi web platform, enabling you to easily implement a workflow utilizing modern web technologies such as ES2015.

# Installation

The recommended approach to using ez-build is to install it as a local development dependency of your project:

```bash
$ npm install --save-dev ez-build
```

This will make the binary `ez-build` available to npm scripts. This tool is self contained, and not dependent on additional peer dependencies. However, if you wish to use additional plugins or presets, you must install those as well. (See the section on using additional plugins below.)

# Usage

Quick help can be retrieved with the `-h` or `--help` flags. Further explanation of the options can be found in a section below.

```bash
$ ez-build --help

  Usage: ez-build [options]

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -i, --src <dir>                the root directory from which all sources are relative [src]
    -o, --out <prefix>             write optimized output to files with the specified prefix [project-min]
    -L, --lib <dir>                write unoptimized files to the specified directory [lib]
    -I, --include [js|css:]<path>  include a path or glob (relative to source root) [js:**/*.js,css:**/*.css]
    -X, --exclude [js|css:]<path>  exclude a path or glob (relative to source root) [../node_modules/**/*]
    -O, --optimize <level>         optimization level (0 = none) [0]
    --no-copy                      disable copying of non-code files to lib
    --no-debug                     disable source map generation
    --log <normal|json>            log output format [normal]
    --interactive                  watch for and recompile on changes (implies -O 0)
    --production                   enable production options (implies -O 1)
```

## Using ez-build in npm scripts

A typical scripts section of a package.json when using ez-build looks something like this:

```json
{ "dev": "ez-build --interactive"
, "build": "ez-build --production"
}
```

The first script – `npm run dev` – will run ez-build in interactive mode, which continously watches for changes to input files and directories, and rebuilds the project as necessary.

The second script – `npm run build` – is the recommended approach to building production artefacts for the Zambezi platform.

## CLI Options

### `-h, --help`
  
Outputs information on how to use ez-build.

### `-V, --version`
  
Outputs the version number of ez-build.

### `-i, --src <dir>`
  
The root directory from which the build tool will reference source files. This affects the matching of the `--include` and `--exclude` flags, and potentially other – e.g. `--include **/*.js` will really resolve to `--include <src dir>/**/*.js`. If left unspecified, this flag will default to `directories.src` from `package.json`, or `<project root>/src` if no such field is specified.

### `-o, --out <prefix>`

The prefix used for linked and – depending on optimization level – optimized output. This option is for advanced usage and its usage is not generally recommended. 

### `-L, --lib <dir>`
  
Unoptimized files, source maps, and other generated content will be written to the directory specified by this flag. If left unspecified, this flag will default to `directories.lib` from `package.json`, or `./lib` if no such field is specified.

### `-I, --include [js|css:]<path>`

*Note that using this flag will overwrite the default values, so if you wish to include those you will have to repeat them.*

Sets a pattern to describe which files to include in the build process. By default, the patterns `js:**/*.js,css:**/*.css` are specified. The patterns can be defined for different pipelines (`js:` or `css:`.) If no namespace is specified – e.g. `*.txt` – it will be added to all pipelines. Generally, you would always specify a namespace for `--include` to avoid pipelines working on incompatible files. (E.g. if you try `--include "**/*.js"` without namespace, the css compiler will also try to compile js files, which is probably not what you want.)

The namespace must be added to all patterns, so to define multiple patterns either repeat the `--include` option or use comma to separate the patterns. The following are equivalent:

```bash
$ ez-build --include "js:**/*.js" --include "js:**/*.jsx"
```

```bash
$ ez-build --include "js:**/*.js,js:**/*.jsx"
```

Typically, this flag is only used if you have also configured additional presets or plugins.

### `-X, --exclude [js|css:]<path>`

*Note that using this flag will overwrite the default values, so if you wish to include those you will have to repeat them.*

Works just like the `--include` flag, but defines which files to *exclude* from the build process entirely (including file copying.) By default, the pattern `../node_modules/**/*` is specified. (Remember, both `--include` and `--exclude` are relative to `src`.)

### `-O, --optimize <level>`

Sets the level of optimization. By default, no optimization occurs, which is a useful default for development purposes but not recommended for production environments. The `level` should be a positive integer, with `0` meaning no optimization should occur. Disabling optimizations altogether usually produces the most accurate debug artefacts such as source maps. Currently, the only optimization that is done for levels over 0 is to bundle all modules together. This will likely change over time.

### `--no-copy`

By default ez-build will copy any non-code files verbatim to the output directory (as specified by `--lib`.) Use this flag to disable this behavior. Non-code files are any files that are not covered by any `--include` patterns, and likewise not covered by any `--exclude` patterns.

### `--no-debug`

By default ez-build will generate source maps and other debugging information for all built artefacts. Use this flag to disable this behavior. Generally, it is not recommended that this flag be used, since it makes debugging a lot more difficult. However, it may have a very small but positive performance implications on builds.

### `--log <normal|json>`

Determines the output format of ez-build's log. This is generally not used, but setting it to `json` provides additional detail and can sometimes help in debugging issues.

### `--interactive`

Runs ez-build in interactive mode, meaning it will run continuously and watch for changes to input files and directories. This is very useful for rapid development, since it's much faster to rebuild only what changed than the entire project. Setting this flag implies `-O 0` which disables all optimizations.

This flag is ignored entirely if combined with `--production`.

### `--production`

Runs ez-build in production mode, which implies a higher optimization level (currently `-O 1`,) as well as the generation of additional artefacts, such as a module manifest. For builds destined for deployment into Zambezi environments, this flag must be used or the builds will not work outside of debug mode.

## Using additional plugins

With the advent of technologies such as React, it is not uncommon to want to extend the language with non-standard features, such as JSX. It is possible to implement such scenarios with ez-build, however it is important to remember a few things:

- Additional presets and plugins *must* be installed as developer dependencies of your project. For example, to install the React preset, do the following:

  ```bash
  $ npm install --save-dev babel-preset-react
  ```

- Additional presets and plugins *must* be specified using a `.babelrc` file in your project. ([Please refer to the babel documentation for more information on this file.][.babelrc]) This file will *add* options to the internal babel configuration, which means you don't have to (and in some cases can't) specify any options that are already defined by ez-build internally. To use the react preset, after installing the dependency, you can add a `.babelrc` file looking like this:

  ```json
  {
    "presets": ["react"]
  }
  ```

  Note that this does *not* add the `es2015` preset, since ez-build already adds this internally. This also applies to the AMD transform plugin, which is a required dependency of Zambezi based projects.

[.babelrc]: http://babeljs.io/docs/usage/babelrc/

- Finally, depending on the presets you use, conventions may dictate you use different file extension to denote the use of non-standard language features. This is very common with JSX, and in order for ez-build to pick those files up, they must be included with the build:

  ```bash
  $ ez-build --include "js:**/*.js,js:**/*.jsx"
  ```

  Note that we add the `js:**/*.js` pattern in addition to `js:**/*.jsx`, since using this option overwrites the defaults. Also note the use of namespaces in the patterns, to determine which pipeline the pattern should affect.