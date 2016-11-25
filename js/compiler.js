(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils"], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('./utils'));
    } else {
        root.Compiler = factory(root.Utils);
    }

})(this, function (Utils) {
    
    var getTreeMapping = function getTreeMapping(typewords) {
        var mapping = {};
        var keys = typewords;
        var getConvertFunc = function getConvertFunc(key) {
            return function convert(propsStr, innerStr) {
                return 'ctx.convert("' + key + '",' + propsStr + ',' + Utils.trimRight(innerStr, ',') + '),';
            };
        };
        keys.forEach(function keyEach(key) {
            mapping[key] = getConvertFunc(key);
        });
        return mapping;
    };

    /**
    * 类HTML标签编译器，主要用于把标签转换成Hash形式表示
    * var labelCompiler = new exports.Tools.LabelCompiler(renderedTpl);
    * var hashTree = labelCompiler();
    */
    function Compiler(str, options) {
        this.options = options || {};
        this.options.typewords = this.options.typewords || ['table', 'tr', 'td'];
        this.funcMappingTree = getTreeMapping(this.options.typewords);
        if (!Object.keys(this.funcMappingTree).length) {
            throw new Error('Compiler init fail: funcMappingTree is empty!');
        }
        if (!Utils.isString(str)) {
            throw new Error('Compiler str type error!');
        }
        return this.compile(str.trim());
    }

    Compiler.prototype.compile = function compile(str) {
        var thisCompiler = this;
        var cache = null;
        var runContext = null;
        var labelRegExp = /<([a-zA-Z-]+)[^>]*>/;
        var labelContentRegExp = /<([a-zA-Z-]+)([^>]*)>([^\1]*?)<\/\1>/g;
        var compileLabel = function compileLabel(labelContent) {
            var compileResult = '';
            var parsingStr = labelContent || '';
            parsingStr = parsingStr.trim();
            if (parsingStr) {
                parsingStr.replace(labelContentRegExp, function rep(match, wrapperName, propsStr, innerStr) {
                    var curInnerStr = innerStr;
                    var props = {};
                    var execResult = null;
                    var propsRegExp = /([\w-]+)\s*=\s*"([ \w-]+)"/g;
                    if (labelRegExp.test(curInnerStr)) {
                        curInnerStr = compileLabel(curInnerStr);
                    } else {
                        curInnerStr = '"' + curInnerStr + '"';
                    }
                    if (thisCompiler.funcMappingTree[wrapperName]) {
                        while (execResult = propsRegExp.exec(propsStr)) {
                            props[execResult[1]] = execResult[2].trim();
                        };
                        compileResult += thisCompiler.funcMappingTree[wrapperName](JSON.stringify(props), curInnerStr);
                    }
                });
            }
            return Utils.trimRight(compileResult, ',') || parsingStr;
        };

        var hashContext = {
            convert: function convert() {
                var args = [].slice.call(arguments);
                var type = args.shift();
                var props = args.shift();
                if (!type || !props) return null;
                var treeHash = {
                    type: type,
                    props: props
                };
                if (args.length === 1 && !Utils.isPlainObject(args[0])) {
                    treeHash.children =  args[0];
                } else {
                    treeHash.children =  args.slice();
                }
                return treeHash;
            },
        };

        return function run(context) {
            var curContext = context || hashContext;
            if (cache && curContext === runContext) {
                return cache;
            }
            runContext = curContext;
            var compiledStr = compileLabel(str);
            var funcTree = new Function('var ctx = this;return ' + compiledStr + ';').bind(runContext);
            cache = funcTree();
            return cache;
        };
    };

    return Compiler;
});


