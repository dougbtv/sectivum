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


parser.loadFile('example.cll');

compile_result = compiler.compile_stmt(parser.ast)

console.log("!trace compile result! %j \n\n",compile_result);

// For some pretty output during debugging.
// var prettyjson = require('prettyjson');
// console.log(prettyjson.render(compile_result));

throw "!trace good work. next is assemble";

compiler.assemble(compile_result);
