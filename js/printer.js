(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils", "./enum"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'), require('./enum'));
    } else {
        root.VirtualPrinter = factory(root.Utils, root.Enum);
    }

})(this, function (Utils, Enum) {
    var nodeType = Enum.nodeType;
    
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

    /**
    * hash打印机，主要用于把hash转换成打印设备可以识别的TreeNode对象形式
    * var newOptions = {colWidth: 10, borderWidth: 1} 设置列宽和边框宽度
    * var p = new exports.VirtualPrinter.HashTreePrinter(printDeviceObject, newOptions);
    */
    function VirtualPrinter(device, options) {
        if (!device) {
            throw new Error('parameter: device is missing!');
        }
        this.device = device;
        options = options || {};
        this.options = Utils.assign({colWidth: 10, borderWidth: 1}, options);
    }

    VirtualPrinter.prototype.pretreat = function pretreat(basicHashTree) {
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
                    case nodeType.WRAPPER:
                    case nodeType.ROW:
                        if (Utils.isArray(node.children) && node.children.length) {
                            var subNode = deepProcessTree(node.children, node.type);
                            if (node.type === nodeType.ROW) {
                                var colNodesNumber = subNode.nodeList.length;
                                var rebuildRowNodeStatus = [];
                                while (true) {
                                    var rebuildRowNode = createTreeNode(nodeType.ROW);
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
                                            var align = colNode.props.align || 'left';
                                            var paddingStr = '';
                                            if (align == 'left') {
                                                paddingStr = Utils.padRight(word, colWidth);
                                            } else {
                                                paddingStr = Utils.padLeft(word, colWidth);
                                            }
                                            newSubNode.setText(paddingStr);
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
                                        var borderNode = createTreeNode(nodeType.COL);
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
                            var rowNode = createTreeNode(nodeType.ROW);
                            var colNode = createTreeNode(nodeType.COL);
                            colNode.setText(node.children);
                            rowNode.add(colNode);
                            if (node.type === nodeType.WRAPPER){
                                var wrapperNode = createTreeNode(nodeType.WRAPPER);
                                wrapperNode.setProps(node.props);
                                wrapperNode.add(rowNode);
                                parentTreeNodes.add(wrapperNode);
                            } else {
                                rowNode.setProps(node.props);
                                parentTreeNodes.add(rowNode);
                            }
                        }
                        break;
                    case nodeType.COL:
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

        return deepProcessTree(basicHashTree, nodeType.ROOT);
    };

    VirtualPrinter.prototype.prepare = function prepare(hashTree) {
        var printNode = this.pretreat(hashTree);
        return printNode;
    };

    VirtualPrinter.prototype.print = function print(hashTree) {
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

    return VirtualPrinter;
});