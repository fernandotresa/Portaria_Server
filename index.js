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

/*************************
 * BANCO DE DADOS
 ****************************/

/*var db_config = {
    host: "rds001.cacasorqzf2r.sa-east-1.rds.amazonaws.com",
    user: "portaria",
    password: "c4d3Oc0ntr4t0",
    database: "portaria",
    timezone: 'utc'  
};*/

var db_config = {
    host: "10.0.2.239",
    user: "root",
    password: "Mudaragora00",
    database: "zoologico",
    timezone: 'utc'  
};

/*var db_config = {
    host: "10.19.0.3",
    user: "root",
    password: "Mudaragora00",
    database: "zoologico",
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

function databasePing(){

    let sql = "SELECT true FROM users LIMIT 1;"; 
    
    setInterval( () => {
        con.query(sql, function (err1, result) {        
            if (err1) throw err1;                 
        });
    }, 10000)        
}

handleDisconnect()
databasePing()

/*************************
 * LOGIN
 ****************************/

function getAuth(req, res){

    let username = req.body.username
    let password = req.body.password

    let sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "' ORDER BY id LIMIT 1;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;          
        res.json({"success": result});
    });                        
}

/*************************
 * PERFIS DE ACESSO
 ****************************/

function getAccessGroups(req, res){

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
}

function getAccessGroupsByName(req, res){

    let name = req.body.name
    let idAccessGroupType = req.body.idAccessGroupType    
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            FALSE as checked \
            FROM acessos_controle_perfil \
        INNER JOIN acessos_controle_tipo ON acessos_controle_tipo.id = acessos_controle_perfil.id_type \
        WHERE acessos_controle_perfil.name LIKE '%" + name + "%' \
        AND acessos_controle_tipo.id = " + idAccessGroupType + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function getAccessGroupsTypeById(req, res){

    let idAccessGroupType = req.body.idAccessGroupType
    
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
}

function getAccessGroupsTypes(req, res){

    let idAccessGroupType = req.body.idAccessGroupType    
    
    let sql = "SELECT * \
            FROM acessos_controle_tipo \
        WHERE acessos_controle_tipo.id = " + idAccessGroupType + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });   
}

function getAccessGroupsBySector(req, res){

    let name = req.body.name
    let idAccessGroupType = req.body.idAccessGroupType    
    
    let sql = "SELECT acessos_controle_perfil.*,\
            acessos_controle_tipo.name AS type,\
            FALSE as checked \
            FROM acessos_controle_perfil \
        INNER JOIN acessos_controle_tipo ON acessos_controle_tipo.id = acessos_controle_perfil.id_type \
        INNER JOIN funcionarios ON funcionarios.name = acessos_controle_perfil.name \
        INNER JOIN setores ON setores.id = funcionarios.id_setor \
        WHERE setores.name LIKE '%" + name + "%' \
        AND acessos_controle_tipo.id = " + idAccessGroupType + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });  
}

function createProfileExpire(req, res){

    let name = req.body.name
    let type = req.body.type
    let desc = req.body.desc    
    
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

    events.forEach(element => {

        let  start = moment(element.startTime).tz('America/Sao_Paulo').format()
        let  end = moment(element.endTime).tz('America/Sao_Paulo').format()
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

    let sqlRemove = "DELETE FROM acessos_controle_config WHERE id_profile = " + id + ";"
    log_(sqlRemove)

    con.query(sqlRemove, function (err, result) {        
        if (err) throw err; 
        
        events.forEach(element => {
                
            console.log(element)
            
            let title = element.title            
            let  start = moment(element.startTime).tz('America/Sao_Paulo').format("YYYY-MM-DDTHH:mm:ss")
            let  end = moment(element.endTime).tz('America/Sao_Paulo').format("YYYY-MM-DDTHH:mm:ss")

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
        
    let sql = "INSERT INTO acessos_controle_perfil (name, id_type, description) \
            VALUES ('"+ name + "', ( SELECT id FROM acessos_controle_tipo WHERE name = '" + type + "'), '" + desc + "');";        

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err; 
        createProfileDayweekConfig(req, res)        
    });                            
}

function createProfileDayweekConfig(req, res){
    
    //let name = req.body.name    
    let events = req.body.events   

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
    
    //let name = req.body.name    
    let events = req.body.events   
    let idProfile = req.body.idProfile
        
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

/*************************
 * LISTA DE ACESSO - ACL
 ****************************/

function addAcl(req, res){

    let name = req.body.name
    let permission = req.body.permission

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
    
    let sql = "DELETE FROM acls WHERE id = " + id + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function delAclUser(idUser){
        
    let sql = "DELETE FROM users_acls WHERE id_user = " + idUser + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
    });
}



/**************************************
 * USUARIOS
 *************************************/

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

function verificaCracha(req, res){
    let cracha = req.body.cracha
    let sql = "SELECT * FROM crachas WHERE id_cracha = '" + cracha + " AND id_status = 1';";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": result}); 
    });            
}

function getBadgesTypes(req, res){
    
    let sql = "SELECT * FROM crachas_tipos;";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": result}); 
    });            
}

function addBadges(req, res){    
    let id_cracha = req.body.idCracha
    let id_tipo = req.body.idTipo
    let status = req.body.status

    let sql = "INSERT INTO crachas (id_cracha, id_tipo, id_status) \
            VALUES ('"+id_cracha+"', (SELECT crachas_tipos.id FROM crachas_tipos WHERE crachas_tipos.name = '"+id_tipo+"'), "+status+")";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": result}); 
    });            
}

function saveBadge(req, res){

    let id = req.body.id
    let id_cracha = req.body.idCracha
    let id_tipo = req.body.idTipo
    let status = req.body.status

    let sql = "UPDATE crachas SET \
                id_cracha = '"+id_cracha+"',\
                id_status = "+status+",\
                id_tipo = (SELECT crachas_tipos.id FROM crachas_tipos WHERE crachas_tipos.name = '"+id_tipo+"') \
                WHERE id = "+id+";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;             
        res.json({"success": result}); 
    });
}

function delBadge(req, res){

    let id = req.body.info.id
    let sql = "UPDATE crachas SET id_status = 0 WHERE id = "+id+";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;          
        res.json({"success": result}); 
    });            
}

/***********************
 * FUNCIONARIOS
 ***********************/

function getEmployee(req, res){

    let sql = "SELECT \
        funcionarios.id,\
        funcionarios.name AS name,\
        funcionarios.name_comum AS name_comum,\
        funcionarios.cpf AS cpf,\
        funcionarios.ramal AS ramal,\
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
        funcao.id AS FUNCAO_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
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
}

function getEmployeeByName(req, res){

    let name = req.body.name

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
        funcionarios.ramal,\
        crachas.id_cracha AS CRACHA,\
        crachas.id_tipo AS CRACHA_TIPO,\
        funcionarios_tipos.name AS FUNCIONARIO_TIPO,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        funcao.name AS FUNCAO,\
        funcao.id AS FUNCAO_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
        cargos.name AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  funcao ON funcao.id =  funcionarios.id_funcao \
    LEFT JOIN  empresas ON empresas.id =  funcionarios.id_empresa \
    LEFT JOIN  cargos ON cargos.id =  funcionarios.id_cargo \
    LEFT JOIN  crachas ON crachas.id =  funcionarios.id_cracha \
    WHERE funcionarios.name LIKE '%" + name + "%' AND funcionarios.status = 1;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function getEmployeesByNameInactive(req, res){

    let name = req.body.name

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
        funcionarios.ramal,\
        crachas.id_cracha AS CRACHA,\
        crachas.id_tipo AS CRACHA_TIPO,\
        funcionarios_tipos.name AS FUNCIONARIO_TIPO,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        funcao.name AS FUNCAO,\
        funcao.id AS FUNCAO_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
        cargos.name AS CARGO \
    FROM funcionarios \
    LEFT JOIN  funcionarios_tipos ON funcionarios_tipos.id =  funcionarios.id_tipo \
    LEFT JOIN  setores ON setores.id =  funcionarios.id_setor \
    LEFT JOIN  funcao ON funcao.id =  funcionarios.id_funcao \
    LEFT JOIN  empresas ON empresas.id =  funcionarios.id_empresa \
    LEFT JOIN  cargos ON cargos.id =  funcionarios.id_cargo \
    LEFT JOIN  crachas ON crachas.id =  funcionarios.id_cracha \
    WHERE funcionarios.name LIKE '%" + name + "%' AND funcionarios.status = 0;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function addEmployee(req, res){

    let name = req.body.name
    let endereco = req.body.endereco
    let commumName = req.body.commumName
    let rg = req.body.rg
    let cpf = req.body.cpf
    let district = req.body.district
    let tel = req.body.tel
    let ramal = req.body.ramal
    let registration = req.body.registration
    let badge = req.body.badge
    let employeeFunction = req.body.employeeFunction
    let employeeType = req.body.employeeType
    let employeeSector = req.body.employeeSector
    let employeeCompany = req.body.employeeCompany
    let employeeOffice = req.body.employeeOffice
    let foto = "./assets/imgs/default-user.png"
    let fotosamba = "./assets/imgs/default-user.png"
    let fotoweb = "./assets/imgs/default-user.png"
    let obs = "VAZIO"        

    let sql = "INSERT INTO funcionarios (name, name_comum, rg, cpf, endereco, bairro, telefone, foto, fotosamba, ramal,\
                matricula, id_funcao, id_tipo, id_setor, id_empresa, id_cargo, id_cracha, obs, foto_web, status) \
            VALUES ('" + 
            name + "', '" + 
            commumName + "', '" + 
            rg + "', '" + 
            String(cpf) + "', '" + 
            endereco + "', '" + 
            district + "', '" + 
            String(tel) + "', '" + 
            foto + "', '" + 
            fotosamba + "', '" + 
            String(ramal) + "', '" + 
            registration + "', " +            
            "(SELECT funcao.id FROM funcao WHERE name = '" + employeeFunction + "' LIMIT 1)" + "," +
            "(SELECT funcionarios_tipos.id FROM funcionarios_tipos WHERE name = '" + employeeType + "' LIMIT 1)" + "," +
            "(SELECT setores.id FROM setores WHERE name = '" + employeeSector + "' LIMIT 1)" + "," +
            "(SELECT empresas.id FROM empresas WHERE name = '" + employeeCompany + "' LIMIT 1)" + "," +
            "(SELECT cargos.id FROM cargos WHERE name = '" + employeeOffice + "' LIMIT 1)" + ", '," + 
            "(SELECT crachas.id FROM crachas WHERE id_cracha = '" + String(badge) + "' LIMIT 1)" + "', '" +
            obs + "', '" +
            fotoweb + "', 1);";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    }); 
}

function editEmployee(req, res){

    let id = req.body.id
    let name = req.body.name
    let endereco = req.body.endereco
    let commumName = req.body.commumName
    let rg = req.body.rg
    let cpf = req.body.cpf
    let district = req.body.district
    let tel = req.body.tel
    let ramal = req.body.ramal
    let registration = req.body.registration
    let badge = req.body.badge
    let employeeFunction = req.body.employeeFunction
    let employeeType = req.body.employeeType
    let employeeSector = req.body.employeeSector
    let employeeCompany = req.body.employeeCompany
    let employeeOffice = req.body.employeeOffice
    let foto = "./assets/imgs/default-user.png"
    let fotosamba = "./assets/imgs/default-user.png"
    let fotoweb = "./assets/imgs/default-user.png"
    let obs = "VAZIO"
        

    let sql = "UPDATE funcionarios SET \
                name = '" + name + "',\
                name_comum = '" + commumName + "',\
                rg = '" + rg + "',\
                cpf = '" + String(cpf) + "',\
                bairro = '" + district + "',\
                endereco = '" + endereco + "',\
                telefone = '" + String(tel) + "',\
                foto = '" + foto + "',\
                fotosamba = '" + fotosamba + "',\
                ramal = '" + String(ramal) + "',\
                matricula = '" + String(registration) + "',\
                id_funcao = (SELECT funcao.id FROM funcao WHERE name = '" + employeeFunction + "' LIMIT 1)" + ",\
                id_tipo = (SELECT funcionarios_tipos.id FROM funcionarios_tipos WHERE name = '" + employeeType + "' LIMIT 1)" + ",\
                id_setor = (SELECT setores.id FROM setores WHERE name = '" + employeeSector + "' LIMIT 1)" + ",\
                id_empresa = (SELECT empresas.id FROM empresas WHERE name = '" + employeeCompany + "' LIMIT 1)"  + ",\
                id_cargo = (SELECT cargos.id FROM cargos WHERE name = '" + employeeOffice + "' LIMIT 1)" + ",\
                id_cracha = (SELECT crachas.id FROM crachas WHERE id_cracha = '" + String(badge) + "' LIMIT 1)" + ",\
                obs = '" + obs + "',\
                foto_web = '" + fotoweb + "',\
                status = 1 \
                WHERE id = " + id + ";";            

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    }); 
}

/***********************
 * VISITANTES
 ***********************/

 function getGuest(req, res){

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
        empresas.name AS EMPRESA,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
        cargos.name AS CARGO \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    LEFT JOIN  setores ON setores.id =  visitantes.id_setor \
    LEFT JOIN  cargos ON cargos.id =  visitantes.id_cargo \
    WHERE visitantes.name IS NOT NULL \
    ORDER BY visitantes.name ASC \
    LIMIT 0,20;";

    log_(sql)    

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
 }

 function getGuestByName(req, res){
    let name = req.body.name    
    
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
        empresas.name AS EMPRESA,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
        cargos.name AS CARGO \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    LEFT JOIN  setores ON setores.id =  visitantes.id_setor \
    LEFT JOIN  cargos ON cargos.id =  visitantes.id_cargo \
    WHERE visitantes.name LIKE '%" + name + "%' \
    AND visitantes.name IS NOT NULL \
    AND visitantes.status = 1;";

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });  
 }

 function getGuestsByNameInactive(req, res){
    let name = req.body.name    
    
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
        empresas.name AS EMPRESA,\
        setores.name AS SETOR,\
        setores.id AS SETOR_ID,\
        empresas.name AS EMPRESA,\
        empresas.id AS EMPRESA_ID,\
        cargos.id AS CARGO_ID,\
        cargos.name AS CARGO \
    FROM visitantes \
    LEFT JOIN  visitantes_tipos ON visitantes_tipos.id =  visitantes.id_tipo \
    LEFT JOIN  funcionarios ON funcionarios.id =  visitantes.id_autorizado_por \
    LEFT JOIN  crachas ON crachas.id =  visitantes.id_cracha \
    LEFT JOIN  empresas ON empresas.id =  visitantes.id_empresa \
    LEFT JOIN  setores ON setores.id =  visitantes.id_setor \
    LEFT JOIN  cargos ON cargos.id =  visitantes.id_cargo \
    WHERE visitantes.name LIKE '%" + name + "%' \
    AND visitantes.name IS NOT NULL \
    AND visitantes.status = 0;";

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });  
 }

function addGuest(req, res){

    let name = req.body.name
    let endereco = req.body.endereco
    let authorizedBy = req.body.authorizedBy
    let rg = req.body.rg
    let cpf = req.body.cpf
    let district = req.body.district
    let tel = req.body.tel
    let registration = req.body.registration
    let badge = req.body.badge
    let employeeType = req.body.employeeType
    let employeeSector = req.body.employeeSector
    let employeeCompany = req.body.employeeCompany
    let employeeOffice = req.body.employeeOffice
    let foto = "./assets/imgs/default-user.png"
    let fotosamba = "./assets/imgs/default-user.png"
    let fotoweb = "./assets/imgs/default-user.png"
    let obs = "VAZIO"        

    let sql = "INSERT INTO visitantes (name, id_autorizado_por, rg, cpf, endereco, bairro, telefone, foto, fotosamba \
                matricula, id_funcao, id_tipo, id_setor, id_empresa, id_cargo, id_cracha, obs, foto_web, status) \
            VALUES ('" + 
            name + "', '" + 
            authorizedBy + "', '" + 
            rg + "', '" + 
            String(cpf) + "', '" + 
            endereco + "', '" + 
            district + "', '" + 
            String(tel) + "', '" + 
            foto + "', '" + 
            fotosamba + "', '" +
            registration + "', " +            
            "(SELECT visitantes_tipos.id FROM visitantes_tipos WHERE name = '" + employeeType + "' LIMIT 1)" + "," +
            "(SELECT setores.id FROM setores WHERE name = '" + employeeSector + "' LIMIT 1)" + "," +
            "(SELECT empresas.id FROM empresas WHERE name = '" + employeeCompany + "' LIMIT 1)" + "," +
            "(SELECT cargos.id FROM cargos WHERE name = '" + employeeOffice + "' LIMIT 1)" + ", '," + 
            "(SELECT crachas.id FROM crachas WHERE id_cracha = '" + String(badge) + "' LIMIT 1)" + "', '" +
            obs + "', '" +
            fotoweb + "', 1);";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    }); 
}

function editGuest(req, res){

    let id = req.body.id
    let name = req.body.name
    let endereco = req.body.endereco
    let authorizedBy = req.body.authorizedBy
    let rg = req.body.rg
    let cpf = req.body.cpf
    let district = req.body.district
    let tel = req.body.tel    
    let registration = req.body.registration
    let badge = req.body.badge
    let employeeType = req.body.employeeType
    let employeeSector = req.body.employeeSector
    let employeeCompany = req.body.employeeCompany
    let employeeOffice = req.body.employeeOffice
    let foto = "./assets/imgs/default-user.png"
    let fotosamba = "./assets/imgs/default-user.png"
    let fotoweb = "./assets/imgs/default-user.png"
    let obs = "VAZIO"
        

    let sql = "UPDATE visitantes SET \
                name = '" + name + "',\
                id_autorizado_por = " + authorizedBy + ",\
                rg = '" + rg + "',\
                cpf = '" + String(cpf) + "',\
                bairro = '" + district + "',\
                endereco = '" + endereco + "',\
                telefone = '" + String(tel) + "',\
                foto = '" + foto + "',\
                fotosamba = '" + fotosamba + "',\
                matricula = '" + String(registration) + "',\
                id_tipo = (SELECT visitantes_tipos.id FROM visitantes_tipos WHERE name = '" + employeeType + "' LIMIT 1)" + ",\
                id_setor = (SELECT setores.id FROM setores WHERE name = '" + employeeSector + "' LIMIT 1)" + ",\
                id_empresa = (SELECT empresas.id FROM empresas WHERE name = '" + employeeCompany + "' LIMIT 1)"  + ",\
                id_cargo = (SELECT cargos.id FROM cargos WHERE name = '" + employeeOffice + "' LIMIT 1)" + ",\
                id_cracha = (SELECT crachas.id FROM crachas WHERE id_cracha = '" + String(badge) + "' LIMIT 1)" + ",\
                obs = '" + obs + "',\
                foto_web = '" + fotoweb + "',\
                status = 1 \
                WHERE id = " + id + ";";            

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    }); 
}

/***********************
 * VEICULOS
 ***********************/

function getVehicleByEmployeeId(req, res){        

    let id = req.body.id
    
    let sql =  "SELECT \
        veiculos_funcionarios.placa AS plate,\
        veiculos_marcas.name AS brand,\
        UPPER(veiculos_modelos.name) AS model,\
        UPPER(veiculos_tipos.name) AS type \
        FROM veiculos_funcionarios \
        INNER JOIN veiculos_marcas ON veiculos_marcas.id = veiculos_funcionarios.id_marca \
        INNER JOIN veiculos_modelos ON veiculos_modelos.id = veiculos_funcionarios.id_modelo \
        INNER JOIN veiculos_tipos ON veiculos_tipos.id = veiculos_funcionarios.id_tipo \
            WHERE veiculos_funcionarios.id_owner = " + id + ";";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;          

        res.json({"success": result});        
    });
}

function addVehicle(req, res){

    let id = req.body.id
    let sql = "DELETE FROM veiculos_funcionarios WHERE id_owner = " + id + ";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;          
        addVehicleContinue(req, res)
    });            
}

function addVehicleContinue(req, res){

    let id = req.body.id
    let vehicles = req.body.vehicles

    vehicles.forEach(element => {
    
        let sql = "INSERT INTO veiculos_funcionarios (id_owner, id_tipo, id_modelo, id_marca, placa, status) \
            VALUES (" + id + ",\
            (SELECT veiculos_tipos.id FROM veiculos_tipos WHERE veiculos_tipos.name = '"+ element.type + "' LIMIT 1),\
            (SELECT veiculos_modelos.id FROM veiculos_modelos WHERE veiculos_modelos.name = '"+ element.model + "' LIMIT 1),\
            (SELECT veiculos_marcas.id FROM veiculos_marcas WHERE veiculos_marcas.name = '"+ element.brand + "' LIMIT 1),\
            '" + element.plate + "', 1)"

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;  
            res.json({"success": result}); 
        });
    });
}

function getVehicleTypes(req, res){
    
    let sql =  "SELECT *, UPPER(name) AS name FROM veiculos_tipos ORDER BY name;"
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;          
        res.json({"success": result});        
    });
}

function getVehicleModels(req, res){
    
    let sql =  "SELECT *, UPPER(name) AS name FROM veiculos_modelos ORDER BY name;"
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;          
        res.json({"success": result});        
    });
}

function getVehicleBrands(req, res){
    
    let sql =  "SELECT *, UPPER(name) AS name FROM veiculos_marcas ORDER BY name;"
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;          
        res.json({"success": result});        
    });
}

/***********************
 * EMPRESAS
 ***********************/

function addCompany(req, res){

    let name = req.body.name
    let responsavel = req.body.responsavel
    let endereco = req.body.endereco
    let bairro = req.body.bairro
    let cnpj = req.body.cnpj
    let tel = req.body.tel
    let status = req.body.status
    let status_ = status === 'Ativo'
    
    let sql =  "INSERT INTO empresas \
        (name, cnpj, endereco, bairro, responsavel,  status, telefone) \
                VALUES ('" + name + "', '"+ cnpj+"', '"+endereco+"', '"+bairro+"',\
                '"+responsavel+"', "+status_+", '"+tel +"')";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function saveCompany(req, res){

    let id = req.body.id
    let name = req.body.name
    let responsavel = req.body.responsavel
    let endereco = req.body.endereco
    let bairro = req.body.bairro
    let cnpj = req.body.cnpj
    let tel = req.body.tel
    let status = req.body.status
    
    let sql =  "UPDATE empresas SET \
        name = '"+name+"',\
        cnpj = '"+cnpj+"',\
        endereco = '"+endereco+"',\
        bairro = '"+bairro+"',\
        responsavel = '"+responsavel+"',\
        status = "+status+", \
        telefone = '"+tel+"' \
    WHERE id = "+id+";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function delCompany(req, res){

    let id = req.body.info.id
       
    let sql =  "UPDATE empresas SET status = 0 WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/***********************
 * CARGOS
 ***********************/

function addOffice(req, res){

    let name = req.body.name    
    let status = req.body.status
    let status_ = status === 'Ativo'
    
    let sql = "INSERT INTO cargos (name, status) VALUES ('" + name + "', "+ status_+")";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function saveOffice(req, res){

    let id = req.body.id
    let name = req.body.name   
    let status = req.body.status
    let status_ = status === 'Ativo'
    
    let sql =  "UPDATE cargos SET name = '"+name+"',status = "+status_+" WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function delOffice(req, res){

    let id = req.body.info.id
       
    let sql =  "UPDATE cargos SET status = 0 WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/******************************
 * SETORES
 ********************************/

function addSector(req, res){

    let name = req.body.name    
    let status = req.body.status
    let status_ = status === 'Ativo'
    
    let sql = "INSERT INTO setores (name, status) VALUES ('" + name + "', "+ status_+")";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function saveSector(req, res){

    let id = req.body.id
    let name = req.body.name   
    let status = req.body.status
    let status_ = status === 'Ativo'
    
    let sql =  "UPDATE setores SET name = '"+name+"',status = "+status_+" WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function delSector(req, res){

    let id = req.body.id
       
    let sql =  "UPDATE setores SET status = 0 WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/***********************
 * PONTOS DE ACESSO
 ***********************/

function getAccessPoints(req, res){

    let sql = "SELECT * FROM pontos;";    
    log_(sql)    

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });  
}

function getAccessPointsByName(req, res){

    let sql = "SELECT * FROM pontos WHERE name LIKE '%" + req.body.name + "%';";
    log_(sql)    

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });  
}

function getAccessPointsEmployee(req, res){

    let id = req.body.id

    let sql = "SELECT * FROM acessos_funcionarios \
            INNER JOIN pontos ON pontos.id = acessos_funcionarios.id_ponto \
            WHERE acessos_funcionarios.id_funcionario = " + id + " \
            ORDER BY acessos_funcionarios.datahora DESC LIMIT 1;";

    log_(sql)    

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function getLastAccessEmployee(req, res){

    let id = req.body.id

    let sql = "SELECT \
            pontos.* \
            FROM acessos_permitidos \
            INNER JOIN pontos ON pontos.id = acessos_permitidos.id_ponto \
            INNER JOIN funcionarios ON funcionarios.id_cracha = acessos_permitidos.id_cracha \
            INNER JOIN crachas ON crachas.id = funcionarios.id_cracha \
                WHERE funcionarios.id = " + id + ";";

    log_(sql)    

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });
}

function removeAccessPointsEmployee(req, res){

    let id = req.body.badge

    let sql = "DELETE FROM acessos_permitidos WHERE id_cracha = \
    ( SELECT id FROM crachas WHERE id_cracha = " + id + " ORDER by id LIMIT 1);";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;   

        addAccessPointsEmployee(req, res)               
    });
}

function addAccessPointsEmployee(req, res){
    let accessPoints = req.body.accessPoints
    let badge = req.body.badge

    accessPoints.forEach(element => {
    
        let sql = "INSERT INTO acessos_permitidos (id_cracha, id_ponto, datahora) \
        VALUES (\
            (SELECT crachas.id FROM crachas WHERE crachas.id_cracha = '" + badge + "' ORDER by crachas.id LIMIT 1),\
            (SELECT pontos.id FROM pontos WHERE pontos.name = '" + element + "' ORDER by pontos.id LIMIT 1), NOW() )"

        log_(sql)
    
        con.query(sql, function (err, result) {        
            if (err) throw err;                            
        });
    });

    activeCracha(req, res)

    res.json({"success": 1});        
}

function activeCracha(req, res){

    let badge = req.body.badge

    let sql = "UPDATE crachas SET id_status = 1 WHERE \
            id_cracha = '" + badge + "' ORDER by id LIMIT 1;";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;                            
    });
}

function addAccessPoint(req, res){

    let name = req.body.name
    let status = req.body.status
    let apType = req.body.apType
    let apCu = req.body.apCu
    let ipAddress = req.body.ipAddress
    
    let sql = "INSERT INTO pontos (name, status, id_tipo, ip, codigo) \
            VALUES ('"+name+"', "+status+", "+apType+", '"+ipAddress+"', "+apCu+")";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        removeCameraPonto(req, res)
    });    
}

function saveAccessPoint(req, res){

    let id = req.body.id
    let name = req.body.name
    let status = req.body.status
    let status_ = status === 'Ativo'
    let apType = req.body.apType
    let apCu = req.body.apCu
    let ipAddress = req.body.ipAddress
    
    let sql =   "UPDATE pontos SET \
            name = '"+name+"',\
            status = "+status_+",\
            id_tipo = "+apType+"\
            ip = '"+ipAddress+"',\
            codigo = "+apCu+" \
            WHERE id = "+id+"";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        removeCameraPonto(req, res)
    });    
}

function delAccessPoint(req, res){

    let id = req.body.id
       
    let sql =  "UPDATE setores SET status = 0 WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/***********************
 * CAMERAS
 ***********************/

function removeCameraPonto(req, res){
    let name = req.body.name

    let sql = "DELETE FROM cameras_pontos WHERE id_ponto = \
        (SELECT pontos.id FROM pontos WHERE pontos.name = '"+name+"' LIMIT 1);"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        addCameraPonto(req, res)        
    });    
}

function addCameraPonto(req, res){
    let name = req.body.name
    let ipCameras = req.body.ipCameras

    ipCameras.forEach(element => {
    
        let sql = "INSERT INTO cameras_pontos (id_ponto, id_camera) \
            VALUES (\
                (SELECT pontos.id FROM pontos WHERE pontos.name = '"+name+"' LIMIT 1),\
                (SELECT cameras.id FROM cameras WHERE cameras.name = '"+element+"' LIMIT 1))";

        log_(sql)

        con.query(sql, function (err, result) {        
            if (err) throw err;          
        });    
    }); 
    
    res.json({"success": 1}); 
}

function getCameraPonto(req, res){
    let id = req.body.id

    let sql = "SELECT * FROM cameras_pontos \
            INNER JOIN cameras ON cameras.id = cameras_pontos.id_camera \
            WHERE id_ponto = "+id+";"

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function getCameras(req, res){    
    let sql = "SELECT * FROM cameras WHERE status = 1;"
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function getCamerasByName(req, res){    

    let name = req.body.name
    let sql = "SELECT * FROM cameras WHERE status = 1 AND name LIKE '%"+name+"%';"
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function addCamera(req, res){    

    let name = req.body.name
    let ipAddress = req.body.ip
    let channel = req.body.channel
    let status = req.body.status
    let type = req.body.type
    let url = req.body.url

    let sql = "INSERT INTO cameras (name, endereco_ip, canal, status, tipo, url) \
            VALUES ('"+ name +"', '" + ipAddress + "', "+channel+", "+status+", "+type+", '"+url+"');";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function saveCamera(req, res){    

    let id = req.body.id
    let name = req.body.name
    let ipAddress = req.body.ip
    let channel = req.body.channel
    let status = req.body.status
    let type = req.body.type
    let url = req.body.url

    let sql = "UPDATE cameras SET \
            name = '"+name+"',\
            endereco_ip = '"+ipAddress+"',\
            canal = "+channel+",\
            status = "+status+",\
            tipo = "+type+",\
            url = '"+url+"' \
        WHERE id = "+id+";";

    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function delCamera(req, res){

    let id = req.body.info.id
       
    let sql =  "UPDATE cameras SET status = 0 WHERE id = "+id+";";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/***************************
 * CRACHAS
 *********************/ 

function getBadges(req, res){
    
    let sql = "SELECT * FROM crachas;";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

function getBadgesNumber(req, res){

    let id = req.body.id
    
    let sql = "SELECT * FROM crachas WHERE id_cracha = "+id+" AND id_status = 1;";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}

/***************************
 * API
 *********************/ 

function getAPICommands(req, res){
    
    let id = req.body.id

    let sql = "SELECT * FROM comando_sistema WHERE id_ponto = " + id + " AND status = 1;";
    log_(sql)

    con.query(sql, function (err, result) {        
        if (err) throw err;  
        res.json({"success": result}); 
    });    
}


/**
 * RECEPTOR
 */

function getAllReceptors(req, res){

    let sql = "SELECT * FROM pontos;";
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;           
        res.json({"success": result}); 
    });
}

function systemCommand(req, res){

    console.log(req.body)

    let cmd = req.body.cmd
    let idUser = req.body.idUser
    let ipPonto = req.body.ipPonto

    let sql = "INSERT INTO comando_sistema (id_comando, id_user, ip_ponto) \
        VALUES (" + cmd + "," + idUser + ",'" + ipPonto + "');";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;           
        res.json({"success": result}); 
    });
}

function runQuery(req, res){

    let sql = req.body.sql
    log_(sql)

    return new Promise(function(resolve, reject) {

        con.query(sql, function (err, result) {        
            if (err){
                console.log(err)
                reject(err); 
            }
                
            else
                resolve(runQueryContinue(result, req.body));
                    
        });                 
    })    

}

function runQueryContinue(results, body){
    
    const idUser = body.idUser
    const ipPonto = body.idPonto
    var rows = JSON.stringify(results[0]);    

    let sql = "INSERT INTO comando_sistema (id_comando, id_user, ip_ponto, callback_query) \
        VALUES (" + cmd + "," + idUser + ",'" + ipPonto + "', '" + rows + "');";

    log_(sql)

    return new Promise(function(resolve, reject) {

        con.query(sql, function (err, result) {        
            if (err){
                console.log(err)
                reject(err);   
            }
                                                         
            else
                resolve("Consulta realizada com sucesso!");                                            
                    
        });                 
    })    

}

async function systemCommandLocal(req, res) {
    console.log("Executando comando...")
    
    const { stdout, stderr } = await exec('xdotool key ctrl+Tab');
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);

    res.json({"success": stdout}); 
}


/*************************
 * APP POSTS
 ********************************/

app.post('/getAuth', function(req, res) {
    getAuth(req, res)     
});

app.post('/getEmployees', function(req, res) {            
    getEmployee(req, res)                           
});

app.post('/getEmployeesByName', function(req, res) {            
    getEmployeeByName(req, res)                            
});

app.post('/getEmployeesByNameInactive', function(req, res) {            
    getEmployeesByNameInactive(req, res)                            
});

app.post('/getGuests', function(req, res) {
    getGuest(req, res)                            
});

app.post('/getGuestsByName', function(req, res) {            
    getGuestByName(req, res)              
});

app.post('/getGuestsByNameInactive', function(req, res) {            
    getGuestsByNameInactive(req, res)              
});

app.post('/getAccessGroups', function(req, res) {                
    getAccessGroups(req, res)                           
});

app.post('/getAccessGroupsByName', function(req, res) {            
    getAccessGroupsByName(req, res)          
});

app.post('/getAccessGroupsTypeById', function(req, res) {            
    getAccessGroupsTypeById(req, res)            
});

app.post('/getAccessGroupsTypes', function(req, res) {            
    getAccessGroupsTypes(req, res)             
});

app.post('/getAccessGroupsBySector', function(req, res) {            
    getAccessGroupsBySector(req, res)       
});

app.post('/getWorkFunctions', function(req, res) {                
    
    let sql = "SELECT * FROM funcao;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getEmployeeTypes', function(req, res) {
                
    let sql = "SELECT * FROM funcionarios_tipos;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getGuestTypes', function(req, res) {
                
    let sql = "SELECT * FROM visitantes_tipos;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getSectors', function(req, res) {
            
    log_('Verificando Setores')
    
    let sql = "SELECT setores.*, false AS checked FROM setores  WHERE status = 1;;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getSectorsByName', function(req, res) {                
    
    let sql = "SELECT * FROM setores WHERE name LIKE '%" + req.body.name + "%'  AND status = 1; ";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getCompanies', function(req, res) {                
    
    let sql = "SELECT * FROM empresas WHERE status = 1;";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getCompaniesByName', function(req, res) {                
    
    let sql = "SELECT * FROM empresas WHERE name LIKE '%" + req.body.name + "%' AND status = 1;";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getOffices', function(req, res) {
            
    log_('Verificando Cargos')
    
    let sql = "SELECT * FROM cargos WHERE status = 1;";        

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getOfficeByName', function(req, res) {                
    
    let sql = "SELECT * FROM cargos WHERE name LIKE '%" + req.body.name + "%' AND status = 1;";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessControlTypes', function(req, res) {
                
    let sql = "SELECT * FROM acessos_controle_tipo;"; 
    log_(sql)       

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

app.post('/getAclsNameEmployee', function(req, res) {
            
    let idEmployee = req.body.idEmployee

    let sql = "SELECT acls.*, \
        acls_permissoes.name AS permissao,\
        acls_permissoes.acl_value \
    FROM acls \
    INNER JOIN acls_permissoes ON acls_permissoes.id = acls.id_permission \
    INNER JOIN users_acls ON users_acls.id_acl = acls.id \
    WHERE users_acls.id_user = " + idEmployee + ";";        

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAccessProfilesNameGuest', function(req, res) {
            
    let idGuest = req.body.idGuest
    
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
    let sql = "SELECT * FROM acessos_controle WHERE id_guest = " + idGuest + ";";        
    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getAcls', function(req, res) {                
    
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
    
    let sql = "SELECT * FROM users;";

    log_(sql)

    con.query(sql, function (err1, result) {        
        if (err1) throw err1;                  
        res.json({"success": result});        
    });                        
});

app.post('/getUserByName', function(req, res) {
            
    let name = req.body.name
    
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

app.post('/addEmployee', function(req, res) {
    addEmployee(req, res)
});

app.post('/editEmployee', function(req, res) {
    editEmployee(req, res)
});

app.post('/verificaCracha', function(req, res) {
    verificaCracha(req, res)
});

app.post('/addGuest', function(req, res) {
    addGuest(req, res)
});

app.post('/editGuest', function(req, res) {
    editGuest(req, res)
});

app.post('/addVehicle', function(req, res) {
    addVehicle(req, res)
});

app.post('/getVehicleTypes', function(req, res) {
    getVehicleTypes(req, res)
});

app.post('/getVehicleModels', function(req, res) {
    getVehicleModels(req, res)
});

app.post('/getVehicleBrands', function(req, res) {
    getVehicleBrands(req, res)
});

app.post('/getVehicleByEmployeeId', function(req, res) {    
    getVehicleByEmployeeId(req, res)
});

app.post('/getAccessPoints', function(req, res) {    
    getAccessPoints(req, res)
});

app.post('/getAccessPointsByName', function(req, res) {    
    getAccessPointsByName(req, res)
});

app.post('/getAccessPointsEmployee', function(req, res) {        
    getAccessPointsEmployee(req, res)                                
});

app.post('/getLastAccessEmployee', function(req, res) {        
    getLastAccessEmployee(req, res)                                
});

app.post('/addAccessPointsEmployee', function(req, res) {       
    removeAccessPointsEmployee(req, res)
});

app.post('/addCompany', function(req, res) {       
    addCompany(req, res)
});

app.post('/saveCompany', function(req, res) {       
    saveCompany(req, res)
});

app.post('/delCompany', function(req, res) {       
    delCompany(req, res)
});

app.post('/addOffice', function(req, res) {       
    addOffice(req, res)
});

app.post('/saveOffice', function(req, res) {       
    saveOffice(req, res)
});

app.post('/delOffice', function(req, res) {       
    delOffice(req, res)
});

app.post('/addSector', function(req, res) {       
    addSector(req, res)
});

app.post('/saveSector', function(req, res) {       
    saveSector(req, res)
});

app.post('/delSector', function(req, res) {       
    delSector(req, res)
});

app.post('/addAccessPoint', function(req, res) {       
    addAccessPoint(req, res)
});

app.post('/saveAccessPoint', function(req, res) {       
    saveAccessPoint(req, res)
});

app.post('/delAccessPoint', function(req, res) {       
    delAccessPoint(req, res)
});

app.post('/getBadges', function(req, res) {       
    getBadges(req, res)
});

app.post('/getBadgesNumber', function(req, res) {       
    getBadgesNumber(req, res)
});

app.post('/getCameraPonto', function(req, res) {       
    getCameraPonto(req, res)
});

app.post('/getCameras', function(req, res) {       
    getCameras(req, res)
});

app.post('/getCamerasByName', function(req, res) {       
    getCamerasByName(req, res)
});

app.post('/getBadgesTypes', function(req, res) {       
    getBadgesTypes(req, res)
});

app.post('/addBadges', function(req, res) {       
    addBadges(req, res)
});

app.post('/saveBadge', function(req, res) {       
    saveBadge(req, res)
});

app.post('/delBadge', function(req, res) {       
    delBadge(req, res)
});

app.post('/addCamera', function(req, res) {       
    addCamera(req, res)
});

app.post('/saveCamera', function(req, res) {       
    saveCamera(req, res)
});

app.post('/delCamera', function(req, res) {       
    delCamera(req, res)
});

app.post('/getAPICommands', function(req, res) {       
    getAPICommands(req, res)
});

/**
 * COMANDOS RECEPTOR
 */

app.post('/getAllReceptors', function(req, res) {    
    getAllReceptors(req, res)    
})

app.post('/systemCommand', function(req, res) {    
    systemCommand(req, res)    
})

/**
 * RODA QUERIES
 */

app.post('/runQuery', function(req, res) {    

    runQuery(req, res)    
    .then(data => {
        res.json({"success": data});
    })
    .catch(() => {
        res.json({"success": false});
    })
})




http.listen(8085);