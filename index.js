let mysql = require('mysql');
let express =  require('express');
let app = express();
let http = require('http').Server(app);
let bodyParser = require('body-parser');
let logger = require('morgan');
let methodOverride = require('method-override')
let cors = require('cors');
var moment = require('moment');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(cors());

function log_(str){
    let now = moment().format("DD/MM/YYYY hh:mm:ss")
    let msg = "[" + now + "] " + str
    console.log(msg)
}

var db_config = {
    host: "10.8.0.50",
    user: "root",
    password: "Mudaragora00",
    database: "zoologico"
};

/*var db_config = {
    host: "10.0.2.180",
    user: "root",
    password: "Mudaragora00",
    database: "zoosp"
};*/

let con;

function handleDisconnect() {

    con = mysql.createConnection(db_config);
   
    con.connect(function(err) {
       if (err){
        setTimeout(handleDisconnect, 2000);
       }

       con.on('error', function(err) {

        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();  

        } else 
            throw err;  
        
    });

    log_("Database conectado!")		    
    log_("Aguardando conexões ...")	
   });
}

handleDisconnect()

app.post('/getAuth', function(req, res) {
        
    let username = req.body.username
    let password = req.body.password

    log_('Verificando credenciais: ' + ' - ' + username)

    let sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "';";        
    //log_(sql1)

    con.query(sql, function (err1, result) {        

        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});


http.listen(8085);

