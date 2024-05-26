var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();
app.use(express.static("public"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware do parsowania ciała żądań POST
app.use(bodyParser.urlencoded({ extended: true }));

// Konfiguracja połączenia z bazą danych MySQL
var db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mydatabase'
});

db.connect(function(err) {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Definiowanie trasy dla endpointu głównego
app.get('/', function(req, res) {
  res.render('index');
});

// Trasa do obsługi formularza
app.post('/submit', function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  
  var sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
  db.query(sql, [name, email], function(err, result) {
    if (err) {
      console.error('Error inserting data: ' + err.stack);
      res.status(500).send('Error inserting data');
      return;
    }
    res.send('Data inserted successfully with ID: ' + result.insertId);
  });
});

// Trasa do wyświetlania rekordu o podanym ID
app.get('/user/:id', function(req, res) {
  var userId = req.params.id;

  var sql = 'SELECT * FROM users WHERE id = ?';
  db.query(sql, [userId], function(err, result) {
    if (err) {
      console.error('Error fetching data: ' + err.stack);
      res.status(500).send('Error fetching data');
      return;
    }

    if (result.length === 0) {
      res.status(404).send('User not found');
      return;
    }

    res.render('user', { user: result[0] });
  });
});
// Trasa do wyświetlania wszystkich użytkowników
app.get('/users', function(req, res) {
    var sql = 'SELECT * FROM users';
    db.query(sql, function(err, results) {
      if (err) {
        console.error('Error fetching data: ' + err.stack);
        res.status(500).send('Error fetching data');
        return;
      }
      res.render('allUsers', { users: results });
    });
  });
  

// Obsługa błędów 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Obsługa błędów
app.use(function(err, req, res, next) {
  // Ustawienie lokalnych zmiennych, tylko w trybie deweloperskim
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderowanie strony błędu
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(3000, function () {
  console.log('Node app is being served on port: 3000')
});
