var fs = require('fs');
var filelist = require(ROOT + 'lib/file-list.js');

exports.route = function () {
    routes.get('/', function (req, res) {
        var configsName = filelist(ROOT + 'config');
        this.views('index', {
            list: configsName,
            wsport: PORTS[1]
        });
    });
}