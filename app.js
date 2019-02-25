const koa = require('koa');
const static = require('koa-static');
const app = new koa();


app.use(static(__dirname, "/www"));

app.listen(8000, () => {
    console.log("localhost:8000");
});
