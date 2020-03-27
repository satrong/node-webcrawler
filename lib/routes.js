var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var querystring = require('querystring');
var url = require('url');
var root = path.join(__dirname, '../');

var headInfo = {
    'Server': 'node.js',
    'X-Powered-By': 'satrong'
};

var Routes = function () {
    this.gets = {};
    this.posts = {};
}

/// path:{String} 视图路径
/// model:{Object} 放入到视图中的数据
Routes.prototype.views = function (path, model) {
    var body;
    try {
        body = fs.readFileSync(root + 'res/html/' + path + '.html', { encoding: 'utf8' });
    } catch (error) {
        console.log(error);
        return;
    }
    var body = ejs.render(body, model);

    this.res.writeHead(200, utils.extend({
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.from(body).length /// 统计的是Buffer的长度，而非String的长度        
    }, headInfo));
    this.res.write(body);
    this.res.end();
}

/// 返回json格式
Routes.prototype.json = function (model) {
    var json = JSON.stringify(model);
    this.res.writeHead(200, utils.extend({
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.from(json).length
    }, headInfo));
    this.res.write(json);
    this.res.end();
}

/// 返回纯文本
Routes.prototype.plain = function (data) {
    if (utils.isString(data)) {
        this.res.writeHead(200, utils.extend({
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Length': Buffer.from(data).length
        }, headInfo));
        this.res.write(data);
        this.res.end();
    } else {
        console.log('plain函数的参数必须为字符串');
    }
}

/// get方法访问
/// path:{String} 访问的url路径
/// fn:{Function} 传入参数req,res
Routes.prototype.get = function (path, fn) {
    var that = this;
    this.gets[path] = function (req, res) {
        req.get = query(req.url);
        that.req = req;
        that.res = res;
        fn.apply(that, [req, res]);
    }
}

/// post方法访问
Routes.prototype.post = function (path, fn) {
    var that = this;
    this.posts[path] = function (req, res) {
        req.get = query(req.url);
        var body = "";
        req.addListener("data", function (chuck) {
            body += chuck;
        });
        req.addListener("end", function () {
            req.post = querystring.parse(body);
            that.req = req;
            that.res = res;
            fn.apply(that, [req, res]);
        });
    }
}

function query(uri) {
    return querystring.parse(url.parse(uri).query);
}

module.exports = function () {
    return new Routes();
}