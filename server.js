//❤️全局this
var that = this;

/**
 * 🔥mysql预处理
 */


function mysqlConnection() {
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: '127.0.0.1',
        port: '3306',
        user: 'mc',
        password: '3EPwHxbP6M7BXh4Y',
        database: 'mc'
    });
    connection.connect();
    return connection;
}

/**
 * 🔥websocket流程处理
 */
function wsCreat(connection) {
    var that = this;
    var ws = require('nodejs-websocket');
    var clients = new Array();
    var wsConnection = new Array();
    var tmp = new Array();
    var latest;

    console.log('mc iot websocket connection：\n')

    /**
     * 🔥开始运作server
     */
    var server = ws.createServer(function (socket) {
        var newly = true; //🚀判断该连接是否发送的是配置消息
        console.log('开始连接：')
        socket.sendText('用户' + socket.key + '已连接');

        //🚀存入数组
        server.connections.forEach((client) => {
            socket.token = "";
            clients.push(socket);
            latest = socket;
        })

        socket.on('text', function (str) {
            //console.log(socket);
            if (newly) {
                //console.log("🔥鉴权开始")
                //🚀accessToken鉴权
                //🚀查询数据库是否存在相同
                connection.query("SELECT * FROM item_access_tokens WHERE token =" + "'" + str + "'", function (error, item, fields) {

                    console.log("🔥查找到token")
                    if (item.length > 0) {
                        console.log("🔥存在token")
                        socket['tag'] = item[0].item;
                        wsConnection[item[0].item] = socket;
                        //console.log(wsConnection);

                        //🚀更新当前设备key
                        connection.query("UPDATE pools SET `socketCode` = " + "'" + socket.key + "'" + " WHERE `token` = " + "'" + item[0].item + "'", function (error, ret, fields) {
                            sendMsg(socket, "success", 1);

                        });
                        newly = false;
                    } else {
                        //🚀不存在
                        console.log('Token验证失败');
                        sendMsg(socket, "failed", 1);
                        //🚀新建数据
                        //connection.query("INSERT INTO pools (token,socketCode) VALUES(" + "'" + str + "'" + ',' + "'" + socket.key + "'" + ")", function(error, ret, fields) {});
                    }
                });

            } else {
                //TODO 🔥数据交换相关

                //🚀处理数据格式
                var data = JSON.parse(str);
                var token = socket['tag']; //🚀当前用户
                var to = data.target; //🚀发送目标
                var msg = data.msg;
                //🚀判断是否存在target对象
                if (to == "default") {
                    /**
                     * 🚀批量发送标识
                     * 🚀进行关系表的对应发送
                     */
                    var sqltmp = "SELECT * FROM pool_extends WHERE belong =" + "'" + token + "'";
                    console.log("🔥mysql = " + sqltmp)
                    connection.query(sqltmp, function (error, newFrom, fields) {
                        console.log(newFrom);
                        newFrom.forEach(function (findpool, index) {
                            //🚀查询数据
                            sendMsg(wsConnection[findpool[to]], msg, 2);
                            // wsConnection[findpool[to]].sendText(msg);

                        });

                    })
                } else {
                    //🚀存在指定目标
                    //TODO  限定指定目标与用户关系
                    //🚀查找目标
                    console.log(to);
                    sendMsg(wsConnection[to], msg, 2);
                }


            }
            console.log(socket.key + "说：" + str);
            //向前端回复消息
        });
        socket.on("close", function (code, reason) {
            //🚀删除连接
            console.log(socket.key + "断开连接")

        })
        //监听异常
        socket.on("error", () => {
            console.log(socket.key + "连接异常")
        })
    }).listen(3000);
}

function sendMsg(target, data, type) {
    var msg = { "type": type }
    switch (type) {
        case 1:
            msg['data'] = data;
            target.sendText(JSON.stringify(msg));
            break;
        case 2:
            msg['data'] = data;
            target.sendText(JSON.stringify(msg));
            break;
        default:
            break;
    }

}
var mysql = mysqlConnection();
wsCreat(mysql);