function Printer (device, options) {
    if (!device) {
        throw new Error('parameter: device is missing!');
    }
    this.device = device;
    options = options || {};
    this.options = Utils.assign({colWidth: 10, borderWidth: 2}, options);
}

Printer.prototype.pretreat = function pretreat(basicHashTree) {
    var thisPrinter = this;
    function deepProcessTree (hashTree) {
        var nodeList = [];
        var printNodes = [];
        if (Utils.isPlainObject(hashTree)) {
            nodeList.push(hashTree);
        } else if (Utils.isArray(hashTree)) {
            nodeList = hashTree.slice();
        }
        while (nodeList.length) {
            var node = nodeList.shift();
            switch (node.type) {
                case 'table':
                case 'tr':
                    if (Utils.isArray(node.children) && node.children.length) {
                        var processResult = deepProcessTree(node.children);
                        if (node.type === 'tr') {
                            var colLen = processResult.length;
                            var processResultStatus = [];
                            while (true) {
                                var rows = [];
                                for (var i = 0; i < colLen; i += 1) {
                                    var td = node.children[i];
                                    var col = processResult[i];
                                    var word = col.shift();
                                    if (word === undefined) {
                                        processResultStatus[i] = true;
                                        word = '';
                                    } else {
                                        processResultStatus[i] = false;
                                    }
                                    if (td.props.width !== 'auto') {
                                        var colWidth = td.props.width || thisPrinter.options.colWidth;
                                        rows.push(Utils.padRight(word, colWidth));
                                    } else {
                                        rows.push(word);
                                    }
                                }
                                var isFinishedPadding = processResultStatus.length && 
                                                        processResultStatus.every(function (status) {return status === true;});
                                if (isFinishedPadding) {
                                    break;
                                } else {
                                    printNodes.push(rows);
                                }
                            }
                        } else {
                            printNodes = printNodes.concat(processResult);
                        }
                    } else {
                        printNodes.push([node.children]);
                    }
                    break;
                case 'td':
                    if (Utils.isString(node.children)) {
                        var cutArray = [node.children];
                        if (node.props.width !== 'auto') {
                            var colWidth = node.props.width || thisPrinter.options.colWidth;
                            cutArray = Utils.cutStrLen(node.children, colWidth);
                        }
                        printNodes.push(cutArray);
                    }
                    break;
            }
        }
        
        return printNodes;
    }

    return deepProcessTree(basicHashTree);
};

Printer.prototype.prepare = function prepare(hashTree) {
    var rows = this.pretreat(hashTree);
    var border = Utils.padRight('', this.options.borderWidth);
    var printRows = [];
    rows.forEach(function (row) {
        printRows.push(row.join(border));
    });
    return printRows;
};

Printer.prototype.print = function print(hashTree) {
    if (!hashTree) {
        throw new Error('parameter: hashTree is missing!');
    }
    if (!Utils.isArray(hashTree) && !Utils.isPlainObject(hashTree)) {
            throw new Error('parameter: hashTree type error!');
    }

    var printRows = this.prepare(Utils.deepCopy(hashTree));
    if (this.device) {
        this.device.print(printRows);
    }
};


function PrintDevice (settings) {
    this.commands = [];
    this.settings = Utils.deepCopy(settings);
    this.init();
}

PrintDevice.prototype.init = function init() {
    this.deviceFont = {};
    this.deviceLineBox = {};
    this.deviceFont.iFontSize = String(this.settings.fontSize || "36");
    this.deviceFont.strFontName = String(this.settings.fontFamily || "宋体");
    this.deviceLineBox.iHeight = String(this.settings.lineHeight || this.deviceFont.iFontSize);
    this.reset();
}

PrintDevice.prototype.reset = function reset() {
    this.deviceLineBox.iX = '0';
    this.deviceLineBox.iY = '0';
}

PrintDevice.prototype.createCommand = function createCommand(rows) {
    if (!rows || !rows.length) return;
    var thisDevice = this;
    rows.forEach(function (text, index) {
        var iY = (index + 1) * thisDevice.deviceLineBox.iHeight;
        thisDevice.deviceLineBox.iY = String(iY);
        thisDevice.commands.push({
            text: text,
            font: JSON.stringify(thisDevice.deviceFont),
            box: JSON.stringify(thisDevice.deviceLineBox)
        });
    });
}

PrintDevice.prototype.print = function print(rows) {
    try {
        this.createCommand(rows);
        if (this.commands.length) {
            this.commands.forEach(function (cmd) {
                TicketClient.NotePrinter.AddSingleText(cmd.text, cmd.font, cmd.box);
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

var t = {
    NotePrinter: {
        AddSingleText: function (){
            console.log(arguments);
        },
        Print: function (){
            console.log('print')
        }
    }
};

if (!window.TicketClient) {
    TicketClient = t;
}