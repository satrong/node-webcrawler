var ws = new WebSocket('ws://127.0.0.1:' + port);

ws.onopen = function () {
    console && console.info && console.info('websocket建立连接成功');
};

ws.onmessage = function (e) {
    var data = $.parseJSON(e.data);
    $("#LogList").prepend('<li class="' + data.color + '">' + data.info + '</li>');
    /// 停止执行
    data.status === 0 && setTimeout(function () {
        exec.stop();
    }, 600);
};

var tip = function (info) {
    return dialog({
        title: '操作提示',
        content: info
    });
}

var exec = {};

/// 添加/编辑弹窗
exec.modal = function (_data) {
    var self = $(this);
    var levelitem = function () {
        return {
            selector: ko.observable(),
            attr: ko.observable()
        };
    };
    dialog({
        title: _data ? "编辑配置" : "新增配置",
        width: 700,
        height: 356,
        padding: '5px 0',
        content: '<div id="AddConfig" class="config-wrap" data-bind="template:{name:\'AddTpl\'}"></div>',
        onshow: function () {
            var self = this;
            var data = _data || {};

            if (data.type === 'text') {
                data.levels[data.levels.length - 1].attr = '';
            }

            this.viewmodel = {
                configName: ko.observable(data.configName),
                url: ko.observable(data.url),
                type: ko.observable(data.type),
                page: ko.observable(data.page + ''),
                from: ko.observable(data.from || 1),
                to: ko.observable(data.to || 1),
                charset: ko.observable(data.charset),
                saveDir: ko.observable(data.saveDir),
                imageFn: ko.observable(data.imageFn),
                levels: ko.observableArray(data.levels),
                remove: function (index) {
                    self.viewmodel.levels.splice(index, 1);
                }
            };
            !_data && this.viewmodel.levels.push(levelitem());
            ko.cleanNode(document.getElementById("AddConfig"));
            ko.applyBindings(this.viewmodel, document.getElementById("AddConfig"));

            var bubble = dialog({
                align: 'top left'
            });
            var events = {
                mouseenter: function (event) {
                    var tipinfo = $(this).data('tip');
                    if (tipinfo) {
                        bubble.content(tipinfo);
                        bubble.show(event.target);
                    }
                },
                mouseout: function () {
                    bubble.close();
                }
            };
            $("#AddConfig input:text").on(events);
            $("#AddConfig").find('ul.config-add').delegate("li input", events);
        },
        button: [
            {
                value: '增加层级', callback: function () {
                    this.viewmodel.levels.push(levelitem());
                    return false;
                }
            },
            {
                value: '保存配置', autofocus: true, callback: function () {
                    var dd = this;
                    var data = validation(ko.toJS(this.viewmodel));
                    clearTimeout(this.f);
                    if (typeof data === 'string') {
                        this.statusbar('<span class="am-text-danger">' + data + '</span>');
                        this.f = setTimeout(function () {
                            dd.statusbar('');
                        }, 2500);
                    } else {
                        delete data.remove;
                        $.ajax({
                            type: "post",
                            url: "/config/add",
                            data: data,
                            success: function (json) {
                                if (json.status) {
                                    var configname = $.trim(data.configName);
                                    dd.close().remove();
                                    if (_data) {
                                        var cc = self.children();
                                        cc.first().text(configname);
                                        cc.last().attr("data-name", configname);
                                    } else {
                                        $('#ConfigList').prepend('<li><span>' + configname + '</span><div class="nc-item-btns" data-name="' + configname + '"><button class="am-btn am-btn-xs am-btn-success" tag="start">爬取</button><button class="am-btn am-btn-xs am-btn-primary" tag="edit">修改</button><button class="am-btn am-btn-xs am-btn-warning" tag="delete">删除</button></div></li>');
                                    }
                                } else {
                                    self.statusbar('<span class="am-text-danger">' + json.info + '</span>');
                                }
                            }
                        });
                    }
                    return false;
                }
            },
            {
                value: '关闭', callback: function () {
                    this.close();
                }
            }
        ]
    }).showModal();
}

/// 删除配置文件
exec.remove = function () {
    var self = $(this);
    dialog({
        title: '操作提示',
        content: '确定要删除吗？',
        okValue: '确定',
        cancelValue: '取消',
        lock: true,
        ok: function () {
            $.ajax({
                url: '/config/delete',
                cache: false,
                data: { name: self.parent().data('name') },
                success: function (json) {
                    json.status && self.parents("li").remove();
                    dialog({
                        title: '操作提示',
                        content: json.info
                    }).show();
                }
            });
        },
        cancel: function () { }
    }).showModal();
};

/// 编辑配置
exec.edit = function () {
    var that = this;
    var self = $(this);
    $.ajax({
        url: '/config/edit',
        data: { name: self.parent().data("name") },
        cache: false,
        success: function (json) {
            if (json.status) {
                exec.modal.call(that, json.data);
            } else {
                tip(json.info);
            }
        },
        error: function () {
            tip('获取数据失败');
        }
    });
}

/// 更新配置
exec.update = function (data) {
    exec.modal.apply(this, data);
}

/// 停止执行/执行完毕
exec.stop = function () {
    $('#Wrap').removeClass('wrap-go');
    $('#FooterBar').removeClass('footer-bar-active');
    $('#LogList').hide().empty();
}

/// 执行爬虫
exec.start = function () {
    var configname = $(this).parent().data('name');
    var wrap = $('#Wrap');
    var loglist = $('#LogList');
    var fb = $('#FooterBar');
    var btn = fb.children('a');
    wrap.addClass('wrap-go');
    btn.children('b').text(configname);
    fb.addClass('footer-bar-active');
    setTimeout(function () {
        loglist.show();
        /// 执行ws
        ws.send(JSON.stringify({
            action: 'start',
            config: configname
        }));
    }, 600);
    btn.one("click", function () {
        ws.send(JSON.stringify({
            action: 'stop'
        }));
    });
}

$(function () {
    $("#ConfigList").delegate('li', {
        mouseenter: function () {
            $(this).children('div').show();
        },
        mouseleave: function () {
            $(this).children('div').hide();
        }
    }).delegate("li button[tag=remove]", 'click', function () {
        exec.remove.apply(this);
    }).delegate("li button[tag=edit]", "click", function () {
        exec.edit.apply(this);
    }).delegate("li button[tag=start]", "click", function () {
        exec.start.apply(this);
    });

    $("#AddBtn").on("click", function () {
        exec.modal.apply(this);
    });
});

function validation(model) {
    var mapping = {
        configName: '配置名称',
        url: '页面地址',
        type: '爬取类型',
        page: '网址类型',
        path: '存储路径'
    };
    for (var i in model) {
        if (!/^(charset)|(remove)|(imageFn)$/.test(i)) {
            if ('levels' === i) {
                for (var j = 0, len = model[i].length; j < len; j++) {
                    const item = model[i];
                    if ($.trim(item[j].selector) === '') {
                        return j + 1 + '级页面选择器不能为空';
                    } else if (model.type === 'image' && $.trim(item[j].attr) === '') {
                        return j + 1 + '级页面URL所在属性不能为空';
                    }
                }
            } else {
                if ($.trim(model[i]) === '') {
                    return mapping[i] + '不能为空';
                }
            }
        }
    }
    model.levels = JSON.stringify(model.levels);
    return model;
}