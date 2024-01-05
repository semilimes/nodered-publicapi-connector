"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompButtonListNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.verticalList = config.verticalList;

        this.buttons = [config.button1, 
                        config.button2, 
                        config.button3, 
                        config.button4, 
                        config.button5, 
                        config.button6];

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            var validButtonList = node.buttons.filter(x => x != null && x != "").length > 0;
            if (validButtonList) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();
                var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
                var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);

                if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                    var component = {
                        refName: referenceValue || "",
                        formComponentType: "buttonlist",
                        title: titleValue || "",
                        requiredSelection: node.required == "1",
                        value: null,
                        verticalList: node.verticalList == "1",
                        options: []
                    };
                    node.buttons.forEach( (button, index) => {
                        if (button.length > 0) {
                            component.options.push({
                                name: "btn" + (index+1),
                                value: button
                            });
                        }
                    });
                    smeFormMsg.dataComponent.formComponents.push(component);
                }
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("sme-formComp-buttonList", FormCompButtonListNode);
}