var Compiler = require('./js/compiler');
var NoteDevice = require('./js/noteDevice');
var Printer = require('./js/printer');

var noteTpl = '<table> \
        <tr fontSize="30"><td width="24">沃尔玛大卖场 销售小票</td></tr> \
        <tr></tr> \
        <tr>2016-11-08 12:00:00</tr> \
        <tr>NO.: 20161154687965</tr> \
        <tr>操作员：1000</tr> \
        <tr width="auto">============================</tr> \
        <tr><td  width="11">商品名称</td><td width="7">单价</td><td>金额</td></tr> \
        <tr><td>新品装套餐</td><td width="8">33.00*1</td><td>33.00</td></tr> \
        <tr>  >爆米花(小)</tr> \
        <tr>  >爆米花(大)</tr> \
        <tr>  >可口可乐</tr> \
        <tr><td>爆米花</td><td width="8">5.00*2</td><td>10.00</td></tr> \
        <tr width="auto">============================</tr> \
        <tr><td width="6"></td><td width="7">合计：</td><td width="3">3</td><td>-99.00</td></tr> \
        <tr><td width="6"></td><td width="7">优惠：</td><td width="3"></td><td>0.00</td></tr> \
        <tr><td width="4"></td><td>实付款:</td><td width="2"></td><td>0.00</td></tr> \
        <tr width="auto">============================</tr> \
        <tr><td width="6"></td><td width="6">现金：</td><td width="4"></td><td>13.00</td></tr> \
        <tr width="auto">============================</tr> \
        <tr width="auto">**谢谢惠顾！欢迎再次光临**</tr> \
</table>';

var compile = new Compiler(noteTpl);
var hashTree = compile();
console.log('compile to hashTree:\n', hashTree);
var deviceOptions = {"fontSize": 33, "fontFamily": "宋体"};
var printerOptions = {colWidth: 10, borderWidth: 1};
var device = new NoteDevice(deviceOptions);
var p = new Printer(device, printerOptions);
p.print(hashTree);