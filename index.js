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

    let sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "' ORDER BY id LIMIT 1;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getEmployees', function(req, res) {            

    log_('Verificando colaboradores')

    let sql = "SELECT \
        funcionarios.id,\
        UPPER(funcionarios.name) AS name,\
        UPPER(funcionarios.name_comum) AS name_comum,\
        UPPER(funcionarios.cpf) AS cpf,\
        UPPER(funcionarios.rg) AS rg,\
        UPPER(funcionarios.telefone) AS telefone,\
        UPPER(funcionarios.endereco) AS endereco,\
        UPPER(funcionarios.bairro) AS bairro,\
        funcionarios.obs,\
        funcionarios.foto,\
        funcionarios.fotosamba,\
        UPPER(funcionarios.matricula) AS matricula,\
        funcionarios.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        funcionarios_tipos.id AS id_tipo,\
        UPPER(funcionarios_tipos.name) AS FUNCIONARIO_TIPO,\
        UPPER(setores.name) AS SETOR,\
        UPPER(empresas.name) AS EMPRESA,\
        UPPER(cargos.name) AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  empresas ON empresas.id =  funcionarios.id_empresa \
    LEFT JOIN  cargos ON cargos.id =  funcionarios.id_cargo \
    LEFT JOIN  crachas ON crachas.id =  funcionarios.id_cracha \
    WHERE funcionarios.status = 1 \
    ORDER BY funcionarios.name ASC \
    LIMIT 0,20;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getEmployeesByName', function(req, res) {            

    let name = req.body.name

    log_('Verificando colaboradores por nome ' + name)

    let sql = "SELECT \
        funcionarios.id,\
        UPPER(funcionarios.name) AS name,\
        UPPER(funcionarios.name_comum) AS name_comum,\
        UPPER(funcionarios.cpf) AS cpf,\
        UPPER(funcionarios.rg) AS rg,\
        UPPER(funcionarios.telefone) AS telefone,\
        UPPER(funcionarios.endereco) AS endereco,\
        UPPER(funcionarios.bairro) AS bairro,\
        funcionarios.obs,\
        funcionarios.foto,\
        funcionarios.obs,\
        funcionarios.fotosamba,\
        UPPER(funcionarios.matricula) AS matricula,\
        funcionarios.status,\
        crachas.id_cracha AS CRACHA,\
        crachas.id_tipo AS CRACHA_TIPO,\
        UPPER(funcionarios_tipos.name) AS FUNCIONARIO_TIPO,\
        UPPER(setores.name) AS SETOR,\
        UPPER(empresas.name) AS EMPRESA,\
        UPPER(cargos.name) AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  empresas ON empresas.id =  funcionarios.id_empresa \
    LEFT JOIN  cargos ON cargos.id =  funcionarios.id_cargo \
    LEFT JOIN  crachas ON crachas.id =  funcionarios.id_cracha \
    WHERE funcionarios.name LIKE '%" + name + "%';";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getGuests', function(req, res) {
            
    log_('Verificando visitantes')
    
    let sql = "SELECT \
        visitantes.id,\
        UPPER(visitantes.name) AS name,\
        UPPER(visitantes.cpf) AS cpf,\
        UPPER(visitantes.rg) AS rg,\
        UPPER(visitantes.telefone) AS telefone,\
        UPPER(visitantes.endereco) AS endereco,\
        UPPER(visitantes.bairro) AS bairro,\
        UPPER(visitantes.obs) AS obs,\
        visitantes.fotosamba,\
        visitantes.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        UPPER(funcionarios.name) AS AUTORIZANTE,\
        funcionarios.id AS AUTORIZANTE_ID,\
        visitantes_tipos.id AS id_tipo,\
        visitantes_tipos.name AS TIPO,\
        UPPER(empresas.name) AS EMPRESA \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    WHERE visitantes.status = 1;"     

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getGuestsByName', function(req, res) {
            
    let name = req.body.name

    log_('Verificando visitantes por nome ' + name)
    
    let sql = "SELECT \
        visitantes.id,\
        UPPER(visitantes.name) AS name,\
        UPPER(visitantes.cpf) AS cpf,\
        UPPER(visitantes.rg) AS rg,\
        UPPER(visitantes.telefone) AS telefone,\
        UPPER(visitantes.endereco) AS endereco,\
        UPPER(visitantes.bairro) AS bairro,\
        UPPER(visitantes.obs) AS obs,\
        visitantes.fotosamba,\
        visitantes.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        UPPER(funcionarios.name) AS AUTORIZANTE,\
        funcionarios.id AS AUTORIZANTE_ID,\
        visitantes_tipos.id AS id_tipo,\
        visitantes_tipos.name AS TIPO,\
        UPPER(empresas.name) AS EMPRESA \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    WHERE visitantes.name LIKE '%" + name + "%';";

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessGroups', function(req, res) {
            
    log_('Verificando Perfis de acesso')
    

    let sql = "SELECT * FROM acessos_controle_perfil;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getWorkFunctions', function(req, res) {
            
    log_('Verificando funções')
    
    let sql = "SELECT * FROM funcao;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getEmployeeTypes', function(req, res) {
            
    log_('Verificando Tipos de funcionários')
    
    let sql = "SELECT * FROM funcionarios_tipos;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getSectors', function(req, res) {
            
    log_('Verificando Setores')
    
    let sql = "SELECT * FROM setores;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getCompanies', function(req, res) {
            
    log_('Verificando Empresas')
    
    let sql = "SELECT * FROM empresas;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getOffices', function(req, res) {
            
    log_('Verificando Cargos')
    
    let sql = "SELECT * FROM cargos;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessControlTypes', function(req, res) {
            
    log_('Verificando tipos de controle de acesso')
    
    let sql = "SELECT * FROM acessos_controle_tipo;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

http.listen(8085);

