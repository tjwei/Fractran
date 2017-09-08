'use strict';
var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

var Fractran = {
    check_error(code_text) {
        var fracs_text = code_text.replace(/[,\s]+/g, ',')
        var fracs = fracs_text.split(',');
        console.log(fracs_text)
        console.log(fracs)
        var errors = fracs.filter(
            s => {
                var v = /[123456789]\d*\/[123456789]\d*/.test(s);                
                return !v;
            })
        console.log(errors);
        return errors;
    }
}

var app = new Vue({
    el: '#fractran',
    methods: {
        math: s=> katex.renderToString(s),
        toggle_code_mode() {
            if(this.code_mode == 0){
                var code_text = $('#code_text').value;            
                this.code_errors = Fractran.check_error(code_text);
                if (this.code_errors.length > 0)
                    return false;                
                this.code_text = code_text;                
            }
            app.code_mode = 1 - app.code_mode;
            return true;
        }

    },
    data: {
        code_modes: ["edit", "view"],
        code_mode: 0,
        code_text: "1/2,33/44",
        code_errors: [],
        input: {
            base: [],
            base_text: [],
            data: [],
            number: 0
        },
        input: {
            base: [],
            base_text: [],
            sequence: [],
            number: 0
        },
        pointer: 0,
        state: 0,
        examples: []
    },
    computed: {
        code() {
        return this.code_text.match(/[123456789]\d*\/[123456789]\d*/g)
                .map(s=>s.split('/'))
        }

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
    var valid = chars+" \r\n\x00\x08";
    var k = String.fromCharCode(e.which);
    if (e.altKey || e.metaKey || e.ctrlKey)
        return;
    if (valid.indexOf(k) == -1) e.preventDefault();
}

fetch_examples("example.json")
