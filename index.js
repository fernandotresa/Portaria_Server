let mysql = require('mysql');
let express =  require('express');
let app = express();
let http = require('http').Server(app);
let bodyParser = require('body-parser');
let logger = require('morgan');
let methodOverride = require('method-override')
let cors = require('cors');
var moment = require('moment-timezone');

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
    host: "venda-online.cacasorqzf2r.sa-east-1.rds.amazonaws.com",
    user: "portaria",
    password: "Mudaragora00",
    database: "portaria",
    timezone: 'utc'  
};

/*var db_config = {
    host: "10.0.2.180",
    user: "root",
    password: "Mudaragora00",
    database: "zoosp",
    timezone: 'utc'  
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
    let  start = moment(req.body.start0).tz('America/Sao_Paulo').format()
    let  end = moment(req.body.end1).tz('America/Sao_Paulo').format()

    log_('Configurando Perfil de acesso: ' + name)
    
    let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end) \
         VALUES ((SELECT id FROM acessos_controle_perfil ORDER BY id DESC LIMIT 1), '" + start + "', '" + end + "');";        

         con.query(sql, function (err1, result1) {        
            if (err1) throw err1; 
            res.json({"success": result1});
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
    let  start = moment(req.body.start).tz('America/Sao_Paulo').format()
    let  end = moment(req.body.end).tz('America/Sao_Paulo').format()

    log_('Atualizando configurações do Perfil de acesso: ' + name)

    let sqlRemove = "DELETE FROM acessos_controle_config WHERE id_profile = " + id + ";"
    log_(sqlRemove)

    con.query(sqlRemove, function (err, result) {        
        if (err) throw err; 
        
        let sql = "INSERT INTO acessos_controle_config (id_profile, datetime_start, datetime_end) \
         VALUES (" + id + ", '" + start + "', '" + end + "');";
     
        log_(sql)

        con.query(sql, function (err1, result1) {        
            if (err1) throw err1; 
            res.json({"success": result1});
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

        let  start = moment(element.startTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
        let  end = moment(element.endTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
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
                        
            let title = element.title            
            let  start = moment(element.startTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
            let  end = moment(element.endTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")

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
    console.log(events)

    events.forEach(element => {
        
        let title = 'Perfil Dia semana'
        let id = element.id

        let  start = moment(element.startTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
        let  end = moment(element.endTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")

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

            let  start = moment(element.startTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
            let  end = moment(element.endTime).tz('America/Sao_Paulo').format("YYYY-MM-DDThh:mm:ss")
            
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

function addAcl(req, res){

    let name = req.body.name
    let permission = req.body.permission

    log_('Adicionando nova ACL: ' + name)

    let sql = "INSERT INTO acls (name, id_permission) \
            VALUES ('" + name + "',\
            (SELECT acls_permissoes.id FROM acls_permissoes WHERE acls_permissoes.name = '" + permission + "'));";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  

        addAclContinue(req, res)                       
    }); 
}

function addAclContinue(req, res){
    let sectors = req.body.sectors
    
    sectors.forEach(element => {

        let sqlSector = "INSERT INTO acls_setores (id_acl, id_sector) \
            VALUES (\
            (SELECT acls.id FROM acls ORDER BY acls.id DESC LIMIT 1), " + element.id + ");";

        log_(sqlSector)

        con.query(sqlSector, function (err, result) {        
            if (err) throw err;             
        });
    });   
    
    res.json({"success": "1"});
}

function saveAcl(req, res){

    let id = req.body.idAcl
    let name = req.body.name
    let permission = req.body.permission

    log_("Atualizando ACL: " + name + " - Id: " + id)

    let sql = "UPDATE acls \
        SET name =  '" + name + "',\
        id_permission = (SELECT acls_permissoes.id FROM acls_permissoes WHERE acls_permissoes.name = '" + permission + "') \
        WHERE acls.id = " + id + ";"


    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;
        saveAclContinue(req, res)
    });  
}

function saveAclContinue(req, res){

    let id = req.body.idAcl
    let sectors = req.body.sectors

    let sqlRemove = "DELETE FROM acls_setores WHERE id_acl = " + id + ";";        
    log_(sqlRemove)

    con.query(sqlRemove, function (err1, result) {        
        if (err1) throw err1;   

        sectors.forEach(element => {

            let sqlSector = "INSERT INTO acls_setores (id_acl, id_sector) \
                VALUES (" + id + ", " + element.id + ");";
    
            log_(sqlSector)
    
            con.query(sqlSector, function (err1, result1) {        
                if (err1) throw err;             
            });
        });  

        res.json({"success": "1"});  
    });            
}

function delAcl(req, res){
    let name = req.body.acl.nome
    let id = req.body.acl.id

    log_('Removendo ACL: ' + name)
    
    let sql = "DELETE FROM acls WHERE id = " + id + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function delAclUser(idUser){
    
    log_('Removendo ACL: ' + idUser)
    
    let sql = "DELETE FROM users_acls WHERE id_user = " + idUser + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
    });
}

function saveAccessProfileEmployee(req, res){

    let employeeId = req.body.employeeId
    let profiles = req.body.profiles

    removeAccessProfileEmployee(req)
    
    profiles.forEach(element => {

        let sql = "INSERT INTO acessos_controle (id_profile, id_employee) \
            VALUES (" + element + ", " + employeeId + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });                    
    });    
    
    res.json({"success": 1}); 
}

function saveAccessProfileGuest(req, res){

    let guestId = req.body.guestId
    let profiles = req.body.profiles

    log_('Salvando profile para visitante: ' + guestId)
    removeAccessProfileGuest(req)
    
    profiles.forEach(element => {

        let sql = "INSERT INTO acessos_controle (id_profile, id_guest) \
            VALUES (" + element + ", " + guestId + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });    
    
    res.json({"success": 1});        
}

function removeAccessProfileEmployee(req){

    let employeeId = req.body.employeeId
    
    let sql = "DELETE FROM acessos_controle WHERE id_employee = " + employeeId + ";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
    });
}

function removeAccessProfileGuest(req){

    let guestId = req.body.guestId
    
    let sql = "DELETE FROM acessos_controle WHERE id_guest = " + guestId + ";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
    });
}

function blockUser(req, res){

    let id = req.body.user.id    
    let sql = "UPDATE users SET id_status = 0 WHERE  id = " + id + ";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": 1}); 
    });            
}

function activeUser(req, res){
    let id = req.body.user.id    
    let sql = "UPDATE users SET id_status = 1 WHERE  id = " + id + ";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": 1}); 
    });            
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
        funcionarios.name AS name,\
        funcionarios.name_comum AS name_comum,\
        funcionarios.cpf AS cpf,\
        funcionarios.rg AS rg,\
        funcionarios.telefone AS telefone,\
        funcionarios.endereco AS endereco,\
        funcionarios.bairro AS bairro,\
        funcionarios.obs,\
        funcionarios.foto_web,\
        funcionarios.matricula AS matricula,\
        funcionarios.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        funcionarios_tipos.id AS id_tipo,\
        funcionarios_tipos.name AS FUNCIONARIO_TIPO,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        funcao.name AS FUNCAO,\
        empresas.name AS EMPRESA,\
        cargos.name AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  funcao ON funcao.id =  funcionarios.id_funcao \
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
        funcionarios.name AS name,\
        funcionarios.name_comum AS name_comum,\
        funcionarios.cpf AS cpf,\
        funcionarios.rg AS rg,\
        funcionarios.telefone AS telefone,\
        funcionarios.endereco AS endereco,\
        funcionarios.bairro AS bairro,\
        funcionarios.obs,\
        funcionarios.foto_web,\
        funcionarios.obs,\
        funcionarios.matricula AS matricula,\
        funcionarios.status,\
        crachas.id_cracha AS CRACHA,\
        crachas.id_tipo AS CRACHA_TIPO,\
        funcionarios_tipos.name AS FUNCIONARIO_TIPO,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        empresas.name AS EMPRESA,\
        funcao.name AS FUNCAO,\
        cargos.name AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  funcao ON funcao.id =  funcionarios.id_funcao \
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
        visitantes.name AS name,\
        visitantes.cpf AS cpf,\
        visitantes.rg AS rg,\
        visitantes.telefone AS telefone,\
        visitantes.endereco AS endereco,\
        visitantes.bairro AS bairro,\
        visitantes.obs AS obs,\
        visitantes.fotosamba,\
        visitantes.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        funcionarios.name AS AUTORIZANTE,\
        funcionarios.id AS AUTORIZANTE_ID,\
        visitantes_tipos.id AS id_tipo,\
        visitantes_tipos.name AS TIPO,\
        empresas.name AS EMPRESA \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    WHERE visitantes.name IS NOT NULL \
    ORDER BY visitantes.name ASC \
    LIMIT 0,20;";

    log_(sql)    

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
        visitantes.name AS name,\
        visitantes.cpf AS cpf,\
        visitantes.rg AS rg,\
        visitantes.telefone AS telefone,\
        visitantes.endereco AS endereco,\
        visitantes.bairro AS bairro,\
        visitantes.obs AS obs,\
        visitantes.fotosamba,\
        visitantes.status,\
        crachas.id AS CRACHA_ID,\
        crachas.id_tipo AS CRACHA_TIPO,\
        crachas.id_cracha AS CRACHA,\
        funcionarios.name AS AUTORIZANTE,\
        funcionarios.id AS AUTORIZANTE_ID,\
        visitantes_tipos.id AS id_tipo,\
        visitantes_tipos.name AS TIPO,\
        empresas.name AS EMPRESA \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    WHERE visitantes.name LIKE '%" + name + "%' AND visitantes.name IS NOT NULL;";

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessGroups', function(req, res) {
            
    log_('Verificando Perfis de acesso')
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            acessos_controle_tipo.id AS type_id,\
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

app.post('/getAccessGroupsTypeById', function(req, res) {
            
    let idAccessGroupType = req.body.idAccessGroupType
    log_('Verificando Tipos Perfis de acesso por id: ' + idAccessGroupType)
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            FALSE as checked \
            FROM acessos_controle_perfil \
        INNER JOIN acessos_controle_tipo ON acessos_controle_tipo.id = acessos_controle_perfil.id_type \
        WHERE acessos_controle_tipo.id = " + idAccessGroupType + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessGroupsTypes', function(req, res) {
            
    let idAccessGroupType = req.body.idAccessGroupType
    log_('Verificando Tipos Perfis de acesso por id: ' + idAccessGroupType)
    
    let sql = "SELECT * \
            FROM acessos_controle_tipo \
        WHERE acessos_controle_tipo.id = " + idAccessGroupType + ";";

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
    
    let sql = "SELECT setores.*, false AS checked FROM setores;";        

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
    saveAccessProfileEmployee(req, res)
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

app.post('/getAccessProfilesNameEmployee', function(req, res) {
            
    let idEmployee = req.body.idEmployee

    log_('Verificando informaçẽs do perfil colaborador: ' + idEmployee)
    
    let sql = "SELECT acessos_controle_perfil.name \
        FROM acessos_controle \
        INNER JOIN acessos_controle_perfil ON acessos_controle_perfil.id = acessos_controle.id_profile \
        WHERE id_employee = " + idEmployee + ";";        

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessProfilesNameGuest', function(req, res) {
            
    let idGuest = req.body.idGuest

    log_('Verificando informaçẽs do perfil visitante: ' + idGuest)
    
    let sql = "SELECT acessos_controle_perfil.name \
        FROM acessos_controle \
        INNER JOIN acessos_controle_perfil ON acessos_controle_perfil.id = acessos_controle.id_profile \
        WHERE id_guest = " + idGuest + ";";        

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



app.post('/saveAccessProfileGuest', function(req, res) {
    saveAccessProfileGuest(req, res)    
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

app.post('/getAcls', function(req, res) {                

    log_('Verificando informaçẽs das ACLS')
    
    let sql = "SELECT acls.*, \
                acls_permissoes.name AS permissao,\
                acls_permissoes.acl_value \
            FROM acls \
            INNER JOIN acls_permissoes ON acls_permissoes.id = acls.id_permission;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getACLByName', function(req, res) {                

    let name = req.body.name
    log_('Verificando informaçoẽs das ACL: ' + name)
    
    let sql = "SELECT acls.*, \
                acls_permissoes.name AS permissao,\
                acls_permissoes.acl_value \
            FROM acls \
            INNER JOIN acls_permissoes ON acls_permissoes.id = acls.id_permission \
            WHERE acls.name LIKE '%" + name + "%';";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/addAcl', function(req, res) {
    addAcl(req, res)                   
});

app.post('/saveAcl', function(req, res) {
    saveAcl(req, res)
});

app.post('/delAcl', function(req, res) {
    delAcl(req, res)                                            
});

app.post('/getAclsUser', function(req, res) {                

    let idUser = req.body.idUser

    log_('Verificando informação ACL do usuário: ' + idUser)
    
    let sql = "SELECT * FROM users_acls \
            WHERE id_user = " + idUser + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAclsSectorsById', function(req, res) {                

    let idAcl = req.body.idAcl
    log_('Verificando informaçẽs das ACLS por id: ' + idAcl)
    
    let sql = "SELECT acls_setores.*, false AS checked \
                FROM acls_setores \
            WHERE id_acl = " + idAcl + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/saveAclsUser', function(req, res) {
            
    let idUser = req.body.idUser
    let acls = req.body.acls

    log_('Salvando ACL para usuário: ' + idUser)
    delAclUser(idUser)
    
    acls.forEach(element => {

        let sql = "INSERT INTO users_acls (id_acl, id_user) \
            VALUES (" + element.id + ", " + idUser + ");";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;             
        });
    });    
    
    res.json({"success": 1});        

});

app.post('/getAclsUserSector', function(req, res) {                

    let idUser = req.body.idUser

    log_('Verificando informação ACL por SETORES do usuário: ' + idUser)

    
    let sql = "SELECT acls.id AS ACL_ID,\
            acls.name AS ACL_NOME,\
            acls_permissoes.id AS ACL_PERMISSAO_ID,\
            acls_permissoes.name AS ACL_PERMISSAO,\
            acls_permissoes.acl_value AS ACL_VALOR,\
            setores.name AS SETOR,\
            setores.id AS SETOR_ID \
            FROM users_acls \
            INNER JOIN acls ON acls.id = users_acls.id_acl \
            INNER JOIN acls_permissoes ON acls_permissoes.id = acls.id_permission \
            INNER JOIN acls_setores ON acls_setores.id_acl = acls.id \
            INNER JOIN setores ON setores.id = acls_setores.id_sector \
            WHERE id_user = " + idUser + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getUsers', function(req, res) {                    

    log_('Verificando informação dos usuários')
    
    let sql = "SELECT * FROM users;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getUserByName', function(req, res) {
            
    let name = req.body.name
    log_('Verificando usuário por nome: ' + name)
    
    let sql = "SELECT * FROM users \
        WHERE users.username LIKE '%" + name + "%';";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/blockUser', function(req, res) {
    blockUser(req, res)
});

app.post('/activeUser', function(req, res) {
    activeUser(req, res)
});

http.listen(8085);

