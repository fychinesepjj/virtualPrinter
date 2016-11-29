(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils", "./enums", "./treeNode", "./client"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'), require('./enums'), require('./treeNode'), require('./client'));
    } else {
        root.NoteDevice = factory(root.utils, root.enums, root.treeNode, root.TicketClient);
    }

})(this, function (utils, enums, treeNode, client) {
    var nodeType = enums.nodeType;

    /**
    * 打印设备，针对不同打印机特性进行打印
    * var newOptions = {"fontSize": 33, "fontFamily": "宋体"}; 全局配置
    * var device = new NoteDevice(newOptions); 初始化对象
    */
    function NoteDevice(settings) {
        this.commands = [];
        settings = settings || {};
        this.settings = utils.deepCopy(settings);
        this.init();
    }

    NoteDevice.prototype.init = function init() {
        this.deviceFont = {};
        this.deviceLineBox = {};
        this.configureDevice();
        this.reset();
    }

    NoteDevice.prototype.configureDevice = function configureDevice() {
        this.deviceFont.iFontSize = String(this.settings.fontSize || "30");
        this.deviceFont.strFontName = String(this.settings.fontFamily || "宋体");
        this.deviceLineBox.iHeight = String(this.settings.lineHeight || this.deviceFont.iFontSize);
    }

    NoteDevice.prototype.reset = function reset() {
        this.deviceLineBox.iX = '0';
        this.deviceLineBox.iY = '0';
    }

    NoteDevice.prototype.convert2Array = function convert2Array(printNode) {
        var printRows = [];
        var curProps = {};
        var rootProps = {};
        var getObjectLength = function getObjLength(obj) {
            return Object.keys(obj).length;
        };

        function convert(node, rows) {
            if (node.nodeType === nodeType.ROW) {
                var text = node.toArray().join('');
                var rowNode = treeNode.createTreeNode(nodeType.ROW);
                rowNode.setText(text);
                if (getObjectLength(node.props)) {
                    curProps = utils.assign(curProps, node.props);
                }
                rowNode.setProps(curProps);
                rows.push(rowNode);
                curProps = rootProps;
            } else {
                if (node.nodeType === nodeType.WRAPPER) {
                    if (getObjectLength(node.props)) {
                        rootProps = node.props;
                        curProps = rootProps;
                    }
                }
                node.nodeList.forEach(function (subNode){
                    convert(subNode, rows);
                });
            }
        }

        convert(printNode, printRows);
        return printRows;
    }

    // 创建打印指令
    NoteDevice.prototype.createCommand = function createCommand(rows) {
        if (!rows || !rows.length) return;
        var thisDevice = this;
        var iY = 0;
        rows.forEach(function (node, index) {
            thisDevice.deviceLineBox.iY = String(iY);
            thisDevice.deviceFont.iFontSize = String(node.props.fontSize || thisDevice.deviceFont.iFontSize);
            thisDevice.deviceFont.strFontName = node.props.fontFamily || thisDevice.deviceFont.strFontName;
            thisDevice.deviceLineBox.iHeight = String(node.props.lineHeight || thisDevice.deviceFont.iFontSize);
            thisDevice.commands.push({
                text: node.text,
                fontSetting: JSON.stringify(thisDevice.deviceFont),
                boxSetting: JSON.stringify(thisDevice.deviceLineBox)
            });
            iY += parseInt(thisDevice.deviceLineBox.iHeight, 10);
            thisDevice.configureDevice();
        });
    }

    NoteDevice.prototype.print = function print(printNode) {
        try {
            var rows = this.convert2Array(printNode);
            this.createCommand(rows);
            if (this.commands.length) {
                this.commands.forEach(function (cmd) {
                    client.NotePrinter.AddSingleText(cmd.text, cmd.fontSetting, cmd.boxSetting);
                });
                client.NotePrinter.Print();
            }
        } catch (e) {
            console.error(e, 'printDevice：print');
        } finally {
            this.commands = [];
            this.reset();
        }
    }

    return NoteDevice;
});