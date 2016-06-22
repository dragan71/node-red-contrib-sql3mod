module.exports = function (RED) {
    "use strict";
    var reconnect = RED.settings.mysqlReconnectTime || 30000;
    var mysqldb = require('mysql');
    
    
    function MySQLNode1(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        this.tz = n.tz || "local";

        this.connected = false;
        this.connecting = false;

        this.dbname = n.db;
        var node = this;

        function doConnect() {
            node.connecting = true;
            node.connection = mysqldb.createConnection({
                host : node.host,
                port : node.port,
                user : node.credentials.user,
                password : node.credentials.password,
                database : node.dbname,
                timezone : node.tz,
                insecureAuth: true
            });

            node.connection.connect(function(err) {
                node.connecting = false;
                if (err) {
                    node.error(err);
                    node.tick = setTimeout(doConnect, reconnect);
                } else {
                    node.connected = true;
                }
            });

            node.connection.on('error', function(err) {
                node.connected = false;
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    doConnect(); // silently reconnect...
                } else {
                    node.error(err);
                    doConnect();
                }
            });
        }

        this.connect = function() {
            if (!this.connected && !this.connecting) {
                doConnect();
            }
        }

        this.on('close', function (done) {
            if (this.tick) { clearTimeout(this.tick); }
            if (this.connection) {
                node.connection.end(function(err) {
                    if (err) { node.error(err); }
                    done();
                });
            } else {
                done();
            }
        });
    }
    
    RED.nodes.registerType("MySQLdatab",MySQLNode1, {
        credentials: {
            user: {type: "text"},
            password: {type: "password"}
        }
    });
    
    function Sql3ModNode(n) {
        RED.nodes.createNode(this,n);
        this.mydb = n.mydb;
        this.mydbConfig = RED.nodes.getNode(this.mydb);

        if (this.mydbConfig) {
            this.mydbConfig.connect();
            var node = this;
            node.on("input", function(msg) {
                if (typeof msg.topic === 'string') {
                    //console.log("query:",msg.topic);
                    var bind = Array.isArray(msg.payload) ? msg.payload : [];
                    node.mydbConfig.connection.query(msg.topic, bind, function(err, rows) {
                        if (err) { node.error(err,msg); }
                        else {
                            msg.payload = rows;
                            node.send(msg);
                        }
                    });
                }
                else {
                    if (typeof msg.topic !== 'string') { node.error("msg.topic : the query is not defined as a string"); }
                }
            });
        }
        else {
            this.error("MySQL database not configured");
        }
    }
    //RED.nodes.registerType("mysql",MysqlDBNodeIn);
    RED.nodes.registerType("sql3mod", Sql3ModNode);
    
    
    
//    function Sql3ModNode(config) {
//        RED.nodes.createNode(this, config);
//        var node = this;
//        this.on('input', function (msg) {
//            var flowContext = this.context().flow;
//            var count = flowContext.get('count') || 0;
//            if (typeof msg.payload === 'string') {
//                count += 1;
//                msg.payload = msg.payload.toLowerCase();
//            } else if (typeof msg.payload === 'object') {
//                if (msg.payload.name !== 'undefined') {
//                    count -= 1;
//                    msg.payload = msg.payload.name.toLowerCase();
//                }
//            }
//            console.log("Count: " + count);
//            flowContext.set('count', count);
//            node.send(msg);
//        });
//    }
//    RED.nodes.registerType("sql3mod", Sql3ModNode);
};