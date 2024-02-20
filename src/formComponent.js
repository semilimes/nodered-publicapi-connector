"use strict";

const Core = require('./sme-main-core.js');

module.exports = function(RED) {
    function FormComponentNode(config) {
        RED.nodes.createNode(this, config);
        
        this.reference = config.reference;
        this.referenceType = config.referenceType;

        this.component = config.component;

        this.title = config.title;
        this.titleType = config.titleType;

        this.required = config.required;
        this.requiredType = config.requiredType;

        this.text = config.text;
        this.textType = config.textType;

        this.verticalList = config.verticalList;
        this.verticalListType = config.verticalListType;

        this.buttons = config.buttons;

        this.choices = config.choices;

        this.switchValue = config.switchValue;
        this.switchValueType = config.switchValueType;

        this.sliderMin = config.sliderMin;
        this.sliderMinType = config.sliderMinType;

        this.sliderMax = config.sliderMax;
        this.sliderMaxType = config.sliderMaxType;

        this.sliderStep = config.sliderStep;
        this.sliderStepType = config.sliderStepType;

        this.sliderValue = config.sliderValue;
        this.sliderValueType = config.sliderValueType;

        this.actionButtonTitle = config.actionButtonTitle;
        this.actionButtonTitleType = config.actionButtonTitleType;

        this.multiSelection = config.multiSelection;
        this.multiSelectionType = config.multiSelectionType;

        this.bucketFilter = config.bucketFilter;

        var node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };

            var core = new Core();
            var smeHelper = new core.SmeHelper();

            
            //Take the form setup location from the special var created by the form setup node
            if (!msg["_formSetupLocation"] || 
                !msg["_formSetupLocation"].var ||
                !msg["_formSetupLocation"].type) {
                var error = "Save location is invalid. Use the form setup first!";
                node.error(error);
                done && done(error);
            }

            node.saveLocation = msg["_formSetupLocation"].var;
            node.saveLocationType = msg["_formSetupLocation"].type;

            var location = undefined;
            switch (node.saveLocationType) {
                case 'msg':
                    location = msg[node.saveLocation];
                    break;
                case 'flow':
                    location = node.context().flow.get(node.saveLocation);
                    break;
                case 'global':
                    location = node.context().global.get(node.saveLocation);
                    break;
                default:
                    break;
            }

            if (location === undefined || !Array.isArray(location.formComponents)) {
                //Build the first form structure
                var error = "Form is not setup correctly!";
                node.error(error);
                done && done(error);
            }
            
            //General fields
            var referenceFieldValue = smeHelper.getNodeConfigValue(node, msg, node.referenceType, node.reference);
            
            switch(node.component) {
                case 'label':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue
                    });
                    break;
                case 'textbox':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var textFieldValue = smeHelper.getNodeConfigValue(node, msg, node.textType, node.text);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        value: textFieldValue
                    });
                    break;
                case 'buttonlist':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var verticalListFieldValue = smeHelper.getNodeConfigValue(node, msg, node.verticalListType, node.verticalList);
                    var optionsFieldValue = [];
                    node.buttons.forEach(button => {
                        optionsFieldValue.push({
                            name: button.value,
                            value: button.id
                        });                        
                    });
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        verticalList: verticalListFieldValue,
                        options: optionsFieldValue
                    });
                    break;
                case 'singlechoice':
                    // => multichoice
                case 'multichoice':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var optionsFieldValue = [];
                    node.choices.forEach(choice => {
                        optionsFieldValue.push({
                            name: choice.value,
                            value: choice.id
                        });                        
                    });
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        options: optionsFieldValue
                    });
                    break;
                case 'switch':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var switchFieldValue = smeHelper.getNodeConfigValue(node, msg, node.switchValueType, node.switchValue);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        value: switchFieldValue
                    });
                    break;
                case 'slider':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var sliderMinFieldValue = smeHelper.getNodeConfigValue(node, msg, node.sliderMinType, node.sliderMin);
                    var sliderMaxFieldValue = smeHelper.getNodeConfigValue(node, msg, node.sliderMaxType, node.sliderMax);
                    var sliderStepFieldValue = smeHelper.getNodeConfigValue(node, msg, node.sliderStepType, node.sliderStep);
                    var sliderValueFieldValue = smeHelper.getNodeConfigValue(node, msg, node.sliderValueType, node.sliderValue);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        min: sliderMinFieldValue,
                        max: sliderMaxFieldValue,
                        step: sliderStepFieldValue,
                        value: sliderValueFieldValue
                    });
                    break;
                case 'datepicker':
                    // => time picker
                case 'timepicker':
                    // => location picker
                case 'locationpicker':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var actionButtonFieldValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        actionButtonTitle: actionButtonFieldValue
                    });
                    break;
                case 'photopicker':
                    // => filepicker
                case 'filepicker':
                    // => contactpicker
                case 'contactpicker':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var actionButtonFieldValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);
                    var multiSelectionFieldValue = smeHelper.getNodeConfigValue(node, msg, node.multiSelectionType, node.multiSelection);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        actionButtonTitle: actionButtonFieldValue,
                        multiSelection: multiSelectionFieldValue
                    });
                    break;
                case 'bucketpicker':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var actionButtonFieldValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);
                    var multiSelectionFieldValue = smeHelper.getNodeConfigValue(node, msg, node.multiSelectionType, node.multiSelection);
                    var bucketFiltersArray = [];
                    if (node.bucketFilter === "all") {
                        bucketFiltersArray.push("post");
                        bucketFiltersArray.push("profile");
                        bucketFiltersArray.push("groupchat");
                        bucketFiltersArray.push("channel");
                    } else {
                        bucketFiltersArray.push(node.bucketFilter);
                    }
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        filter: {
                            types: bucketFiltersArray
                        },
                        actionButtonTitle: actionButtonFieldValue,
                        multiSelection: multiSelectionFieldValue
                    });
                    break;
                case 'hiddenvalue':
                    var textFieldValue = smeHelper.getNodeConfigValue(node, msg, node.textType, node.text);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        value: textFieldValue
                    });
                    break;
                case 'qrcodescanner':
                    // => nfcreader
                case 'nfcreader':
                    var titleFieldValue = smeHelper.getNodeConfigValue(node, msg, node.titleType, node.title);
                    var requiredFieldValue = smeHelper.getNodeConfigValue(node, msg, node.requiredType, node.required);
                    var actionButtonFieldValue = smeHelper.getNodeConfigValue(node, msg, node.actionButtonTitleType, node.actionButtonTitle);
                    location.formComponents.push({
                        refName: referenceFieldValue || "",
                        formComponentType: node.component,
                        title: titleFieldValue,
                        requiredSelection: requiredFieldValue,
                        actionButtonTitle: actionButtonFieldValue
                    });
                    break;
                default:
                    break;
            }

            //Set the new values back to the original save field
            switch (node.saveLocationType) {
                case 'msg':
                    msg[node.saveLocation] = location;
                    break;
                case 'flow':
                    node.context().flow.set(node.saveLocation, location);
                    break;
                case 'global':
                    node.context().global.set(node.saveLocation, location);
                    break;
                default:
                    break;
            }

            send(msg);

            done && done();
        });
    }
    RED.nodes.registerType("formComponent", FormComponentNode);
}