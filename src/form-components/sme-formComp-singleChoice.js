"use strict";

const Core = require('../sme-main-core.js');

module.exports = function(RED) {
    function FormCompSingleChoiceNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;

        this.choices = [config.choice1, 
                        config.choice2, 
                        config.choice3, 
                        config.choice4, 
                        config.choice5, 
                        config.choice6];

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) }
            var validChoiceList = node.choices.filter(x => x != null && x != "").length > 0;
            if (validChoiceList) {
                var core = new Core();
                var smeHelper = new core.SmeHelper();
                var smeFormMsg = smeHelper.getOrAddSendingFormMsg(msg);

                var referenceValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
                var titleValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);

                if(smeFormMsg && smeFormMsg.dataComponent && smeFormMsg.dataComponent.formComponents) {
                    var component = {
                        refName: referenceValue || "",
                        formComponentType: "singlechoice",
                        title: titleValue || "",
                        requiredSelection: node.required == "1",
                        value: null,
                        options: []
                    };
                    node.choices.forEach( (choice, index) => {
                        if (choice.length > 0) {
                            component.options.push({
                                name: "choice" + (index+1),
                                value: choice
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
    RED.nodes.registerType("sme-formComp-singleChoice", FormCompSingleChoiceNode);
}