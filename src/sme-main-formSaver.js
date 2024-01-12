"use strict";

const Core = require('./sme-main-core.js');

module.exports = function (RED) {

    function SmeFormSaverNode(config) {
        RED.nodes.createNode(this, config);
        
        var node = this;

        node.location = config.location;
        node.locationType = config.locationType;

        node.on('input', function (msg, send, done) {
            send = send || function () { node.send.apply(node, arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();
            var smeSendingBox = smeHelper.getSendingBox(msg);
            if (smeSendingBox && smeSendingBox.length > 0) {
                var lastMsg = smeSendingBox[smeSendingBox.length - 1];
                if (node.location &&
                    lastMsg && 
                    lastMsg.dataComponent && 
                    lastMsg.dataComponent.dataComponentType == "form") 
                {
                    switch (node.locationType) 
                    {
                        case 'msg':
                            msg[node.location] = lastMsg.dataComponent;
                            break;
                        case 'flow':
                            node.context().flow.set(node.location, lastMsg.dataComponent);
                            break;
                        case 'global':
                            node.context().global.set(node.location, lastMsg.dataComponent);
                            break;
                        default:
                            break;
                    }
                }
            }

            send(msg, false);
            done && done();        

        });
    };

    RED.nodes.registerType("sme-main-formSaver", SmeFormSaverNode);
};