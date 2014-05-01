Sectivum
---

A Perl-inspired language for writing Ethereum contracts. With a hint of inspiration from c++. 

<sub>(*Pssst, It compiles Serpent [aka CLL], too*)</sub>

----

**Try It Out!**

You can give it a try @ https://sectivum.io/

Just hit the "compile" tab, and you'll have options to compile from there, without having to install the whole application.

As of this update, it's PoC-4/Poc-4.5 compatible (and almost ready for PoC5)

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

**Usage at the command line**

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

    [user@host sectivum]$ node sectivum.js --help

    Usage: node sectivum.js [options]

    Options:
       -f FILE, --file FILE               Compile given file
       -str "STRING", --string "STRING"   Compile from a string
       -c, --cli                          start CLI
       -s, --server                       start server for RESTful API

----

**Usage via web application**

Check out the `docs/*.config` files for both an nginx & apache configuration for running the web server. 

When you're ready just issue:

    node sectivum.js --server

May I suggest also using [forever](https://github.com/nodejitsu/forever)? It's a great way to keep a node app up and running.

* More docs on the way for setting up running your instance of the web application, and also complete docs for making requests to the RESTful API.

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

- PoC5 compatibility
- Better defining of functions (broken right now, but it's ready)
- Creating richer data structures using contract storage
- Better docs for the web app features.
- For loops
- Better output from the parser when you've got a mistake in your code.

----

**Namesake**

After Perl, specifically for the "pearl onion" a variety of which is known as [*sectivum*](http://en.wikipedia.org/wiki/Pearl_onion). In latin it means "sectioned" or "severed", we can assume that this makes reference to the layers of an onion.

Originally inspired by the Ethereum Compiler for CLL -> https://github.com/ethereum/compiler
