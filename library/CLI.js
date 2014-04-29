module.exports = function(parser,compiler,preprocessor,restserver,constants) {

	// Our interactive command prompt module.
	var prompt = require('prompt');
	var readline = require('readline');

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
			  abbr: 'str',
			  metavar: '"STRING"',
			  help: 'Compile from a string'
		   })
		   .option('cli', {
		   	  abbr: 'c',
			  flag: true,
			  help: 'start CLI'
		   })
		   .option('server', {
		   	  abbr: 's',
			  flag: true,
			  help: 'start server for RESTful API'
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




			// Setup restify
			

		*/


		if (typeof opts.file === 'string') {
			// Work from a file.
			
			this.loadFile(opts.file,function() {
				// Dont' really have to do anything else.
			});

		} else if (typeof opts.string === 'string') {
			// Compile from a string.
			this.parseString(opts.string,function(){});

		} else if (opts.server) {

			restserver.serverStart();

		} else {

			
			// Create our readline interface.
			rl = readline.createInterface(process.stdin, process.stdout);

			// Set the prompt, and launch it.
			rl.setPrompt('sectivum cli> '.cyan);
			rl.prompt();

			// Act on the line input from the readline.
			rl.on('line', function(line) {
			
				// parse the CLI input.
				this.parseCLI(line.trim(),function(){
					
					// And start again.
					rl.prompt();

				}.bind(this));

			}.bind(this)).on('close', function() {

				// console.log('Have a great day!');
				console.log("\n");
				process.exit(0);
		
			}.bind(this));

		}

	}


	this.parseCLI = function(cli,callback) {

		// split words by spaces.
		var words = cli.split(" ");

		switch (words[0]) {

			case "load":
				this.loadFile(words[1],function(){
					callback();
				});			
				break;

			case "parse":
				var re_parseclean = /^parse\s+?/;
				var mystr = cli.replace(re_parseclean,"");
				this.parseString(mystr,function(){
					callback();
				});
				break;

			case "exit":
			case "quit":
				process.exit();
				break;

			// Empty line.
			case "":
				callback();
				break;

			default:
				console.log("Unknown command:",words[0]);
				callback();
				break;

		}

	}

	this.parseString = function(instr,callback) {

		preprocessor.loadFile(instr,true,function(err){

			// Trace any preprocessor errors.
			if (err) { throw "!trace error: " + err; }

			this.compileIt(function(){
				callback();
			});
		}.bind(this));

	}

	this.loadFile = function(infile,callback) {

		preprocessor.loadFile(infile,false,function(err) {

			// Trace any preprocessor errors.
			if (err) { throw "!trace error: " + err; }
		
			this.compileIt(function(){
				callback();	
			});
			
		}.bind(this));
	
	}

	this.compileIt = function(callback) {

		parser.parSecInitialize(preprocessor.processed_file,preprocessor.stringers);

		var asm = compiler.compile_to_assembly(parser.ast);

		this.printOutput(asm);

		console.log("code:%s \n",compiler.hexoutput);

		callback();

	}

	this.printOutput = function(asm) {

		output = "";
		for (var j = 0; j < asm.length; j++) {
			output += asm[j] + " ";
		}

		// console.log("Raw ASM: %j\n\n",asm);

		console.log("Output: %s \n",output);



	}


	// Initialize our constructor.
	this.myConstructor();
	


}