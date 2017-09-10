'use strict';
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var prime_table = [2];
function construct_prime_table() {
    for (var i = 3; i < 10000; i += 2)
        if (bigInt(i).isPrime()) {
            prime_table.push(i);
        }
}
construct_prime_table();
function semi_factorization(n0, primes) {
    var n = bigInt(n0);
    var i = 0;
    var rtn = {};
    while (i < primes.length) {
        var r = n.divmod(primes[i]);
        if(r.remainder.eq(0)){
            rtn[primes[i]] = (rtn[[primes[i]]] || 0) +1;
            n = r.quotient;
            if(n.eq(1))
                break;
        }
        else{
            i+=1;
        }
    }
    if(n.gt(1)){
        rtn[n]=1;
    }
    return rtn;
}
var Fractran = {
    parse_input(input_number) {
        var text = input_number.replace(/[*\s]+/g, '*')
        var nums = text.split('*');
        var factors = nums.map(
            s => {
                var v1 = /^[123456789]\d*\^[123456789]\d*$/.test(s);
                var v2 = /^[123456789]\d*$/.test(s);
                if (v1) {
                    var a = s.split('^');
                    return bigInt(a[0]).pow(a[1]);
                }
                if (v2) {
                    return bigInt(s);
                }
            })
        return factors.reduce((a, b) => a.times(b), bigInt(1))
    },
    check_input_error(input_number) {
        var text = input_number.replace(/[*\s]+/g, '*')
        var nums = text.split('*');
        var errors = nums.filter(
            s => {
                var v1 = /^[123456789]\d*\^[123456789]\d*$/.test(s);
                var v2 = /^[123456789]\d*$/.test(s);
                return !(v1 || v2);
            })
        return errors;
    },
    check_error(code_text) {
        var fracs_text = code_text.replace(/[,\s]+/g, ',')
        var fracs = fracs_text.split(',');
        var errors = fracs.filter(
            s => {
                var v = /^[123456789]\d*\/[123456789]\d*$/.test(s);
                return !v;
            })
        return errors;
    },
    step(pointer, n, code) {
        if (pointer >= code.length) {
            return [pointer, n, 0, 0]
        }
        var f = code[pointer];
        var p = bigInt(n).times(f[0]);
        var q = bigInt(f[1]);
        var r = bigInt.gcd(p, q);
        p = p.divide(r);
        q = q.divide(r);
        if (q.compare(1) == 0) {
            pointer = 0;
            n = p;
        }
        else {
            pointer = pointer + 1;
        }
        return [pointer, n, p, q]

    }
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var app = new Vue({
    el: '#fractran',

    methods: {
        input_changed(e) {
            var text = e.target.value;
            this.code_errors = Fractran.check_input_error(text);
            if (this.code_errors.length > 0)
                return false;
            this.input_number = text;
        },
        async run() {
            if (this.code_mode == 0)
                if (!this.toggle_code_mode())
                    return;
            var n = bigInt(this.input.number);
            var code = this.code_text.match(/[123456789]\d*\/[123456789]\d*/g)
            console.log(code)
            code = code.map(s => s.split('/').map(n => bigInt(n)));
            console.log(code)
            this.pointer = 0;
            var pointer = 0, n2, p, q
            while (this.pointer < code.length) {
                var f = code[pointer];
                [pointer, n2, p, q] = Fractran.step(pointer, n, code);
                console.log(pointer, n2.toString(), p.toString(), q.toString())
                this.current_ok = q.compare(1) == 0;
                var in_text = this.current_ok ? "\\in" : "\\not\\in"
                var text1 = `${n} \\times \\frac{${f[0]}}{${f[1]}} = `
                this.step_text = text1 + `\\frac{${p}}{${q}} ${in_text} \\mathbb{N}`
                await timeout(this.current_ok ? 2000 : 300);
                n = n2;
                this.pointer = pointer
            }
        },
        math: s => katex.renderToString(s),
        toggle_code_mode() {
            if (this.code_mode == 0) {
                var code_text = $('#code_text').value;
                this.code_errors = Fractran.check_error(code_text);
                if (this.code_errors.length > 0)
                    return false;
                this.code_text = code_text;
            }
            app.code_mode = 1 - app.code_mode;
            return true;
        },
        frac_class(i) {
            return {
                code_frac: true,
                frac_passed: this.pointer > i,
                frac_current_ok: this.pointer == i && this.current_ok,
                frac_current_no: this.pointer == i && !this.current_ok
            }
        }

    },
    data: {
        code_modes: ["edit", "view"],
        code_mode: 0,
        code_text: "455/33 11/13 1/11 3/7 11/2 1/3",
        code_errors: [],
        current_ok: true,
        input_number: "8",
        pointer: -1,
        state: 0,
        step_text: "",
        examples: []
    },
    computed: {
        input_math() {
            var n = Fractran.parse_input(this.input_number);
            var fac = semi_factorization(n, prime_table);
            var fac_s = Object.entries(fac).map( a =>
                    String(a[0])+ (a[1]==1 ?"":`^{${a[1]}}`) 
            )
            return katex.renderToString(String(n)+"="+fac_s.join(" \\cdot "))
        },
        step_text_math() {
            return katex.renderToString(this.step_text)
        },
        code() {
            return this.code_text.match(/[123456789]\d*\/[123456789]\d*/g)
                .map(s => s.split('/'))
        },
    }
})

async function fetch_examples(file_name) {
    try {
        app.examples = await (await fetch(file_name)).json()
    } catch (e) {
        console.log("unable to fetch examples", e)
    }
}

var input_only = (e, chars) => {
    var valid = chars + " \r\n\x00\x08";
    var k = String.fromCharCode(e.which);
    if (e.altKey || e.metaKey || e.ctrlKey)
        return;
    if (valid.indexOf(k) == -1) e.preventDefault();
}

fetch_examples("example.json")