/*	 读取配置文件，让用户选择
 *
 */
var PATH = require('path');
var FS = require('fs');
var READLINE = require('readline');
var color = require('./color.js');

module.exports = function (callback) {
    var files = FS.readdirSync('../config');
    if (files.length === 0) {
        console.log('未找到配置文件，请到config文件夹中添加配置文件！\n即将退出程序');
        setTimeout(function () {
            process.exit(0);
        }, 5000);
        return;
    }
    
    var rl = READLINE.createInterface({
        input : process.stdin,
        output : process.stdout
    });
    
    var txt = '';
    files.forEach(function (name, index) {
        txt += '(' + (index + 1) + ')：' + name + '\n';
    });
    
    (function confirm() {
        rl.question(txt + "请选择序号：", function (answer) {
            if (!files[answer - 1]) {
                console.log(color('redBG'), '选择错误，请选择序号');
                confirm();
                return;
            }
            
            var content = FS.readFileSync('../config/' + files[answer - 1], { encoding: 'utf8' });
            var obj = new Function('return ' + content)();
            callback(obj);
            rl.close();
        });
    })();
}