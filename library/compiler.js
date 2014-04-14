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
	this.compile_expr = function(expr,varhash,functionhash,lc) {

		if(typeof(varhash)===	'undefined')	varhash = {};
		if(typeof(functionhash)==='undefined') 	functionhash = {};
		if(typeof(lc)==='undefined') 			lc = [0];
		
		// def compile_expr(expr,varhash,functionhash={},lc=[0]):
		// !banger
		if (typeof expr === 'string') {
	    
	    	// !bang warning: general array in this area.

	    	re_expr = /^[0-9\-]*$/;
	    	re_ref = /^REF_/;
	        if (re_expr.match(expr)) {
	            return ['PUSH',parseInt(expr)];
	        
	        } else if (re_ref.match(expr)) {
	            return [expr];
	        
	        } else if (expr in varhash) {
	            return ['PUSH',varhash[expr],'MLOAD'];
	        
	        } else if (pseudovars[expr]) {
	            return [pseudovars[expr]];
	        
	        } else {
	            varhash[expr] = varhash.length;
	            return ['PUSH',varhash[expr],'MLOAD'];
	        }
	    
	    } else if (optable[expr[0]]) {
	    
	        if (expr.length != 3) {
	            throw "Wrong number of arguments: " + expr;
	        }

	        var f = this.compile_expr(expr[1],varhash);
	        var g = this.compile_expr(expr[2],varhash);

	        // !bang warning: array addition
	        return g + f + [optable[expr[0]]];
	    
	    } else if (expr[0] == 'fun' && expr[1] in funtable) {
	    
	        if (expr.length != funtable[expr[1]][1] + 2) {
	            throw "Wrong number of arguments: " + expr;
	        }

	        var sum = 0;
	        // exprslice = expr[];

	        // !bang : I don't like this.
	        console.log("!bang !trace : sum situation. FIX THIS");


	        var f = null; // sum([this.compile_expr(e,varhash) for e in expr[2:]],[])

	        // refernce: var f = sum([this.compile_expr(e,varhash) for e in expr[2:]],[])

	        return f + [funtable[expr[1]][0]]
	    
	    } else if (expr[0] == 'access') {
	    
	        if (expr[1][0] == 'block.contract_storage') {
	        	// !bang warning: array addition
			    return compile_expr(expr[2],varhash) + compile_expr(expr[1][1],varhash) + ['EXTRO'];
	        
	        } else if (expr[1] in pseudoarrays) {
	        	// !bang warning: array addition
	            return compile_expr(expr[2],varhash) + [pseudoarrays[expr[1]]];
	        
	        } else {
	        	// !bang warning: array addition
	            return compile_left_expr(expr[1],varhash) + compile_expr(expr[2],varhash) + ['ADD','MLOAD'];

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
	        label = 'LABEL_' + lc[0];
	        ref = 'REF_' + lc[0];
	        lc[0] += 1;

	        // Save that in the variable reserved for this function.
	        var stmt_setfuncreturnvar = ['set',expr[1] + "_returnpoint",ref];
	        var stmt_functionreturn = this.compile_stmt(stmt_setfuncreturnvar,varhash,functionhash,lc);
	        
	        // Set each variable which represents a parameter for the function.
	        var params = []
	        var paramidx = -1
	        
	        slicexpr = expr.slice(2,expr.length);
	        for (var expridx = 0; expridx < slicexpr.length; expridx++) { // for ex in expr[2:]:

	        	var ex = slicexpr[expridx];
	        	
	            paramidx += 1;

	            var setparamstmt = ['set',functionhash[expr[1]]['params'][paramidx],ex];

	            // reference: for part in this.compile_stmt(setparamstmt,varhash,functionhash,lc): params.append(part)
	            var parts = this.compile_stmt(setparamstmt,varhash,functionhash,lc);
	            for (var partidx = 0; partidx < parts.length; partidx++) {
	            	params.push(parts[partidx]);
	            }

	            
	        }
	        
	        // Steps: Set function return variable, Set parameters, Go to the function, Set the label
	        // !bang warning: array addition
	        return stmt_functionreturn + params + [ functionhash[expr[1]]['funcref'], 'JMP' ] + [ label ];
	    
	    } else if (expr[0] == '!') {
	    
	        var f = this.compile_expr(expr[1],varhash);
	        // !bang warning: array addition
	        // !fix1
	        return f.push('NOT');
	    
	    } else if (expr[0] in pseudoarrays) {
	    
	    	// !bang warning: array addition
	        return this.compile_expr(expr[1],varhash) + pseudoarrays[expr[0]];
	    
	    } else if (expr[0] in ['or', '||']) {
	    
	    	// !bang warning... maybe not a warning.
	        return this.compile_expr(['!', [ '*', ['!', expr[1] ], ['!', expr[2] ] ] ],varhash);
	    
	    } else if (expr[0] in ['and', '&&']) {
	    
	    	// !bang ... maybe not a warning.
	        return this.compile_expr(['!', [ '+', ['!', expr[1] ], ['!', expr[2] ] ] ],varhash);
	    
	    } else if (expr[0] == 'multi') {
	    
	    	console.log("!bang !trace : sum situation. FIX THIS");
	        return null; // sum([compile_expr(e,varhash) for e in expr[1:]],[])
	    
	    } else if (expr == 'tx.datan') {
	    
	        return ['DATAN'];
	    
	    } else {
	    
	        throw "invalid op: " +expr[0];
	    
	    }

	}


	this.compile_left_expr = function(expr,varhash) {

		// def compile_left_expr(expr,varhash):
	    typ = this.get_left_expr_type(expr);

	    if (typ == 'variable') {
	    
	    	var re_expr = /^[0-9\-]*$/;
	        if (re_expr.match(expr)) {
	            throw "Can't set the value of a number! "+expr;
	        } else if (varhash[expr]) {

	        	// !bang warning: general array warning
	            return ['PUSH',varhash[expr]];
	        
	        } else {
	        
	            varhash[expr] = varhash.length;
	            return ['PUSH',varhash[expr]];
	        
	        }
	    
	    } else if (typ == 'storage') {
	    
	        return this.compile_expr(expr[2],varhash);
	    
	    } else if (typ == 'access') {
	    
	        if (this.get_left_expr_type(expr[1]) == 'storage') {
	        	// !bang warning: array addition
	            return this.compile_left_expr(expr[1],varhash) + ['SLOAD'] + this.compile_expr(expr[2],varhash);
	        } else {
	        	// !bang warning: array addition
	            return this.compile_left_expr(expr[1],varhash) + this.compile_expr(expr[2],varhash) + ['ADD'];
	        }
	    
	    } else {
	        throw "invalid op: " + expr[0];
	    }

	}

	this.compile_stmt = function(stmt,varhash,functionhash,lc,endifmarker,endifknown) {

		// Setup default parameters.
		if(typeof(varhash)===	'undefined')	varhash = {};
		if(typeof(functionhash)==='undefined') 	functionhash = {};
		if(typeof(lc)==='undefined') 			lc = [0];
		if(typeof(endifmarker)==='undefined')	endifmarker = [0];
		if(typeof(endifknown)==='undefined') 	endifknown = [0];
		
		console.log("stmt: %j ", stmt);
		console.log("varhash: %j ", varhash);
		console.log("functionhash: %j ", functionhash);
		console.log("lc: %j ", lc);
		console.log("endifmarker: %j ", endifmarker);
		console.log("endifknown: %j ", endifknown);

		console.log("statement! %j", stmt);
		
		// throw "!trace death";



		// def compile_stmt(stmt,varhash={},functionhash={},lc=[0],endifmarker=[0],endifknown=[0]):
	    if (['if', 'elif', 'else'].contains(stmt[0])) {

	        // Typically we use the second index, which is the condition for the if
	        var stmtindex = 2;
	        // However, with else, our condition isn't explicit.
	        if (stmt[0] == "else") {

	            // So we use a previous index in this statement
	            stmtindex = 1;
	            // Set that we know the endif exists, at this label.
	            endifmarker[0] = lc[0];
	            endifknown[0] = 1;

	        } else {

	            // Additionally we compile expressions only for conditionals.
	            var f = this.compile_expr(stmt[1],varhash,functionhash,lc);
		        var g = this.compile_stmt(stmt[stmtindex],varhash,functionhash,lc,endifmarker,endifknown);
		        
		        var h;

		        if (stmt.length > 3) {
		        	h = this.compile_stmt(stmt[3],varhash,functionhash,lc,endifmarker,endifknown)
		        } else {
		        	h = null;
		        }

		        var label = 'LABEL_' + lc[0]; 
		        var ref = 'REF_'+lc[0];
		        
		        // We hold the lc's place, as if the end if location is unknown this "could be end if"
		        var couldbeendif = lc[0];
		        lc[0] += 1;

		        if (stmt[0] == "else") {
		        	// !bang warning: array addition.
		        	return g + [ label ];
		        } else {
		            
		            if (!endifknown[0]) {
		                // If our endif is unknown, we mark it here
		                endifmarker[0] = couldbeendif;
		                endifknown[0] = 1;
		            }

		            // An if denotes the beginning of a if/elif/else block, reset our known endif
		        	if (stmt[0] == "if") { 
		        		endifknown[0] = 0; 
		        	}

		            if (h) {
		            	// !bang warning: array addition.
		            	return f + [ 'NOT', ref, 'SWAP', 'JMPI' ] + g + [ 'REF_' + endifmarker[0], 'JMP' ] + [ label ] + h
		            } else {
		            	// !bang warning: array addition.
		            	return f + [ 'NOT', ref, 'SWAP', 'JMPI' ] + g + [ label ]
		        	}

		        }
		    }

	    } else if (stmt[0] == "def") {

	        // create the reference and label.
	        var label = 'LABEL_' + lc[0]; 
		    var ref = 'REF_'+lc[0];

	        // increment it.
	        lc[0] += 1;
	        
	        // hey, we're going to need a label INSIDE, so we can access this.
	        var insidelabel = 'LABEL_' + lc[0]; 
		    var insideref = 'REF_'+lc[0];

	        lc[0] += 1;

	        // Compile our sequence inside the function.
	        f = this.compile_stmt(stmt[2],varhash,functionhash,lc);
	        
	        // put together the metadata about the function in the functionhash.
	        funcname = stmt[1][1];
	        
	        functionhash[funcname] = {};
	        functionhash[funcname]['params'] = [];
	        functionhash[funcname]['funcref'] = insideref;
	        
	        // - one of which is: where do we go at the end, we return to whence we came.
	        varhash[funcname + '_returnpoint'] = varhash.length;

	        // - and we add each parameter to the varhash (if unknown, typically they're known as they're used in the function block)
	        var stmtslice = stmt[1].slice(2,stmt.length);

	        for (var sliceidx = 0; sliceidx < stmtslice.length; slice++) {

	        	var param = stmtslice[sliceidx];

	            if (!varhash[param]) { // param not in varhash:
	                varhash[param] = varhash.length;
	            }

	            functionhash[funcname]['params'].push(param);
	        }
	        
	        // !bang warning: array addition.
	        return [ ref, 'JMP', insidelabel ] + f + [ 'PUSH', varhash[funcname + '_returnpoint'], 'MLOAD', 'JMP'] + [ label ];

	    } else if (stmt[0] == 'while') {

	        var f = this.compile_expr(stmt[1],varhash,functionhash,lc);
	        var g = this.compile_stmt(stmt[2],varhash,functionhash,lc);

	        beglab = 'LABEL_' + lc[0];
	        begref = 'REF_' + lc[0];

	        endlab = 'LABEL_' + (lc[0]+1);
	        endref = 'REF_' + (lc[0]+1);

	        lc[0] += 2;

	        // !bang warning: array addition.
	        return [ beglab ] + f + [ 'NOT', endref, 'SWAP', 'JMPI' ] + g + [ begref, 'JMP', endlab ];

	    } else if (stmt[0] == 'set') {

	        var lexp = this.compile_left_expr(stmt[1],varhash);
	        var rexp = this.compile_expr(stmt[2],varhash,functionhash,lc);
	        var lt = this.get_left_expr_type(stmt[1]);

	        // !bang warning: array addition.
	        var verb = 'MSTORE';
	        if (lt == 'storage') {
	        	verb = 'SSTORE';
	        }

	        return rexp + lexp + [verb];

	    } else if (stmt[0] == 'mset') {

	        rexp = this.compile_expr(stmt[2],varhash,functionhash,lc);
	        
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

				// !bang warning: array addition.
		        // for (e in stmt[1][1:]) {
	            //   o += this.compile_left_expr(e,varhash)
	            //   o += [ 'SSTORE' if get_left_expr_type(e) == 'storage' else 'MSTORE' ]

	            o.push(this.compile_left_expr(e,varhash));

	            var verb = 'SSTORE';
	            if (this.get_left_expr_type(e) == 'storage') {
	            	verb = 'MSTORE';
	            };

	            o.push(verb);

	        }

	        return o;

	    } else if (stmt[0] == 'seq') {

	        var o = [];

	        var stmtslice = stmt.slice(1,stmt.length);

			for (var stmtindex = 0; stmtindex < stmtslice.length; stmtindex++) {
	        	// for s in stmt[1:]:
	        	// !bang warning: array addition.
	        	var s = stmtslice[stmtindex];
	            o.push(this.compile_stmt(s,varhash,functionhash,lc));
	        }

	        return o;

	    } else if (stmt[0] == 'fun' && stmt[1] == 'mktx') {
	        
	        var to = this.compile_expr(stmt[2],varhash,functionhash,lc);
	        var value = this.compile_expr(stmt[3],varhash,functionhash,lc);
	        var datan = this.compile_expr(stmt[4],varhash,functionhash,lc);
	        var datastart = this.compile_expr(stmt[5],varhash,functionhash,lc);

	        // !bang warning: array addition.
	        return datastart + datan + value + to + [ 'MKTX' ];

	    } else if (stmt[0] == 'fun' && stmt[1] in functionhash) {

	        // It's a bare function. Which looks like a statement, compile it as an expression.
	        return this.compile_expr(stmt,varhash,functionhash,lc);

	    } else if (stmt == 'stop') {
	        
	        // !bang warning: array addition.
	        return [ 'STOP' ];

	    } else if (stmt[0] == 'fun' && stmt[1] == 'suicide') {

	    	// !bang warning: array addition.
	        return this.compile_expr(stmt[2]) + [ 'SUICIDE' ];

	    } else if (stmt[0] == 'return') {

	    	// !bang warning: array addition.
	        return this.compile_expr(stmt[1],varhash,functionhash,lc);
	    }

	}

	// cllcompiler.compile_stmt(ast)

	/*

	*/



}

/*

#!/usr/bin/python
import re, sys, os
from cllparser import *

optable = { 
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
}

funtable = {
    'sha256': ['SHA256', 3],
    'sha3': ['SHA3', 3],
    'ripemd160': ['RIPEMD160', 3],
    'ecsign': ['ECSIGN', 2],
    'ecrecover': ['ECRECOVER', 4],
    'ecvalid': ['ECVALID', 2],
    'ecadd': ['ECADD', 4],
    'ecmul': ['ECMUL', 3],
}

pseudovars = {
    'tx.datan': 'TXDATAN',
    'tx.sender': 'TXSENDER',
    'tx.value': 'TXVALUE',
    'block.timestamp': 'BLK_TIMESTAMP',
    'block.number': 'BLK_NUMBER',
    'block.basefee': 'BASEFEE',
    'block.difficulty': 'BLK_DIFFICULTY',
    'block.coinbase': 'BLK_COINBASE',
    'block.parenthash': 'BLK_PREVHASH'
}

pseudoarrays = {
    'tx.data': 'TXDATA',
    'contract.storage': 'SLOAD',
    'block.address_balance': 'BALANCE',
}

// Left-expressions can either be:
// * variables
// * A[B] where A is a left-expr and B is a right-expr
// * contract.storage[B] where B is a right-expr
def get_left_expr_type(expr):
    if isinstance(expr,str):
        return 'variable'
    elif expr[0] == 'access' and expr[1] == 'contract.storage':
        return 'storage'
    else:
        return 'access'

def compile_left_expr(expr,varhash):
    typ = get_left_expr_type(expr)
    if typ == 'variable':
        if re.match('^[0-9\-]*$',expr):
            raise Exception("Can't set the value of a number! "+expr)
        elif expr in varhash:
            return ['PUSH',varhash[expr]]
        else:
            varhash[expr] = len(varhash)
            return ['PUSH',varhash[expr]]
    elif typ == 'storage':
        return compile_expr(expr[2],varhash)
    elif typ == 'access':
        if get_left_expr_type(expr[1]) == 'storage':
            return compile_left_expr(expr[1],varhash) + ['SLOAD'] + compile_expr(expr[2],varhash)
        else:
            return compile_left_expr(expr[1],varhash) + compile_expr(expr[2],varhash) + ['ADD']
    else:
        raise Exception("invalid op: "+expr[0])

# Right-hand-side expressions (ie. the normal kind)
def compile_expr(expr,varhash,functionhash={},lc=[0]):
    if isinstance(expr,str):
        if re.match('^[0-9\-]*$',expr):
            return ['PUSH',int(expr)]
        elif re.match('^REF_',expr):
            return [expr]
        elif expr in varhash:
            return ['PUSH',varhash[expr],'MLOAD']
        elif expr in pseudovars:
            return [pseudovars[expr]]
        else:
            varhash[expr] = len(varhash)
            return ['PUSH',varhash[expr],'MLOAD']
    elif expr[0] in optable:
        if len(expr) != 3:
            raise Exception("Wrong number of arguments: "+str(expr))
        f = compile_expr(expr[1],varhash)
        g = compile_expr(expr[2],varhash)
        return g + f + [optable[expr[0]]]
    elif expr[0] == 'fun' and expr[1] in funtable:
        if len(expr) != funtable[expr[1]][1] + 2:
            raise Exception("Wrong number of arguments: "+str(expr)) 
        f = sum([compile_expr(e,varhash) for e in expr[2:]],[])
        return f + [funtable[expr[1]][0]]
    elif expr[0] == 'access':
        if expr[1][0] == 'block.contract_storage':
            return compile_expr(expr[2],varhash) + compile_expr(expr[1][1],varhash) + ['EXTRO']
        elif expr[1] in pseudoarrays:
            return compile_expr(expr[2],varhash) + [pseudoarrays[expr[1]]]
        else:
            return compile_left_expr(expr[1],varhash) + compile_expr(expr[2],varhash) + ['ADD','MLOAD']
    elif expr[0] == 'fun' and expr[1] == 'array':
        return [ 'PUSH', 0, 'PUSH', 1, 'SUB', 'MLOAD', 'PUSH',
                         2, 'PUSH', 160, 'EXP', 'ADD', 'DUP',
                         'PUSH', 0, 'PUSH', 1, 'SUB', 'MSTORE' ]
    elif expr[0] == 'fun':
        # That's a custom function.
        if expr[1] not in functionhash:
            raise Exception("function not defined: "+expr[1])
        # Setup our return point.
        label, ref = 'LABEL_'+str(lc[0]), 'REF_'+str(lc[0])
        lc[0] += 1
        # Save that in the variable reserved for this function.
        stmt_setfuncreturnvar = ['set',expr[1] + "_returnpoint",ref]
        stmt_functionreturn = compile_stmt(stmt_setfuncreturnvar,varhash,functionhash,lc)
        # Set each variable which represents a parameter for the function.
        params = []
        paramidx = -1
        for ex in expr[2:]:
            paramidx += 1
            setparamstmt = ['set',functionhash[expr[1]]['params'][paramidx],ex]
            for part in compile_stmt(setparamstmt,varhash,functionhash,lc): params.append(part)
        # Steps: Set function return variable, Set parameters, Go to the function, Set the label
        return stmt_functionreturn + params + [ functionhash[expr[1]]['funcref'], 'JMP' ] + [ label ]
    elif expr[0] == '!':
        f = compile_expr(expr[1],varhash)
        return f + ['NOT']
    elif expr[0] in pseudoarrays:
        return compile_expr(expr[1],varhash) + pseudoarrays[expr[0]]
    elif expr[0] in ['or', '||']:
        return compile_expr(['!', [ '*', ['!', expr[1] ], ['!', expr[2] ] ] ],varhash)
    elif expr[0] in ['and', '&&']: 
        return compile_expr(['!', [ '+', ['!', expr[1] ], ['!', expr[2] ] ] ],varhash)
    elif expr[0] == 'multi':
        return sum([compile_expr(e,varhash) for e in expr[1:]],[])
    elif expr == 'tx.datan':
        return ['DATAN']
    else:
        raise Exception("invalid op: "+expr[0])

# Statements (ie. if, while, a = b, a,b,c = d,e,f, [ s1, s2, s3 ], stop, suicide)
def compile_stmt(stmt,varhash={},functionhash={},lc=[0],endifmarker=[0],endifknown=[0]):
    if stmt[0] in ['if', 'elif', 'else']:
        # Typically we use the second index, which is the condition for the if
        stmtindex = 2
        # However, with else, our condition isn't explicit.
        if stmt[0] == "else":
            # So we use a previous index in this statement
            stmtindex = 1
            # Set that we know the endif exists, at this label.
            endifmarker[0] = lc[0]
            endifknown[0] = 1
        else:
            # Additionally we compile expressions only for conditionals.
            f = compile_expr(stmt[1],varhash,functionhash,lc)
        g = compile_stmt(stmt[stmtindex],varhash,functionhash,lc,endifmarker,endifknown)
        h = compile_stmt(stmt[3],varhash,functionhash,lc,endifmarker,endifknown) if len(stmt) > 3 else None
        label, ref = 'LABEL_'+str(lc[0]), 'REF_'+str(lc[0])
        # We hold the lc's place, as if the end if location is unknown this "could be end if"
        couldbeendif = lc[0]
        lc[0] += 1
        if stmt[0] == "else": return g + [ label ]
        else:
            if not endifknown[0]:
                # If our endif is unknown, we mark it here
                endifmarker[0] = couldbeendif
                endifknown[0] = 1
            # An if denotes the beginning of a if/elif/else block, reset our known endif
            if stmt[0] == "if": endifknown[0] = 0
            if h: return f + [ 'NOT', ref, 'SWAP', 'JMPI' ] + g + [ 'REF_'+str(endifmarker[0]), 'JMP' ] + [ label ] + h
            else: return f + [ 'NOT', ref, 'SWAP', 'JMPI' ] + g + [ label ]
    elif stmt[0] == "def":
        # create the reference and label.
        label, ref = 'LABEL_'+str(lc[0]), 'REF_'+str(lc[0])
        # increment it.
        lc[0] += 1
        # hey, we're going to need a label INSIDE, so we can access this.
        insidelabel, insideref = 'LABEL_'+str(lc[0]), 'REF_'+str(lc[0])
        lc[0] += 1
        # Compile our sequence inside the function.
        f = compile_stmt(stmt[2],varhash,functionhash,lc)
        # put together the metadata about the function in the functionhash.
        funcname = stmt[1][1]
        functionhash[funcname] = {}
        functionhash[funcname]['params'] = []
        functionhash[funcname]['funcref'] = insideref
        # - one of which is: where do we go at the end, we return to whence we came.
        varhash[funcname + '_returnpoint'] = len(varhash)
        # - and we add each parameter to the varhash (if unknown, typically they're known as they're used in the function block)
        for param in stmt[1][2:]:
            if param not in varhash:
                varhash[param] = len(varhash)
            functionhash[funcname]['params'].append(param)
        return [ ref, 'JMP', insidelabel] + f + [ 'PUSH', varhash[funcname + '_returnpoint'], 'MLOAD', 'JMP'] + [ label ]
    elif stmt[0] == 'while':
        f = compile_expr(stmt[1],varhash,functionhash,lc)
        g = compile_stmt(stmt[2],varhash,functionhash,lc)
        beglab, begref = 'LABEL_'+str(lc[0]), 'REF_'+str(lc[0])
        endlab, endref = 'LABEL_'+str(lc[0]+1), 'REF_'+str(lc[0]+1)
        lc[0] += 2
        return [ beglab ] + f + [ 'NOT', endref, 'SWAP', 'JMPI' ] + g + [ begref, 'JMP', endlab ]
    elif stmt[0] == 'set':
        lexp = compile_left_expr(stmt[1],varhash)
        rexp = compile_expr(stmt[2],varhash,functionhash,lc)
        lt = get_left_expr_type(stmt[1])
        return rexp + lexp + ['SSTORE' if lt == 'storage' else 'MSTORE']
    elif stmt[0] == 'mset':
        rexp = compile_expr(stmt[2],varhash,functionhash,lc)
        exprstates = [get_left_expr_type(e) for e in stmt[1][1:]]
        o = rexp
        for e in stmt[1][1:]:
            o += compile_left_expr(e,varhash)
            o += [ 'SSTORE' if get_left_expr_type(e) == 'storage' else 'MSTORE' ]
        return o
    elif stmt[0] == 'seq':
        o = []
        for s in stmt[1:]:
            o.extend(compile_stmt(s,varhash,functionhash,lc))
        return o
    elif stmt[0] == 'fun' and stmt[1] == 'mktx':
        to = compile_expr(stmt[2],varhash,functionhash,lc)
        value = compile_expr(stmt[3],varhash,functionhash,lc)
        datan = compile_expr(stmt[4],varhash,functionhash,lc)
        datastart = compile_expr(stmt[5],varhash,functionhash,lc)
        return datastart + datan + value + to + [ 'MKTX' ]
    elif stmt[0] == 'fun' and stmt[1] in functionhash:
        # It's a bare function. Which looks like a statement, compile it as an expression.
        return compile_expr(stmt,varhash,functionhash,lc)
    elif stmt == 'stop':
        return [ 'STOP' ]
    elif stmt[0] == 'fun' and stmt[1] == 'suicide':
        return compile_expr(stmt[2]) + [ 'SUICIDE' ]
    elif stmt[0] == 'return':
        return compile_expr(stmt[1],varhash,functionhash,lc)
        
# Dereference labels
def assemble(c):
    iq = [x for x in c]
    mq = []
    pos = 0
    labelmap = {}
    while len(iq):
        front = iq.pop(0)
        if isinstance(front,str) and front[:6] == 'LABEL_':
            labelmap[front[6:]] = pos
        else:
            mq.append(front)
            pos += 2 if isinstance(front,str) and front[:4] == 'REF_' else 1
    oq = []
    for m in mq:
        if isinstance(m,str) and m[:4] == 'REF_':
            oq.append('PUSH')
            oq.append(labelmap[m[4:]])
        else: oq.append(m)
    return oq

def compile(source):
    if isinstance(source,('str','unicode')): source = parse(source)
    #print p
    return assemble(compile_stmt(source))

if len(sys.argv) >= 2:
    if os.path.exists(sys.argv[1]):
        open(sys.argv[1]).read()
        print ' '.join([str(k) for k in compile(open(sys.argv[1]).read())])
    else:
        print ' '.join([str(k) for k in compile(sys.argv[1])])


*/