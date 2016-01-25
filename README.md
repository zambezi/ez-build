# ez-build

A build tool for the Zambezi web platform, enabling you to easily implement a workflow utilizing modern web technologies such as ES2015.

# Installation

The recommended approach to using ez-build is to install it as a local development dependency of your project:

```bash
$ npm install --save-dev ez-build
```

This will make the binary `ez-build` available to npm scripts.

In order to use ez-build however, you *must* install [babel] and any associated [plugins or presets][plugins] that will be used in the build. This is because ez-build doesn't include babel or any plugins or presets, since these tools evolve independently and at a very rapid pace. To install babel and the default set of plugins used by ez-build, please run the following command:

```bash
$ npm install --save-dev babel-cli babel-preset-es2015 babel-plugin-transform-es2015-modules-amd
```

All 6.x versions of babel and associated presets and plugins should be compatible with ez-build. If you wish to use additional plugins, you must install those as well.

[babel]: http://babeljs.io
[plugins]: http://babeljs.io/docs/plugins/

# Usage

Quick help can be retrieved with the `-h` or `--help` flags. Further explanation of the options can be found in a section below.

```bash
$ ez-build --help

  Usage: ez-build [options]

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -i, --src <dir>         the root directory from which all sources are relative [src]
    -o, --out <file>        write optimized output to the specified file [project-min.js]
    -L, --lib <dir>         write unoptimized files to the specified directory [lib]
    -I, --include <path>    include the specified path or glob (relative to source root) [**/*.js]
    -X, --exclude <path>    exclude the specified path or glob (relative to source root)
    -O, --optimize <level>  optimization level (0 = none) [0]
    --presets <list>        comma separated list of babel presets; prepend + to add to defaults [es2015]
    --plugins <list>        comma separated list of babel plugins; prepend + to add to defaults [transform-es2015-modules-amd]
    --no-copy               disable copying of non-code files to lib
    --no-debug              disable source map generation
    --interactive           watch for and recompile on changes (implies -O 0)
    --production            enable production options (implies -O 1)
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
  
The root directory from which the build tool will reference source files. This affects the matching of the `--include` and `--exclude` flags, and potentially other – e.g. `--include **/*.js` will really resolve to `--include <src dir>/**/*.js`. If left unspecified, this flag will default to `directories.src` from `package.json`, or `./src` if no such field is specified.

### `-o, --out <file>`

The file used for linked and, depending on optimization level, optimized output. This option is for advanced users and its usage is not generally recommended.

### `-L, --lib <dir>`
  
Unoptimized files, source maps, and other generated content will be written to the directory specified by this flag. If left unspecified, this flag will default to `directories.lib` from `package.json`, or `./lib` if no such field is specified.

### `-I, --include <path>`

Sets a pattern to describe which files to include in the build process. By default, the pattern `**/*.js` is specified. This flag is additive, and can be used multiple times to add multiple patterns. Typically, this flag is not used, unless other presets or plugins are used that may conventionally use other file extensions for source code – see section on plugins and presets below.

### `-X, --exclude <path>`

Sets a pattern to describe which files to exclude from the build process. By default, the pattern `../node_modules/**/*` is specified. (Remember, both `--include` and `--exclude` are relative to `src`.) This flag is additive, and can be used multiple times to add multiple patterns. Typically, this flag is never used.

### `-O, --optimize <level>`

Sets the level of optimization. By default, no optimization occurs, which is a useful default for development purposes but not recommended for production environments. The `level` should be a positive integer, with `0` meaning no optimization should occur. Disabling optimizations altogether usually produces the most accurate debug artefacts such as source maps. Currently, the only optimization that is done for levels over 0 is to bundle all modules together. This may change over time.

### `--presets <list>`

Sets the list of [babel presets][plugins] to use when compiling code. By default, this is set to only include the [ES2015 preset](http://babeljs.io/docs/plugins/preset-es2015/) however it is possible to amend this. Setting this flag will reset the preset list altogether, which is usually not what you want. To just add a preset, prepend the list of presets with a `+` character – e.g. if you'd like to add the [React preset](http://babeljs.io/docs/plugins/preset-react/) you'd do something like this:

```bash
$ ez-build --presets +react
```

N.B.: you *must* install the preset as a developer dependency of your project, or ez-build won't be able to find it.

### `--plugins <list>`

Like presets, this flag sets the list of [babel plugins][plugins] used when compiling code. It behaves much the same as the `--presets` flag, and you can use `+` for additive behavior here as well.

### `--no-copy`

By default ez-build will copy any non-code files verbatim to the output directory (as specified by `--lib`.) Use this flag to disable this behavior.

### `--no-debug`

By default ez-build will generate source maps and other debugging information for all built artefacts. Use this flag to disable this behavior. Generally, it is not recommended that this flag be used, since it makes debugging a lot more difficult. However, it may have small positive performance implications on builds.

### `--interactive`

Runs ez-build in interactive mode, meaning it will run continuously and watch for changes to input files and directories. This is very useful for rapid development, since it's much faster to rebuild only what changed than the entire project. Setting this flag implies `-O 0` which disables all optimizations.

### `--production`

Runs ez-build in production mode, which implies a higher optimization level (currently `-O 1`,) as well as the generation of additional artefacts, such as a module manifest. For builds destined for deployment into Zambezi environments, this flag must be used or the builds will not work outside of debug mode.

## Using additional plugins

With the advent of technologies such as React, it is not uncommon to want to extend the language with non-standard features, such as JSX. It is possible to implement such scenarios with ez-build, however it is important to remember a few things:

- Additional presets and plugins *must* be installed as developer dependencies of your project. For example, to install the React preset, do the following:

  ```bash
  $ npm install --save-dev babel-preset-react
  ```

- Additional presets and plugins *must* be specified using the `--presets` or `--plugins` flags. Following on with the React example above, it would look like this:

  ```bash
  $ ez-build --presets +react
  ```

  (Note the use of `+` to append the React preset to the default list.)

- Finally, depending on the presets you use, conventions may dictate you use different file extension to denote the use of non-standard language features. This is very common with JSX, and in order for ez-build to pick those files up, they must be included with the build:

  ```bash
  $ ez-build --presets +react --include **/*.jsx
  ```

## .babelrc files

While it is technically possible to use .babelrc files as normal, it is not entirely recommended. This is due to some inconsistencies in Babel's own resolution of those files, as well as inconcistencies in what options can actually be modified using such files. We've found that these problems add more confusion than the files add value, so we recommend you use ez-build flags instead.
