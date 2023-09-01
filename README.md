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

### Basic usage

```bash
npx lessc-watcher --src ./folder --dst ./dist/less.css
```

This traverses the `--src` folder and searches for a `main.less` file. This file serves as the source for your bundled `.css` file. If you want to target a specific file, use:

```bash
npx lessc-watcher --src ./folder/src.less --dst ./dist/less.css
```

Or you can just watch an entire folder. In this case less-watch will searc for an entry file named `main.less`. Without this entry file, your compiler wouldn't work.

```bash
npx lessc-watcher --src ./folder --dst ./dist/less.css
```

**_NOTE:_** If you only provide a destination path, without specifying the exact file name in `.css`, your files will be compiled to a css file named `_main.css`. This is done to prevent conflicts with another possible `main.css` file.

### Adding more source folders

You can add more source folders by using a comma(`,`) separator. Example:

```bash
npx lessc-watcher --src ./folder-1,./folder-2 --dst ./dist/folder-1.css,./dist/folder-2.css
```

**_NOTE:_** Your `--dst` input must match the number of comma-separated folders in your `src` input.

## Advanced Features

lessc-watcher has more advanced features to better fine-tune your files

### Ignore files

Ignore files/folders by enlosing the names in braces. Eg `(general).less`

### Compile specific files

If you're watching an entire folder, you can compile specific files in that folder to a stanalone file. Example if you create a file named `[test].less` in your watch directory, in your distribution directory there will be an extra file named `test.css`.

## Using a `lesscw.config.json` file

You can use a `lesscw.config.json` file to add your files instead of using the CLI interface. For this to work your `lesscw.config.json` file must be located in the root directory of your project, and it must contain at least one `src` and one `dst` entry

### Basic Config JSON

```json
{
    "src": "./folder",
    "dst": "./dist/less.css"
}
```

This works the same as running `npx lessc-watcher --src ./folder --dst ./dist/less.css` in your terminal. Instead you only need to run:

```bash
npx lessc-watcher
```

### Using multiple sources and destinations

```json
{
    "src": ["./folder", "./folder-2", "./folder/sub-folder/admin.less"],
    "dst": ["./dist/less.css", "./dist/folder-2/less.css", "./dist/sub-folder.css"]
}
```

Like the CLI paradigm, the number of paths in the `src` array must match the `dst array`. And note that you can use multiple different folders with multiple different destinations.

### Using a `srcDst` cofiguration

ALternative to the `src` and `dst` paths, you can provide a `srcDst` key instead, this will contain an array of key-value pairs as follows

```json
{
    "srcDst": [
        {
            "src": "./folder",
            "dst": "./folder-2"
        }
    ]
}
```

**_NOTE:_** If you provide a config file and still add `--src` and `--dst` arguments in your terminal, the terminal source and distributuion arguments will be ignored.
