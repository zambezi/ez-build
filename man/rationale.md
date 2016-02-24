# Why ez-build?

Ez-build is a tool to enable web developers to easily implement a build workflow utilizing modern standard technologies, such as ES2015. To achieve this goal, ez-build codifies common processes and practices, by making some crucial choices for you.

# Overwhelming choice

As it stands, the current state of web development means that when you start a new project you're easily overwhelmed by choice – the choice of languages, frameworks, tooling, etc.

This problem is not specific to web developers either. In fact, American psychologist Barry Schwartz discusses this problem from a consumer standpoint, in his book [The Paradox of Choice – Why More Is Less][1]. It is argued that shopper anxiety can be greatly reduced by eliminating consumer choices.

[1]: https://en.wikipedia.org/wiki/The_Paradox_of_Choice

This problem of overwhelming choice is especially obvious when it comes to build tooling for web development. The popular tool [webpack][2] has an entire section of its documentation dedicated to lists of [loaders][3] and [plugins][4]. Another popular tool, [grunt][5], has [thousands of plugins][6].

[2]: http://webpack.github.io/docs/ 
[3]: http://webpack.github.io/docs/list-of-loaders.html
[4]: http://webpack.github.io/docs/list-of-plugins.html
[5]: http://gruntjs.com
[6]: http://gruntjs.com/plugins

The web development community in particular has a problem with choices, in that there are too many. This often leads to questions like:

- How should I structure my project?
- What compiler should we use?
- Should we enable non-standard features?
- How do we deal with non-code assets?
- What kind of optimizations should we do?
- Where do we get dependencies from?
- How do we package our project for distribution?

And many, many more. It is very likely however, that none of these questions are actually relevant to you delivering whatever product you're building. In fact, at the end of the day, whoever is consuming your product probably doesn't care what language you wrote it in, or what compiler was used to create the deployed code.

# Eliminating choice

This is where ez-build comes in. By making some important choices, ez-build becomes a build tool that does many things – compiles code, copies files, optimizes, generates metadata, etc. – according to certain conventions. This is common practice in many areas of software engineering, and in some ways ez-build can be compared with tools like gcc, or clang.

It is not *one* tool, it is a collection of many, with the explicit goal of turning sources into something distributable – based on a set of choices made for you. These choices include:

- What compilers to use
- What languages to target
- How to structure projects
- Where metadata goes
- How to define dependencies; both developer and runtime

This means ez-build is less flexible than simply stringing a collection of tools together; but on the other hand, this means all builds follow a certain convention and have predictable end results. We are eliminating choices, in favour of reducing anxiety and increasing focus and productivity.

# Reasonably flexible

While ez-build eliminates a lot of choices, it doesn't eliminate them all. Indeed, some flexibility must remain so developers can add functionality that may be crucial to their specific use case. For example, [React][7] is a popular user interface library these days, and it's often used with [JSX][8] – a non-standard ECMAScript extension. This is the kind of flexibility that ez-build allows, by providing ways to [augment the defaults][9].

[7]: https://facebook.github.io/react/
[8]: https://facebook.github.io/jsx/
[9]: ../README.md#using-additional-plugins

On the flip-side however, it is not possible to wholesale change the way ez-build operates. For instance, ez-build doesn't – and likely will never – support other languages than standard Javascript, CSS, etc. For instance, ez-build has no support for something like [TypeScript][10], and there are no plans to include it. That's not to say Typescript is bad, or even the wrong choice for you – it just means you'll have to make different choices.

[10]: http://www.typescriptlang.org

# Staying future compatible

The choices made by ez-build are meant to reflect modern web development practices, and in particular practices that are compatible with the Zambezi platform. Ez-build by default targets the ES2015 language specification and [modern CSS standards][11]. As these standards progress, so will ez-builds defaults – all the while remaining backwards compatibility to the extent it is possible. This means that as the future arrives, you will largely benefit without having to change your build process. By eliminating choices, ez-build can make more specific determinations about your project, and build it with up-to-date practices.

[11]: http://www.xanthir.com/b4Ko0

# Standing alone

By intentionally being a standalone CLI tool, not a plugin to task runners or the likes, ez-build has the benefit of fitting well into almost any environment. Crucially, learning how to use ez-build on typical projects doesn't require learning how to use additional tooling or spending time developing convoluted configurations.

# Conclusion

Ez-build isn't the build tool for all projects, and all situations. It isn't the tool for esoteric features and fun experiments. It never will be.

But it *is* the build tool for *typical* projects, where the requirements are to deliver well built products based on modern and standard web technologies. It *is* the build tool that codifies solid practices, by using a strong and stable foundation of tools.