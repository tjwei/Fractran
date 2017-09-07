var app = new Vue({
    el: '#fractran',
    methods: {},
    data: {
        examplies: []
    }
})
fetch('examples.json')
    .catch(() => console.log("unable to fetch examples.json"))
    .then((res) => res.json())
    .then((data) => {
        app.examples = data;
    })