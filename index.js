var net = require('net');

/// 获取可用端口
var baseport = 3000;
var ports = [];
(function getPort(port) {
    var server = net.createServer();
    server.listen(port, function () {
        server.once('close', function () {
            ports.push(port);
            if (ports.length >= 2) {
                require('./lib/app.js')(ports);
            } else {
                getPort(port + 1);
            }
        });
        server.close();
    });
    
    server.on('error', function () {
        getPort(port + 1);
    });
})(baseport);