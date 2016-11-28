(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.enums = root.enums || {};
        root.enums.nodeType = factory();
    }

})(this, function () {

    /**
     * 枚举类型：节点类型
     */
    var nodeType = {
        COL: 'td',
        ROW: 'tr',
        WRAPPER: 'table',
        ROOT: 'root'
    };

    return nodeType;
});