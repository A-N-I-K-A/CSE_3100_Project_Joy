var mysql = require('mysql');
var port = 3000;
var connection = mysql.createConnection({

    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sampleDB'
});


connection.connect(function (error) {

    if (!!error) {
        console.log('Error Connecting in database.');
    }
    else {
        console.log('Connected to Database.');
    }
});

module.exports=connection;

