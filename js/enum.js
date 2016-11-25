(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Enum = root.Enum || {};
        root.Enum.nodeType = factory();
    }

})(this, function () {
    var nodeType = {
        COL: 'td',
        ROW: 'tr',
        WRAPPER: 'table',
        ROOT: 'root'
    };

    return nodeType;
});