'use strict';
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);
var prime_table = [2];

function construct_prime_table() {
    for (var i = 3; i < 300; i += 2)
        if (bigInt(i).isPrime()) {
            prime_table.push(i);
        }
}
construct_prime_table();

function fac_math(fac) {
    return Object.entries(fac).map(a =>
        String(a[0]) + (a[1] == 1 ? "" : `^{${a[1]}}`)
    ).join(' \\cdot ')
}

function semi_factorization(n0, primes = prime_table) {
    var n = bigInt(n0);
    var i = 0;
    var rtn = {};
    if (n.eq(1)) {
        return {
            1: 1
        }
    }
    while (i < primes.length) {
        var r = n.divmod(primes[i]);
        if (r.remainder.eq(0)) {
            rtn[primes[i]] = (rtn[[primes[i]]] || 0) + 1;
            n = r.quotient;
            if (n.eq(1))
                break;
        } else {
            i += 1;
        }
    }
    if (n.gt(1)) {
        rtn[n] = 1;
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
        } else {
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
        output_base_changed(text) {
            this.output_base = text.match(/\d+/g).map(s => parseInt(s));
        },
        input_changed(text) {
            this.code_errors = Fractran.check_input_error(text);
            if (this.code_errors.length > 0)
                return false;
            this.input_number = text;
            return true;
        },
        async run() {
            this.output_base_changed($('#output_base_input').value)
            if (!this.input_changed($('#input_input').value)) {
                return;
            }
            if (this.code_mode == 0)
                if (!this.toggle_code_mode())
                    return;
            var n = Fractran.parse_input(this.input_number);
            var code = this.code_text.match(/[123456789]\d*\/[123456789]\d*/g)
            console.log(code)
            code = code.map(s => s.split('/').map(n => bigInt(n)));
            console.log(code)
            this.pointer = 0;
            var pointer = 0,
                n2, p, q
            var skip_count = 0;
            var skip = 0;
            while (this.pointer < code.length) {
                var f = code[pointer];
                [pointer, n2, p, q] = Fractran.step(pointer, n, code);
                var fac_p
                //console.log(pointer, n2.toString(), p.toString(), q.toString())
                this.current_ok = q.compare(1) == 0;
                var in_text = this.current_ok ? "\\in" : "\\not\\in"
                var speedup = this.speedup;
                if (speedup < 0.01) speedup = 1;
                if (speedup >= 20000) {
                    skip = speedup / 10000;
                } else skip = 0;
                if (this.output_base.length > 0 && this.current_ok) {
                    fac_p = semi_factorization(p)
                    console.log(fac_math(fac_p), this.output_base, Object.keys(fac_p))
                    if (Object.keys(fac_p).map(s => parseInt(s)).every(k => {
                            console.log(k, this.output_base.indexOf(k))
                            return this.output_base.indexOf(k) > -1
                        })) {
                        this.output_seq.push(`${fac_math(fac_p)}`)
                    }
                }
                if (speedup < 10000 || this.current_ok) {
                    if (skip > 0 && skip_count < skip) {
                        skip_count += 1;
                    } else {
                        fac_p = fac_p || semi_factorization(p)
                        var fac_n = semi_factorization(n)
                        var fac_q = semi_factorization(q)
                        var text1 = `${fac_math(fac_n)} `
                        var text2 = `\\times \\frac{${f[0]}}{${f[1]}} = `
                        var text3 = `\\frac{${fac_math(fac_p)}}{${fac_math(fac_q)}} `
                        var text4 = `${in_text} \\mathbb{N}`
                        this.step_text = text1 + text2 + text3 + text4
                        await timeout((this.current_ok ? 1000 : 200) / speedup);
                        skip_count = 0;
                    }
                }



                n = n2;
                this.pointer = pointer
            }
            var fac = semi_factorization(n, prime_table);
            this.step_text = `Output=${fac_math(fac)}`
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
        //code_text: "455/33 11/13 1/11 3/7 11/2 1/3",
        code_text: "17/91, 78/85, 19/51, 23/38, 29/33, 77/29, 95/23, 77/19, 1/17, 11/13, 13/11, 15/14, 15/2, 55/1",
        code_errors: [],
        current_ok: true,
        input_number: "8",
        output_base: [],
        output_seq: [],
        pointer: -1,
        state: 0,
        step_text: "",
        speedup: 1,
        examples: []
    },
    computed: {
        output_seq_math() {
            var s = this.output_seq.join(" , ");
            return katex.renderToString(s);
        },
        output_base_math() {
            var s = this.output_base.map(n => `${n}^{?}`).join(" ");
            return katex.renderToString(s);
        },
        input_math() {
            var n = Fractran.parse_input(this.input_number);
            var fac = semi_factorization(n, prime_table);
            return katex.renderToString(String(n) + "=" + fac_math(fac))
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