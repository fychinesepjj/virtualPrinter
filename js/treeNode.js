(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'));
    } else {
        root.treeNode = factory(root.utils);
    }

})(this, function (utils) {

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
        props && (this.props = utils.deepCopy(props));
    }

    TreeNode.prototype.setText = function setText(text) {
        text && (this.text = text);
    }

    TreeNode.prototype.clone = function clone(isDeepClone) {
        var cloneNode = createTreeNode(this.nodeType);
        if (isDeepClone) {
            cloneNode.nodeList = utils.deepCopy(this.nodeList);
        }
        cloneNode.setText(this.text);
        cloneNode.setProps(this.props);
        return cloneNode;
    }

    return {
        createTreeNode: createTreeNode
    };
});