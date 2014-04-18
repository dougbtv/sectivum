Sectivum
---

A Perl-inspired language for Ethereum. With a hint of inspiration from c++. 
<sub>(*Pssst, It compiles Serpent [aka CLL], too*)</sub>

----

**Installation**

*Requires:*

- Node.JS
- NPM (NodeJS Package Manager)

Need some help? Check out the [Node.JS site](http://nodejs.org/), or you might be able to search in your distro's package manager.

*To install:*

    git clone https://github.com/dougbtv/sectivum.git
    npm install

----

**Usage**

To compile from a source file:

    node sectivum.js -f example.sec

You can also bring up a command line, and compile from a source file there with the `load` command:

    [user@host sectivum]$ node sectivum.js 
    sectivum.cli > load example.sec

Or, compile interactively:

    sectivum.cli > parse $a=5;
    Output: PUSH 5 PUSH 0 MSTORE  

You can quit the command line by issuing a `quit` (or `exit`) command.

You can get some help by running with the `--help` flag:

    [doug@localhost sectivum]$ node sectivum.js --help
    
    Usage: node sectivum.js [options]
    
    Options:
        -f FILE, --file FILE         Compile given file
        -s STRING, --string STRING   Compile a string
        -c, --cli                    start CLI

----

**Syntax**

You'll find that the syntax is rather Perl/PHP inspired, including:

- Semicolon `;` line terminators
- `{` Curly braces `}` for defining blocks
- Lets you organize whitespace how you'd like in your code
- Rather friendly towards strings (more work to do there, though)
- Very comment friendly, we use `//` for single lines, and `/* comment */` for block comments

Let's take a very basic example:

```php
// This is a comment.
// Here we set a variable.
$a = 15;
// Use some flow-control / conditionals
if ($a > 14) {
    $b = $a + 1;
    $c = $a + 2;
}
$a = $b * $a;
```

If you're used to the syntax, it should be pretty straight forward.

Now let's look at the C++ inspired pre-processing for defines.

```php
#define MYCONSTANT 10
$foo = MYCONSTANT;
```

As you can see, you can set a constant, so you can clean up some magic numbers from your code.

(More docs to come in terms of syntax)

----

**Coming soon**

- PoC4 Compatibility (Started with a PoC3 compatible reference)
- Better defining of functions (broken right now)
- REST API for compilation
- Web app for compilation

----

**Namesake**

After Perl, specifically for the "pearl onion" a variety of which is known as [*sectivum*](http://en.wikipedia.org/wiki/Pearl_onion). In latin it means "sectioned" or "severed", we can assume that this makes reference to the layers of an onion.

Originally inspired by the Ethereum Compiler for CLL -> https://github.com/ethereum/compiler
