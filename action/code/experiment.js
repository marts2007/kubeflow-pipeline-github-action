"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const rest = __importStar(require("typed-rest-client"));
const http_1 = require("http");
class Experiment {
    constructor() {
        this.endpointUrl = core.getInput('kubeflowEndpoint');
        this.name = core.getInput('experimentName');
        this.description = core.getInput('experimentDescription');
        this.getAllExperimentsEndpoint = 'apis/v1beta1/experiments';
        this.restAPIClient = new rest.RestClient('agent');
        this.bearerToken = core.getInput('bearerToken');
    }
    async validateEndpointUrl() {
        try {
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var req = await this.restAPIClient.get(this.endpointUrl, options);
            if (req.statusCode == 200) {
                return true;
            }
            return false;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validateName() {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}`;
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                if (webRequest.result.experiments != undefined) {
                    for (var exp of webRequest.result.experiments) {
                        if (exp.name == this.name) {
                            return false;
                        }
                    }
                    return true;
                }
                else {
                    return true;
                }
            }
            else {
                throw new Error('Request did not go through. Make sure your Url is valid, and that you have the correct bearer token, if needed.');
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async runValidations() {
        try {
            if (!await this.validateEndpointUrl()) {
                throw new Error('Endpoint Url must be a valid Url.');
            }
            if (!await this.validateName()) {
                throw new Error('Experiment name field is either empty, or experiment name is already in use.');
            }
            return true;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    //The payload that posting a new experiment takes follows this format as a string: {name: string, description: string}
    async createExperiment() {
        try {
            if (this.description == undefined || this.description == null) {
                var form = JSON.stringify({ "name": this.name });
            }
            else {
                var form = JSON.stringify({ "name": this.name, "description": this.description });
            }
            var reqHost = this.endpointUrl.substring(8, this.endpointUrl.length - 1);
            var reqHeaders = {
                'authorization': `Bearer ${this.bearerToken}`,
                'content-type': 'application/json'
            };
            await this.postRequest(reqHost, form, reqHeaders);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async postRequest(reqHost, form, reqHeaders) {
        var req = http_1.request({
            host: reqHost,
            path: `/${this.getAllExperimentsEndpoint}`,
            method: 'POST',
            headers: reqHeaders,
        }, response => {
            try {
                response.on('data', d => {
                    process.stdout.write(d);
                });
                console.log(`Response returned with status code ${response.statusCode}: ${response.statusMessage}`);
            }
            catch (error) {
                core.setFailed(`${error.message} Make sure that your endpoint is correct, and that you are using the correct bearer token, if neccessary.`);
            }
        });
        req.write(form);
        req.end();
    }
}
exports.Experiment = Experiment;
