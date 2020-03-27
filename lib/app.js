var cp = require('child_process');
var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var WebSocketServer = require('ws').Server;
global.ROOT = path.join(__dirname, '../');
global.utils = require('./utils.js');
global.routes = require('./routes.js')();

var MIME_TYPES = require('./mime.js');

var worker;

/// 读取routes
var routeFiles = fs.readdirSync(ROOT + 'routes');

routeFiles.forEach(function (element, index) {
    require(ROOT + 'routes/' + element).route();
});


module.exports = function (ports) {
    global.PORTS = ports;
    var port = ports[0];
    http.createServer(function (req, res) {
        res.setTimeout(10000, function () {
            res.writeHead(500);
            res.end('500，响应超时');
        });
        var filepath = realpath(url.parse(req.url).pathname);
        var extname = path.extname(filepath);
        if (extname === '') {
            var fn = routes[req.method.toLowerCase() + 's'][filepath];
            if (fn) {
                fn(req, res);
            } else {
                res.writeHead(404);
                res.end('404，页面不存在');
            }
        } else {
            fs.readFile(filepath, function (err, body) {
                if (err) {
                    res.writeHead(404);
                } else {
                    res.writeHead(200, {
                        'Content-Type': MIME_TYPES[extname],
                        'Content-Length': body.length, /// 统计的是Buffer的长度，而非String的长度
                        'Server': 'node.js',
                        'X-Powered-By': 'satrong'
                    });
                    res.write(body);
                }
                res.end();
            });
        }
    }).listen(port, function () {
        console.log('node-crawler启动成功，监听端口%s中\r(请使用支持websocket的浏览器打开地址http://127.0.0.1:%s进行操作)', port, port);
    });

    var worker;
    var wss = new WebSocketServer({ port: ports[1] });
    wss.on('connection', function connection(_ws) {
        _ws.on('message', function incoming(message) {
            //console.log('received: %s', message);
            message = JSON.parse(message);
            if (message.action === 'start') {
                /// 开启子进程来执行抓取
                worker = cp.fork(ROOT + 'lib/crawler.js');
                worker.on("message", function (data) {
                    _ws.send(data);
                });
                worker.on("close", function (code, signal) {
                    !code && _ws.send(JSON.stringify({ color: 'redBG', info: !signal ? '执行完毕' : '已手动停止抓取', status: 0 }));
                });

                /// 将要使用的配置文件名传送给子进程
                worker.send(message.config);
            } else if (message.action === "stop") {
                worker.kill();
            }
        });
    });
}

/// 针对静态文件返回真实地址
function realpath(pathname) {
    if (/^\/((js)|(css)|(fonts)|(html))\/.+/i.test(pathname)) {
        return ROOT + 'res' + pathname;
    } else {
        return pathname;
    }
}