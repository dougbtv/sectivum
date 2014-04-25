// COMPILER.

module.exports = function() {

	var opcodes = {
		0x00: ['STOP', 0, 0],
		0x01: ['ADD', 2, 1],
		0x02: ['SUB', 2, 1],
		0x03: ['MUL', 2, 1],
		0x04: ['DIV', 2, 1],
		0x05: ['SDIV', 2, 1],
		0x06: ['MOD', 2, 1],
		0x07: ['SMOD', 2, 1],
		0x08: ['EXP', 2, 1],
		0x09: ['NEG', 2, 1],
		0x0a: ['LT', 2, 1],
		0x0b: ['GT', 2, 1],
		0x0c: ['EQ', 2, 1],
		0x0d: ['NOT', 1, 1],
		0x10: ['AND', 2, 1],
		0x11: ['OR', 2, 1],
		0x12: ['XOR', 2, 1],
		0x13: ['BYTE', 2, 1],
		0x20: ['SHA3', 2, 1],
		0x30: ['ADDRESS', 0, 1],
		0x31: ['BALANCE', 0, 1],
		0x32: ['ORIGIN', 0, 1],
		0x33: ['CALLER', 0, 1],
		0x34: ['CALLVALUE', 0, 1],
		0x35: ['CALLDATALOAD', 1, 1],
		0x36: ['CALLDATASIZE', 0, 1],
		0x37: ['GASPRICE', 0, 1],
		0x40: ['PREVHASH', 0, 1],
		0x41: ['COINBASE', 0, 1],
		0x42: ['TIMESTAMP', 0, 1],
		0x43: ['NUMBER', 0, 1],
		0x44: ['DIFFICULTY', 0, 1],
		0x45: ['GASLIMIT', 0, 1],
		0x50: ['POP', 1, 0],
		0x51: ['DUP', 1, 2],
		0x52: ['SWAP', 2, 2],
		0x53: ['MLOAD', 1, 1],
		0x54: ['MSTORE', 2, 0],
		0x55: ['MSTORE8', 2, 0],
		0x56: ['SLOAD', 1, 1],
		0x57: ['SSTORE', 2, 0],
		0x58: ['JUMP', 1, 0],
		0x59: ['JUMPI', 2, 0],
		0x5a: ['PC', 0, 1],
		0x5b: ['MSIZE', 0, 1],
		0x5c: ['GAS', 0, 1],
		0x60: ['PUSH', 0, 1], // encompasses 96...127
		0xf0: ['CREATE', 4, 1],
		0xf1: ['CALL', 7, 1],
		0xf2: ['RETURN', 2, 1],
		0xff: ['SUICIDE', 1, 1],
	};

	// Now reverse these opcodes so it's lookup instruction by byte-value.

	var reverse_opcodes = {};

	var opkeys = Object.keys(opcodes);

	for (var opidx = 0; opidx < opkeys.length; opidx++) {
		var eachkey = opkeys[opidx];
		var instruction = opcodes[eachkey][0];
		reverse_opcodes[instruction] = eachkey;
	}

	// All functions go here
	// 
	// Entries go in a format:
	// 
	// [ val, inputcount, outputcount, code ]

	var funtable = [
		['+', 	2, 1, ['<1>', '<0>', 'ADD']],
		['-', 	2, 1, ['<1>', '<0>', 'SUB']],
		['*', 	2, 1, ['<1>', '<0>', 'MUL']],
		['/', 	2, 1, ['<1>', '<0>', 'DIV']],
		['^', 	2, 1, ['<1>', '<0>', 'EXP']],
		['%', 	2, 1, ['<1>', '<0>', 'MOD']],
		['#/', 	2, 1, ['<1>', '<0>', 'SDIV']],
		['#%', 	2, 1, ['<1>', '<0>', 'SMOD']],
		['==', 	2, 1, ['<1>', '<0>', 'EQ']],
		['<', 	2, 1, ['<1>', '<0>', 'LT']],
		['<=', 	2, 1, ['<1>', '<0>', 'GT', 'NOT']],
		['>', 	2, 1, ['<1>', '<0>', 'GT']],
		['>=', 	2, 1, ['<1>', '<0>', 'LT', 'NOT']],
		['!', 	1, 1, ['<0>', 'NOT']],
		['or', 	2, 1, ['<1>', '<0>', 'DUP', 4, 'PC',
						'ADD', 'JUMPI', 'POP', 'SWAP', 'POP']],
		['||', 	2, 1, ['<1>', '<0>', 'DUP', 4, 'PC',
					  'ADD', 'JUMPI', 'POP', 'SWAP', 'POP']],
		['and', 2, 1, ['<1>', '<0>', 'NOT', 'NOT', 'MUL']],
		['&&', 	2, 1, ['<1>', '<0>', 'NOT', 'NOT', 'MUL']],
		['xor', 2, 1, ['<1>', '<0>', 'XOR']],
		['&', 	2, 1, ['<1>', '<0>', 'AND']],
		['|', 	2, 1, ['<1>', '<0>', 'OR']],
		['byte', 2, 1, ['<0>', '<1>', 'BYTE']],
		// Word array methods
		// arr, ind -> val
		['access', 2, 1, ['<0>', '<1>', 32, 'MUL', 'ADD', 'MLOAD']],
		// arr, ind, val
		['arrset', 3, 0, ['<2>', '<0>', '<1>', 32, 'MUL', 'ADD', 'MSTORE']],
		// val, pointer -> pointer+32
		['set_and_inc', 2, 1, ['<1>', 'DUP', '<0>', 'SWAP', 'MSTORE', 32, 'ADD']],
		// len (32 MUL) len*32 (MSIZE) len*32 MSIZE (SWAP) MSIZE len*32 (MSIZE ADD)
		// MSIZE MSIZE+len*32 (1) MSIZE MSIZE+len*32 1 (SWAP SUB) MSIZE
		// MSIZE+len*32-1 (0 SWAP MSTORE8) MSIZE
		['array', 1, 1, ['<0>', 32, 'MUL', 'MSIZE', 'SWAP', 'MSIZE',
						 'ADD', 1, 'SWAP', 'SUB', 0, 'SWAP', 'MSTORE8']],  // len -> arr
		// String array methods
		// arr, ind -> val
		['getch', 2, 1, ['<1>', '<0>', 'ADD', 'MLOAD', 255, 'AND']],
		['setch', 3, 0, ['<2>', '<1>', '<0>', 'ADD', 'MSTORE']],  // arr, ind, val
		// len MSIZE (SWAP) MSIZE len (MSIZE ADD) MSIZE MSIZE+len (1) MSIZE
		// MSIZE+len 1 (SWAP SUB) MSIZE MSIZE+len-1 (0 SWAP MSTORE8) MSIZE
		['string', 1, 1, ['<0>', 'MSIZE', 'SWAP', 'MSIZE', 'ADD',
						  1, 'SWAP', 'SUB', 0, 'SWAP', 'MSTORE8']],  // len -> arr
		// ['send', 2, 1, [0,0,0,0,0,'<1>','<0>','CALL'] ], // to, value, 0, [] -> /dev/null
		// to, value, gas, [] -> /dev/null
		['send', 3, 1, [0, 0, 0, 0, '<2>', '<1>', '<0>', 'CALL']],
		// MSIZE 0 MSIZE (MSTORE) MSIZE (DUP) MSIZE MSIZE (...) MSIZE MSIZE 32 <4>
		// <3> <2> <1> <0> (CALL) MSIZE FLAG (POP) MSIZE (MLOAD) RESULT
		['msg', 5, 1, ['MSIZE', 0, 'MSIZE', 'MSTORE', 'DUP', 32, 'SWAP', '<4>', 32, 'MUL', '<3>',
					   '<2>', '<1>', '<0>', 'CALL', 'POP', 'MLOAD']],  // to, value, gas, data, datasize -> out32
		// <5>*32 (MSIZE SWAP MSIZE SWAP) MSIZE MSIZE <5>*32 (DUP MSIZE ADD) MSIZE MSIZE <5>*32 MEND+1 (1 SWAP SUB) MSIZE MSIZE <5>*32 MEND (0 SWAP MSTORE8) MSIZE MSIZE <5>*32 (SWAP) MSIZE <5>*32 MSIZE
		['msg', 6, 1, ['<5>', 32, 'MUL', 'MSIZE', 'SWAP', 'MSIZE', 'SWAP', 'DUP', 'MSIZE', 'ADD', 1, 'SWAP', 'SUB', 0, 'SWAP', 'MSTORE8', 'SWAP',
					   '<4>', 32, 'MUL', '<3>', '<2>', '<1>', '<0>', 'CALL', 'POP']],  // to, value, gas, data, datasize, outsize -> out
		// value, gas, data, datasize
		['create', 4, 1, ['<3>', '<2>', '<1>', '<0>', 'CREATE']],
		['sha3', 1, 1, [32, 'MSIZE', '<0>', 'MSIZE', 'MSTORE', 'SHA3']],
		['sha3bytes', 1, 1, ['SHA3']],
		['sload', 1, 1, ['<0>', 'SLOAD']],
		['sstore', 2, 0, ['<1>', '<0>', 'SSTORE']],
		['calldataload', 1, 1, ['<0>', 32, 'MUL', 'CALLDATALOAD']],
		['id', 1, 1, ['<0>']],
		// 0 MSIZE (SWAP) MSIZE 0 (MSIZE) MSIZE 0 MSIZE (MSTORE) MSIZE (32 SWAP) 32
		// MSIZE
		// returns single value
		['return', 1, 0, [
			'<0>', 'MSIZE', 'SWAP', 'MSIZE', 'MSTORE', 32, 'SWAP', 'RETURN']],
		['return', 2, 0, ['<1>', 32, 'MUL', '<0>', 'RETURN']],
		['suicide', 1, 0, ['<0>', 'SUICIDE']],
	]

	//  Pseudo-variables representing opcodes
	var pseudovars = {
		'msg.datasize': [32, 'CALLDATASIZE', 'DIV'],
		'msg.sender': ['CALLER'],
		'msg.value': ['CALLVALUE'],
		'tx.gasprice': ['GASPRICE'],
		'tx.origin': ['ORIGIN'],
		'tx.gas': ['GAS'],
		'contract.balance': ['BALANCE'],
		'block.prevhash': ['PREVHASH'],
		'block.coinbase': ['COINBASE'],
		'block.timestamp': ['TIMESTAMP'],
		'block.number': ['NUMBER'],
		'block.difficulty': ['DIFFICULTY'],
		'block.gaslimit': ['GASLIMIT'],
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

	
	this.mklabel = function (prefix) {
		this.labelcollection[0] += 1;
		return prefix + (this.labelcollection[0] - 1).toString();
	}

	// A set of methods for detecting raw values (numbers and strings) and
	// converting them to integers
	this.frombytes = function(b) {
		if (b.length == 0) {
			return 0;
		} else {
			// !bang
			// String.fromCharCode((b.last() + 256 * this.frombytes(b.substring()[:-1]) // orig: frombytes(b[:-1])    --> is that the whole array?

		}
		
	}


	this.fromhex = function(b) {
		if (b.length == 0) {
			return 0;
		} else {
			var hashstr = '0123456789abcdef';
			var hexpos = hashstr.indexOf(b.last());
			// !bang warning.
			// fromhex(b[:-1])) { // that's everything but the last item.
			return hexpos + 16 * this.fromhex(b.substring(1,b.substring.length-1));
		}
	}

	this.is_numberlike = function(b) {
		if (typeof b === 'string') {
			re_number = /^[0-9\-]*$/;
			if (re_number.match(b)) {
				return true;
			}

			// !bang might not need this, I think I'm doing strings differently.

			// if (b[0] in ["'", '"'] and b[-1] in ["'", '"'] and b[0] == b[-1]) {
			// 	return true;
			// }
			if (b.substring(0,2) == '0x') {
				return true;
			}
		}
		return false;
	}

	this.numberize = function(b) {
		
		if (["'", '"'].contains(b[0])) {
			// !banger !untested
			return this.frombytes(b.substring(1,b.length-1));
		
		} else if (b.substring(0,2) == '0x') {
			return this.fromhex(b.substring(2,b.length));
		
		} else {
			return parseInt(b);
		
		}
	}

	// http://en.wikipedia.org/wiki/Arity
	this.arity = function(ast) {
		
		if (typeof ast === 'string') { 
			return 1;
		} else if (ast[0] == 'set') {
			return 0;
		} else if (ast[0] == 'if') {
			return 0;
		} else if (ast[0] == 'seq') {
			if ((ast.length - 1) && this.arity(ast.last())) {
				return 1;
			} else {
				return 0;
			}
		} else {

			for (var fidx = 0; fidx < funtable.length; fidx++) {
				var f = funtable[fidx];
				if (ast[0] == f[0]) {
					return f[2];
				}
			}

		}

	}


	// Apply rewrite rules
	this.rewrite = function(ast) {
										// !bang -- warning.
		if (typeof ast === 'string') { // isinstance(ast, (str, unicode))) {
			return ast;

		} else if (ast[0] == 'set') {
			if (ast[1][0] == 'access') {
				if (ast[1][1] == 'contract.storage') {
					return ['sstore', this.rewrite(ast[1][2]), this.rewrite(ast[2])];
				} else {
					return ['arrset', this.rewrite(ast[1][1]), this.rewrite(ast[1][2]), this.rewrite(ast[2])];
				}
			}

		} else if (ast[0] == 'access') {
			if (ast[1] == 'msg.data') {
				return ['calldataload', this.rewrite(ast[2])];

			} else if (ast[1] == 'contract.storage') {
				return ['sload', this.rewrite(ast[2])];

			}

		} else if (ast[0] == 'array_lit') {
			var o = ['array', (ast.length-1).toString()]
			for (var astidx = 1; astidx < ast.length; astidx++) {
				var a = ast[astidx];
				o = ['set_and_inc', this.rewrite(a), o];
			}
			return ['-', o, ((ast.length-1)*32).toString()];

		} else if (ast[0] == 'return') {
			if (ast.length == 2 && ast[1][0] == 'array_lit') {
				return ['return', this.rewrite(ast[1]), (ast[1].length() - 1).toString()];
			}
		}

		// Apply function to every item of iterable, and return list.
		// return map(this.rewrite, ast);

		var returner = [];
		for (var mapidx; mapidx < ast.length; mapidx++) {
			returner.push(this.rewrite(ast[mapidx]));
		}
		return returner;
		
	}


	this.assemble = function(compiled) {

		console.log("!trace COMPILED --> ",compiled);

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

		for (var idx = 0; idx < mq.length; idx++) {

			var m = mq[idx];

			if (typeof m === 'string' && m.substring(0,4) == 'REF_') {

				oq.push('PUSH4');
				oq.push(labelmap[m.substring(4,m.length)]);
			
			} else if (typeof m === 'number') {

				// !bang -- testing in progress.
				var L = Math.max(1,this.log256(m));
				oq = oq.concat('PUSH' + parseInt(L));
				oq = oq.concat(this.tobytearr(m,L));

			} else {

				oq.push(m);

			}

		}

		return oq;


	}
	
	this.log256 = function(n) {
		if (n == 0) {
			return 0;
		} else {
			return 1 + this.log256(Math.floor(n / 256));
		}
    	// return 0 if n == 0 else 1 + log256(n / 256)
    }


	this.tobytearr = function(n, L) {
		if (L == 0) {
			return [];
		} else {
			return this.tobytearr(n / 256, L - 1).concat(n % 256);
		}
    	// return [] if L == 0 else tobytearr(n / 256, L - 1) + [n % 256]
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

	/* 
	this.compile_expr = function(ast, varhash, lc=[0]) {
		// Stop keyword
		if (ast == 'stop') {
			return ['STOP'];
		// Literals
		} else if (isinstance(ast, (str, unicode))) {
			if (this.is_numberlike(ast)) {
				return [this.numberize(ast)];
			} else if (pseudovars.contains(ast)) {
				return pseudovars[ast];
			} else {
				if (!varhash.contains(ast)) {
					varhash[ast] = len(varhash) * 32
				}
				return [varhash[ast], 'MLOAD'];
			}
		// Set (specifically, variables)
		} else if (ast[0] == 'set') {
			if (not isinstance(ast[1], (str, unicode))) {
				raise Exception("Cannot set the value of " + str(ast[1]))
			} else if (ast[1] in pseudovars) {
				raise Exception("Cannot set a pseudovariable!")
			} else {
				if (ast[1] not in varhash) {
					varhash[ast[1]] = len(varhash) * 32
				return compile_expr(ast[2], varhash, lc) + [varhash[ast[1]], 'MSTORE'];
		// if (and if/else statement) {
		} else if (ast[0] == 'if') {
			f = compile_expr(ast[1], varhash, lc)
			g = compile_expr(ast[2], varhash, lc)
			h = compile_expr(ast[3], varhash, lc) if (len(ast) > 3 else Non) {
			label, ref = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
			lc[0] += 1
			label2, ref2 = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
			lc[0] += 1
			if (h) {
				return f + ['NOT', ref2, 'JUMPI'] + g + [ref, 'JUMP', label2] + h + [label];
			} else {
				return f + ['NOT', ref, 'JUMPI'] + g + [label];
		// While loops
		} else if (ast[0] == 'while') {
			f = compile_expr(ast[1], varhash, lc)
			g = compile_expr(ast[2], varhash, lc)
			beglab, begref = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
			endlab, endref = 'LABEL_' + str(lc[0] + 1), 'REF_' + str(lc[0] + 1)
			lc[0] += 2
			return [beglab] + f + ['NOT', endref, 'JUMPI'] + g + [begref, 'JUMP', endlab];
		// Seq
		} else if (ast[0] == 'seq') {
			o = []
			for arg in ast[1:]:
				o.extend(compile_expr(arg, varhash, lc))
				if (arity(arg) == 1 and arg != ast[-1]) {
					o.append('POP')
			return o;
		// Functions and operations
		for f in funtable:
			if (ast[0] == f[0] and len(ast[1:]) == f[1]) {
				// if (arity of all args is ) {
				if (reduce(lambda x, y: x * arity(y), ast[1:], 1)) {
					iq = f[3][:]
					oq = []
					while len(iq):
						tok = iq.pop(0)
						if (isinstance(tok, (str, unicode)) and tok[0] == '<' and tok[-1] == '>') {
							oq.extend(
								compile_expr(ast[1 + int(tok[1:-1])], varhash, lc))
						} else {
							oq.append(tok)
					return oq;
				} else {
					raise Exception(
						"Arity of argument mismatches for %s: %s" % (f[0], ast))
		raise Exception("invalid op: " + ast[0])

	}

	/*

	def compile_expr(ast, varhash, lc=[0]):
	// Stop keyword
	if (ast == 'stop') {
		return ['STOP']
	# Literals
	} else if isinstance(ast, (str, unicode)):
		if is_numberlike(ast):
			return [numberize(ast)]
		elif ast in pseudovars:
			return pseudovars[ast]
		else:
			if ast not in varhash:
				varhash[ast] = len(varhash) * 32
			return [varhash[ast], 'MLOAD']
	# Set (specifically, variables)
	elif ast[0] == 'set':
		if not isinstance(ast[1], (str, unicode)):
			raise Exception("Cannot set the value of " + str(ast[1]))
		elif ast[1] in pseudovars:
			raise Exception("Cannot set a pseudovariable!")
		else:
			if ast[1] not in varhash:
				varhash[ast[1]] = len(varhash) * 32
			return compile_expr(ast[2], varhash, lc) + [varhash[ast[1]], 'MSTORE']
	# If and if/else statements
	elif ast[0] == 'if':
		f = compile_expr(ast[1], varhash, lc)
		g = compile_expr(ast[2], varhash, lc)
		h = compile_expr(ast[3], varhash, lc) if len(ast) > 3 else None
		label, ref = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
		lc[0] += 1
		label2, ref2 = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
		lc[0] += 1
		if h:
			return f + ['NOT', ref2, 'JUMPI'] + g + [ref, 'JUMP', label2] + h + [label]
		else:
			return f + ['NOT', ref, 'JUMPI'] + g + [label]
	# While loops
	elif ast[0] == 'while':
		f = compile_expr(ast[1], varhash, lc)
		g = compile_expr(ast[2], varhash, lc)
		beglab, begref = 'LABEL_' + str(lc[0]), 'REF_' + str(lc[0])
		endlab, endref = 'LABEL_' + str(lc[0] + 1), 'REF_' + str(lc[0] + 1)
		lc[0] += 2
		return [beglab] + f + ['NOT', endref, 'JUMPI'] + g + [begref, 'JUMP', endlab]
	# Seq
	elif ast[0] == 'seq':
		o = []
		for arg in ast[1:]:
			o.extend(compile_expr(arg, varhash, lc))
			if arity(arg) == 1 and arg != ast[-1]:
				o.append('POP')
		return o
	# Functions and operations
	for f in funtable:
		if ast[0] == f[0] and len(ast[1:]) == f[1]:
			# If arity of all args is 1
			if reduce(lambda x, y: x * arity(y), ast[1:], 1):
				iq = f[3][:]
				oq = []
				while len(iq):
					tok = iq.pop(0)
					if isinstance(tok, (str, unicode)) and tok[0] == '<' and tok[-1] == '>':
						oq.extend(
							compile_expr(ast[1 + int(tok[1:-1])], varhash, lc))
					else:
						oq.append(tok)
				return oq
			else:
				raise Exception(
					"Arity of argument mismatches for %s: %s" % (f[0], ast))
	raise Exception("invalid op: " + ast[0])

	*/


	/*

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

			var f = [];
			var astslice = expr.slice(2,expr.length);
			for (var astindex = 0; astindex < astslice.length; astindex++) {
				var e = astslice[astindex];
				var nowexpression = this.compile_expr(e);
				f = f.concat(nowexpression);
			}

			return f.concat([funtable[expr[1]][0]]);
		
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
			var ast_setfuncreturnvar = ['set',expr[1] + "_returnpoint",ref];
			var ast_functionreturn = this.compile_expr(ast_setfuncreturnvar);
			
			// Set each variable which represents a parameter for the function.
			var params = []
			var paramidx = -1
			
			slicexpr = expr.slice(2,expr.length);
			for (var expridx = 0; expridx < slicexpr.length; expridx++) { // for ex in expr[2:]:

				var ex = slicexpr[expridx];
				
				paramidx += 1;

				var setparamast = ['set',functionhash[expr[1]]['params'][paramidx],ex];

				// reference: for part in this.compile_expr(setparamast,functionhash,lc): params.append(part)
				var parts = this.compile_expr(setparamast);
				for (var partidx = 0; partidx < parts.length; partidx++) {
					params.push(parts[partidx]);
				}

				
			}
			
			// Steps: Set function return variable, Set parameters, Go to the function, Set the label
			return ast_functionreturn.concat(params,[ functionhash[expr[1]]['funcref'], 'JMP' ],[ label ]);
		
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
		
			var f = [];
			var astslice = expr.slice(1,expr.length);
			for (var astindex = 0; astindex < astslice.length; astindex++) {
				var e = astslice[astindex];
				var nowexpression = this.compile_expr(e);
				f = f.concat(nowexpression);
			}

			return f;
		
		} else if (expr == 'tx.datan') {
		
			return ['DATAN'];
		
		} else {
		
			throw "invalid op: " +expr[0];
		
		}

	}

	*/

	/*

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

	*/

	this.compile_expr = function(ast) {

			// handy ole debug methods.
			console.log("!trace -------------------------------------- detent");
			console.log("!trace ast: %j ", ast);
			console.log("this.varhash: %j ", this.varhash);
			// console.log("functionhash: %j ", functionhash);
			// console.log("lc: %j ", this.labelcollection);
			// console.log("this.endifmarker: %j ", this.endifmarker);
			// console.log("this.endifknown: %j ", this.endifknown);
			// console.log("statement! %j", ast);
		
		if (ast == 'stop') {
			return ['STOP'];
		// Literals
		} else if (typeof ast === 'string') { 

			// Is it number like?
			if (this.is_numberlike(ast)) {
				var numbered = this.numberize(ast);
				return [numbered];

			// Is it a psuedovar?
			} else if (pseudovars.isset(ast)) {
				return pseudovars[ast];

			// Then it's gotta be a variable, right?
			} else {
				
				if (!this.varhash.isset(ast)) {
					this.varhash[ast] = len(this.varhash) * 32
				}
				return [this.varhash[ast], 'MLOAD'];
			}

		// Set (specifically, variables)
		} else if (ast[0] == 'set') {

			if (!(typeof ast[1] === 'string')) {
				return new Error("Cannot set the value of " + str(ast[1]));

			} else if (ast[1] in pseudovars) {
				return new Error("Cannot set a pseudovariable!");

			} else {

				// console.log("!trace referencing var:  ",ast[1]);
				if (!this.varhash.isset(ast[1])) { 
					this.varhash[ast[1]] = this.varhash.hashlength() * 32;
				}

				var retval = this.compile_expr(ast[2]);
				return retval.concat([this.varhash[ast[1]], 'MSTORE']);
				// !bang array addition.
				// return this.compile_expr(ast[2], varhash, lc) + [varhash[ast[1]], 'MSTORE'];

			}

		} else if (['if', 'elif', 'else'].contains(ast[0])) {

			// Typically we use the second index, which is the condition for the if
			var astindex = 2;
			// However, with else, our condition isn't explicit.
			
			if (ast[0] == "else") {

				// So we use a previous index in this statement
				astindex = 1;
				// Set that we know the endif exists, at this label.
				this.endifmarker[0] = this.labelcollection[0];
				this.endifknown[0] = 1;

			} else {

				// Additionally we compile expressions only for conditionals.
				var f = this.compile_expr(ast[1]);
			}

			var g = this.compile_expr(ast[astindex]);
			
			var h;

			if (ast.length > 3) {
				h = this.compile_expr(ast[3]);
			} else {
				h = null;
			}

			var label = 'LABEL_' + this.labelcollection[0]; 
			var ref = 'REF_' + this.labelcollection[0];
			
			// We hold the lc's place, as if the end if location is unknown this "could be end if"
			var couldbeendif = this.labelcollection[0];
			this.labelcollection[0] += 1;

			console.log("!trace IF FOUND RETURNED ------::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::------");

			if (ast[0] == "else") {
				
				return g.concat([label]);

			} else {
				
				if (!this.endifknown[0]) {
					// If our endif is unknown, we mark it here
					this.endifmarker[0] = couldbeendif;
					this.endifknown[0] = 1;
				}

				// An if denotes the beginning of a if/elif/else block, reset our known endif
				if (ast[0] == "if") { 
					this.endifknown[0] = 0; 
				}

				if (h) {
					return f.concat( [ 'NOT', ref, 'JUMPI' ] , g , [ 'REF_' + this.endifmarker[0], 'JUMP' ] , [ label ] , h );
				} else {
					return f.concat( [ 'NOT', ref, 'JUMPI' ] , g , [ label ] );
				}

			}
		

		} else if (ast[0] == "def") {

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
			f = this.compile_expr(ast[2]);
			
			// put together the metadata about the function in the functionhash.
			funcname = ast[1][1];
			
			functionhash[funcname] = {};
			functionhash[funcname]['params'] = [];
			functionhash[funcname]['funcref'] = insideref;
			
			// - one of which is: where do we go at the end, we return to whence we came.
			this.varhash[funcname + '_returnpoint'] = this.varhash.hashlength();

			// - and we add each parameter to the this.varhash (if unknown, typically they're known as they're used in the function block)
			var astslice = ast[1].slice(2,ast.length);

			for (var sliceidx = 0; sliceidx < astslice.length; slice++) {

				var param = astslice[sliceidx];

				if (!this.varhash[param]) { // param not in this.varhash:
					this.varhash[param] = this.varhash.hashlength();
				}

				functionhash[funcname]['params'].push(param);
			}
			
			return [ ref, 'JUMP', insidelabel ].concat(f , [ 'PUSH', this.varhash[funcname + '_returnpoint'], 'MLOAD', 'JUMP'] , [ label ] );

		} else if (ast[0] == 'while') {

			var f = this.compile_expr(ast[1]);
			var g = this.compile_expr(ast[2]);

			beglab = 'LABEL_' + this.labelcollection[0];
			begref = 'REF_' + this.labelcollection[0];

			endlab = 'LABEL_' + (this.labelcollection[0]+1);
			endref = 'REF_' + (this.labelcollection[0]+1);

			this.labelcollection[0] += 2;

			return [ beglab ].concat(f , [ 'NOT', endref, 'JUMP' ] , g , [ begref, 'JUMP', endlab ] );

		}  else if (ast[0] == 'seq') {

			var o = [];

			var astslice = ast.slice(1,ast.length);

			for (var astindex = 0; astindex < astslice.length; astindex++) {
				
				var s = astslice[astindex];
				var slicecompiled = this.compile_expr(s);
				o = o.concat(slicecompiled);

			}

			return o;

		} else if (ast[0] == 'fun' &&  functionhash.isset(ast[1])) {

			// It's a bare function. Which looks like a statement, compile it as an expression.
			return this.compile_expr(ast);

		} else if (ast[0] == 'return') {

			return this.compile_expr(ast[1]);
		}

		console.log("!trace ------>------>------>------> function tracer");
		console.log("!trace ast: ",ast);
		
		for (var funidx = 0; funidx < funtable.length; funidx++) {
			var f = funtable[funidx];
			
			if (ast[0] == f[0] && (ast.length-1) == f[1]) {
			
				var sliceast = ast.slice(1,ast.length);
				var reduction = sliceast.reduce(function(x, y) {
					return x * this.arity(y);
				}.bind(this),1);

				// console.log("!trace reduction: ",reduction);

				if (reduction) {

					var iq = f[3]; // f[3][:]
					var oq = [];
					while (iq.length) {

						console.log("!trace iq: ",iq);
						console.log("!trace oq: ",oq);

						var tok = iq.shift();
						// console.log("!trace type typof",(typeof tok));
						// console.log("!trace tok substr 1: ",tok.substring(0,1));
						// console.log("!trace tok substr 2: ",tok.last());

						if ((typeof tok === 'string') && tok.substring(0,1) == '<' && tok.last() == '>') {

							// !bang originally oq.extend.
							var toksub = parseInt(tok.substring(1,tok.length-1));
							var eachast = ast[1 + toksub];
							var compileres = this.compile_expr(eachast);
							
							// console.log("!trace toksub > ",toksub);
							// console.log("!trace eachast > ",eachast);
							// console.log("!trace compileres > ",compileres);

							oq = oq.concat(compileres);

							// compile_expr(ast[1 + int(tok[1:-1])], varhash, lc)

						} else {
							// !bang originally oq.append.
							// console.log("!trace pushed token >>>> ",tok);
							oq.push(tok);
						}

					}
					return oq;

				} else {

					return new Error("Arity of argument mismatches for %s: %s" % (f[0], ast));

				}

				// If arity of all args is 1
				// if (reduce(lambda x, y: x * arity(y), ast[1:], 1)) {
					
			}

		}

	}

	// cllcompiler.compile_ast(ast)

	/*

	*/



}
