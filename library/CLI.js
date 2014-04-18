module.exports = function(parser,compiler,preprocessor) {

	// Our interactive command prompt module.
	var prompt = require('prompt');

	this.myConstructor = function() {

		// Parse up our options.
		// Tres nifty: https://github.com/harthur/nomnom
		var opts = require("nomnom")
		   .option('file', {
			  abbr: 'f',
			  metavar: 'FILE',
			  help: 'Compile given file'
		   })
		   .option('string', {
			  abbr: 's',
			  metavar: 'STRING',
			  help: 'Compile a string'
		   })
		   .option('cli', {
		   	  abbr: 'c',
			  flag: true,
			  help: 'start CLI'
		   })
		   .parse();

		/*

			.option('version', {
				  flag: true,
				  help: 'print version and exit',
				  callback: function() {
					 return "version 1.2.4";
				  }
			   })
		*/

		// console.log("!trace options: ",opts);

		if (typeof opts.file === 'string') {
			// Work from a file.
			this.loadFile(opts.file);

		} else if (typeof opts.string === 'string') {
			// Compile from a string.

		} else {

			// Command prompt mode
			// setup promtps.
			prompt.message = "sectivum.cli >".cyan;
			prompt.delimiter = "".green;

			// start the prompt module.
			prompt.start();

			// we run some things once upon init.
			this.init = false;

			// finally we start the interactive prompt.
			this.startPrompt();

		}

	}

	this.startPrompt = function() {

		// Only start the prompt when not yet initialized.
		if (!this.init) { 
			prompt.start(); 
			this.init = true; 
		}

		// Get the prompt, and then call this function upon it's return.
		prompt.get({
				properties: {
				cli: {
					description: "".cyan
				}
			}
		}, function (err, result) {
			this.parseCLI(result.cli);
			// console.log("You said your name is: ".white + result.cli.cyan);
			// And start again.
			this.startPrompt();
		}.bind(this));

	}

	this.parseCLI = function(cli) {

		// split words by spaces.
		var words = cli.split(" ");

		switch (words[0]) {

			case "load":
				this.loadFile(words[0]);			
				break;

			case "exit":
			case "quit":
				process.exit();
				break;

		}

	}

	this.loadFile = function(infile) {

		preprocessor.loadFile(infile)
		parser.parSecInitialize(preprocessor.processed_file,preprocessor.stringers);
		var asm = compiler.assemble(compiler.compile_stmt(parser.ast));
		this.printOutput(asm);
	
	}

	this.printOutput = function(asm) {

		output = "";
		for (var j = 0; j < asm.length; j++) {
			output += asm[j] + " ";
		}

		console.log("Output: %s \n\n",output);



	}


	// Initialize our constructor.
	this.myConstructor();
	


}