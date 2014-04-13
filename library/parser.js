// ---------------------------------------------------------------------- -
//                                      __   __                       
//  .-----.---.-.----.-----.-----.----.|  |_|__|.--.--.--.--.--------.
//  |  _  |  _  |   _|__ --|  -__|  __||   _|  ||  |  |  |  |        |
//  |   __|___._|__| |_____|_____|____||____|__| \___/|_____|__|__|__|
//  |__|                                                              
//
// ---------------------------------------------------------------------- -
// Parsectivum. The sectivum parser.
// Inspired by ethereum/compiler by Vitalik Buterin
// Originally compiles CLL.
// Ported and extended by Doug Smith, April 2014.
// ---------------------------------------------------------------------- -

module.exports = function() {

	// For some pretty output during debugging.
	var prettyjson = require('prettyjson');

	// Here we turn token types into an abstract syntax tree.
	var precedence = {
		'^': 1,
		'*': 2,
		'/': 3,
		'%': 4,
		'#/': 2,
		'#%': 2,
		'+': 3,
		'-': 3,
		'<': 4,
		'<=': 4,
		'>': 4,
		'>=': 4,
		'==': 5,
		'and': 6,
		'&&': 6,
		'or': 7,
		'||': 7,
	};

    // Include the filesystem module.
	this.fs = require('fs');

	// Debug for infinite loop
	this.madlimit = 0;

	// Our abstract syntax tree.
	this.ast = [];
	
	// ---------------------------------------------------------
	// -- loadFile : Load up a file for parsing.

	this.loadFile = function(filepath) {

		// Read the file into a string.
		filecontents = this.fs.readFileSync(filepath,{encoding: "ascii"});

		// console.log(filecontents);

		// Ok, rip apart the lines.
		filelines = filecontents.toString().split("\n");
		applines = [];

		for(i in filelines) {

			// Get each line.
			line = filelines[i];
			console.log(line);

			// Look for a multi-equals sign, to break chunks of code.
			pattern_equals = /\={3}/;

			if(pattern_equals.test(line)) {
				break;
			}

			// Push this line to 
			applines.push(line);

		}

		console.log(applines);

		console.log("\n\n");

		// Ok, now let's parse the lines

		
		this.ast = this.parseLines(applines);

		console.log("AST: %j", this.ast, "\n\n");

		// console.log(prettyjson.render(this.ast));

	}

	// ---------------------------------------------------------
	// -- parseLines : parse lines of loaded text.

	this.parseLines = function(lines) {

		var output = [];

		var i = 0;

		while (i < lines.length) {

			// Get the main part here.
			main = lines[i];

			// Trim it down.
			main = main.trim();

			// skip empty lines.
			if (main.length == 0) {
				i++;
				continue;
			}


			// Find out it's indent level.
			if (this.indentLevel(main) > 0) {
				throw "Indent level is wrong.";
			}

			// Grab the child block.
			start_child_block = i+1
			spacesmin = 99999999

			i++;

			while (i < lines.length) {				
				inlevel = this.indentLevel(lines[i])
				if (inlevel == 0) {
					break;
				}
				spacesmin = Math.min(inlevel,spacesmin);
				i++; 

			}

			// child_block = map(lambda x:x[spacesmin:],lns[start_child_block:i])

			sublines = lines.slice(start_child_block,i);
			child_block = sublines.map(
				function(n) {
					return n.substring(spacesmin,n.length);
				}
			);

			// console.log("child block: ", child_block);



			// Ok, so this is where you actually parse the line itself
			// !bang
			// ...important parse the line itself.
			var out = this.parseSingleLine(main);
			// console.log("!trace parse single result: ", out);

			
			// Include the child block into the parsed expression
			block_statements = ['if', 'else', 'while', 'else if','def'];

			if (block_statements.contains(out[0])) {

				if (child_block.length == 0) {
					throw "If/else/while statement must have sub-clause! " + i;
				} else {
					parseresult = this.parseLines(child_block);
					out.push(parseresult);
				}

			} else {

				if (child_block.length > 0) {
					return new Error("Not an if/else/while statement, can't have sub-clause! ", i);
				}

			}


			
			// This is somewhat complicated. Essentially, it converts something like
	        // "if c1 then s1 elif c2 then s2 elif c3 then s3 else s4" (with appropriate
	        // indenting) to [ if c1 s1 [ if c2 s2 [ if c3 s3 s4 ] ] ]
	        if (out[0] == 'else if') {
	        
	        	if (output.length == 0) {
	            	throw "Cannot start with else if!: " + i;
	            }

	            var u = output.last();

	            while (u.length == 4) {
	            	u = u.last();
	            }

	            var pushto = ['elif'];
	            var targetslices = out.slice(1,out.length);
	            for (var tsi = 0; tsi < targetslices.length; tsi++) {
	            	pushto.push(targetslices[tsi]);
	            }
	            u.push(pushto);
	            
	        } else if (out[0] == 'else') {
	        
	            if (output.length == 0) {
	            	throw "Cannot start with else!: " + i;
	            }

	            u = output.last();

	            while (u.length == 4) {
	            	u = u.last();
	            }

	            u.push(['else',out[1]]);
	            // u.push([out[1]]);

	        } else {
	            // Normal case: just add the parsed line to the output
	            output.push(out)
	        }

			/*  !bang -- this builds the nicely nested if's.
							


			        
			    
			*/

		}

		if (output.length == 1) {
			return output[0];
		} else {
			var sequencer = ['seq'];
			var outitem;
			for (outitem = 0; outitem < output.length; outitem++) {
				sequencer.push(output[outitem]);
			}
			return sequencer;
		} 

	}

	this.charType = function(mychar) {

		re_alphanum = /[a-zA-Z0-9\.]/;
		re_space = /[\s]/;
		re_brack = /[\(\)\[\]]/;
		re_dquote = /"/;
		re_squote = /'/;

		if (re_alphanum.match(mychar)) {
		    return 'alphanum';
		} else if (re_space.match(mychar)) {
			return 'space';
		} else if (re_brack.match(mychar)) {
			return 'brack';
		} else if (re_dquote.match(mychar)) {
			return 'dquote';
		} else if (re_squote.match(mychar)) {	
			return 'squote';
		} else {
			return 'symb';
		}

	}

	this.tokenize = function(line) {

		var tp = 'space';
	    var i = 0;
	    var o = [];
	    var current_token = '';

	    // This would at least try to strip out slashed comments.
	    // if line.contains('//') in line: line = line[:line.find('//')]


	    // Finish a token and start a new one
	    // def nxt():
	    // //    global current_token

	    function nxt() {

	    	if (current_token.length >= 2 && current_token.last() == '-') {

	        	token_as_array = current_token.split("");

	        	for (i in token_as_array) {
	        		mychar = token_as_array[i];
	        		o.push(mychar)
	        	}

	            o.push('-');

	        } else if (current_token.trim().length >= 1) {

	            o.push(current_token);

	        }
	        
	        current_token = '';
	    }
	    
	    // Main loop
	    
	    while (i < line.length) {

	        c = this.charType(line.charAt(i));
	        
	        // Inside a string
	        if (tp == 'squote' || tp == "dquote") {
	            if (c == tp) {
	                current_token += line.charAt(i);
	                nxt();
	                i += 1;
	                tp = 'space';
	            } else if (line.substring(i,i+2) == '\\x') {
	                current_token += parseInt(line.substring(i+2,i+4),16).toString();
	                i += 4;
	            } else if (line.substring(i,i+2) == '\\n') {
	                current_token += '\x0a';
	                i += 2;
	            } else if (line.substring(i) == '\\') {
	                current_token += line.substring(i+1);
	                i += 2;
	            } else {
	                current_token += line.substring(i)
	                i += 1;
	            }
	        // Not inside a string
	        } else {

	            if (c == 'brack' || tp == 'brack') { 
	            	nxt();
	            } else if (c == 'space') {
	            	nxt();
	            } else if (c != 'space' && tp == 'space') {
	            	nxt();
	            } else if (c == 'symb' && tp != 'symb') {
	            	nxt();
	            } else if (c == 'alphanum' && tp == 'symb') {
	            	nxt();
	            } else if (c == 'squote' || c == "dquote") {
	            	nxt();
	            }

	            current_token += line.charAt(i);
	            tp = c;
	            i++;

	        }
	        
	    }

	    nxt();

	    if ([':',':\n','\n'].contains(o.last())) {
	    	o.pop();
	    }

	    if (['squote','dquote'].contains(tp)) {
	    	throw "Unclosed string: " + line;
		}
	    
	    return o;
		

	}

	this.tokenType = function(token) {

		re_alphanum = /^[0-9a-z\-\.]*$/;

		if (token == null) { 
			return null; 

		} else if (['(','['].contains(token)) { 
			return 'lparen'; 

		} else if ([')',']'].contains(token)) { 
			return 'rparen'; 

		} else if (token == ',') { 
			return 'comma'; 

		} else if (['!'].contains(token)) { 
			return 'monop' ; 

		} else if (typeof token !== 'string') { 
			return 'compound'; 

		} else if (precedence[token]) { 
			return 'op';

		} else if (re_alphanum.match(token)) { 
			return 'alphanum'; 

		} else { 
			throw "Invalid token: "+token; 
		}

	}

	// https://en.wikipedia.org/wiki/Shunting-yard_algorithm
	this.shuntingYard = function(tokens) {

		var iq = tokens.clone(); // orig: [x for x in tokens];
		var oq = [];
		var stack = [];
		var prev = null;
		var tok = null;

		var tokentyper = this.tokenType;

		// The normal Shunting-Yard algorithm simply converts expressions into
	    // reverse polish notation. Here, we try to be slightly more ambitious
	    // and build up the AST directly on the output queue
	    // eg. say oq = [ 2, 5, 3 ] and we add "+" then "*"
	    // we get first [ 2, [ +, 5, 3 ] ] then [ *, 2, [ +, 5, 3 ] ]
	    
	    function popstack(stack,oq,parent) {

	        tok = stack.pop();
	        typ = tokentyper(tok);

	        if (typ == 'op') {

	            a = oq.pop();
	            b = oq.pop();
	            oq.push([ tok, b, a]);

	        } else if (typ == 'monop') {

	            a = oq.pop();
	            oq.push([ tok, a ]);

	        } else if (typ == 'rparen') {
	            
	            var args = [];
	            
	            while(parent.tokenType(oq.last()) != 'lparen') {
	            	args.unshift(oq.pop());
	            }

	            oq.pop();
	            
	            if (tok == ']') {

					var pusher = ['access'];
					for (var a = 0; a < args.length; a++) {
						pusher.push(args[a]);
					}

					oq.push(pusher);

	            } else if (tok == ')' && args.length > 0 && args[0] != 'id') {
	            	var pusher = ['fun'];
	            	for (var a = 0; a < args.length; a++) {
	            		pusher.push(args[a]);
	            	}
	            	
	                oq.push(pusher);

	            } else {
	                oq.push(args[1]);
	            }

	        }

	    }


	    // The main loop
	    while (iq.length > 0) {

	    	// This is -really- handy btw.
	    	// console.log("!trace inqueue destack while: ", stack, iq, oq);

	        prev = tok;
	        tok = iq.shift();
	        typ = this.tokenType(tok);

	        if (typ == 'alphanum') {
	            oq.push(tok);

	        } else if (typ == 'lparen') {
	            
	            if (this.tokenType(prev) != 'alphanum') { 
	            	oq.push('id');
	            }

	            stack.push(oq.pop());
	            oq.push(tok);
	            oq.push(stack.pop());
	            stack.push(tok);

	        } else if (typ == 'rparen') {

	        	while (stack.length && this.tokenType(stack.last()) != 'lparen') {
	        		popstack(stack,oq,this);
	            }

	            if (stack.length) {
	                stack.pop();
	            }

	            stack.push(tok);
	            popstack(stack,oq,this);

	        } else if (typ == 'monop' || typ == 'op') {

	            if (tok == '-' && ![ 'alphanum', 'rparen' ].contains(this.tokenType(prev))) {
	                oq.push('0');
	            }

	            prec = precedence[tok];

	            while (stack.length && this.tokenType(stack.last()) == 'op' && precedence[stack.last()] < prec) {
	            	popstack(stack,oq,this);
	            }

	            stack.push(tok);

	        } else if (typ == 'comma') {

	            while (stack.length && stack.last() != 'lparen') {
	            	popstack(stack,oq,this);
	            }

		    }

	        // print 'iq',iq,'stack',stack,'oq',oq
		}

	    while (stack.length) {
	        popstack(stack,oq,this);
	    }

	    if (oq.length == 1) {
	        return oq[0];
	    } else {
	        return [ 'multi', oq ];
	    }

	}

	this.parseSingleLine = function(line) {

		re_function = /^\s*[^\s]+\(.*\)$/;

		tokens = this.tokenize(line.trim());
		
		if (tokens[0] == 'if' || tokens[0] == 'while' || tokens[0] == 'def') {
	        return [ tokens[0], this.shuntingYard(tokens.slice(1,tokens.length)) ];

	    } else if (tokens.length >= 2 && tokens[0] == 'else' && tokens[1] == 'if') {
	        return [ 'else if', this.shuntingYard(tokens.slice(2,tokens.length)) ];

	    } else if (tokens.length >= 1 && tokens[0] == 'elif') {
	        return [ 'else if', this.shuntingYard(tokens.slice(1,tokens.length)) ];

	    } else if (tokens.length == 1 && tokens[0] == 'else') {
	        return [ 'else' ];

	    } else if (tokens[0] == "return") {
	        return [ 'return', this.shuntingYard(tokens.slice(1,tokens.length)) ]

	    } else if (['mktx','suicide','stop'].contains(tokens[0])) {
	        return this.shuntingYard(tokens);

	    } else if (re_function.match(line)) {
	        // Thats a bare function call.
	        return this.shuntingYard(tokens);

	    } else {

	        eqplace = tokens.indexOf('=');
	        pre = 0;
	        i = 0;

	        while (i < eqplace) {

	        	commaidx = tokens.slice(i,tokens.length).indexOf(',');
	        	
	        	if (commaidx > -1) {
	        		nextcomma = i + commaidx;
	        	} else {
	        		nextcomma = eqplace;
	        	}

	            pre += 1;
	            i = nextcomma + 1;
	        }

	        if (pre == 1) {
				return [ 'set', this.shuntingYard(tokens.slice(0,eqplace)), this.shuntingYard(tokens.slice(eqplace+1,tokens.length))];
	        } else {
	            return [ 'mset', this.shuntingYard(tokens.slice(0,eqplace)), this.shuntingYard(tokens.slice(eqplace+1,tokens.length)) ];
	        }

		}


	}

	this.indentLevel = function(line) {

		spaces = 0;
		while (spaces < line.length && line.charAt(spaces) == ' ') {
			spaces++;
		}
		// console.log("indent level check: " + spaces);
		return spaces;

	}

}