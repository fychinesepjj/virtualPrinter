(function (exports) {
    var noteTpl = '<table> \
        <tr fontSize="30"><td width="24"><%= Cinema %></td></tr> \
        <tr></tr> \
        <tr><%= Date %> <%= Time %></tr> \
        <tr>NO.: <%= OrderNo %></tr> \
        <tr>操作员：<%= Seller %></tr> \
        <tr>============================</tr> \
        <tr><td  width="9">商品名称</td><td width="10">单价*数量</td><td width="5" align="right">金额</td></tr> \
        <% for(var i = 0, goodsLen = goodsList.length; i < goodsLen; i++){%> \
        <tr><td><%= goodsList[i].Name %></td><td width="8" align="right"><%= goodsList[i].Price %>*<%= goodsList[i].Count %></td><td width="6" align="right"><%= goodsList[i].Money %></td></tr> \
            <% for(var j = 0, packageLen = (goodsList[i].pac && goodsList[i].pac.length) || 0; j < packageLen; j++){%> \
            <tr>  ><%= goodsList[i].pac[j].Pac_single_name %></tr> \
            <%}%> \
        <%}%> \
        <tr>============================</tr> \
        <tr><td align="right" width="13">合计:</td><td align="right" width="4"><%= GoodsCount %></td><td width="7" align="right"><%= TotalMoney %></td></tr> \
        <tr><td align="right" width="13">优惠:</td><td width="4"></td><td width="7" align="right"><%= DisMoney %></td></tr> \
        <tr><td align="right" width="13">实付款:</td><td width="4"></td><td width="7" align="right"><%= Last_Money %></td></tr> \
        <tr>============================</tr> \
        <% for(var k = 0, payListLen = payList.length || 0; k < payListLen; k++){%> \
        <tr><td width="13" align="right"><%= typeNameMapping[payList[k].name] %>:</td><td width="4"></td><td width="7" align="right"><%= payList[k].money %></td></tr> \
        <% if(payList[k].name == "card") {%> \
        <tr><td width="13" align="right">卡余额：</td><td width="4"></td><td width="7" align="right"><%= card_bal %></td></tr> \
        <%}%> \
        <%}%> \
        <tr>============================</tr> \
        <tr>**谢谢惠顾！欢迎再次光临**</tr> \
    </table>';
    
    var defaultOptions = {
        fontSize: 24,
        fontFamily: 'SimSun-ExtB' //M+ 1m light
    };
    
    exports.Helper = exports.Helper || {};
    exports.Helper.printeNote = function printeNote(data, options) {
        data = data || {};
        options = options || {};
        var times = options.times || 1;
        var newOptions = exports.Tools.Utils.assign({}, defaultOptions, options);
        if (!template) {
            throw new Error('arctemplate is not loaded!');
        }
        var tplCompiler = template.compile(noteTpl);
        var renderedTpl = tplCompiler(data);
        var labelCompiler = new exports.Tools.LabelCompiler(renderedTpl);
        var device = new exports.NotePrinterDevice(newOptions);
        var p = new exports.Printer.HashTreePrinter(device, newOptions);
        var compiledHashTree = labelCompiler();
        while (times--) {
            p.print(compiledHashTree);
        }
    }
})(Device);