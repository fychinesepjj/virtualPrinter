(function (exports) {
    var NODE_TYPE = {
        col: 'td',
        row: 'tr',
        wrapper: 'table',
        root: 'root'
    };

    function createTreeNode(nodeType) {
        return new TreeNode(nodeType);
    }

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

    TreeNode.prototype.toArray = function toArray() {
        var nodeToArray = [];
        if (this.nodeList) {
            this.nodeList.forEach(function (node) {
                nodeToArray.push(node.text);
            });
        }
        return nodeToArray;
    }

    TreeNode.prototype.setProps = function setProps(props) {
        props && (this.props = Utils.deepCopy(props));
    }

    TreeNode.prototype.setText = function setText(text) {
        text && (this.text = text);
    }

    TreeNode.prototype.clone = function clone(isDeepClone) {
        var cloneNode = createTreeNode(this.nodeType);
        if (isDeepClone) {
            cloneNode.nodeList = Utils.deepCopy(this.nodeList);
        }
        cloneNode.setText(this.text);
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
            var parentTreeNodes = createTreeNode(type);
            if (Utils.isPlainObject(hashTree)) {
                nodeList.push(hashTree);
            } else if (Utils.isArray(hashTree)) {
                nodeList = hashTree.slice();
            }
            while (nodeList.length) {
                var node = nodeList.shift();
                switch (node.type) {
                    case NODE_TYPE.wrapper:
                    case NODE_TYPE.row:
                        if (Utils.isArray(node.children) && node.children.length) {
                            var subNode = deepProcessTree(node.children, node.type);
                            if (node.type === NODE_TYPE.row) {
                                var colNodesNumber = subNode.nodeList.length;
                                var rebuildRowNodeStatus = [];
                                while (true) {
                                    var rebuildRowNode = createTreeNode(NODE_TYPE.row);
                                    for (var i = 0; i < colNodesNumber; i += 1) {
                                        var colNode = subNode.nodeList[i];
                                        var newSubNode = colNode.clone();
                                        var cutTextArray = colNode.text.length ? colNode.text.split('\n') : [];
                                        var word = cutTextArray.shift();
                                        if (word === undefined) {
                                            rebuildRowNodeStatus[i] = true;
                                            word = '';
                                            colNode.text = word;
                                        } else {
                                            rebuildRowNodeStatus[i] = false;
                                            colNode.text = cutTextArray.join('\n');
                                        }
                                        if (colNode.props.width !== 'auto') {
                                            var colWidth = colNode.props.width || thisPrinter.options.colWidth;
                                            newSubNode.props.width = colWidth;
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
                                        rebuildRowNode.setProps(node.props);
                                        var borderContent = Utils.padRight('', thisPrinter.options.borderWidth);
                                        var borderNode = createTreeNode(NODE_TYPE.col);
                                        borderNode.setText(borderContent);
                                        rebuildRowNode.nodeList = Utils.intersect(rebuildRowNode.nodeList, borderNode);
                                        parentTreeNodes.add(rebuildRowNode);
                                    }
                                }
                            } else {
                                subNode.setProps(node.props);
                                parentTreeNodes.add(subNode);
                            }
                        } else {
                            var rowNode = createTreeNode(NODE_TYPE.row);
                            var colNode = createTreeNode(NODE_TYPE.col);
                            colNode.setText(node.children);
                            rowNode.add(colNode);
                            if (node.type === NODE_TYPE.wrapper){
                                var wrapperNode = createTreeNode(NODE_TYPE.wrapper);
                                wrapperNode.setProps(node.props);
                                wrapperNode.add(rowNode);
                                parentTreeNodes.add(wrapperNode);
                            } else {
                                rowNode.setProps(node.props);
                                parentTreeNodes.add(rowNode);
                            }
                        }
                        break;
                    case NODE_TYPE.col:
                        if (Utils.isString(node.children)) {
                            var treeNode = createTreeNode(node.type);
                            treeNode.setText(node.children);
                            if (node.props.width !== 'auto') {
                                var colWidth = node.props.width || thisPrinter.options.colWidth;
                                var cutStrArray = Utils.cutStrLen(node.children, colWidth);
                                treeNode.setText(cutStrArray.join('\n'));
                            }
                            treeNode.setProps(node.props);
                            parentTreeNodes.add(treeNode);
                        }
                        break;
                }
            }
            
            return parentTreeNodes;
        }

        return deepProcessTree(basicHashTree, NODE_TYPE.root);
    };

    Printer.prototype.prepare = function prepare(hashTree) {
        var printNode = this.pretreat(hashTree);
        return printNode;
    };

    Printer.prototype.print = function print(hashTree) {
        if (!hashTree) {
            throw new Error('parameter: hashTree is missing!');
        }
        if (!Utils.isArray(hashTree) && !Utils.isPlainObject(hashTree)) {
                throw new Error('parameter: hashTree type error!');
        }

        var printNode = this.prepare(Utils.deepCopy(hashTree));
        if (this.device) {
            this.device.print(printNode);
        }
    };


    function PrintDevice(settings) {
        this.commands = [];
        settings = settings || {};
        this.settings = Utils.deepCopy(settings);
        this.init();
    }

    PrintDevice.prototype.init = function init() {
        this.deviceFont = {};
        this.deviceLineBox = {};
        this.configureDevice();
        this.reset();
    }

    PrintDevice.prototype.configureDevice = function configureDevice() {
        this.deviceFont.iFontSize = String(this.settings.fontSize || "30");
        this.deviceFont.strFontName = String(this.settings.fontFamily || "宋体");
        this.deviceLineBox.iHeight = String(this.settings.lineHeight || this.deviceFont.iFontSize);
    }

    PrintDevice.prototype.reset = function reset() {
        this.deviceLineBox.iX = '0';
        this.deviceLineBox.iY = '0';
    }

    PrintDevice.prototype.convert2Array = function convert2Array(printNode) {
        var printRows = [];
        var curProps = {};
        var rootProps = {};
        var getObjectLength = function getObjLength(obj) {
            return Object.keys(obj).length;
        };

        function convert(node, rows) {
            if (node.nodeType === NODE_TYPE.row) {
                var text = node.toArray().join('');
                var rowNode = createTreeNode(NODE_TYPE.row);
                rowNode.setText(text);
                if (getObjectLength(node.props)) {
                    curProps = Utils.assign(curProps, node.props);
                }
                rowNode.setProps(curProps);
                rows.push(rowNode);
                curProps = rootProps;
            } else {
                if (node.nodeType === NODE_TYPE.wrapper) {
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

    PrintDevice.prototype.createCommand = function createCommand(rows) {
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

    PrintDevice.prototype.print = function print(printNode) {
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

    var _TicketClient = {
        NotePrinter: {
            AddSingleText: function (){
                console.log(arguments);
            },
            Print: function (){
                console.log('print')
            }
        }
    };

    exports.TicketClient = exports.TicketClient || _TicketClient;

    exports.PRINTER = exports.PRINTER = function () {
        return {
            getPrinter: function getPrinter(type, options) {
                if (type === 'hashTree') {
                    var device = new PrintDevice(options);
                    return new Printer(device, options);
                }
            }
        };
    }();

})(window);