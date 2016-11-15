var Utils = require('./utils');

var getTreeMapping = function createMapping(converterName, typewords) {
    var mapping = {};
    var getConvert = function getConvert(key) {
        return function convert(propsStr, innerStr) {
            return 'ctx.' + converterName + '("' + key + '",' + propsStr + ',' + Utils.trimRight(innerStr, ',') + '),';
        };
    };
    var keys = typewords || [];
    if (!converterName) return mapping;
    keys.forEach(function keyEach(key) {
        mapping[key] = getConvert(key);
    });

    return mapping;
};

function Compiler(options) {
    this.options = options || {};
    this.treeMapping = getTreeMapping(this.options.converterName, this.options.typewords);
    if (!Object.keys(this.treeMapping).length) {
        throw new Error('Error: options missing!');
    }
}

Compiler.prototype.getCompiler = function compile(str) {
    var thisCompiler = this;
    var cache = null;
    var compileHtml = function compileHtml(html) {
        var compileResult = '';
        var parsedStr = html || '';
        parsedStr = parsedStr.trim();
        if (parsedStr) {
            parsedStr.replace(/<([a-zA-Z-]+)([^>]*)>([^\1]*?)<\/\1>/g, function rep(match, wrapperName, propsStr, innerStr) {
                var curInnerStr = innerStr;
                var props = {};
                var execResult = null;
                var propMatcher = /([\w-]+)\s*=\s*"([ \w-]+)"/g;
                if (/<([a-zA-Z-]+)[^>]*>/.test(curInnerStr)) {
                    curInnerStr = compileHtml(curInnerStr);
                } else {
                    curInnerStr = '"' + curInnerStr + '"';
                }
                if (thisCompiler.treeMapping[wrapperName]) {
                    while (execResult = propMatcher.exec(propsStr)) {
                        props[execResult[1]] = execResult[2].trim();
                    };
                    compileResult += thisCompiler.treeMapping[wrapperName](JSON.stringify(props), curInnerStr);
                }
            });
        }
        return Utils.trimRight(compileResult, ',') || parsedStr;
    };
    return function run(context) {
        var compiledStr = compileHtml(str);
        if (cache) {
            return cache;
        }
        cache = new Function('var ctx = this;return ' + compiledStr + ';').bind(context);
        return cache;
    };
};

module.exports = Compiler;

