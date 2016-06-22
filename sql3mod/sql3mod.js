module.exports = function (RED) {
    function Sql3ModNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var flowContext = this.context().flow;
            var count = flowContext.get('count') || 0;
            if (typeof msg.payload === 'string') {
                count += 1;
                msg.payload = msg.payload.toLowerCase();
            } else if (typeof msg.payload === 'object') {
                if (msg.payload.name !== 'undefined') {
                    count -= 1;
                    msg.payload = msg.payload.name.toLowerCase();
                }
            }
            console.log("Count: " + count);
            flowContext.set('count', count);
            node.send(msg);
        });
    }
    RED.nodes.registerType("sql3mod", Sql3ModNode);
};