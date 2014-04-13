// ------------------------------------------------------ -
//                      __   __                       
//   .-----.-----.----.|  |_|__|.--.--.--.--.--------.
//   |__ --|  -__|  __||   _|  ||  |  |  |  |        |
//   |_____|_____|____||____|__| \___/|_____|__|__|__|
// 
// ---------------------------------------------------- -
// A perl-like language for writing Ethereum contracts
// --------------------------------------------------- -


var constants = require("./library/constants.js"); 	// Constants module (w/ general configs)
var Parser = require("./library/parser.js");		// the parser
var parser = new Parser();

parser.loadFile('example.cll');

