// ----------------------------------------------------------- -
//                      __   __                       
//   .-----.-----.----.|  |_|__|.--.--.--.--.--------.
//   |__ --|  -__|  __||   _|  ||  |  |  |  |        |
//   |_____|_____|____||____|__| \___/|_____|__|__|__|
// 
// -------------------------------------------------------- -
// A perl-inspired language for writing Ethereum contracts
// ------------------------------------------------------- -


var constants = require("./library/constants.js"); 	// Constants module (w/ general configs)
var Parser = require("./library/parser.js");		// the parser
var parser = new Parser();

var Compiler = require("./library/compiler.js");		// the Compiler
var compiler = new Compiler();

var PreProcessor = require("./library/preProcessor.js");		// the Compiler
var preprocessor = new PreProcessor();



// parser.loadFile('example.cll');

preprocessor.loadFile('example.cll');

var compile_result = compiler.compile_stmt(parser.ast)



// console.log("!trace compile result! %j \n\n",compile_result);

// For some pretty output during debugging.
// var prettyjson = require('prettyjson');
// console.log(prettyjson.render(compile_result));

var asm = compiler.assemble(compile_result);

output = "";
for (var j = 0; j < asm.length; j++) {
	output += asm[j] + " ";
}

console.log("Output: %s \n\n",output);


