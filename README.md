# ez-build

A build tool for the Zambezi web platform, enabling you to easily implement a workflow utilizing modern web technologies such as ES2015.

For more information on why ez-build exists, [please read the rationale](RATIONALE.md).

# Installation

The recommended approach to using ez-build is to install it as a local development dependency of your project:

```bash
$ npm install --save-dev @zambezi/ez-build
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
    --flags <flags>                toggle build flags
    @<path>                        read options from the file at <path> (relative to cwd)
```

## Using ez-build in npm scripts

A typical scripts section of a package.json when using ez-build looks something like this:

```json
{ "build": "ez-build --production"
, "build:dev": "ez-build --interactive"
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

**Note:** It's important to properly quote the pattern, to avoid the shell expanding the pattern before executing ez-build.

The namespace must be added to all patterns, so to define multiple patterns either repeat the `--include` option or use comma to separate the patterns. The following are equivalent:

```bash
$ ez-build --include "js:**/*.js" --include "js:**/*.jsx"
```

```bash
$ ez-build --include "js:**/*.js,js:**/*.jsx"
```

It's also possible to use braced patterns, instead of multiple comma separated patterns, which can make some configurations neater. For instance, the above pattern could be rewritten as such:

```bash
$ ez-build --include "js:**/*.{js,jsx}"
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

If `NODE_ENV=production` is set when invoking ez-build with `--interactive`, it will still enter interactive mode, but will *not* change the value of `NODE_ENV`.

### `--production`

Runs ez-build in production mode, which implies a higher optimization level (currently `-O 1`,) as well as the generation of additional artefacts, such as a module manifest. For builds destined for deployment into Zambezi environments, this flag must be used or the builds will not work outside of debug mode.

If `NODE_ENV` is not set when ez-build is invoked in production mode, it will be set to `production`. Conversely if `NODE_ENV=production` when ez-build is invoked and no other mode is specified, e.g. `--interactive`, it will also enable production mode. This means there are three different ways one can enable ez-build production mode:

- `ez-build --production`
- `NODE_ENV=production ez-build`
- `npm run --production build` (assuming `build` is a script which invokes ez-build; substitute for whatever script name you may be using)

*Note: the `NODE_ENV=production ez-build` syntax may not work on all systems. For compatibility across operating systems, you may want to consider using something like [cross-env](https://www.npmjs.com/package/cross-env).*

### `--target-browsers <spec|false>`

Define which browsers that ez-build should do its best to target when producing its output. What this means is that only those features that actually need compiling will be compiled, and the rest will be left alone. The `spec` string can be any query supported by [browserslist](https://github.com/ai/browserslist). This option defaults to `"last 3 versions"` which is a rather broad range, intended to capture most reasonably modern browsers.

**Please note:** because of the rather freeform nature of target queries, it's very likely that you will have to quote the query, otherwise it won't be passed correctly. For instance, this will not be recognized properly:

```bash
$ ez-build --target-browsers last 3 versions
```

Because this isn't quoted, the spaces are considered argument boundaries, and the value parsed will only include `last`. The correct syntax is:

```bash
$ ez-build --target-browsers "last 3 versions"
```

This feature will *not* enable experimental features, even though target browsers may support them.

### `--target-node [<current|number|false>]`

Define which version of node ez-build should target in its output. This flag is disabled by default, since browsers are the typical targets for ez-build. If no value is specified when this option is enabled however, the default is `current`, which means the currently installed version of node.

Combining this option with `--target-browsers` should be safe, however if you want to only target node it may be useful to disable browser targets since it can produce more optimal code. To do this, simply do the following:

```bash
$ ez-build --target-node --target-browsers false
```

This would enable the currently installed node version as the target. To use a different version, simply specify a version:

```bash
$ ez-build --target-node 4.1.2 --target-browsers false
```

It's not necessary to specify a full version, simply `4` or `4.1` would also do.

### `--flags <flags>`

Toggles flags that may affect the output or behavior of ez-build. Multiple flags can be toggled at once, just separate them with a comma. For example, `--flags modules:commonjs,add-module-exports` would set the `modules` flag value to `commonjs`, and enable the `add-module-exports` flag.

The available flags are:

  - `modules:<umd|amd|commonjs|systemjs|ecmascript>` allows you to control the output module format. Setting this value to `ecmascript` will disable the transformation of output module format altogether, keeping `import` and `export` statements largely intact. This flag defaults to `umd`.
  - `add-module-exports` toggles whether the UMD output of ez-build should be backwards compatible with AMD and CJS module formats. If this flag is specified, ez-build will ensure any module with a single `export default` will not export an object with a `default` key. This flag is disabled by default. It is only recommended you use this flag if you *must* keep backwards compatibility with legacy code.
  - `es-stage:<0|1|2|3>` enables experimental EcmaScript features as determined by the [TC39 proposals documentation](https://github.com/tc39/proposals). Note that [finished proposals](https://github.com/tc39/proposals/blob/master/finished-proposals.md), i.e. stage 4, are enabled by default. This flag is disabled by default.
  - `react` enables support for React specific features, such as JSX. See section on React & JSX below for more information. This flag is disabled by default.

### `@<path>`

Reads ez-build options from the file at `<path>`, resolved from the current working directory. This can be used to share configuration among different builds. For instance, a common scenario is to share the same build configuration between `--production` and `--interactive` builds in npm scripts, like so:

```json
{
  "build": "ez-build --production --include \"js:**/*.{js,jsx}\" --flags add-module-exports",
  "build:dev": "ez-build --interactive --include \"js:**/*.{js,jsx}\" --flags add-module-exports"
}
```

To avoid this repetition, and also make things a bit neater, we can place this configuration in a file. The name and extension of the file doesn't matter, just pick something useful to your project. In this example, we'll use the name `build.opts`, and the contents look like this:

```
--include js:**/*.js
--include js:**/*.jsx
--flags add-module-exports"
```

*(Note how we repeat the `--include` option – any option that allows a list of values can be specified multiple times like this. It can make options much more readable, and also make it easy to maintain. No longer want to include jsx files? Just remove the line.)*

Now we can change our scripts to include the options from the file, making them less repetitive, and making it easier to maintain our configuration:

```json
{
  "build": "ez-build --production @build.opts",
  "build:dev": "ez-build --interactive @build.opts"
}
```
## Enabling experimental JavaScript features

Some features are not yet in the standard set, but may well be on their way. The features are categorized by their maturity, and there are four different such maturity categories that features must progress through before being considered *finished*. These are explained in depth in the [TC39 process document](https://tc39.github.io/process-document/) but can be summarized as such:

- stage-0 - Strawman: just an idea.
- stage-1 - Proposal: an idea worth exploring further.
- stage-2 - Draft: initial spec.
- stage-3 - Candidate: complete spec and initial browser implementations.
- stage-4 - Finished: will be added to the next yearly release.

Because of their experimental nature and often fast paced development and – particularly for lower stage features – volatility, staged features are disabled by default. It's very simply to toggle them on however, by using the `es-stage` flag. For instance, to enable the current stage 3 features, use the following option:

```
$ ez-build --flags es-stage:3
```

When enabling a more experimental stage, it will also enable all stages "above it". The following example will enable stages 1, 2, and 3:

```bash
$ ez-build --flags es-stage:1
```

Stages are usually updated shortly after TC39 holds their meetings, in case there are any relevant changes. You may need to reinstall ez-build in order to retreive the latest updates.

## React, JSX, and other non-standard features

React is a popular library for front-end web development, and with that comes the non-standard language extension JSX. While [ez-build takes a conservative stance with regards to the languages and features it supports](RATIONALE.md), it also recognizes that some non-standard extensions and features are so popular that it wouldn't be very practical to exclude them. React is such an example.

To enable support for React features, simply toggle the `react` flag:

```
--flags react
```

It's very common with the use of JSX to use a different file extension, and in order for ez-build to pick those files up, they must be included with the build:

```bash
$ ez-build --include "js:**/*.{js,jsx}"
```

Note that we add the `js:**/*.js` pattern in addition to `js:**/*.jsx`, since using this option overwrites the defaults. Also note the use of namespaces in the patterns, to determine which pipeline the pattern should affect.

Found an issue, or want to contribute?
--------------------------------------

If you find an issue, want to start a discussion on something related to this project, or have suggestions on how to improve it? Please [create an issue](../../issues/new)!

See an error and want to fix it? Want to add a file or otherwise make some changes? All contributions are welcome! Please refer to the [contribution guidelines](CONTRIBUTING.md) for more information.

License
-------

Please refer to the [license](LICENSE.md) for more information on licensing and copyright information.
