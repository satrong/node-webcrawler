/// 获取文件夹里面的文件，并根据['size', 'atime', 'mtime', 'ctime', 'birthtime']中的属性进行排序
/// BY CHC  

var fs = require('fs');
var path = require('path');

/// @dirpath:文件夹路径
/// @sortprop:排序属性，默认mtime
var filelist = function (dirpath, sortprop) {
    var validateProp = ['size', 'atime', 'mtime', 'ctime', 'birthtime'];
    
    sortprop = sortprop || 'mtime';
    if (validateProp.indexOf(sortprop) === -1) {
        throw ('无效的排序属性')
        return;
    }
    
    var files;
    var filesinfo = [];
    var result = [];
    try {
        files = fs.readdirSync(dirpath);
        files.forEach(function (element) {
            var stats = fs.statSync(path.join(dirpath, element));
            var info = { filename: element };
            info[sortprop] = stats[sortprop];
            filesinfo.push(info);
        });

        filesinfo.sort(function (left, right) {
            return left[sortprop] > right[sortprop] ?-1:1;
        });

        filesinfo.forEach(function (element) {
            result.push(element.filename);
        });
    } catch (error) {
        console.log(error);
    }
    
    return result;
}

module.exports = filelist;