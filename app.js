var express = require('express')
var app = express()
app.use(express.static('static'))

app.get('/', function (req, res) {
    res.sendFile('index.html');
})

app.get('/xhr', function (req, res) {
    setTimeout(() => {
        res.send('xhr');
    }, 3000);
})

app.listen(3000, function () {
  console.log('Static server')
})
