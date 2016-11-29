(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.TicketClient = factory();
    }

})(this, function () {

    /**
     * 打印客户端接口模拟
     */
    var _ticketClient = {
        NotePrinter: {
            AddSingleText: function (text, font, setting) {
                console.log(text);
            },
            Print() {
                console.log('Begin printing...');
            }
        }
    };

    return this.TicketClient || _ticketClient;
});