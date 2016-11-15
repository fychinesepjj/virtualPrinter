var str = '<table><tr><td>第一行第一列</td></tr><tr><td>第二行第一列</td><td>第二行第二列</td></tr></table>';
var Compiler = require('./virtualDom');
var Utils = require('./utils');
var Printer = require('./printerProcessor');
var hashTree = require('./result.json');

var Context = {
    createHash: function createHash() {
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

var p = new Printer(hashTree);
console.log(p.prepare());


// var instance = new Compiler({
//     converterName: 'createHash',
//     typewords: ['table', 'tr', 'td'],
// });
// var compiler = instance.getCompiler(str);
// var func = compiler(Context);
// var t = func();
// console.dir(JSON.stringify(t));