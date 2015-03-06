var fs = require('fs');
var _path = require('path');

exports.route = function () {
    /// 添加配置
    routes.post('/config/add', function (req, res) {
        var self = this;
        var selector = [];
        JSON.parse(req.post.levels).forEach(function (element, index) {
            selector.push({
                $: element.selector,
                attr: element.attr
            });
        });
        req.post.selector = selector;
        var filename = ROOT + 'config/' + req.post.configName.trim();
        req.post.isPagination = !!req.post.page?1:0;
        req.post.mode = 'web';
        delete req.post.page;
        delete req.post.configName;
        delete req.post.levels;
        fs.writeFile(filename, JSON.stringify(req.post), function (err) {
            self.json({
                status: !err,
                info: !err ? '保存成功':'保存失败',
                error: err
            });
        });
    });
    
    /// 删除配置
    routes.get('/config/delete', function (req, res) {
        var self = this;
        fs.unlink(ROOT + 'config/' + req.get.name, function (err) {
            self.json({
                status: !err,
                info: !err?'删除成功':'删除失败',
                error: err
            });
        });
    });
    
    /// 获取配置内容
    routes.get('/config/edit', function (req, res) {
        var self = this;
        var filename = _path.join(ROOT, 'config', req.get.name);
        fs.readFile(filename, { encoding: 'utf8' }, function (err, data) {
            if (err) {
                self.json({
                    status: false,
                    info: '该配置文件不存在'
                });
            } else {
                var data = utils.switchAttr(JSON.parse(data), 'isPagination page,selector levels,selector.[].$ selector');
                self.json({
                    status: true,
                    data: utils.extend(data, { configName: req.get.name })
                });
            }
        });
    });
}