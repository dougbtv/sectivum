// COMPILER.

module.exports = function() {


	var optable = { 
	    '+': 'ADD',
	    '-': 'SUB',
	    '*': 'MUL',
	    '/': 'DIV',
	    '^': 'EXP',
	    '%': 'MOD',
	    '#/': 'SDIV',
	    '#%': 'SMOD',
	    '==': 'EQ',
	    '<=': 'LE',
	    '>=': 'GE',
	    '<': 'LT',
	    '>': 'GT'
	};

	var funtable = {
	    'sha256': ['SHA256', 3],
	    'sha3': ['SHA3', 3],
	    'ripemd160': ['RIPEMD160', 3],
	    'ecsign': ['ECSIGN', 2],
	    'ecrecover': ['ECRECOVER', 4],
	    'ecvalid': ['ECVALID', 2],
	    'ecadd': ['ECADD', 4],
	    'ecmul': ['ECMUL', 3],
	};

	var pseudovars = {
	    'tx.datan': 'TXDATAN',
	    'tx.sender': 'TXSENDER',
	    'tx.value': 'TXVALUE',
	    'block.timestamp': 'BLK_TIMESTAMP',
	    'block.number': 'BLK_NUMBER',
	    'block.basefee': 'BASEFEE',
	    'block.difficulty': 'BLK_DIFFICULTY',
	    'block.coinbase': 'BLK_COINBASE',
	    'block.parenthash': 'BLK_PREVHASH'
	};

	var pseudoarrays = {
	    'tx.data': 'TXDATA',
	    'contract.storage': 'SLOAD',
	    'block.address_balance': 'BALANCE',
	};

	// Our collection of properties which are used within multiple methods.
	// varhash : a description of the variables which have been indexed
	// functionhash : all known code-defined functions
	// endifmarker : notes the points at ends of if statements
	// endifknown : remembers if knows an end if marker within a particular block

	this.varhash = {};
	this.functionhash = {};
	this.labelcollection = [0];
	this.endifmarker = [0];
	this.endifknown = [0];

	this.assemble = function(compiled) {

		console.log("!trace I got compiled: %j \n\n", compiled);

		var iq = compiled.clone();
		var mq = [];
		var pos = 0;
		var labelmap = {};

		while (iq.length) {
			
			var front = iq.shift();

			if (typeof front === 'string' && front.substring(0,6) == 'LABEL_') {
				labelmap[front.substring(6,front.length)] = pos;
			} else {

				mq.push(front);

				if (typeof front === 'string' && front.substring(0,4) == 'REF_') {
					pos += 2;
				} else {
					pos += 1;
				}
			}
		}

		var oq = [];
		for (m in mq) {

			if (typeof m === 'string' && m.substring(0,4) == 'REF_') {
		    
		        oq.push('PUSH');
		        oq.push(labelmap[m.substring(4,m.length)]);
		    
		    } else {
		    	oq.push(m);
		    }

		}
		return oq;


	}

	this.get_left_expr_type = function(expr) {

		if (typeof expr === 'string') {
			return 'variable';
	    } else if (expr[0] == 'access' && expr[1] == 'contract.storage') {
	        return 'storage';
	    } else {
	        return 'access';
	    }

	}

	// Right-hand-side expressions (ie. the normal kind)
	this.compile_expr = function(expr) {

		if (typeof expr === 'string') {
	    
	    	re_expr = /^[0-9\-]*$/;
	    	re_ref = /^REF_/;
	        if (re_expr.match(expr)) {
	            return ['PUSH',parseInt(expr)];
	        
	        } else if (re_ref.match(expr)) {
	            return [expr];
	        
	        } else if (this.varhash.isset(expr)) {
	            return ['PUSH',this.varhash[expr],'MLOAD'];
	        
	        } else if (pseudovars[expr]) {
	            return [pseudovars[expr]];
	        
	        } else {
				var hashlen = this.varhash.hashlength();
	            this.varhash[expr] = hashlen;
	            return ['PUSH',this.varhash[expr],'MLOAD'];
	        }
	    
	    } else if (optable[expr[0]]) {
	    
	        if (expr.length != 3) {
	            throw "Wrong number of arguments: " + expr;
	        }

	        var f = this.compile_expr(expr[1]);
	        var g = this.compile_expr(expr[2]);

	        return g.concat(f,[optable[expr[0]]]);
	    
	    } else if (expr[0] == 'fun' && expr[1] in funtable) {
	    
	        if (expr.length != funtable[expr[1]][1] + 2) {
	            throw "Wrong number of arguments: " + expr;
	        }

	        var sum = 0;
	        // exprslice = expr[];

	        // !bang : I don't like this.
	        console.log("!bang !trace : sum situation. FIX THIS");


	        var f = null; // sum([this.compile_expr(e,this.varhash) for e in expr[2:]],[])

	        // refernce: var f = sum([this.compile_expr(e,this.varhash) for e in expr[2:]],[])

	        return f + [funtable[expr[1]][0]]
	    
	    } else if (expr[0] == 'access') {
	    
	        if (expr[1][0] == 'block.contract_storage') {
	        	return compile_expr(expr[2]).concat(compile_expr(expr[1][1]),['EXTRO']);
	        
	        } else if (expr[1] in pseudoarrays) {
	        	return compile_expr(expr[2]).concat([pseudoarrays[expr[1]]]);
	        
	        } else {
	        	return compile_left_expr(expr[1]).concat(compile_expr(expr[2]),['ADD','MLOAD']);

	        }
	    
	    } else if (expr[0] == 'fun' && expr[1] == 'array') {
	    
	    	// !bang wtf is this anyways.... looks like an unfinished idea, it's static.

	        return [ 'PUSH', 0, 'PUSH', 1, 'SUB', 'MLOAD', 'PUSH',
	                         2, 'PUSH', 160, 'EXP', 'ADD', 'DUP',
	                         'PUSH', 0, 'PUSH', 1, 'SUB', 'MSTORE' ];
	    
	    } else if (expr[0] == 'fun') {
	    
	        // That's a custom function.
	        if (!functionhash[expr[1]]) {
	            throw "function not defined: "+expr[1];
	        }

	        // Setup our return point.
	        label = 'LABEL_' + this.labelcollection[0];
	        ref = 'REF_' + this.labelcollection[0];
	        this.labelcollection[0] += 1;

	        // Save that in the variable reserved for this function.
	        var stmt_setfuncreturnvar = ['set',expr[1] + "_returnpoint",ref];
	        var stmt_functionreturn = this.compile_stmt(stmt_setfuncreturnvar);
	        
	        // Set each variable which represents a parameter for the function.
	        var params = []
	        var paramidx = -1
	        
	        slicexpr = expr.slice(2,expr.length);
	        for (var expridx = 0; expridx < slicexpr.length; expridx++) { // for ex in expr[2:]:

	        	var ex = slicexpr[expridx];
	        	
	            paramidx += 1;

	            var setparamstmt = ['set',functionhash[expr[1]]['params'][paramidx],ex];

	            // reference: for part in this.compile_stmt(setparamstmt,functionhash,lc): params.append(part)
	            var parts = this.compile_stmt(setparamstmt);
	            for (var partidx = 0; partidx < parts.length; partidx++) {
	            	params.push(parts[partidx]);
	            }

	            
	        }
	        
	        // Steps: Set function return variable, Set parameters, Go to the function, Set the label
	        return stmt_functionreturn.concat(params,[ functionhash[expr[1]]['funcref'], 'JMP' ],[ label ]);
	    
	    } else if (expr[0] == '!') {
	    
	        var f = this.compile_expr(expr[1]);
	        return f.concat(['NOT']);
	    
	    } else if (expr[0] in pseudoarrays) {
	    
	    	return this.compile_expr(expr[1]).concat(pseudoarrays[expr[0]]);
	    
	    } else if (expr[0] in ['or', '||']) {
	    
	    	// !untested
	        return this.compile_expr(['!', [ '*', ['!', expr[1] ], ['!', expr[2] ] ] ]);
	    
	    } else if (expr[0] in ['and', '&&']) {
	    
	    	// !untested
	        return this.compile_expr(['!', [ '+', ['!', expr[1] ], ['!', expr[2] ] ] ]);
	    
	    } else if (expr[0] == 'multi') {
	    
	    	console.log("!bang !trace : sum situation. FIX THIS");
	        return null; // sum([compile_expr(e,this.varhash) for e in expr[1:]],[])
	    
	    } else if (expr == 'tx.datan') {
	    
	        return ['DATAN'];
	    
	    } else {
	    
	        throw "invalid op: " +expr[0];
	    
	    }

	}


	this.compile_left_expr = function(expr) {

		typ = this.get_left_expr_type(expr);

	    if (typ == 'variable') {
	    
	    	var re_expr = /^[0-9\-]*$/;
	        if (re_expr.match(expr)) {
	            throw "Can't set the value of a number! "+expr;

	        } else if (this.varhash.isset(expr)) {

	        	return ['PUSH',this.varhash[expr]];
	        
	        } else {
	        
	        	this.varhash[expr] = this.varhash.hashlength();
	        	return ['PUSH',this.varhash[expr]];

	        }
	    
	    } else if (typ == 'storage') {
	    
	        return this.compile_expr(expr[2]);
	    
	    } else if (typ == 'access') {
	    
	        if (this.get_left_expr_type(expr[1]) == 'storage') {
	        	return this.compile_left_expr(expr[1]).concat(['SLOAD'],this.compile_expr(expr[2]));
	        } else {
	        	return this.compile_left_expr(expr[1]).concat(this.compile_expr(expr[2]),['ADD']);
	        }
	    
	    } else {
	        throw "invalid op: " + expr[0];
	    }

	}

	this.compile_stmt = function(stmt) {

		/* !trace

			// handy ole debug methods.
			console.log("stmt: %j ", stmt);
			console.log("this.varhash: %j ", this.varhash);
			console.log("functionhash: %j ", functionhash);
			console.log("lc: %j ", lc);
			console.log("this.endifmarker: %j ", this.endifmarker);
			console.log("this.endifknown: %j ", this.endifknown);
			console.log("statement! %j", stmt);
		*/
		

		if (['if', 'elif', 'else'].contains(stmt[0])) {

	        // Typically we use the second index, which is the condition for the if
	        var stmtindex = 2;
	        // However, with else, our condition isn't explicit.
	        
	        if (stmt[0] == "else") {

	        	// So we use a previous index in this statement
	            stmtindex = 1;
	            // Set that we know the endif exists, at this label.
	            this.endifmarker[0] = this.labelcollection[0];
	            this.endifknown[0] = 1;

	        } else {

	            // Additionally we compile expressions only for conditionals.
	            var f = this.compile_expr(stmt[1]);
	        }

	        var g = this.compile_stmt(stmt[stmtindex]);
	        
	        var h;

	        if (stmt.length > 3) {
	        	h = this.compile_stmt(stmt[3]);
	        } else {
	        	h = null;
	        }

	        var label = 'LABEL_' + this.labelcollection[0]; 
	        var ref = 'REF_' + this.labelcollection[0];
	        
	        // We hold the lc's place, as if the end if location is unknown this "could be end if"
	        var couldbeendif = this.labelcollection[0];
	        this.labelcollection[0] += 1;

	        if (stmt[0] == "else") {
	        	
	        	return g.concat([label]);

	        } else {
	            
	            if (!this.endifknown[0]) {
	                // If our endif is unknown, we mark it here
	                this.endifmarker[0] = couldbeendif;
	                this.endifknown[0] = 1;
	            }

	            // An if denotes the beginning of a if/elif/else block, reset our known endif
	        	if (stmt[0] == "if") { 
	        		this.endifknown[0] = 0; 
	        	}

	            if (h) {
	            	return f.concat( [ 'NOT', ref, 'SWAP', 'JMPI' ] , g , [ 'REF_' + this.endifmarker[0], 'JMP' ] , [ label ] , h );
	            } else {
	            	return f.concat( [ 'NOT', ref, 'SWAP', 'JMPI' ] , g , [ label ] );
	        	}

	        }
	    

	    } else if (stmt[0] == "def") {

	        // create the reference and label.
	        var label = 'LABEL_' + this.labelcollection[0]; 
		    var ref = 'REF_'+this.labelcollection[0];

	        // increment it.
	        this.labelcollection[0] += 1;
	        
	        // hey, we're going to need a label INSIDE, so we can access this.
	        var insidelabel = 'LABEL_' + this.labelcollection[0]; 
		    var insideref = 'REF_'+this.labelcollection[0];

	        this.labelcollection[0] += 1;

	        // Compile our sequence inside the function.
	        f = this.compile_stmt(stmt[2]);
	        
	        // put together the metadata about the function in the functionhash.
	        funcname = stmt[1][1];
	        
	        functionhash[funcname] = {};
	        functionhash[funcname]['params'] = [];
	        functionhash[funcname]['funcref'] = insideref;
	        
	        // - one of which is: where do we go at the end, we return to whence we came.
	        this.varhash[funcname + '_returnpoint'] = this.varhash.hashlength();

	        // - and we add each parameter to the this.varhash (if unknown, typically they're known as they're used in the function block)
	        var stmtslice = stmt[1].slice(2,stmt.length);

	        for (var sliceidx = 0; sliceidx < stmtslice.length; slice++) {

	        	var param = stmtslice[sliceidx];

	            if (!this.varhash[param]) { // param not in this.varhash:
	                this.varhash[param] = this.varhash.hashlength();
	            }

	            functionhash[funcname]['params'].push(param);
	        }
	        
	        return [ ref, 'JMP', insidelabel ].concat(f , [ 'PUSH', this.varhash[funcname + '_returnpoint'], 'MLOAD', 'JMP'] , [ label ] );

	    } else if (stmt[0] == 'while') {

	        var f = this.compile_expr(stmt[1]);
	        var g = this.compile_stmt(stmt[2]);

	        beglab = 'LABEL_' + this.labelcollection[0];
	        begref = 'REF_' + this.labelcollection[0];

	        endlab = 'LABEL_' + (this.labelcollection[0]+1);
	        endref = 'REF_' + (this.labelcollection[0]+1);

	        this.labelcollection[0] += 2;

	        return [ beglab ].concat(f , [ 'NOT', endref, 'SWAP', 'JMPI' ] , g , [ begref, 'JMP', endlab ] );

	    } else if (stmt[0] == 'set') {

	    	var lexp = this.compile_left_expr(stmt[1]);
	        var rexp = this.compile_expr(stmt[2]);
	        var lt = this.get_left_expr_type(stmt[1]);

	        var verb = 'MSTORE';
	        if (lt == 'storage') {
	        	verb = 'SSTORE';
	        }

	        // !fix1
	        return rexp.concat(lexp,verb);

	    } else if (stmt[0] == 'mset') {

	        rexp = this.compile_expr(stmt[2]);
	        
	        // based on: exprstates = [get_left_expr_type(e) for e in stmt[1][1:]];
	        var stmtslice = stmt[1].slice(1,stmt.length); // [1:]]
	        var exprstates = [];
	        for (var stmtindex = 0; stmtindex < stmtslice.length; stmtindex++) {
	        	var e = stmtslice[stmtindex];
	        	exprstates.push(e);
	        }

	        var o = rexp;

	        var stmtslice = stmt[1].slice(1,stmt.length); // [1:]]

			for (var stmtindex = 0; stmtindex < stmtslice.length; stmtindex++) {
				var e = stmtslice[stmtindex];

				o.concat(this.compile_left_expr(e));

	            var verb = 'SSTORE';
	            if (this.get_left_expr_type(e) == 'storage') {
	            	verb = 'MSTORE';
	            };

	            o.concat([verb]);

	        }

	        return o;

	    } else if (stmt[0] == 'seq') {

	        var o = [];

	        var stmtslice = stmt.slice(1,stmt.length);

			for (var stmtindex = 0; stmtindex < stmtslice.length; stmtindex++) {
				
				var s = stmtslice[stmtindex];
	        	var slicecompiled = this.compile_stmt(s);
	        	o = o.concat(slicecompiled);

	        }

	        return o;

	    } else if (stmt[0] == 'fun' && stmt[1] == 'mktx') {
	        
	        var to = this.compile_expr(stmt[2]);
	        var value = this.compile_expr(stmt[3]);
	        var datan = this.compile_expr(stmt[4]);
	        var datastart = this.compile_expr(stmt[5]);

	        return datastart.concat(datan,value,to,[ 'MKTX' ]);

	    } else if (stmt[0] == 'fun' &&  functionhash.isset(stmt[1])) {

	        // It's a bare function. Which looks like a statement, compile it as an expression.
	        return this.compile_expr(stmt);

	    } else if (stmt == 'stop') {
	        
	        return [ 'STOP' ];

	    } else if (stmt[0] == 'fun' && stmt[1] == 'suicide') {

	    	return this.compile_expr(stmt[2]).concat([ 'SUICIDE' ]);

	    } else if (stmt[0] == 'return') {

	    	return this.compile_expr(stmt[1]);
	    }

	}

	// cllcompiler.compile_stmt(ast)

	/*

	*/



}
