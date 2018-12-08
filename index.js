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

function createProfileExpire(req, res){

    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    

    log_('Adicionando Perfil de acesso: ' + name)
    
    let sql = "INSERT INTO acessos_controle_perfil (name, id_type, description) \
            VALUES ('"+ name + "', ( SELECT id FROM acessos_controle_tipo WHERE name = '" + type + "'), '" + desc + "');";        

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        createProfileExpireConfig(req, res)        
    });                            
}

function createProfileExpireConfig(req, res){
    
    let name = req.body.name
    let start0 = req.body.start0
    let end0 = req.body.end0
    let start1 = req.body.start1
    let end1 = req.body.end1

    log_('Configurando Perfil de acesso: ' + name)
    
    let sql0 = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, id_type) \
         VALUES (" + id + ", '" + start0 + "', '" + end0 + "', 1);";

        let sql1 = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, id_type) \
         VALUES (" + id + ", '" + start1 + "', '" + end1 + "', 2);";

        log_(sql0)
        log_(sql1)

        con.query(sql0, function (err0, result0) {        
            if (err0) throw err0; 
            
            con.query(sql1, function (err1, result1) {        
                if (err1) throw err1; 
                res.json({"success": result1});
            });
        });               
}

function updateProfileExpire(req, res){

    let id = req.body.idProfile
    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    

    log_('Atualizando Perfil de acesso: ' + name)
    
    let sql = "UPDATE acessos_controle_perfil SET \
                name = '" + name + "',\
                id_type = (SELECT acessos_controle_tipo.id FROM acessos_controle_tipo WHERE acessos_controle_tipo.name = '" + type + "'),\
                description = '" + desc + "' \
            WHERE id = " + id + ";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        updateProfileExpireConfig(req, res)        
    });                            
}

function updateProfileExpireConfig(req, res){

    let id = req.body.idProfile
    let name = req.body.name
    let start0 = req.body.start0
    let end0 = req.body.end0
    let start1 = req.body.start1
    let end1 = req.body.end1

    log_('Atualizando configurações do Perfil de acesso: ' + name)

    let sqlRemove = "DELETE FROM acessos_controle_config WHERE id_profile = " + id + ";"
    log_(sqlRemove)

    con.query(sqlRemove, function (err, result) {        
        if (err) throw err; 
        
        let sql0 = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, id_type) \
         VALUES (" + id + ", '" + start0 + "', '" + end0 + "', 1);";

        let sql1 = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, id_type) \
         VALUES (" + id + ", '" + start1 + "', '" + end1 + "', 2);";

        log_(sql0)
        log_(sql1)

        con.query(sql0, function (err0, result0) {        
            if (err0) throw err0; 
            
            con.query(sql1, function (err1, result1) {        
                if (err1) throw err1; 
                res.json({"success": result1});
            });
        });
    });        
}

function createProfileDatetime(req, res){

    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    
    
    log_('Adicionando Perfil de acesso: ' + name)    
    
    let sql = "INSERT INTO acessos_controle_perfil (name, id_type, description) \
            VALUES ('"+ name + "', ( SELECT id FROM acessos_controle_tipo WHERE name = '" + type + "'), '" + desc + "');";        

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        createProfileDatetimeConfig(req, res)        
    });                            
}

function createProfileDatetimeConfig(req, res){
    
    let name = req.body.name    
    let events = req.body.events   

    log_('Configurando Perfil de acesso: ' + name)

    events.forEach(element => {

        let start = element.startTime
        let end = element.endTime
        let title = element.title

        let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, title) \
            VALUES ((SELECT id FROM acessos_controle_perfil ORDER BY id DESC LIMIT 1), '" + start + "', '" + end + "', '" + title + "');";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });            
     
    res.json({"success": 1});
}

function updateProfileDatetime(req, res){

    let id = req.body.idProfile
    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    
    
    log_('Atualizando Perfil de acesso: ' + name)    
    
    let sql = "UPDATE acessos_controle_perfil SET \
            name = '" + name + "',\
            id_type = (SELECT acessos_controle_tipo.id FROM acessos_controle_tipo WHERE acessos_controle_tipo.name = '" + type + "'),\
            description = '" + desc + "' \
        WHERE id = " + id + ";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        updateProfileDatetimeConfig(req, res)        
    });                            
}

function updateProfileDatetimeConfig(req, res){    
    let name = req.body.name    
    let events = req.body.events   
    let id = req.body.idProfile

    log_('Atualizando configurações do Perfil de acesso: ' + name)

    let sqlRemove = "DELETE FROM acessos_controle_config WHERE id_profile = " + id + ";"
    log_(sqlRemove)

    con.query(sqlRemove, function (err, result) {        
        if (err) throw err; 
        
        events.forEach(element => {

            let start = element.startTime
            let end = element.endTime
            let title = element.title
                
            let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, title) \
                VALUES (" + id + ", '" + start + "', '" + end + "', '" + title + "');";
    
            log_(sql)
    
            con.query(sql, function (err, result) {        
                if (err) throw err;             
            });
        });            
         
        res.json({"success": 1});
    });            
}

function createProfileDayweek(req, res){

    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    
    
    log_('Adicionando Perfil de acesso: ' + name)    
    
    let sql = "INSERT INTO acessos_controle_perfil (name, id_type, description) \
            VALUES ('"+ name + "', ( SELECT id FROM acessos_controle_tipo WHERE name = '" + type + "'), '" + desc + "');";        

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        createProfileDayweekConfig(req, res)        
    });                            
}

function createProfileDayweekConfig(req, res){
    
    let name = req.body.name    
    let events = req.body.events   

    log_('Configurando Perfil de acesso: ' + name)

    events.forEach(element => {

        let start = element.startTime
        let end = element.endTime
        let title = 'Perfil Dia semana'
        let id = element.id

        let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, title, id_day) \
            VALUES ((SELECT id FROM acessos_controle_perfil ORDER BY id DESC LIMIT 1), '" + start + "', '" + end + "', '" + title + "', " + id + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });            
     
    res.json({"success": 1});
}

function updateProfileDayweek(req, res){

    let id = req.body.idProfile
    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    
    
    log_('Atualizando Perfil de acesso: ' + name)    
    
    let sql = "UPDATE acessos_controle_perfil SET \
            name = '" + name + "',\
            id_type = (SELECT acessos_controle_tipo.id FROM acessos_controle_tipo WHERE acessos_controle_tipo.name = '" + type + "'),\
            description = '" + desc + "' \
        WHERE id = " + id + ";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        updateProfileDayweekConfig(req, res)        
    });                            
}

function updateProfileDayweekConfig(req, res){
    
    let name = req.body.name    
    let events = req.body.events   
    let idProfile = req.body.idProfile
        
    log_('Atualizando configuração do Perfil de acesso: ' + name)

    let sqlRemove = "DELETE FROM acessos_controle_config WHERE id_profile = " + idProfile + ";"
    log_(sqlRemove)

    con.query(sqlRemove, function (err, result) {        
        if (err) throw err; 
        
        events.forEach(element => {

            let start = element.startTime
            let end = element.endTime
            let title = 'Perfil Dia semana'
            let idDay = element.id
    
            let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end, title, id_day) \
                VALUES (" + idProfile + ", '" + start + "', '" + end + "', '" + title + "', " + idDay + ");";
    
            log_(sql)
    
            con.query(sql, function (err, result) {        
                if (err) throw err;             
            });
        });            
         
        res.json({"success": 1});

    });     
}

function updateProfileDayweekConfigBySector(req, res){
    
    let profiles = req.body.profiles   
    let employees = req.body.employees
            
    log_('Atualizando configurações de perfil por setor')

    employees.forEach(element => {

        let sqlRemove = "DELETE FROM acessos_controle WHERE id_employee = " + element + ";"

        con.query(sqlRemove, function (err, result) {        
            if (err) throw err;    
            
            profiles.forEach(element1 => {

                let sql = "INSERT INTO acessos_controle (id_profile, id_employee) \
                    VALUES (" + element1 + ", " + element + ");";
        
                log_(sql)
        
                con.query(sql, function (err1, result1) {        
                    if (err1) throw err1;             
                });
            });
        });
    });

    res.json({"success": 1});        
}


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
    ORDER BY visitantes.name ASC \
    LIMIT 0,20;";

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
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            FALSE as checked \
            FROM acessos_controle_perfil \
        INNER JOIN acessos_controle_tipo ON acessos_controle_tipo.id = acessos_controle_perfil.id_type;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessGroupsByName', function(req, res) {
            
    let name = req.body.name
    log_('Verificando Perfis de acesso por nome: ' + name)
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            FALSE as checked \
            FROM acessos_controle_perfil \
        INNER JOIN acessos_controle_tipo ON acessos_controle_tipo.id = acessos_controle_perfil.id_type \
        WHERE acessos_controle_perfil.name LIKE '%" + name + "%';";

    log_(sql)

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

app.post('/addAccessProfileExpire', function(req, res) {            
    createProfileExpire(req, res)    
});

app.post('/updateAccessProfileExpire', function(req, res) {            
    updateProfileExpire(req, res)    
});

app.post('/addAccessProfileDatetime', function(req, res) {            
    createProfileDatetime(req, res)        
});

app.post('/updateAccessProfileDatetime', function(req, res) {            
    updateProfileDatetime(req, res)        
});

app.post('/addAccessProfileDayweek', function(req, res) {            
    createProfileDayweek(req, res)        
});

app.post('/updateAccessProfileDayweek', function(req, res) {            
    updateProfileDayweek(req, res)        
});

app.post('/delAccessGroups', function(req, res) {
                
    let name = req.body.profile.name
    let idProfile = req.body.profile.id

    log_('Removendo Perfil de acesso: ' + name)
    
    let sql = "DELETE FROM acessos_controle_perfil WHERE id = " + idProfile + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getProfileInfo', function(req, res) {
            
    let idProfile = req.body.idProfile

    log_('Verificando informaçẽs do perfil: ' + idProfile)
    
    let sql = "SELECT * FROM acessos_controle_config WHERE id_profile = " + idProfile + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/saveAccessProfileEmployee', function(req, res) {
            
    let employeeId = req.body.employeeId
    let profiles = req.body.profiles

    log_('Salvando profile para colaborador: ' + employeeId)
    
    profiles.forEach(element => {

        let sql = "INSERT INTO acessos_controle (id_profile, id_employee) \
            VALUES (" + element + ", " + employeeId + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });    
    
    res.json({"success": 1});        

});

app.post('/getAccessProfileEmployee', function(req, res) {
            
    let idEmployee = req.body.idEmployee

    log_('Verificando informaçẽs do perfil colaborador: ' + idEmployee)
    
    let sql = "SELECT * FROM acessos_controle WHERE id_employee = " + idEmployee + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getEmployeesBySector', function(req, res) {
            
    let idSector = req.body.idSector

    log_('Verificando colaboradores do setor: ' + idSector)
    
    let sql = "SELECT \
        funcionarios.id,\
        UPPER(funcionarios.name) AS name,\
        UPPER(funcionarios.name_comum) AS name_comum,\
        UPPER(funcionarios.cpf) AS cpf,\
        UPPER(funcionarios.rg) AS rg,\
        UPPER(funcionarios.telefone) AS telefone,\
        UPPER(funcionarios.endereco) AS endereco,\
        UPPER(funcionarios.bairro) AS bairro,\
        false AS checked,\
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
    INNER JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    INNER JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  empresas ON empresas.id =  funcionarios.id_empresa \
    LEFT JOIN  cargos ON cargos.id =  funcionarios.id_cargo \
    LEFT JOIN  crachas ON crachas.id =  funcionarios.id_cracha \
    WHERE setores.id = " + idSector + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/saveAccessProfileSector', function(req, res) {            
    updateProfileDayweekConfigBySector(req, res)        
});

app.post('/getAccessProfileEmployeeBySector', function(req, res) {
            
    let idSector = req.body.idSector
    let idProfile = req.body.idProfile

    log_('Verificando informaçoẽs do perfil todos colaborador - Setor ' + idSector + ' Profile: ' + idProfile)
    
    let sql = "SELECT funcionarios.id \
        FROM acessos_controle \
        INNER JOIN funcionarios ON funcionarios.id = acessos_controle.id_employee \
        INNER JOIN setores ON setores.id =  funcionarios.id_setor \
        WHERE setores.name = '" + idSector + "' \
        AND acessos_controle.id_profile = " + idProfile + ";";        

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/saveAccessProfileGuest', function(req, res) {
            
    let guestId = req.body.guestId
    let profiles = req.body.profiles

    log_('Salvando profile para visitante: ' + guestId)
    
    profiles.forEach(element => {

        let sql = "INSERT INTO acessos_controle (id_profile, id_guest) \
            VALUES (" + element + ", " + guestId + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });    
    
    res.json({"success": 1});        
});

app.post('/getAccessProfileGuests', function(req, res) {
            
    let idGuest = req.body.idGuest

    log_('Verificando informaçẽs do perfil colaborador: ' + idGuest)
    
    let sql = "SELECT * FROM acessos_controle WHERE id_guest = " + idGuest + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

http.listen(8085);

