# Less watch for .less files

This is a super-light npm package that watches .less files and actively compiles them into .css files

---

## Prerequisites

You need `less` npm package insalled. you can add it your project by running:

```bash
npm install less
```

## Installation

To install this package simply run:

```bash
npm install lessc-watcher
```

## How to use

There are few different ways to run your less compiler

#### Basic usage

```bash
lessc-watcher --src ./folder --dst ./dist/less.css
```

This traverses the folder and searches for a `main.less` file. This file serves as the source for your bundled `.css` file. If you want to target a specific file, use:

```bash
lessc-watcher --src ./folder/src.less --dst ./dist/less.css
```

Or you can just watch an entire folder. In this case less-watch will searc for an entry file named `main.less`. Without this entry file, your compiler wouldn't work.

```bash
lessc-watcher --src ./folder --dst ./dist/less.css
```

#### Adding more source folders

You can add more source folders by using a comma(`,`) separator. Example:

```bash
lessc-watcher --src ./folder-1,./folder-2 --dst ./dist/folder-1.css,./dist/folder-2.css
```

**_NOTE:_** Your `--dst` input must match the number of comma-separated folders in your `src` input.

#### Advanced Features

lessc-watcher has more advanced features to better fine-tune your files

##### Ignore files

Ignore files/folders by enlosing the names in braces. Eg `(general).less`

##### Compile specific files

If you're watching an entire folder, you can compile specific files in that folder to a stanalone file. Example if you create a file named `[test].less` in your watch directory, in your distribution directory there will be an extra file named `test.css`.
