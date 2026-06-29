//RESULTS RAADS

//  In TabSINT 4:
//     (function() {
//        tabsint.controller('results', function ($scope) {

// Hardening: wrap the whole script in an IIFE so var/function declarations and the
// QRCode/PDF417 library do not leak into (or collide with) the global scope, and so
// definition-before-use ordering is self-contained. (No 'use strict' on purpose: the
// bundled PDF417 lib below relies on a couple of implicit-global assignments internally.)
(function () {
	debugger

	var results = '';
	var responses = [];

	results = window.tabsint.resultsModel.getResults();
	// returns object with currentExam and currentPage
	responses = results.currentExam.responses;

	var subjectId_index_begin = 0;
	var subjectId_index_end = responses.length;


	var RAADSId;

	var idStr;
	var Q6ans = 0;
	var RAADSans_array = [0, 3, 2, 1, 0];
	var Q6ans_array = [0, 0, 1, 2, 3];
	var RAADS_score = 0;
	var RAADS_interp = ' ';
	var RAADS_interp_short = ' ';

	var RAADS_A_Q1 = ' ';
	var RAADS_A_Q2 = ' ';
	var RAADS_A_Q3 = ' ';
	var RAADS_A_Q4 = ' ';
	var RAADS_A_Q5 = ' ';
	var RAADS_A_Q6 = ' ';

	for (var i = subjectId_index_begin; i < subjectId_index_end; i++) {
		RAADSId = responses[i].pageId;
		if ((RAADSId.indexOf("RAADS_Q")) >= 0) {
			if ((RAADSId.indexOf("RAADS_Q1")) >= 0) {
				idStr = 'RAADS_Q1';
				if (idStr.length === RAADSId.length) {
					RAADS_A_Q1 = RAADSans_array[parseInt(responses[i].response)];
				}
			}
			if ((RAADSId.indexOf("RAADS_Q2")) >= 0) {
				RAADS_A_Q2 = RAADSans_array[parseInt(responses[i].response)];
			}

			if ((RAADSId.indexOf("RAADS_Q3")) >= 0) {
				RAADS_A_Q3 = RAADSans_array[parseInt(responses[i].response)];
			}

			if ((RAADSId.indexOf("RAADS_Q4")) >= 0) {
				RAADS_A_Q4 = RAADSans_array[parseInt(responses[i].response)];
			}

			if ((RAADSId.indexOf("RAADS_Q5")) >= 0) {
				RAADS_A_Q5 = RAADSans_array[parseInt(responses[i].response)];
			}

			if ((RAADSId.indexOf("RAADS_Q6")) >= 0) {
				Q6ans = parseInt(responses[i].response);
				RAADS_A_Q6 = Q6ans_array[Q6ans];
			}

		}
	}



	// display results

	var RAADS_Q1_C1 = document.getElementById("RAADS_Q1_col1");
	RAADS_Q1_C1.textContent = " ";
	if (RAADS_A_Q1 == 3) {
		RAADS_Q1_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q1_C2 = document.getElementById("RAADS_Q1_col2")
	RAADS_Q1_C2.textContent = " ";
	if (RAADS_A_Q1 == 2) {
		RAADS_Q1_C2.textContent = "\u2713";
	};
	var RAADS_Q1_C3 = document.getElementById("RAADS_Q1_col3")
	RAADS_Q1_C3.textContent = " ";
	if (RAADS_A_Q1 == 1) {
		RAADS_Q1_C3.textContent = "\u2713";
	};
	var RAADS_Q1_C4 = document.getElementById("RAADS_Q1_col4")
	RAADS_Q1_C4.textContent = " ";
	if (RAADS_A_Q1 == 0) {
		RAADS_Q1_C4.textContent = "\u2713";
	};


	var RAADS_Q2_C1 = document.getElementById("RAADS_Q2_col1")
	RAADS_Q2_C1.textContent = " ";
	if (RAADS_A_Q2 == 3) {
		RAADS_Q2_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q2_C2 = document.getElementById("RAADS_Q2_col2")
	RAADS_Q2_C2.textContent = " ";
	if (RAADS_A_Q2 == 2) {
		RAADS_Q2_C2.textContent = "\u2713";
	};
	var RAADS_Q2_C3 = document.getElementById("RAADS_Q2_col3")
	RAADS_Q2_C3.textContent = " ";
	if (RAADS_A_Q2 == 1) {
		RAADS_Q2_C3.textContent = "\u2713";
	};
	var RAADS_Q2_C4 = document.getElementById("RAADS_Q2_col4")
	RAADS_Q2_C4.textContent = " ";
	if (RAADS_A_Q2 == 0) {
		RAADS_Q2_C4.textContent = "\u2713";
	};

	var RAADS_Q3_C1 = document.getElementById("RAADS_Q3_col1")
	RAADS_Q3_C1.textContent = " ";
	if (RAADS_A_Q3 == 3) {
		RAADS_Q3_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q3_C2 = document.getElementById("RAADS_Q3_col2")
	RAADS_Q3_C2.textContent = " ";
	if (RAADS_A_Q3 == 2) {
		RAADS_Q3_C2.textContent = "\u2713";
	};
	var RAADS_Q3_C3 = document.getElementById("RAADS_Q3_col3")
	RAADS_Q3_C3.textContent = " ";
	if (RAADS_A_Q3 == 1) {
		RAADS_Q3_C3.textContent = "\u2713";
	};
	var RAADS_Q3_C4 = document.getElementById("RAADS_Q3_col4")
	RAADS_Q3_C4.textContent = " ";
	if (RAADS_A_Q3 == 0) {
		RAADS_Q3_C4.textContent = "\u2713";
	};

	var RAADS_Q4_C1 = document.getElementById("RAADS_Q4_col1")
	RAADS_Q4_C1.textContent = " ";
	if (RAADS_A_Q4 == 3) {
		RAADS_Q4_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q4_C2 = document.getElementById("RAADS_Q4_col2")
	RAADS_Q4_C2.textContent = " ";
	if (RAADS_A_Q4 == 2) {
		RAADS_Q4_C2.textContent = "\u2713";
	};
	var RAADS_Q4_C3 = document.getElementById("RAADS_Q4_col3")
	RAADS_Q4_C3.textContent = " ";
	if (RAADS_A_Q4 == 1) {
		RAADS_Q4_C3.textContent = "\u2713";
	};
	var RAADS_Q4_C4 = document.getElementById("RAADS_Q4_col4")
	RAADS_Q4_C4.textContent = " ";
	if (RAADS_A_Q4 == 0) {
		RAADS_Q4_C4.textContent = "\u2713";
	};

	var RAADS_Q5_C1 = document.getElementById("RAADS_Q5_col1")
	RAADS_Q5_C1.textContent = " ";
	if (RAADS_A_Q5 == 3) {
		RAADS_Q5_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q5_C2 = document.getElementById("RAADS_Q5_col2")
	RAADS_Q5_C2.textContent = " ";
	if (RAADS_A_Q5 == 2) {
		RAADS_Q5_C2.textContent = "\u2713";
	};
	var RAADS_Q5_C3 = document.getElementById("RAADS_Q5_col3")
	RAADS_Q5_C3.textContent = " ";
	if (RAADS_A_Q5 == 1) {
		RAADS_Q5_C3.textContent = "\u2713";
	};
	var RAADS_Q5_C4 = document.getElementById("RAADS_Q5_col4")
	RAADS_Q5_C4.textContent = " ";
	if (RAADS_A_Q5 == 0) {
		RAADS_Q5_C4.textContent = "\u2713";
	};

	var RAADS_Q6_C1 = document.getElementById("RAADS_Q6_col1")
	RAADS_Q6_C1.textContent = " ";
	if (RAADS_A_Q6 == 3) {
		RAADS_Q6_C1.textContent = "\u2713";  //\u2713
	};
	var RAADS_Q6_C2 = document.getElementById("RAADS_Q6_col2")
	RAADS_Q6_C2.textContent = " ";
	if (RAADS_A_Q6 == 2) {
		RAADS_Q6_C2.textContent = "\u2713";
	};
	var RAADS_Q6_C3 = document.getElementById("RAADS_Q6_col3")
	RAADS_Q6_C3.textContent = " ";
	if (RAADS_A_Q6 == 1) {
		RAADS_Q6_C3.textContent = "\u2713";
	};
	var RAADS_Q6_C4 = document.getElementById("RAADS_Q6_col4")
	RAADS_Q6_C4.textContent = " ";
	if (RAADS_A_Q6 == 0) {
		RAADS_Q6_C4.textContent = "\u2713";
	};




	RAADS_score = RAADS_A_Q6 + RAADS_A_Q5 + RAADS_A_Q4 + RAADS_A_Q3 + RAADS_A_Q2 + RAADS_A_Q1;

	if (RAADS_score > 7) {
		RAADS_interp = "Positive Screen";
		RAADS_interp_short = "POS";
	}
	else {
		RAADS_interp = "Negative Screen";
		RAADS_interp_short = "NEG";
	}

	var RAADS_Scr = document.getElementById("RAADS_Scr")
	RAADS_Scr.textContent = RAADS_score;

	var RAADS_Int = document.getElementById("RAADS_Int")
	RAADS_Int.textContent = RAADS_interp;


	// ECAA Code

	var RAADS_testname = 'RAADS';
	var RAADS_testcond = 'TabSINT5 Test';
	var RAADS_testsubcond = ' ';
	var RAADS_testear = ' ';
	var RAADS_testlvl = ' ';
	// RAADS_score
	var RAADS_testmaxscor = '24';
	// RAADS_interp_short
	var RAADS_testmeta = 'RAADS:  [' + RAADS_A_Q1 + ',' + RAADS_A_Q2 + ',' + RAADS_A_Q3 + ',' + RAADS_A_Q4 + ',' + RAADS_A_Q5 + ',' + RAADS_A_Q6;


	var testCode_RAADS = {
		"TABSINTtest": [
			[
				"Questionnaire",
				RAADS_testname,
				RAADS_testcond,
				RAADS_testsubcond,
				RAADS_testear,
				RAADS_testlvl,
				RAADS_score,
				RAADS_testmaxscor,
				RAADS_interp_short,
				RAADS_testmeta
			]

		]
	};

	// in TabSINT 4, 
	//	$scope.printQrCodeRAADS = function(){
	//		var qrcode = new QRCode(document.getElementById("qrcodeRAADS"), {text: JSON.stringify(testCode_RAADS),width: 225,height: 450,colorDark : "#000000",colorLight : "#ffffff",correctLevel : QRCode.CorrectLevel.H});
	//	};



	// NOTE: the barcode is now generated at the END of this file, after QRCode/PDF417
	// are defined. Generating it here threw "QRCode is not defined" because the
	// library is declared further down. (The old `textContent = RAADS_qrcode` line was
	// also removed: it overwrote the <canvas> the generator had just appended.)


	//UNCOMMENT FOR LOCAL TESTING
	//	 });  // end controller - stand-alone

	// QRCODE BLOCK
	var QRCode = function (el, vOption) {
		//    function QRCode(el, vOption) {  

		PDF417.init(vOption.text);

		var barcode = PDF417.getBarcodeArray();

		// block sizes (width and height) in pixels 
		var bw = 2;
		var bh = 2;

		// create canvas element based on number of columns and rows in barcode 
		//var qrcode = new QRCode(document.getElementById("qrcodeTripleDigit"), {text: testCode,width: 200,height: 200,colorDark : "#000000",colorLight : "#ffffff",correctLevel : QRCode.CorrectLevel.H});    
		var container = el;

		//container.removeChild(container.firstChild); 

		var canvas = document.createElement('canvas');
		canvas.width = bw * barcode['num_cols'];
		canvas.height = bh * barcode['num_rows'];
		container.appendChild(canvas);

		var ctx = canvas.getContext('2d');

		// graph barcode elements 
		var y = 0;
		// for each row 
		for (var r = 0; r < barcode['num_rows']; ++r) {
			var x = 0;
			// for each column 
			for (var c = 0; c < barcode['num_cols']; ++c) {
				if (barcode['bcode'][r][c] == 1) {
					ctx.fillRect(x, y, bw, bh);
				}
				x += bw;
			}
			y += bh;
		}
	}
	QRCode.CorrectLevel = {};
	QRCode.CorrectLevel.H = 2;

	/** 
	* Binary Calculator (BC) Arbitrary Precision Mathematics Lib v0.10  (LGPL) 
	* Copy of libbcmath included in PHP5 src 
	* supports bcadd, bcsub, bcmul, bcdiv, bccomp, bcscale, and new function bcround(val, precision) 
	* See PHP Manual for parameters.. functions work identical to the PHP5 funcions 
	* Feel free to use how-ever you want, just email any bug-fixes/improvements to the sourceforge project: 
	*      https://sourceforge.net/projects/bcmath-js/ 
	* 
	* Ported from the PHP5 bcmath extension source code, 
	* which uses the libbcmath package... 
	*    Copyright (C) 1991, 1992, 1993, 1994, 1997 Free Software Foundation, Inc. 
	*    Copyright (C) 2000 Philip A. Nelson 
	*     The Free Software Foundation, Inc. 
	*     59 Temple Place, Suite 330 
	*     Boston, MA 02111-1307 USA. 
	*      e-mail:  philnelson@acm.org 
	*     us-mail:  Philip A. Nelson 
	*               Computer Science Department, 9062 
	*               Western Washington University 
	*               Bellingham, WA 98226-9062 
	*/

	var libbcmath = { PLUS: "+", MINUS: "-", BASE: 10, scale: 0, bc_num: function () { this.n_sign = null; this.n_len = null; this.n_scale = null; this.n_value = null; this.toString = function () { var b, a; a = this.n_value.join(""); b = ((this.n_sign == libbcmath.PLUS) ? "" : this.n_sign) + a.substr(0, this.n_len); if (this.n_scale > 0) { b += "." + a.substr(this.n_len, this.n_scale) } return b }; this.setScale = function (a) { while (this.n_scale < a) { this.n_value.push(0); this.n_scale++ } while (this.n_scale > a) { this.n_value.pop(); this.n_scale-- } return this } }, bc_new_num: function (b, c) { var a; a = new libbcmath.bc_num(); a.n_sign = libbcmath.PLUS; a.n_len = b; a.n_scale = c; a.n_value = libbcmath.safe_emalloc(1, b + c, 0); libbcmath.memset(a.n_value, 0, 0, b + c); return a }, safe_emalloc: function (c, b, a) { return Array((c * b) + a) }, bc_init_num: function () { return new libbcmath.bc_new_num(1, 0) }, _bc_rm_leading_zeros: function (a) { while ((a.n_value[0] === 0) && (a.n_len > 1)) { a.n_value.shift(); a.n_len-- } }, php_str2num: function (b) { var a; a = b.indexOf("."); if (a == -1) { return libbcmath.bc_str2num(b, 0) } else { return libbcmath.bc_str2num(b, (b.length - a)) } }, CH_VAL: function (a) { return a - "0" }, BCD_CHAR: function (a) { return a + "0" }, isdigit: function (a) { return (isNaN(parseInt(a, 10)) ? false : true) }, bc_str2num: function (h, c) { var g, f, a, b, e, i, d; g = h.split(""); a = 0; b = 0; e = 0; i = false; if ((g[a] === "+") || (g[a] === "-")) { a++ } while (g[a] === "0") { a++ } while ((g[a]) % 1 === 0) { a++; b++ } if (g[a] === ".") { a++ } while ((g[a]) % 1 === 0) { a++; e++ } if ((g[a]) || (b + e === 0)) { return libbcmath.bc_init_num() } e = libbcmath.MIN(e, c); if (b === 0) { i = true; b = 1 } f = libbcmath.bc_new_num(b, e); a = 0; if (g[a] === "-") { f.n_sign = libbcmath.MINUS; a++ } else { f.n_sign = libbcmath.PLUS; if (g[a] === "+") { a++ } } while (g[a] === "0") { a++ } d = 0; if (i) { f.n_value[d++] = 0; b = 0 } for (; b > 0; b--) { f.n_value[d++] = libbcmath.CH_VAL(g[a++]) } if (e > 0) { a++; for (; e > 0; e--) { f.n_value[d++] = libbcmath.CH_VAL(g[a++]) } } return f }, cint: function (b) { if (typeof (b) == "undefined") { b = 0 } var a = parseInt(b, 10); if (isNaN(a)) { a = 0 } return a }, MIN: function (d, c) { return ((d > c) ? c : d) }, MAX: function (d, c) { return ((d > c) ? d : c) }, ODD: function (b) { return (b & 1) }, memset: function (d, e, c, a) { var b; for (b = 0; b < a; b++) { d[e + b] = c } }, memcpy: function (b, f, e, d, a) { var c; for (c = 0; c < a; c++) { b[f + c] = e[d + c] } return true }, bc_is_zero: function (a) { var b; var c; b = a.n_len + a.n_scale; c = 0; while ((b > 0) && (a.n_value[c++] === 0)) { b-- } if (b !== 0) { return false } else { return true } }, bc_out_of_memory: function () { throw new Error("(BC) Out of memory") } }; libbcmath.bc_add = function (f, d, c) { var e, b, a; if (f.n_sign === d.n_sign) { e = libbcmath._bc_do_add(f, d, c); e.n_sign = f.n_sign } else { b = libbcmath._bc_do_compare(f, d, false, false); switch (b) { case -1: e = libbcmath._bc_do_sub(d, f, c); e.n_sign = d.n_sign; break; case 0: a = libbcmath.MAX(c, libbcmath.MAX(f.n_scale, d.n_scale)); e = libbcmath.bc_new_num(1, a); libbcmath.memset(e.n_value, 0, 0, a + 1); break; case 1: e = libbcmath._bc_do_sub(f, d, c); e.n_sign = f.n_sign } } return e }; libbcmath.bc_compare = function (b, a) { return libbcmath._bc_do_compare(b, a, true, false) }; libbcmath._bc_do_compare = function (e, d, c, b) { var g, a; var f; if (c && (e.n_sign != d.n_sign)) { if (e.n_sign == libbcmath.PLUS) { return (1) } else { return (-1) } } if (e.n_len != d.n_len) { if (e.n_len > d.n_len) { if (!c || (e.n_sign == libbcmath.PLUS)) { return (1) } else { return (-1) } } else { if (!c || (e.n_sign == libbcmath.PLUS)) { return (-1) } else { return (1) } } } f = e.n_len + Math.min(e.n_scale, d.n_scale); g = 0; a = 0; while ((f > 0) && (e.n_value[g] == d.n_value[a])) { g++; a++; f-- } if (b && (f == 1) && (e.n_scale == d.n_scale)) { return (0) } if (f !== 0) { if (e.n_value[g] > d.n_value[a]) { if (!c || e.n_sign == libbcmath.PLUS) { return (1) } else { return (-1) } } else { if (!c || e.n_sign == libbcmath.PLUS) { return (-1) } else { return (1) } } } if (e.n_scale != d.n_scale) { if (e.n_scale > d.n_scale) { for (f = (e.n_scale - d.n_scale); f > 0; f--) { if (e.n_value[g++] !== 0) { if (!c || e.n_sign == libbcmath.PLUS) { return (1) } else { return (-1) } } } } else { for (f = (d.n_scale - e.n_scale); f > 0; f--) { if (d.n_value[a++] !== 0) { if (!c || e.n_sign == libbcmath.PLUS) { return (-1) } else { return (1) } } } } } return (0) }; libbcmath._one_mult = function (d, e, i, f, j, c) { var h, g; var b, a; if (f === 0) { libbcmath.memset(j, 0, 0, i) } else { if (f == 1) { libbcmath.memcpy(j, c, d, e, i) } else { b = e + i - 1; a = c + i - 1; h = 0; while (i-- > 0) { g = d[b--] * f + h; j[a--] = g % libbcmath.BASE; h = Math.floor(g / libbcmath.BASE) } if (h != 0) { j[a] = h } } } }; libbcmath.bc_divide = function (l, k, z) { var y; var w; var c, b; var p, o, h, x; var u, A; var j, i, s, q, a, g; var r, m, t, v; var e; var n; var f; var d; if (libbcmath.bc_is_zero(k)) { return -1 } if (libbcmath.bc_is_zero(l)) { return libbcmath.bc_new_num(1, z) } if (k.n_scale === 0) { if (k.n_len === 1 && k.n_value[0] === 1) { w = libbcmath.bc_new_num(l.n_len, z); w.n_sign = (l.n_sign == k.n_sign ? libbcmath.PLUS : libbcmath.MINUS); libbcmath.memset(w.n_value, l.n_len, 0, z); libbcmath.memcpy(w.n_value, 0, l.n_value, 0, l.n_len + libbcmath.MIN(l.n_scale, z)) } } s = k.n_scale; h = k.n_len + s - 1; while ((s > 0) && (k.n_value[h--] === 0)) { s-- } j = l.n_len + s; u = l.n_scale - s; if (u < z) { a = z - u } else { a = 0 } c = libbcmath.safe_emalloc(1, l.n_len + l.n_scale, a + 2); if (c === null) { libbcmath.bc_out_of_memory() } libbcmath.memset(c, 0, 0, l.n_len + l.n_scale + a + 2); libbcmath.memcpy(c, 1, l.n_value, 0, l.n_len + l.n_scale); i = k.n_len + s; b = libbcmath.safe_emalloc(1, i, 1); if (b === null) { libbcmath.bc_out_of_memory() } libbcmath.memcpy(b, 0, k.n_value, 0, i); b[i] = 0; h = 0; while (b[h] === 0) { h++; i-- } if (i > j + z) { q = z + 1; n = true } else { n = false; if (i > j) { q = z + 1 } else { q = j - i + z + 1 } } w = libbcmath.bc_new_num(q - z, z); libbcmath.memset(w.n_value, 0, 0, q); e = libbcmath.safe_emalloc(1, i, 1); if (e === null) { libbcmath.bc_out_of_memory() } if (!n) { f = Math.floor(10 / (k.n_value[h] + 1)); if (f != 1) { libbcmath._one_mult(c, 0, j + u + a + 1, f, c, 0); libbcmath._one_mult(k.n_value, h, i, f, k.n_value, h) } r = 0; if (i > j) { x = i - j } else { x = 0 } while (r <= j + z - i) { if (k.n_value[h] == c[r]) { m = 9 } else { m = Math.floor((c[r] * 10 + c[r + 1]) / k.n_value[h]) } if (k.n_value[h + 1] * m > (c[r] * 10 + c[r + 1] - k.n_value[h] * m) * 10 + c[r + 2]) { m--; if (k.n_value[h + 1] * m > (c[r] * 10 + c[r + 1] - k.n_value[h] * m) * 10 + c[r + 2]) { m-- } } t = 0; if (m !== 0) { e[0] = 0; libbcmath._one_mult(k.n_value, h, i, m, e, 1); p = r + i; o = i; for (g = 0; g < i + 1; g++) { if (o < 0) { A = c[p] - 0 - t } else { A = c[p] - e[o--] - t } if (A < 0) { A += 10; t = 1 } else { t = 0 } c[p--] = A } } if (t == 1) { m--; p = r + i; o = i - 1; v = 0; for (g = 0; g < i; g++) { if (o < 0) { A = c[p] + 0 + v } else { A = c[p] + k.n_value[o--] + v } if (A > 9) { A -= 10; v = 1 } else { v = 0 } c[p--] = A } if (v == 1) { c[p] = (c[p] + 1) % 10 } } w.n_value[x++] = m; r++ } } w.n_sign = (l.n_sign == k.n_sign ? libbcmath.PLUS : libbcmath.MINUS); if (libbcmath.bc_is_zero(w)) { w.n_sign = libbcmath.PLUS } libbcmath._bc_rm_leading_zeros(w); return w }; libbcmath._bc_do_add = function (h, g, i) { var f; var c, b; var k, e, j; var m, l, a; var d; c = libbcmath.MAX(h.n_scale, g.n_scale); b = libbcmath.MAX(h.n_len, g.n_len) + 1; f = libbcmath.bc_new_num(b, libbcmath.MAX(c, i)); l = h.n_scale; a = g.n_scale; k = (h.n_len + l - 1); e = (g.n_len + a - 1); j = (c + b - 1); if (l != a) { if (l > a) { while (l > a) { f.n_value[j--] = h.n_value[k--]; l-- } } else { while (a > l) { f.n_value[j--] = g.n_value[e--]; a-- } } } l += h.n_len; a += g.n_len; m = 0; while ((l > 0) && (a > 0)) { d = h.n_value[k--] + g.n_value[e--] + m; if (d >= libbcmath.BASE) { m = 1; d -= libbcmath.BASE } else { m = 0 } f.n_value[j] = d; j--; l--; a-- } if (l === 0) { while (a-- > 0) { d = g.n_value[e--] + m; if (d >= libbcmath.BASE) { m = 1; d -= libbcmath.BASE } else { m = 0 } f.n_value[j--] = d } } else { while (l-- > 0) { d = h.n_value[k--] + m; if (d >= libbcmath.BASE) { m = 1; d -= libbcmath.BASE } else { m = 0 } f.n_value[j--] = d } } if (m == 1) { f.n_value[j] += 1 } libbcmath._bc_rm_leading_zeros(f); return f }; libbcmath._bc_do_sub = function (h, g, i) { var l; var m, a; var d, f; var k, c, n; var j, e, b; a = libbcmath.MAX(h.n_len, g.n_len); m = libbcmath.MAX(h.n_scale, g.n_scale); f = libbcmath.MIN(h.n_len, g.n_len); d = libbcmath.MIN(h.n_scale, g.n_scale); l = libbcmath.bc_new_num(a, libbcmath.MAX(m, i)); k = (h.n_len + h.n_scale - 1); c = (g.n_len + g.n_scale - 1); n = (a + m - 1); j = 0; if (h.n_scale != d) { for (e = h.n_scale - d; e > 0; e--) { l.n_value[n--] = h.n_value[k--] } } else { for (e = g.n_scale - d; e > 0; e--) { b = 0 - g.n_value[c--] - j; if (b < 0) { b += libbcmath.BASE; j = 1 } else { j = 0; l.n_value[n--] = b } } } for (e = 0; e < f + d; e++) { b = h.n_value[k--] - g.n_value[c--] - j; if (b < 0) { b += libbcmath.BASE; j = 1 } else { j = 0 } l.n_value[n--] = b } if (a != f) { for (e = a - f; e > 0; e--) { b = h.n_value[k--] - j; if (b < 0) { b += libbcmath.BASE; j = 1 } else { j = 0 } l.n_value[n--] = b } } libbcmath._bc_rm_leading_zeros(l); return l }; libbcmath.MUL_BASE_DIGITS = 80; libbcmath.MUL_SMALL_DIGITS = (libbcmath.MUL_BASE_DIGITS / 4); libbcmath.bc_multiply = function (f, d, h) { var c; var b, a; var g, e; b = f.n_len + f.n_scale; a = d.n_len + d.n_scale; g = f.n_scale + d.n_scale; e = libbcmath.MIN(g, libbcmath.MAX(h, libbcmath.MAX(f.n_scale, d.n_scale))); c = libbcmath._bc_rec_mul(f, b, d, a, g); c.n_sign = (f.n_sign == d.n_sign ? libbcmath.PLUS : libbcmath.MINUS); c.n_len = a + b + 1 - g; c.n_scale = e; libbcmath._bc_rm_leading_zeros(c); if (libbcmath.bc_is_zero(c)) { c.n_sign = libbcmath.PLUS } return c }; libbcmath.new_sub_num = function (b, d, c) { var a = new libbcmath.bc_num(); a.n_sign = libbcmath.PLUS; a.n_len = b; a.n_scale = d; a.n_value = c; return a }; libbcmath._bc_simp_mul = function (i, b, h, m, a) { var j; var k, c, f; var n, l; var e, g, d; d = b + m + 1; j = libbcmath.bc_new_num(d, 0); n = b - 1; l = m - 1; f = d - 1; g = 0; for (e = 0; e < d - 1; e++) { k = n - libbcmath.MAX(0, e - m + 1); c = l - libbcmath.MIN(e, m - 1); while ((k >= 0) && (c <= l)) { g += i.n_value[k--] * h.n_value[c++] } j.n_value[f--] = Math.floor(g % libbcmath.BASE); g = Math.floor(g / libbcmath.BASE) } j.n_value[f] = g; return j }; libbcmath._bc_shift_addsub = function (b, g, a, d) { var c, h; var e, f; e = g.n_len; if (g.n_value[0] === 0) { e-- } if (!(b.n_len + b.n_scale >= a + e)) { throw new Error("len + scale < shift + count") } c = b.n_len + b.n_scale - a - 1; h = g.n_len = 1; f = 0; if (d) { while (e--) { b.n_value[c] -= g.n_value[h--] + f; if (b.n_value[c] < 0) { f = 1; b.n_value[c--] += libbcmath.BASE } else { f = 0; c-- } } while (f) { b.n_value[c] -= f; if (b.n_value[c] < 0) { b.n_value[c--] += libbcmath.BASE } else { f = 0 } } } else { while (e--) { b.n_value[c] += g.n_value[h--] + f; if (b.n_value[c] > (libbcmath.BASE - 1)) { f = 1; b.n_value[c--] -= libbcmath.BASE } else { f = 0; c-- } } while (f) { b.n_value[c] += f; if (b.n_value[c] > (libbcmath.BASE - 1)) { b.n_value[c--] -= libbcmath.BASE } else { f = 0 } } } return true }; libbcmath._bc_rec_mul = function (m, i, l, j, c) { var k; var s, r, h, g; var f, p; var d, b, a, y, x; var o, w, e; var q, t; if ((i + j) < libbcmath.MUL_BASE_DIGITS || i < libbcmath.MUL_SMALL_DIGITS || j < libbcmath.MUL_SMALL_DIGITS) { return libbcmath._bc_simp_mul(m, i, l, j, c) } o = Math.floor((libbcmath.MAX(i, j) + 1) / 2); if (i < o) { r = libbcmath.bc_init_num(); s = libbcmath.new_sub_num(i, 0, m.n_value) } else { r = libbcmath.new_sub_num(i - o, 0, m.n_value); s = libbcmath.new_sub_num(o, 0, m.n_value + i - o) } if (j < o) { g = libbcmath.bc_init_num(); h = libbcmath.new_sub_num(j, 0, l.n_value) } else { g = libbcmath.new_sub_num(j - o, 0, l.n_value); h = libbcmath.new_sub_num(o, 0, l.n_value + j - o) } libbcmath._bc_rm_leading_zeros(r); libbcmath._bc_rm_leading_zeros(s); f = s.n_len; libbcmath._bc_rm_leading_zeros(g); libbcmath._bc_rm_leading_zeros(h); p = h.n_len; e = libbcmath.bc_is_zero(r) || libbcmath.bc_is_zero(g); y = libbcmath.bc_init_num(); x = libbcmath.bc_init_num(); y = libbcmath.bc_sub(r, s, 0); q = y.n_len; x = libbcmath.bc_sub(h, g, 0); t = x.n_len; if (e) { d = libbcmath.bc_init_num() } else { d = libbcmath._bc_rec_mul(r, r.n_len, g, g.n_len, 0) } if (libbcmath.bc_is_zero(y) || libbcmath.bc_is_zero(x)) { b = libbcmath.bc_init_num() } else { b = libbcmath._bc_rec_mul(y, q, x, t, 0) } if (libbcmath.bc_is_zero(s) || libbcmath.bc_is_zero(h)) { a = libbcmath.bc_init_num() } else { a = libbcmath._bc_rec_mul(s, s.n_len, h, h.n_len, 0) } w = i + j + 1; k = libbcmath.bc_new_num(w, 0); if (!e) { libbcmath._bc_shift_addsub(k, d, 2 * o, 0); libbcmath._bc_shift_addsub(k, d, o, 0) } libbcmath._bc_shift_addsub(k, a, o, 0); libbcmath._bc_shift_addsub(k, a, 0, 0); libbcmath._bc_shift_addsub(k, b, o, y.n_sign != x.n_sign); return k }; libbcmath.bc_sub = function (e, d, c) { var f; var b, a; if (e.n_sign != d.n_sign) { f = libbcmath._bc_do_add(e, d, c); f.n_sign = e.n_sign } else { b = libbcmath._bc_do_compare(e, d, false, false); switch (b) { case -1: f = libbcmath._bc_do_sub(d, e, c); f.n_sign = (d.n_sign == libbcmath.PLUS ? libbcmath.MINUS : libbcmath.PLUS); break; case 0: a = libbcmath.MAX(c, libbcmath.MAX(e.n_scale, d.n_scale)); f = libbcmath.bc_new_num(1, a); libbcmath.memset(f.n_value, 0, 0, a + 1); break; case 1: f = libbcmath._bc_do_sub(e, d, c); f.n_sign = e.n_sign; break } } return f }; function bcadd(b, d, f) { var e, c, a; if (typeof (f) == "undefined") { f = libbcmath.scale } f = ((f < 0) ? 0 : f); e = libbcmath.bc_init_num(); c = libbcmath.bc_init_num(); a = libbcmath.bc_init_num(); e = libbcmath.php_str2num(b.toString()); c = libbcmath.php_str2num(d.toString()); if (e.n_scale > c.n_scale) { c.setScale(e.n_scale) } if (c.n_scale > e.n_scale) { e.setScale(c.n_scale) } a = libbcmath.bc_add(e, c, f); if (a.n_scale > f) { a.n_scale = f } return a.toString() } function bcsub(b, d, f) { var e, c, a; if (typeof (f) == "undefined") { f = libbcmath.scale } f = ((f < 0) ? 0 : f); e = libbcmath.bc_init_num(); c = libbcmath.bc_init_num(); a = libbcmath.bc_init_num(); e = libbcmath.php_str2num(b.toString()); c = libbcmath.php_str2num(d.toString()); if (e.n_scale > c.n_scale) { c.setScale(e.n_scale) } if (c.n_scale > e.n_scale) { e.setScale(c.n_scale) } a = libbcmath.bc_sub(e, c, f); if (a.n_scale > f) { a.n_scale = f } return a.toString() } function bccomp(a, c, e) { var d, b; if (typeof (e) == "undefined") { e = libbcmath.scale } e = ((e < 0) ? 0 : e); d = libbcmath.bc_init_num(); b = libbcmath.bc_init_num(); d = libbcmath.bc_str2num(a.toString(), e); b = libbcmath.bc_str2num(c.toString(), e); return libbcmath.bc_compare(d, b, e) } function bcscale(a) { a = parseInt(a, 10); if (isNaN(a)) { return false } if (a < 0) { return false } libbcmath.scale = a; return true } function bcdiv(b, d, f) { var e, c, a; if (typeof (f) == "undefined") { f = libbcmath.scale } f = ((f < 0) ? 0 : f); e = libbcmath.bc_init_num(); c = libbcmath.bc_init_num(); a = libbcmath.bc_init_num(); e = libbcmath.php_str2num(b.toString()); c = libbcmath.php_str2num(d.toString()); if (e.n_scale > c.n_scale) { c.setScale(e.n_scale) } if (c.n_scale > e.n_scale) { e.setScale(c.n_scale) } a = libbcmath.bc_divide(e, c, f); if (a === -1) { throw new Error(11, "(BC) Division by zero") } if (a.n_scale > f) { a.n_scale = f } return a.toString() } function bcmul(b, d, f) { var e, c, a; if (typeof (f) == "undefined") { f = libbcmath.scale } f = ((f < 0) ? 0 : f); e = libbcmath.bc_init_num(); c = libbcmath.bc_init_num(); a = libbcmath.bc_init_num(); e = libbcmath.php_str2num(b.toString()); c = libbcmath.php_str2num(d.toString()); if (e.n_scale > c.n_scale) { c.setScale(e.n_scale) } if (c.n_scale > e.n_scale) { e.setScale(c.n_scale) } a = libbcmath.bc_multiply(e, c, f); if (a.n_scale > f) { a.n_scale = f } return a.toString() } function bcround(d, b) { var a, c; a = "0." + Array(b + 1).join("0") + "5"; if (d.toString().substring(0, 1) == "-") { a = "-" + a } c = bcadd(d, a, b); return c };

	/** 
	 * PDF417 - 2D Barcode generator (LGPLv3) 
	 * 
	 * Ported from PHP - PDF417 class, version 1.0.005, from TCPDF library (http://www.tcpdf.org/) 
	 */

	var PDF417 = { ROWHEIGHT: 4, QUIETH: 2, QUIETV: 2, barcode_array: {}, start_pattern: "11111111010101000", stop_pattern: "111111101000101001", textsubmodes: [[65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 32, 253, 254, 255], [97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 32, 253, 254, 255], [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 38, 13, 9, 44, 58, 35, 45, 46, 36, 47, 43, 37, 42, 61, 94, 251, 32, 253, 254, 255], [59, 60, 62, 64, 91, 92, 93, 95, 96, 126, 33, 13, 9, 44, 58, 10, 45, 46, 36, 47, 34, 124, 42, 40, 41, 63, 123, 125, 39, 255]], textlatch: { "01": [27], "02": [28], "03": [28, 25], 10: [28, 28], 12: [28], 13: [28, 25], 20: [28], 21: [27], 23: [25], 30: [29], 31: [29, 27], 32: [29, 28] }, clusters: [[120256, 125680, 128380, 120032, 125560, 128318, 108736, 119920, 108640, 86080, 108592, 86048, 110016, 120560, 125820, 109792, 120440, 125758, 88256, 109680, 88160, 89536, 110320, 120700, 89312, 110200, 120638, 89200, 110140, 89840, 110460, 89720, 110398, 89980, 128506, 119520, 125304, 128190, 107712, 119408, 125244, 107616, 119352, 84032, 107568, 119324, 84e3, 107544, 83984, 108256, 119672, 125374, 85184, 108144, 119612, 85088, 108088, 119582, 85040, 108060, 85728, 108408, 119742, 85616, 108348, 85560, 108318, 85880, 108478, 85820, 85790, 107200, 119152, 125116, 107104, 119096, 125086, 83008, 107056, 119068, 82976, 107032, 82960, 82952, 83648, 107376, 119228, 83552, 107320, 119198, 83504, 107292, 83480, 83468, 83824, 107452, 83768, 107422, 83740, 83900, 106848, 118968, 125022, 82496, 106800, 118940, 82464, 106776, 118926, 82448, 106764, 82440, 106758, 82784, 106936, 119006, 82736, 106908, 82712, 106894, 82700, 82694, 106974, 82830, 82240, 106672, 118876, 82208, 106648, 118862, 82192, 106636, 82184, 106630, 82180, 82352, 82328, 82316, 82080, 118830, 106572, 106566, 82050, 117472, 124280, 127678, 103616, 117360, 124220, 103520, 117304, 124190, 75840, 103472, 75808, 104160, 117624, 124350, 76992, 104048, 117564, 76896, 103992, 76848, 76824, 77536, 104312, 117694, 77424, 104252, 77368, 77340, 77688, 104382, 77628, 77758, 121536, 126320, 128700, 121440, 126264, 128670, 111680, 121392, 126236, 111648, 121368, 126222, 111632, 121356, 103104, 117104, 124092, 112320, 103008, 117048, 124062, 112224, 121656, 126366, 93248, 74784, 102936, 117006, 93216, 112152, 93200, 75456, 103280, 117180, 93888, 75360, 103224, 117150, 93792, 112440, 121758, 93744, 75288, 93720, 75632, 103356, 94064, 75576, 103326, 94008, 112542, 93980, 75708, 94140, 75678, 94110, 121184, 126136, 128606, 111168, 121136, 126108, 111136, 121112, 126094, 111120, 121100, 111112, 111108, 102752, 116920, 123998, 111456, 102704, 116892, 91712, 74272, 121244, 116878, 91680, 74256, 102668, 91664, 111372, 102662, 74244, 74592, 102840, 116958, 92e3, 74544, 102812, 91952, 111516, 102798, 91928, 74508, 74502, 74680, 102878, 92088, 74652, 92060, 74638, 92046, 92126, 110912, 121008, 126044, 110880, 120984, 126030, 110864, 120972, 110856, 120966, 110852, 110850, 74048, 102576, 116828, 90944, 74016, 102552, 116814, 90912, 111e3, 121038, 90896, 73992, 102534, 90888, 110982, 90884, 74160, 102620, 91056, 74136, 102606, 91032, 111054, 91020, 74118, 91014, 91100, 91086, 110752, 120920, 125998, 110736, 120908, 110728, 120902, 110724, 110722, 73888, 102488, 116782, 90528, 73872, 102476, 90512, 110796, 102470, 90504, 73860, 90500, 73858, 73944, 90584, 90572, 90566, 120876, 120870, 110658, 102444, 73800, 90312, 90308, 90306, 101056, 116080, 123580, 100960, 116024, 70720, 100912, 115996, 70688, 100888, 70672, 70664, 71360, 101232, 116156, 71264, 101176, 116126, 71216, 101148, 71192, 71180, 71536, 101308, 71480, 101278, 71452, 71612, 71582, 118112, 124600, 127838, 105024, 118064, 124572, 104992, 118040, 124558, 104976, 118028, 104968, 118022, 100704, 115896, 123486, 105312, 100656, 115868, 79424, 70176, 118172, 115854, 79392, 105240, 100620, 79376, 70152, 79368, 70496, 100792, 115934, 79712, 70448, 118238, 79664, 105372, 100750, 79640, 70412, 79628, 70584, 100830, 79800, 70556, 79772, 70542, 70622, 79838, 122176, 126640, 128860, 122144, 126616, 128846, 122128, 126604, 122120, 126598, 122116, 104768, 117936, 124508, 113472, 104736, 126684, 124494, 113440, 122264, 126670, 113424, 104712, 117894, 113416, 122246, 104706, 69952, 100528, 115804, 78656, 69920, 100504, 115790, 96064, 78624, 104856, 117966, 96032, 113560, 122318, 100486, 96016, 78600, 104838, 96008, 69890, 70064, 100572, 78768, 70040, 100558, 96176, 78744, 104910, 96152, 113614, 70022, 78726, 70108, 78812, 70094, 96220, 78798, 122016, 126552, 128814, 122e3, 126540, 121992, 126534, 121988, 121986, 104608, 117848, 124462, 113056, 104592, 126574, 113040, 122060, 117830, 113032, 104580, 113028, 104578, 113026, 69792, 100440, 115758, 78240, 69776, 100428, 95136, 78224, 104652, 100422, 95120, 113100, 69764, 95112, 78212, 69762, 78210, 69848, 100462, 78296, 69836, 95192, 78284, 69830, 95180, 78278, 69870, 95214, 121936, 126508, 121928, 126502, 121924, 121922, 104528, 117804, 112848, 104520, 117798, 112840, 121958, 112836, 104514, 112834, 69712, 100396, 78032, 69704, 100390, 94672, 78024, 104550, 94664, 112870, 69698, 94660, 78018, 94658, 78060, 94700, 94694, 126486, 121890, 117782, 104484, 104482, 69672, 77928, 94440, 69666, 77922, 99680, 68160, 99632, 68128, 99608, 115342, 68112, 99596, 68104, 99590, 68448, 99768, 115422, 68400, 99740, 68376, 99726, 68364, 68358, 68536, 99806, 68508, 68494, 68574, 101696, 116400, 123740, 101664, 116376, 101648, 116364, 101640, 116358, 101636, 67904, 99504, 115292, 72512, 67872, 116444, 115278, 72480, 101784, 116430, 72464, 67848, 99462, 72456, 101766, 67842, 68016, 99548, 72624, 67992, 99534, 72600, 101838, 72588, 67974, 68060, 72668, 68046, 72654, 118432, 124760, 127918, 118416, 124748, 118408, 124742, 118404, 118402, 101536, 116312, 105888, 101520, 116300, 105872, 118476, 116294, 105864, 101508, 105860, 101506, 105858, 67744, 99416, 72096, 67728, 116334, 80800, 72080, 101580, 99398, 80784, 105932, 67716, 80776, 72068, 67714, 72066, 67800, 99438, 72152, 67788, 80856, 72140, 67782, 80844, 72134, 67822, 72174, 80878, 126800, 128940, 126792, 128934, 126788, 126786, 118352, 124716, 122576, 126828, 124710, 122568, 126822, 122564, 118338, 122562, 101456, 116268, 105680, 101448, 116262, 114128, 105672, 118374, 114120, 122598, 101442, 114116, 105666, 114114, 67664, 99372, 71888, 67656, 99366, 80336, 71880, 101478, 97232, 80328, 105702, 67650, 97224, 114150, 71874, 97220, 67692, 71916, 67686, 80364, 71910, 97260, 80358, 97254, 126760, 128918, 126756, 126754, 118312, 124694, 122472, 126774, 122468, 118306, 122466, 101416, 116246, 105576, 101412, 113896, 105572, 101410, 113892, 105570, 113890, 67624, 99350, 71784, 101430, 80104, 71780, 67618, 96744, 80100, 71778, 96740, 80098, 96738, 71798, 96758, 126738, 122420, 122418, 105524, 113780, 113778, 71732, 79988, 96500, 96498, 66880, 66848, 98968, 66832, 66824, 66820, 66992, 66968, 66956, 66950, 67036, 67022, 1e5, 99984, 115532, 99976, 115526, 99972, 99970, 66720, 98904, 69024, 100056, 98892, 69008, 100044, 69e3, 100038, 68996, 66690, 68994, 66776, 98926, 69080, 100078, 69068, 66758, 69062, 66798, 69102, 116560, 116552, 116548, 116546, 99920, 102096, 116588, 115494, 102088, 116582, 102084, 99906, 102082, 66640, 68816, 66632, 98854, 73168, 68808, 66628, 73160, 68804, 66626, 73156, 68802, 66668, 68844, 66662, 73196, 68838, 73190, 124840, 124836, 124834, 116520, 118632, 124854, 118628, 116514, 118626, 99880, 115478, 101992, 116534, 106216, 101988, 99874, 106212, 101986, 106210, 66600, 98838, 68712, 99894, 72936, 68708, 66594, 81384, 72932, 68706, 81380, 72930, 66614, 68726, 72950, 81398, 128980, 128978, 124820, 126900, 124818, 126898, 116500, 118580, 116498, 122740, 118578, 122738, 99860, 101940, 99858, 106100, 101938, 114420], [128352, 129720, 125504, 128304, 129692, 125472, 128280, 129678, 125456, 128268, 125448, 128262, 125444, 125792, 128440, 129758, 120384, 125744, 128412, 120352, 125720, 128398, 120336, 125708, 120328, 125702, 120324, 120672, 125880, 128478, 110144, 120624, 125852, 110112, 120600, 125838, 110096, 120588, 110088, 120582, 110084, 110432, 120760, 125918, 89664, 110384, 120732, 89632, 110360, 120718, 89616, 110348, 89608, 110342, 89952, 110520, 120798, 89904, 110492, 89880, 110478, 89868, 90040, 110558, 90012, 89998, 125248, 128176, 129628, 125216, 128152, 129614, 125200, 128140, 125192, 128134, 125188, 125186, 119616, 125360, 128220, 119584, 125336, 128206, 119568, 125324, 119560, 125318, 119556, 119554, 108352, 119728, 125404, 108320, 119704, 125390, 108304, 119692, 108296, 119686, 108292, 108290, 85824, 108464, 119772, 85792, 108440, 119758, 85776, 108428, 85768, 108422, 85764, 85936, 108508, 85912, 108494, 85900, 85894, 85980, 85966, 125088, 128088, 129582, 125072, 128076, 125064, 128070, 125060, 125058, 119200, 125144, 128110, 119184, 125132, 119176, 125126, 119172, 119170, 107424, 119256, 125166, 107408, 119244, 107400, 119238, 107396, 107394, 83872, 107480, 119278, 83856, 107468, 83848, 107462, 83844, 83842, 83928, 107502, 83916, 83910, 83950, 125008, 128044, 125e3, 128038, 124996, 124994, 118992, 125036, 118984, 125030, 118980, 118978, 106960, 119020, 106952, 119014, 106948, 106946, 82896, 106988, 82888, 106982, 82884, 82882, 82924, 82918, 124968, 128022, 124964, 124962, 118888, 124982, 118884, 118882, 106728, 118902, 106724, 106722, 82408, 106742, 82404, 82402, 124948, 124946, 118836, 118834, 106612, 106610, 124224, 127664, 129372, 124192, 127640, 129358, 124176, 127628, 124168, 127622, 124164, 124162, 117568, 124336, 127708, 117536, 124312, 127694, 117520, 124300, 117512, 124294, 117508, 117506, 104256, 117680, 124380, 104224, 117656, 124366, 104208, 117644, 104200, 117638, 104196, 104194, 77632, 104368, 117724, 77600, 104344, 117710, 77584, 104332, 77576, 104326, 77572, 77744, 104412, 77720, 104398, 77708, 77702, 77788, 77774, 128672, 129880, 93168, 128656, 129868, 92664, 128648, 129862, 92412, 128644, 128642, 124064, 127576, 129326, 126368, 124048, 129902, 126352, 128716, 127558, 126344, 124036, 126340, 124034, 126338, 117152, 124120, 127598, 121760, 117136, 124108, 121744, 126412, 124102, 121736, 117124, 121732, 117122, 121730, 103328, 117208, 124142, 112544, 103312, 117196, 112528, 121804, 117190, 112520, 103300, 112516, 103298, 112514, 75680, 103384, 117230, 94112, 75664, 103372, 94096, 112588, 103366, 94088, 75652, 94084, 75650, 75736, 103406, 94168, 75724, 94156, 75718, 94150, 75758, 128592, 129836, 91640, 128584, 129830, 91388, 128580, 91262, 128578, 123984, 127532, 126160, 123976, 127526, 126152, 128614, 126148, 123970, 126146, 116944, 124012, 121296, 116936, 124006, 121288, 126182, 121284, 116930, 121282, 102864, 116972, 111568, 102856, 116966, 111560, 121318, 111556, 102850, 111554, 74704, 102892, 92112, 74696, 102886, 92104, 111590, 92100, 74690, 92098, 74732, 92140, 74726, 92134, 128552, 129814, 90876, 128548, 90750, 128546, 123944, 127510, 126056, 128566, 126052, 123938, 126050, 116840, 123958, 121064, 116836, 121060, 116834, 121058, 102632, 116854, 111080, 121078, 111076, 102626, 111074, 74216, 102646, 91112, 74212, 91108, 74210, 91106, 74230, 91126, 128532, 90494, 128530, 123924, 126004, 123922, 126002, 116788, 120948, 116786, 120946, 102516, 110836, 102514, 110834, 73972, 90612, 73970, 90610, 128522, 123914, 125978, 116762, 120890, 102458, 110714, 123552, 127320, 129198, 123536, 127308, 123528, 127302, 123524, 123522, 116128, 123608, 127342, 116112, 123596, 116104, 123590, 116100, 116098, 101280, 116184, 123630, 101264, 116172, 101256, 116166, 101252, 101250, 71584, 101336, 116206, 71568, 101324, 71560, 101318, 71556, 71554, 71640, 101358, 71628, 71622, 71662, 127824, 129452, 79352, 127816, 129446, 79100, 127812, 78974, 127810, 123472, 127276, 124624, 123464, 127270, 124616, 127846, 124612, 123458, 124610, 115920, 123500, 118224, 115912, 123494, 118216, 124646, 118212, 115906, 118210, 100816, 115948, 105424, 100808, 115942, 105416, 118246, 105412, 100802, 105410, 70608, 100844, 79824, 70600, 100838, 79816, 105446, 79812, 70594, 79810, 70636, 79852, 70630, 79846, 129960, 95728, 113404, 129956, 95480, 113278, 129954, 95356, 95294, 127784, 129430, 78588, 128872, 129974, 95996, 78462, 128868, 127778, 95870, 128866, 123432, 127254, 124520, 123428, 126696, 128886, 123426, 126692, 124514, 126690, 115816, 123446, 117992, 115812, 122344, 117988, 115810, 122340, 117986, 122338, 100584, 115830, 104936, 100580, 113640, 104932, 100578, 113636, 104930, 113634, 70120, 100598, 78824, 70116, 96232, 78820, 70114, 96228, 78818, 96226, 70134, 78838, 129940, 94968, 113022, 129938, 94844, 94782, 127764, 78206, 128820, 127762, 95102, 128818, 123412, 124468, 123410, 126580, 124466, 126578, 115764, 117876, 115762, 122100, 117874, 122098, 100468, 104692, 100466, 113140, 104690, 113138, 69876, 78324, 69874, 95220, 78322, 95218, 129930, 94588, 94526, 127754, 128794, 123402, 124442, 126522, 115738, 117818, 121978, 100410, 104570, 112890, 69754, 78074, 94714, 94398, 123216, 127148, 123208, 127142, 123204, 123202, 115408, 123244, 115400, 123238, 115396, 115394, 99792, 115436, 99784, 115430, 99780, 99778, 68560, 99820, 68552, 99814, 68548, 68546, 68588, 68582, 127400, 129238, 72444, 127396, 72318, 127394, 123176, 127126, 123752, 123172, 123748, 123170, 123746, 115304, 123190, 116456, 115300, 116452, 115298, 116450, 99560, 115318, 101864, 99556, 101860, 99554, 101858, 68072, 99574, 72680, 68068, 72676, 68066, 72674, 68086, 72694, 129492, 80632, 105854, 129490, 80508, 80446, 127380, 72062, 127924, 127378, 80766, 127922, 123156, 123700, 123154, 124788, 123698, 124786, 115252, 116340, 115250, 118516, 116338, 118514, 99444, 101620, 99442, 105972, 101618, 105970, 67828, 72180, 67826, 80884, 72178, 80882, 97008, 114044, 96888, 113982, 96828, 96798, 129482, 80252, 130010, 97148, 80190, 97086, 127370, 127898, 128954, 123146, 123674, 124730, 126842, 115226, 116282, 118394, 122618, 99386, 101498, 105722, 114170, 67706, 71930, 80378, 96632, 113854, 96572, 96542, 80062, 96702, 96444, 96414, 96350, 123048, 123044, 123042, 115048, 123062, 115044, 115042, 99048, 115062, 99044, 99042, 67048, 99062, 67044, 67042, 67062, 127188, 68990, 127186, 123028, 123316, 123026, 123314, 114996, 115572, 114994, 115570, 98932, 100084, 98930, 100082, 66804, 69108, 66802, 69106, 129258, 73084, 73022, 127178, 127450, 123018, 123290, 123834, 114970, 115514, 116602, 98874, 99962, 102138, 66682, 68858, 73210, 81272, 106174, 81212, 81182, 72894, 81342, 97648, 114364, 97592, 114334, 97564, 97550, 81084, 97724, 81054, 97694, 97464, 114270, 97436, 97422, 80990, 97502, 97372, 97358, 97326, 114868, 114866, 98676, 98674, 66292, 66290, 123098, 114842, 115130, 98618, 99194, 66170, 67322, 69310, 73404, 73374, 81592, 106334, 81564, 81550, 73310, 81630, 97968, 114524, 97944, 114510, 97932, 97926, 81500, 98012, 81486, 97998, 97880, 114478, 97868, 97862, 81454, 97902, 97836, 97830, 69470, 73564, 73550, 81752, 106414, 81740, 81734, 73518, 81774, 81708, 81702], [109536, 120312, 86976, 109040, 120060, 86496, 108792, 119934, 86256, 108668, 86136, 129744, 89056, 110072, 129736, 88560, 109820, 129732, 88312, 109694, 129730, 88188, 128464, 129772, 89592, 128456, 129766, 89340, 128452, 89214, 128450, 125904, 128492, 125896, 128486, 125892, 125890, 120784, 125932, 120776, 125926, 120772, 120770, 110544, 120812, 110536, 120806, 110532, 84928, 108016, 119548, 84448, 107768, 119422, 84208, 107644, 84088, 107582, 84028, 129640, 85488, 108284, 129636, 85240, 108158, 129634, 85116, 85054, 128232, 129654, 85756, 128228, 85630, 128226, 125416, 128246, 125412, 125410, 119784, 125430, 119780, 119778, 108520, 119798, 108516, 108514, 83424, 107256, 119166, 83184, 107132, 83064, 107070, 83004, 82974, 129588, 83704, 107390, 129586, 83580, 83518, 128116, 83838, 128114, 125172, 125170, 119284, 119282, 107508, 107506, 82672, 106876, 82552, 106814, 82492, 82462, 129562, 82812, 82750, 128058, 125050, 119034, 82296, 106686, 82236, 82206, 82366, 82108, 82078, 76736, 103920, 117500, 76256, 103672, 117374, 76016, 103548, 75896, 103486, 75836, 129384, 77296, 104188, 129380, 77048, 104062, 129378, 76924, 76862, 127720, 129398, 77564, 127716, 77438, 127714, 124392, 127734, 124388, 124386, 117736, 124406, 117732, 117730, 104424, 117750, 104420, 104418, 112096, 121592, 126334, 92608, 111856, 121468, 92384, 111736, 121406, 92272, 111676, 92216, 111646, 92188, 75232, 103160, 117118, 93664, 74992, 103036, 93424, 112252, 102974, 93304, 74812, 93244, 74782, 93214, 129332, 75512, 103294, 129908, 129330, 93944, 75388, 129906, 93820, 75326, 93758, 127604, 75646, 128756, 127602, 94078, 128754, 124148, 126452, 124146, 126450, 117236, 121844, 117234, 121842, 103412, 103410, 91584, 111344, 121212, 91360, 111224, 121150, 91248, 111164, 91192, 111134, 91164, 91150, 74480, 102780, 91888, 74360, 102718, 91768, 111422, 91708, 74270, 91678, 129306, 74620, 129850, 92028, 74558, 91966, 127546, 128634, 124026, 126202, 116986, 121338, 102906, 90848, 110968, 121022, 90736, 110908, 90680, 110878, 90652, 90638, 74104, 102590, 91e3, 74044, 90940, 74014, 90910, 74174, 91070, 90480, 110780, 90424, 110750, 90396, 90382, 73916, 90556, 73886, 90526, 90296, 110686, 90268, 90254, 73822, 90334, 90204, 90190, 71136, 101112, 116094, 70896, 100988, 70776, 100926, 70716, 70686, 129204, 71416, 101246, 129202, 71292, 71230, 127348, 71550, 127346, 123636, 123634, 116212, 116210, 101364, 101362, 79296, 105200, 118140, 79072, 105080, 118078, 78960, 105020, 78904, 104990, 78876, 78862, 70384, 100732, 79600, 70264, 100670, 79480, 105278, 79420, 70174, 79390, 129178, 70524, 129466, 79740, 70462, 79678, 127290, 127866, 123514, 124666, 115962, 118266, 100858, 113376, 122232, 126654, 95424, 113264, 122172, 95328, 113208, 122142, 95280, 113180, 95256, 113166, 95244, 78560, 104824, 117950, 95968, 78448, 104764, 95856, 113468, 104734, 95800, 78364, 95772, 78350, 95758, 70008, 100542, 78712, 69948, 96120, 78652, 69918, 96060, 78622, 96030, 70078, 78782, 96190, 94912, 113008, 122044, 94816, 112952, 122014, 94768, 112924, 94744, 112910, 94732, 94726, 78192, 104636, 95088, 78136, 104606, 95032, 113054, 95004, 78094, 94990, 69820, 78268, 69790, 95164, 78238, 95134, 94560, 112824, 121950, 94512, 112796, 94488, 112782, 94476, 94470, 78008, 104542, 94648, 77980, 94620, 77966, 94606, 69726, 78046, 94686, 94384, 112732, 94360, 112718, 94348, 94342, 77916, 94428, 77902, 94414, 94296, 112686, 94284, 94278, 77870, 94318, 94252, 94246, 68336, 99708, 68216, 99646, 68156, 68126, 68476, 68414, 127162, 123258, 115450, 99834, 72416, 101752, 116414, 72304, 101692, 72248, 101662, 72220, 72206, 67960, 99518, 72568, 67900, 72508, 67870, 72478, 68030, 72638, 80576, 105840, 118460, 80480, 105784, 118430, 80432, 105756, 80408, 105742, 80396, 80390, 72048, 101564, 80752, 71992, 101534, 80696, 71964, 80668, 71950, 80654, 67772, 72124, 67742, 80828, 72094, 80798, 114016, 122552, 126814, 96832, 113968, 122524, 96800, 113944, 122510, 96784, 113932, 96776, 113926, 96772, 80224, 105656, 118366, 97120, 80176, 105628, 97072, 114076, 105614, 97048, 80140, 97036, 80134, 97030, 71864, 101470, 80312, 71836, 97208, 80284, 71822, 97180, 80270, 97166, 67678, 71902, 80350, 97246, 96576, 113840, 122460, 96544, 113816, 122446, 96528, 113804, 96520, 113798, 96516, 96514, 80048, 105564, 96688, 80024, 105550, 96664, 113870, 96652, 80006, 96646, 71772, 80092, 71758, 96732, 80078, 96718, 96416, 113752, 122414, 96400, 113740, 96392, 113734, 96388, 96386, 79960, 105518, 96472, 79948, 96460, 79942, 96454, 71726, 79982, 96494, 96336, 113708, 96328, 113702, 96324, 96322, 79916, 96364, 79910, 96358, 96296, 113686, 96292, 96290, 79894, 96310, 66936, 99006, 66876, 66846, 67006, 68976, 100028, 68920, 99998, 68892, 68878, 66748, 69052, 66718, 69022, 73056, 102072, 116574, 73008, 102044, 72984, 102030, 72972, 72966, 68792, 99934, 73144, 68764, 73116, 68750, 73102, 66654, 68830, 73182, 81216, 106160, 118620, 81184, 106136, 118606, 81168, 106124, 81160, 106118, 81156, 81154, 72880, 101980, 81328, 72856, 101966, 81304, 106190, 81292, 72838, 81286, 68700, 72924, 68686, 81372, 72910, 81358, 114336, 122712, 126894, 114320, 122700, 114312, 122694, 114308, 114306, 81056, 106072, 118574, 97696, 81040, 106060, 97680, 114380, 106054, 97672, 81028, 97668, 81026, 97666, 72792, 101934, 81112, 72780, 97752, 81100, 72774, 97740, 81094, 97734, 68654, 72814, 81134, 97774, 114256, 122668, 114248, 122662, 114244, 114242, 80976, 106028, 97488, 80968, 106022, 97480, 114278, 97476, 80962, 97474, 72748, 81004, 72742, 97516, 80998, 97510, 114216, 122646, 114212, 114210, 80936, 106006, 97384, 80932, 97380, 80930, 97378, 72726, 80950, 97398, 114196, 114194, 80916, 97332, 80914, 97330, 66236, 66206, 67256, 99166, 67228, 67214, 66142, 67294, 69296, 100188, 69272, 100174, 69260, 69254, 67164, 69340, 67150, 69326, 73376, 102232, 116654, 73360, 102220, 73352, 102214, 73348, 73346, 69208, 100142, 73432, 102254, 73420, 69190, 73414, 67118, 69230, 73454, 106320, 118700, 106312, 118694, 106308, 106306, 73296, 102188, 81616, 106348, 102182, 81608, 73284, 81604, 73282, 81602, 69164, 73324, 69158, 81644, 73318, 81638, 122792, 126934, 122788, 122786, 106280, 118678, 114536, 106276, 114532, 106274, 114530, 73256, 102166, 81512, 73252, 98024, 81508, 73250, 98020, 81506, 98018, 69142, 73270, 81526, 98038, 122772, 122770, 106260, 114484, 106258, 114482, 73236, 81460, 73234, 97908, 81458, 97906, 122762, 106250, 114458, 73226, 81434, 97850, 66396, 66382, 67416, 99246, 67404, 67398, 66350, 67438, 69456, 100268, 69448, 100262, 69444, 69442, 67372, 69484, 67366, 69478, 102312, 116694, 102308, 102306, 69416, 100246, 73576, 102326, 73572, 69410, 73570, 67350, 69430, 73590, 118740, 118738, 102292, 106420, 102290, 106418, 69396, 73524, 69394, 81780, 73522, 81778, 118730, 102282, 106394, 69386, 73498, 81722, 66476, 66470, 67496, 99286, 67492, 67490, 66454, 67510, 100308, 100306, 67476, 69556, 67474, 69554, 116714]], rsfactors: [[27, 917], [522, 568, 723, 809], [237, 308, 436, 284, 646, 653, 428, 379], [274, 562, 232, 755, 599, 524, 801, 132, 295, 116, 442, 428, 295, 42, 176, 65], [361, 575, 922, 525, 176, 586, 640, 321, 536, 742, 677, 742, 687, 284, 193, 517, 273, 494, 263, 147, 593, 800, 571, 320, 803, 133, 231, 390, 685, 330, 63, 410], [539, 422, 6, 93, 862, 771, 453, 106, 610, 287, 107, 505, 733, 877, 381, 612, 723, 476, 462, 172, 430, 609, 858, 822, 543, 376, 511, 400, 672, 762, 283, 184, 440, 35, 519, 31, 460, 594, 225, 535, 517, 352, 605, 158, 651, 201, 488, 502, 648, 733, 717, 83, 404, 97, 280, 771, 840, 629, 4, 381, 843, 623, 264, 543], [521, 310, 864, 547, 858, 580, 296, 379, 53, 779, 897, 444, 400, 925, 749, 415, 822, 93, 217, 208, 928, 244, 583, 620, 246, 148, 447, 631, 292, 908, 490, 704, 516, 258, 457, 907, 594, 723, 674, 292, 272, 96, 684, 432, 686, 606, 860, 569, 193, 219, 129, 186, 236, 287, 192, 775, 278, 173, 40, 379, 712, 463, 646, 776, 171, 491, 297, 763, 156, 732, 95, 270, 447, 90, 507, 48, 228, 821, 808, 898, 784, 663, 627, 378, 382, 262, 380, 602, 754, 336, 89, 614, 87, 432, 670, 616, 157, 374, 242, 726, 600, 269, 375, 898, 845, 454, 354, 130, 814, 587, 804, 34, 211, 330, 539, 297, 827, 865, 37, 517, 834, 315, 550, 86, 801, 4, 108, 539], [524, 894, 75, 766, 882, 857, 74, 204, 82, 586, 708, 250, 905, 786, 138, 720, 858, 194, 311, 913, 275, 190, 375, 850, 438, 733, 194, 280, 201, 280, 828, 757, 710, 814, 919, 89, 68, 569, 11, 204, 796, 605, 540, 913, 801, 700, 799, 137, 439, 418, 592, 668, 353, 859, 370, 694, 325, 240, 216, 257, 284, 549, 209, 884, 315, 70, 329, 793, 490, 274, 877, 162, 749, 812, 684, 461, 334, 376, 849, 521, 307, 291, 803, 712, 19, 358, 399, 908, 103, 511, 51, 8, 517, 225, 289, 470, 637, 731, 66, 255, 917, 269, 463, 830, 730, 433, 848, 585, 136, 538, 906, 90, 2, 290, 743, 199, 655, 903, 329, 49, 802, 580, 355, 588, 188, 462, 10, 134, 628, 320, 479, 130, 739, 71, 263, 318, 374, 601, 192, 605, 142, 673, 687, 234, 722, 384, 177, 752, 607, 640, 455, 193, 689, 707, 805, 641, 48, 60, 732, 621, 895, 544, 261, 852, 655, 309, 697, 755, 756, 60, 231, 773, 434, 421, 726, 528, 503, 118, 49, 795, 32, 144, 500, 238, 836, 394, 280, 566, 319, 9, 647, 550, 73, 914, 342, 126, 32, 681, 331, 792, 620, 60, 609, 441, 180, 791, 893, 754, 605, 383, 228, 749, 760, 213, 54, 297, 134, 54, 834, 299, 922, 191, 910, 532, 609, 829, 189, 20, 167, 29, 872, 449, 83, 402, 41, 656, 505, 579, 481, 173, 404, 251, 688, 95, 497, 555, 642, 543, 307, 159, 924, 558, 648, 55, 497, 10], [352, 77, 373, 504, 35, 599, 428, 207, 409, 574, 118, 498, 285, 380, 350, 492, 197, 265, 920, 155, 914, 299, 229, 643, 294, 871, 306, 88, 87, 193, 352, 781, 846, 75, 327, 520, 435, 543, 203, 666, 249, 346, 781, 621, 640, 268, 794, 534, 539, 781, 408, 390, 644, 102, 476, 499, 290, 632, 545, 37, 858, 916, 552, 41, 542, 289, 122, 272, 383, 800, 485, 98, 752, 472, 761, 107, 784, 860, 658, 741, 290, 204, 681, 407, 855, 85, 99, 62, 482, 180, 20, 297, 451, 593, 913, 142, 808, 684, 287, 536, 561, 76, 653, 899, 729, 567, 744, 390, 513, 192, 516, 258, 240, 518, 794, 395, 768, 848, 51, 610, 384, 168, 190, 826, 328, 596, 786, 303, 570, 381, 415, 641, 156, 237, 151, 429, 531, 207, 676, 710, 89, 168, 304, 402, 40, 708, 575, 162, 864, 229, 65, 861, 841, 512, 164, 477, 221, 92, 358, 785, 288, 357, 850, 836, 827, 736, 707, 94, 8, 494, 114, 521, 2, 499, 851, 543, 152, 729, 771, 95, 248, 361, 578, 323, 856, 797, 289, 51, 684, 466, 533, 820, 669, 45, 902, 452, 167, 342, 244, 173, 35, 463, 651, 51, 699, 591, 452, 578, 37, 124, 298, 332, 552, 43, 427, 119, 662, 777, 475, 850, 764, 364, 578, 911, 283, 711, 472, 420, 245, 288, 594, 394, 511, 327, 589, 777, 699, 688, 43, 408, 842, 383, 721, 521, 560, 644, 714, 559, 62, 145, 873, 663, 713, 159, 672, 729, 624, 59, 193, 417, 158, 209, 563, 564, 343, 693, 109, 608, 563, 365, 181, 772, 677, 310, 248, 353, 708, 410, 579, 870, 617, 841, 632, 860, 289, 536, 35, 777, 618, 586, 424, 833, 77, 597, 346, 269, 757, 632, 695, 751, 331, 247, 184, 45, 787, 680, 18, 66, 407, 369, 54, 492, 228, 613, 830, 922, 437, 519, 644, 905, 789, 420, 305, 441, 207, 300, 892, 827, 141, 537, 381, 662, 513, 56, 252, 341, 242, 797, 838, 837, 720, 224, 307, 631, 61, 87, 560, 310, 756, 665, 397, 808, 851, 309, 473, 795, 378, 31, 647, 915, 459, 806, 590, 731, 425, 216, 548, 249, 321, 881, 699, 535, 673, 782, 210, 815, 905, 303, 843, 922, 281, 73, 469, 791, 660, 162, 498, 308, 155, 422, 907, 817, 187, 62, 16, 425, 535, 336, 286, 437, 375, 273, 610, 296, 183, 923, 116, 667, 751, 353, 62, 366, 691, 379, 687, 842, 37, 357, 720, 742, 330, 5, 39, 923, 311, 424, 242, 749, 321, 54, 669, 316, 342, 299, 534, 105, 667, 488, 640, 672, 576, 540, 316, 486, 721, 610, 46, 656, 447, 171, 616, 464, 190, 531, 297, 321, 762, 752, 533, 175, 134, 14, 381, 433, 717, 45, 111, 20, 596, 284, 736, 138, 646, 411, 877, 669, 141, 919, 45, 780, 407, 164, 332, 899, 165, 726, 600, 325, 498, 655, 357, 752, 768, 223, 849, 647, 63, 310, 863, 251, 366, 304, 282, 738, 675, 410, 389, 244, 31, 121, 303, 263]], init: function (r, t, e) { if (r = unescape(encodeURIComponent(r)), t = t || -1, e = e || 2, this.barcode_array = {}, "" === r) return !1; var sequence = this.getInputSequences(r), codewords = []; for (var a = 0; a < sequence.length; a++) { var s = this.getCompaction(sequence[a][0], sequence[a][1], !0); codewords = codewords.concat(s) } 900 == codewords[0] && codewords.shift(); var i = codewords.length; if (i > 925) return !1; t = this.getErrorCorrectionLevel(t, i); var n = 2 << t, c = i + n + 1, o = Math.round((Math.sqrt(4761 + 68 * e * this.ROWHEIGHT * c) - 69) / 34); 1 > o ? o = 1 : o > 30 && (o = 30); var h = Math.ceil(c / o), u = o * h; (3 > h || h > 90) && (3 > h ? h = 3 : h > 90 && (h = 90), o = Math.ceil(u / h), u = o * h), u > 928 && (Math.abs(e - 493 / 32) < Math.abs(e - 272 / 58) ? (o = 29, h = 32) : (o = 16, h = 58), u = 928); var f = u - c; f > 0 && (u - h == c ? (--h, u -= h) : codewords = codewords.concat(this._array_fill(0, f, 900))); var l = u - n; codewords.unshift(l); var d = this.getErrorCorrection(codewords, t); codewords = codewords.concat(d); var _ = this._str_repeat("0", this.QUIETH) + this.start_pattern, v = this.stop_pattern + "" + this._str_repeat("0", this.QUIETH); this.barcode_array.num_rows = h * this.ROWHEIGHT + 2 * this.QUIETV, this.barcode_array.num_cols = 17 * (o + 2) + 35 + 2 * this.QUIETH, this.barcode_array.bcode = []; var g; if (this.QUIETV > 0) { g = this._array_fill(0, this.barcode_array.num_cols, 0); for (var a = 0; a < this.QUIETV; ++a)this.barcode_array.bcode.push(g) } for (var b, p = 0, E = 0, m = 0; h > m; ++m) { var y = _; switch (E) { case 0: b = 30 * this._intval(m / 3) + this._intval((h - 1) / 3); break; case 1: b = 30 * this._intval(m / 3) + 3 * t + (h - 1) % 3; break; case 2: b = 30 * this._intval(m / 3) + (o - 1) }y += this._sprintf("%17b", this.clusters[E][b]); for (var x = 0; o > x; ++x)y += this._sprintf("%17b", this.clusters[E][codewords[p]]), ++p; switch (E) { case 0: b = 30 * this._intval(m / 3) + (o - 1); break; case 1: b = 30 * this._intval(m / 3) + this._intval((h - 1) / 3); break; case 2: b = 30 * this._intval(m / 3) + 3 * t + (h - 1) % 3 }y += this._sprintf("%17b", this.clusters[E][b]), y += v; for (var I = this._preg_split("//", y, -1, "PREG_SPLIT_NO_EMPTY"), w = 0; w < this.ROWHEIGHT; ++w)this.barcode_array.bcode.push(I); ++E, E > 2 && (E = 0) } if (this.QUIETV > 0) for (var a = 0; a < this.QUIETV; ++a)this.barcode_array.bcode.push(g) }, getInputSequences: function (r) { var t = [], e = []; if (e = r.match(/([0-9]{13,44})/g), null == e) e = []; else for (var a = 0, s = 0; a < e.length; a++)s = r.indexOf(e[a], s), e[a] = [e[a], s], s += e[a][0].length; e.push(["", r.length]); for (var s = 0, i = 0; i < e.length; i++) { var n = e[i], c = n[0].length; if (n[1] > 0) { var o = r.substr(s, n[1] - s), h = []; if (h = o.match(/([\x09\x0a\x0d\x20-\x7e]{5,})/g), null == h) h = []; else for (var a = 0; a < h.length; a++) { var s = o.indexOf(h[a]); h[a] = [h[a], s] } h.push(["", o.length]); for (var u = 0, f = 0; f < h.length; f++) { var l = h[f], d = l[0].length; if (l[1] > 0) { var _ = o.substr(u, l[1] - u); _.length > 0 && (1 == _.length && t.length > 0 && 900 == t[t.length - 1][0] ? t.push([913, _]) : _.length % 6 == 0 ? t.push([924, _]) : t.push([901, _])) } d > 0 && t.push([900, l[0]]), u = l[1] + d } } c > 0 && t.push([902, n[0]]), s = n[1] + c } return t }, getCompaction: function (r, t, e) { e = e || !0; var a = []; switch (r) { case 900: for (var s = 0, i = [], n = t.length, c = 0; n > c; ++c) { var o, h = this._ord(t.charAt(c)); if ((o = this._array_search(h, this.textsubmodes[s])) !== !1) i.push(o); else for (var u = 0; 4 > u; ++u)if (u != s && (o = this._array_search(h, this.textsubmodes[u])) !== !1) { (c + 1 == n || n > c + 1 && this._array_search(this._ord(t.charAt(c + 1)), this.textsubmodes[s]) !== !1) && (3 == u || 0 == u && 1 == s) ? 3 == u ? i.push(29) : i.push(27) : (i = i.concat(this.textlatch["" + s + u]), s = u), i.push(o); break } } var f = i.length; f % 2 != 0 && (i.push(29), ++f); for (var c = 0; f > c; c += 2)a.push(30 * parseInt(i[c]) + parseInt(i[c + 1])); break; case 901: case 924: for (var l, d, n; (n = t.length) > 0;) { if (n > 6 ? (l = t.substring(6), t = t.substring(0, 6), d = 6) : (l = "", d = t.length), 6 == d) { var _ = bcmul("" + this._ord(t.charAt(0)), "1099511627776"); _ = bcadd(_, bcmul("" + this._ord(t.charAt(1)), "4294967296")), _ = bcadd(_, bcmul("" + this._ord(t.charAt(2)), "16777216")), _ = bcadd(_, bcmul("" + this._ord(t.charAt(3)), "65536")), _ = bcadd(_, bcmul("" + this._ord(t.charAt(4)), "256")), _ = bcadd(_, "" + this._ord(t.charAt(5))); var v = []; do { var g = this._my_bcmod(_, "900"); _ = bcdiv(_, "900"), v.unshift(g) } while ("0" != _); a = a.concat(v) } else for (var c = 0; d > c; ++c)a.push(this._ord(t.charAt(c))); t = l } break; case 902: for (var l, n; (n = t.length) > 0;) { n > 44 ? (l = t.substring(44), t = t.substring(0, 44)) : l = ""; var _ = "1" + t; do { var g = this._my_bcmod(_, "900"); _ = bcdiv(_, "900"), a.unshift(g) } while ("0" != _); t = l } break; case 913: a.push(this._ord(t)) }return e && a.unshift(r), a }, getErrorCorrectionLevel: function (r, t) { for (var e = 8, a = 928 - t; e > 0;) { var s = 2 << r; if (a >= s) break; --e } return (0 > r || r > 8) && (r = 41 > t ? 2 : 161 > t ? 3 : 321 > t ? 4 : 864 > t ? 5 : e), r > e && (r = e), r }, getErrorCorrection: function (r, t) { for (var e = this.rsfactors[t], a = 2 << t, s = a - 1, i = this._array_fill(0, a, 0), n = 0; n < r.length; n++) { for (var c = (r[n] + i[s]) % 929, o = s; o > 0; --o) { var h = c * e[o] % 929, u = 929 - h; i[o] = (i[o - 1] + u) % 929 } h = c * e[0] % 929, u = 929 - h, i[0] = u % 929 } for (var o = 0; o < i.length; o++)0 != i[o] && (i[o] = 929 - i[o]); return i = i.reverse() }, getBarcodeArray: function () { return this.barcode_array }, _array_fill: function (r, t, e) { var a, s = {}; if (0 == r) { for (var i = [], n = 0; t > n; n++)i.push(e); return i } if (!isNaN(r) && !isNaN(t)) for (a = 0; t > a; a++)s[a + r] = e; return s }, _str_repeat: function (r, t) { for (var e = ""; ;) { if (1 & t && (e += r), t >>= 1, !t) break; r += r } return e }, _intval: function (r, t) { var e, a = typeof r; return "boolean" === a ? +r : "string" === a ? (e = parseInt(r, t || 10), isNaN(e) || !isFinite(e) ? 0 : e) : "number" === a && isFinite(r) ? 0 | r : 0 }, _sprintf: function () { var r = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g, t = arguments, e = 0, a = t[e++], s = function (r, t, e, a) { e || (e = " "); var s = r.length >= t ? "" : Array(1 + t - r.length >>> 0).join(e); return a ? r + s : s + r }, i = function (r, t, e, a, i, n) { var c = a - r.length; return c > 0 && (r = e || !i ? s(r, a, n, e) : r.slice(0, t.length) + s("", c, "0", !0) + r.slice(t.length)), r }, n = function (r, t, e, a, n, c, o) { var h = r >>> 0; return e = e && h && { 2: "0b", 8: "0", 16: "0x" }[t] || "", r = e + s(h.toString(t), c || 0, "0", !1), i(r, e, a, n, o) }, c = function (r, t, e, a, s, n) { return null != a && (r = r.slice(0, a)), i(r, "", t, e, s, n) }, o = function (r, a, o, h, u, f, l) { var d, _, v, g, b; if ("%%" == r) return "%"; for (var p = !1, E = "", m = !1, y = !1, x = " ", I = o.length, w = 0; o && I > w; w++)switch (o.charAt(w)) { case " ": E = " "; break; case "+": E = "+"; break; case "-": p = !0; break; case "'": x = o.charAt(w + 1); break; case "0": m = !0; break; case "#": y = !0 }if (h = h ? "*" == h ? +t[e++] : "*" == h.charAt(0) ? +t[h.slice(1, -1)] : +h : 0, 0 > h && (h = -h, p = !0), !isFinite(h)) throw new Error("sprintf: (minimum-)width must be finite"); switch (f = f ? "*" == f ? +t[e++] : "*" == f.charAt(0) ? +t[f.slice(1, -1)] : +f : "fFeE".indexOf(l) > -1 ? 6 : "d" == l ? 0 : void 0, b = a ? t[a.slice(0, -1)] : t[e++], l) { case "s": return c(String(b), p, h, f, m, x); case "c": return c(String.fromCharCode(+b), p, h, f, m); case "b": return n(b, 2, y, p, h, f, m); case "o": return n(b, 8, y, p, h, f, m); case "x": return n(b, 16, y, p, h, f, m); case "X": return n(b, 16, y, p, h, f, m).toUpperCase(); case "u": return n(b, 10, y, p, h, f, m); case "i": case "d": return d = +b || 0, d = Math.round(d - d % 1), _ = 0 > d ? "-" : E, b = _ + s(String(Math.abs(d)), f, "0", !1), i(b, _, p, h, m); case "e": case "E": case "f": case "F": case "g": case "G": return d = +b, _ = 0 > d ? "-" : E, v = ["toExponential", "toFixed", "toPrecision"]["efg".indexOf(l.toLowerCase())], g = ["toString", "toUpperCase"]["eEfFgG".indexOf(l) % 2], b = _ + Math.abs(d)[v](f), i(b, _, p, h, m)[g](); default: return r } }; return a.replace(r, o) }, _preg_split: function (r, t, e, a) { e = e || 0, a = a || ""; var s, i = [], n = 0, c = 0, o = !1, h = !1, u = !1, f = {}, l = 0, d = /^\/(.*)\/\w*$/.exec(r.toString())[1], _ = /^\/.*\/(\w*)$/.exec(r.toString())[1]; if (r = r.global && "string" != typeof r ? r : new RegExp(d, _ + (-1 !== _.indexOf("g") ? "" : "g")), f = { PREG_SPLIT_NO_EMPTY: 1, PREG_SPLIT_DELIM_CAPTURE: 2, PREG_SPLIT_OFFSET_CAPTURE: 4 }, "number" != typeof a) { for (a = [].concat(a), c = 0; c < a.length; c++)f[a[c]] && (l |= f[a[c]]); a = l } o = a & f.PREG_SPLIT_NO_EMPTY, h = a & f.PREG_SPLIT_DELIM_CAPTURE, u = a & f.PREG_SPLIT_OFFSET_CAPTURE; var v = function (r, t) { (!o || r.length) && (u && (r = [r, t]), i.push(r)) }; if (!d) { for (s = t.split(""), c = 0; c < s.length; c++)v(s[c], c); return i } for (; (s = r.exec(t)) && 1 !== e;) { if (v(t.slice(n, s.index), n), n = s.index + s[0].length, h) { var g = Array.prototype.slice.call(s); for (c = 1; c < g.length; c++)void 0 !== s[c] && v(s[c], s.index + s[0].indexOf(s[c])) } e-- } return v(t.slice(n, t.length), n), i }, _ord: function (r) { return r.charCodeAt(0) }, _array_search: function (r, t, e) { var a = !!e, s = ""; if (t && "object" == typeof t && t.change_key_case) return t.search(r, e); if ("object" == typeof r && r.exec) { if (!a) { var i = "i" + (r.global ? "g" : "") + (r.multiline ? "m" : "") + (r.sticky ? "y" : ""); r = new RegExp(r.source, i) } for (s in t) if (r.test(t[s])) return s; return !1 } for (s in t) if (a && t[s] === r || !a && t[s] == r) return s; return !1 }, _my_bcmod: function (r, t) { var e = 5, a = ""; do { var s = parseInt(a + "" + r.substring(0, e)); r = r.substring(e), a = s % t } while (r.length); return parseInt(a) } };

	// QRCODE BLOCK

	// --- Generate the PDF417 barcode ---
	// Runs LAST, after QRCode + PDF417 (+ libbcmath) are defined above, so the
	// constructor is in scope. The QRCode() function renders a PDF417 barcode onto a
	// <canvas> it appends to the target cell (suitable for the external handheld scanner).
	var QRcodeRAADS = document.getElementById("qrcodeRAADS");
	if (QRcodeRAADS) {
		new QRCode(QRcodeRAADS, {
			text: JSON.stringify(testCode_RAADS),
			width: 225,
			height: 450,
			colorDark: "#000000",
			colorLight: "#ffffff",
			correctLevel: QRCode.CorrectLevel.H
		});
	} else {
		console.error("RAADS results: #qrcodeRAADS element not found; barcode not rendered.");
	}

})(); // end IIFE
// })();  // end function - stand-alone 