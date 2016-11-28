(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils", "./enums", "./treeNode"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'), require('./enums'), require('./treeNode'));
    } else {
        root.VirtualPrinter = factory(root.utils, root.enums, root.treeNode);
    }

})(this, function (utils, enums, treeNode) {
    var nodeType = enums.nodeType;

    /**
    * 虚拟打印机，主要用于把hash代码转换成打印设备可以识别的TreeNode对象形式，委托device设备进行打印
    * var newOptions = {colWidth: 10, borderWidth: 1} 设置列宽和边框宽度
    * var p = new VirtualPrinter(printDeviceObject, newOptions);
    * p.print(hashTree);
    */
    function VirtualPrinter(device, options) {
        if (!device) {
            throw new Error('parameter: device is missing!');
        }
        this.device = device;
        options = options || {};
        this.options = utils.assign({colWidth: 10, borderWidth: 1}, options);
    }

    VirtualPrinter.prototype.pretreat = function pretreat(basicHashTree) {
        var thisPrinter = this;
        var deepProcessTree = function deepProcessTree (hashTree, type) {
            var nodeList = [];
            var parentTreeNodes = treeNode.createTreeNode(type);
            if (utils.isPlainObject(hashTree)) {
                nodeList.push(hashTree);
            } else if (utils.isArray(hashTree)) {
                nodeList = hashTree.slice();
            }
            while (nodeList.length) {
                var node = nodeList.shift();
                switch (node.type) {
                    case nodeType.WRAPPER:
                    case nodeType.ROW:
                        if (utils.isArray(node.children) && node.children.length) {
                            var subNode = deepProcessTree(node.children, node.type);
                            if (node.type === nodeType.ROW) {
                                var colNodesNumber = subNode.nodeList.length;
                                var rebuildRowNodeStatus = [];
                                while (true) {
                                    var rebuildRowNode = treeNode.createTreeNode(nodeType.ROW);
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
                                                paddingStr = utils.padRight(word, colWidth);
                                            } else {
                                                paddingStr = utils.padLeft(word, colWidth);
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
                                        var borderContent = utils.padRight('', thisPrinter.options.borderWidth);
                                        var borderNode = treeNode.createTreeNode(nodeType.COL);
                                        borderNode.setText(borderContent);
                                        rebuildRowNode.nodeList = utils.intersect(rebuildRowNode.nodeList, borderNode);
                                        parentTreeNodes.add(rebuildRowNode);
                                    }
                                }
                            } else {
                                subNode.setProps(node.props);
                                parentTreeNodes.add(subNode);
                            }
                        } else {
                            var rowNode = treeNode.createTreeNode(nodeType.ROW);
                            var colNode = treeNode.createTreeNode(nodeType.COL);
                            colNode.setText(node.children);
                            rowNode.add(colNode);
                            if (node.type === nodeType.WRAPPER){
                                var wrapperNode = treeNode.createTreeNode(nodeType.WRAPPER);
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
                        if (utils.isString(node.children)) {
                            var tNode = treeNode.createTreeNode(node.type);
                            tNode.setText(node.children);
                            if (node.props.width !== 'auto') {
                                var colWidth = node.props.width || thisPrinter.options.colWidth;
                                var cutStrArray = utils.cutStrLen(node.children, colWidth);
                                tNode.setText(cutStrArray.join('\n'));
                            }
                            tNode.setProps(node.props);
                            parentTreeNodes.add(tNode);
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
        if (!utils.isArray(hashTree) && !utils.isPlainObject(hashTree)) {
                throw new Error('parameter: hashTree type error!');
        }

        var printNode = this.prepare(utils.deepCopy(hashTree));
        if (this.device) {
            this.device.print(printNode);
        }
    };

    return VirtualPrinter;
});