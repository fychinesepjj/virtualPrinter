function TreeNode(nodeType) {
    if (!nodeType) {
        throw new Error('TreeNode parameter is missing!');
    }
    this.nodeType = nodeType;
    this.nodeList = [];
    this.props = {};
    this.text = '';
}

TreeNode.prototype.add = function add(node) {
    node && this.nodeList.push(node)
}

TreeNode.prototype.setProps = function setProps(props) {
    props && (this.props = Utils.deepCopy(props));
}

TreeNode.prototype.setText = function setText(text) {
    text && (this.text = text);
}

TreeNode.prototype.clone = function clone(isDeepClone) {
    var cloneNode = new TreeNode(this.nodeType);
    if (isDeepClone) {
        cloneNode.nodeList = Utils.deepCopy(this.nodeList);
    }
    cloneNode.setProps(this.props);
    return cloneNode;
}


function Printer(device, options) {
    if (!device) {
        throw new Error('parameter: device is missing!');
    }
    this.device = device;
    options = options || {};
    this.options = Utils.assign({colWidth: 10, borderWidth: 2}, options);
}

Printer.prototype.pretreat = function pretreat(basicHashTree) {
    var thisPrinter = this;
    function deepProcessTree (hashTree, type) {
        var nodeList = [];
        var parentTreeNodes = new TreeNode(type);
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
                        var subNodes = deepProcessTree(node.children, node.type);
                        if (node.type === 'tr') {
                            var colNodesNumber = subNodes.nodeList.length;
                            var rebuildRowNodeStatus = [];
                            while (true) {
                                var rebuildRowNode = new TreeNode('tr');
                                for (var i = 0; i < colNodesNumber; i += 1) {
                                    var subNode = subNodes.nodeList[i];
                                    var newSubNode = subNode.clone();
                                    var word = subNode.nodeList.shift();
                                    if (word === undefined) {
                                        rebuildRowNodeStatus[i] = true;
                                        word = '';
                                    } else {
                                        rebuildRowNodeStatus[i] = false;
                                    }
                                    if (subNode.props.width !== 'auto') {
                                        var colWidth = subNode.props.width || thisPrinter.options.colWidth;
                                        newSubNode.setText(Utils.padRight(word, colWidth));
                                        rebuildRowNode.add(newSubNode);
                                    } else {
                                        newSubNode.setText(word);
                                        rebuildRowNode.add(newSubNode);
                                    }
                                }
                                var isFinishedRebuilding = rebuildRowNodeStatus.length && 
                                                        rebuildRowNodeStatus.every(function (status) {return status === true;});
                                if (isFinishedRebuilding) {
                                    break;
                                } else {
                                    parentTreeNodes.add(rebuildRowNode);
                                }
                            }
                        } else {
                            parentTreeNodes.add(subNodes);
                        }
                    } else {
                        var trNode = new TreeNode('tr');
                        var tdNode = new TreeNode('td');
                        tdNode.setText(node.children);
                        trNode.add(tdNode);
                        parentTreeNodes.add(trNode);
                    }
                    break;
                case 'td':
                    if (Utils.isString(node.children)) {
                        var treeNode = new TreeNode(node.type);
                        treeNode.nodeList = [node.children];
                        if (node.props.width !== 'auto') {
                            var colWidth = node.props.width || thisPrinter.options.colWidth;
                            treeNode.nodeList = Utils.cutStrLen(node.children, colWidth);
                        }
                        treeNode.setProps(node.props);
                        parentTreeNodes.add(treeNode);
                    }
                    break;
            }
        }
        
        return parentTreeNodes;
    }

    return deepProcessTree(basicHashTree, 'root');
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


function PrintDevice(settings) {
    this.commands = [];
    this.settings = Utils.deepCopy(settings);
    this.init();
}

PrintDevice.prototype.init = function init() {
    this.deviceFont = {};
    this.deviceLineBox = {};
    this.deviceFont.iFontSize = String(this.settings.fontSize || "30");
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