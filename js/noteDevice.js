(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils", "./enum"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'), require('./enum'));
    } else {
        root.NotePrinterDevice = factory(root.Utils, root.Enum);
    }

})(this, function (Utils, Enum) {
     var nodeType = Enum.nodeType;

    /**
    * 打印设备，针对不同打印机特性进行打印设置
    * var newOptions = {"fontSize": 33, "fontFamily": "宋体"}; 全局配置
    * var device = new exports.NotePrinterDevice(newOptions); 初始化对象
    */
    function NotePrinterDevice(settings) {
        this.commands = [];
        settings = settings || {};
        this.settings = Utils.deepCopy(settings);
        this.init();
    }

    NotePrinterDevice.prototype.init = function init() {
        this.deviceFont = {};
        this.deviceLineBox = {};
        this.configureDevice();
        this.reset();
    }

    NotePrinterDevice.prototype.configureDevice = function configureDevice() {
        this.deviceFont.iFontSize = String(this.settings.fontSize || "30");
        this.deviceFont.strFontName = String(this.settings.fontFamily || "宋体");
        this.deviceLineBox.iHeight = String(this.settings.lineHeight || this.deviceFont.iFontSize);
    }

    NotePrinterDevice.prototype.reset = function reset() {
        this.deviceLineBox.iX = '0';
        this.deviceLineBox.iY = '0';
    }

    NotePrinterDevice.prototype.convert2Array = function convert2Array(printNode) {
        var printRows = [];
        var curProps = {};
        var rootProps = {};
        var getObjectLength = function getObjLength(obj) {
            return Object.keys(obj).length;
        };

        function convert(node, rows) {
            if (node.nodeType === nodeType.ROW) {
                var text = node.toArray().join('');
                var rowNode = createTreeNode(nodeType.ROW);
                rowNode.setText(text);
                if (getObjectLength(node.props)) {
                    curProps = Utils.assign(curProps, node.props);
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
    NotePrinterDevice.prototype.createCommand = function createCommand(rows) {
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

    NotePrinterDevice.prototype.print = function print(printNode) {
        try {
            var rows = this.convert2Array(printNode);
            this.createCommand(rows);
            if (this.commands.length) {
                this.commands.forEach(function (cmd) {
                    TicketClient.NotePrinter.AddSingleText(cmd.text, cmd.fontSetting, cmd.boxSetting);
                });
                TicketClient.NotePrinter.Print();
            }
        } catch (e) {
            console.error(e, 'printDevice：print');
        } finally {
            this.commands = [];
            this.reset();
        }
    }

    return NotePrinterDevice;
});