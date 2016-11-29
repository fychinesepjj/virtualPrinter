(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.enums = factory();
    }

})(this, function () {
    var enums = {};
    var nodeType = {
        COL: 'td',
        ROW: 'tr',
        WRAPPER: 'table',
        ROOT: 'root'
    };

    enums.nodeType = nodeType;
    return enums;
});