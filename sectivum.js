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

// console.log("!trace compile result! %j \n\n",compile_result);

// For some pretty output during debugging.
// var prettyjson = require('prettyjson');
// console.log(prettyjson.render(compile_result));

// Restify object, for making RESTful APIs
var restify = require('restify');
var RestServer = require('./library/server.js');

var server = restify.createServer();
server.use(restify.bodyParser());

var restserver = new RestServer(server,constants);

var CLI = require('./library/CLI.js');
var cli = new CLI(parser,compiler,preprocessor,restserver,constants);