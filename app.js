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
  database: 'tiering'
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

app.get('/create_tierlist', function(req, res) {
    res.render('create_tierlist');
  });

  app.post('/add_object', function(req, res) {
    var tid = req.body.tid;
    res.render('add_object', { tid: tid });
  });

// Trasa do obsługi formularza
app.post('/submit', function(req, res) {
  var name = req.body.name;
  var description = req.body.description;
  var coverart = req.body.coverart;
  var tiers = req.body.tiers;
  var colors = req.body.colors;
  var type = req.body.type;
  
  var sql = 'INSERT INTO tierlists (name, description, coverart, tiers, colors, type) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [name, description, coverart, tiers, colors, type], function(err, result) {
    if (err) {
      console.error('Error inserting data: ' + err.stack);
      res.status(500).send('Error inserting data');
      return;
    }
    

    sql = `CREATE TABLE tierlist${result.insertId} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, url VARCHAR(255) NULL, coverart VARCHAR(255) NULL, tier VARCHAR(255) NULL, colors VARCHAR(255) NULL)`;
    db.query(sql, function(err, result) {
        if (err) {
          console.error('Error inserting data: ' + err.stack);
          res.status(500).send('Error inserting data');
          return;
        }
    });
    res.send('Data inserted successfully with ID: ' + result.insertId + '<br><a href="./">Back</a>');
    });
});


app.post('/submit_object', function(req, res) {
    var tid = req.body.tid;
    var name = req.body.name;
    var url = req.body.url;
    var coverart = req.body.coverart;
    var colors = req.body.colors;
    var tier = "0"
    
    var sql = `INSERT INTO tierlist${tid} (name, url, coverart, tier, colors) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, url, coverart, tier, colors], function(err, result) {
      if (err) {
        console.error('Error inserting data: ' + err.stack);
        res.status(500).send('Error inserting data');
        return;
      }
      
  
      
      res.send('Data inserted successfully with ID: ' + result.insertId + '<br><a href="./">Back</a>');
      });
  });

// Trasa do wyświetlania rekordu o podanym ID
app.get('/tierlist/:id', function(req, res) {
  var tierlist_id = req.params.id;

  var sql = 'SELECT * FROM tierlists WHERE id = ?';
  db.query(sql, [tierlist_id], function(err, result) {
    if (err) {
      console.error('Error fetching data: ' + err.stack);
      res.status(500).send('Error fetching data');
      return;
    }

    if (result.length === 0) {
      res.status(404).send('Tierlist not found');
      return;
    }
                var sql2 = `SELECT * FROM tierlist${tierlist_id}`;
            db.query(sql2, function(err, result2) {
                if (err) {
                console.error('Error fetching data: ' + err.stack);
                res.status(500).send('Error fetching data');
                return;
                }

                if (result.length === 0) {
                res.status(404).send('Objects not found');
                return;
                }
                console.log(result2)

                res.render('tierlist', { tierlist: result[0], objects: result2});
            });

    
  });
});


// Trasa do wyświetlania wszystkich użytkowników
app.get('/tierlists', function(req, res) {
    var sql = 'SELECT * FROM tierlists';
    db.query(sql, function(err, results) {
      if (err) {
        console.error('Error fetching data: ' + err.stack);
        res.status(500).send('Error fetching data');
        return;
      }
      res.render('tierlists', { tierlists: results });
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
