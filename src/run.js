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
class Run {
    constructor() {
        this.endpointUrl = core.getInput('KubeflowEndpoint');
        this.runName = core.getInput('runName');
        this.pipeline = core.getInput('pipeline');
        if (core.getInput('useDefaultVersion').toLowerCase() == 'true') {
            this.useDefaultVersion = true;
            this.pipelineVersion = this.pipeline;
        }
        else if (core.getInput('useDefaultVersion').toLowerCase() == 'false') {
            this.useDefaultVersion = false;
            this.pipelineVersion = core.getInput('pipelineVersion');
        }
        else {
            this.useDefaultVersion = false;
            this.pipelineVersion = '';
            core.setFailed('useDefaultVersion must be a boolean');
        }
        this.pipelineParams = core.getInput('pipelineParams');
        this.description = core.getInput('runDescription');
        if (core.getInput('waitForRunToFinish').toLowerCase() == 'true') {
            this.waitForRunToFinish = true;
        }
        else if (core.getInput('waitForRunToFinish').toLowerCase() == 'false') {
            this.waitForRunToFinish = false;
        }
        else {
            this.waitForRunToFinish = false;
            core.setFailed('waitForRunToFinish must be a boolean');
        }
        this.experiment = core.getInput('experiment');
        this.experimentName = core.getInput('experimentName');
        this.runType = 'One-Off';
        this.getAllRunsEndpoint = 'pipeline/apis/v1beta1/runs';
        this.getAllPipelinesEndpoint = 'pipeline/apis/v1beta1/pipelines';
        this.getAllVersionsEndpoint = 'pipeline/apis/v1beta1/pipeline_versions';
        this.getAllExperimentsEndpoint = 'pipeline/apis/v1beta1/experiments';
        this.pipelineID = '';
        this.pipelineVersionID = '';
        this.experimentID = '';
        this.runID = '';
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
    async validatePipeline() {
        try {
            var pipelineID = await this.getPipelineID();
            if (pipelineID != 'Not a valid pipeline id.') {
                this.pipelineID = pipelineID;
                core.setOutput("kf_pipeline_id", this.pipelineID);
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validatePipelineVersion() {
        try {
            var versionID = await this.getPipelineVersionID();
            if (versionID != 'Not a valid version id.') {
                this.pipelineVersionID = versionID;
                core.setOutput("kf_pipeline_version_id", this.pipelineVersionID);
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validateExperimentName() {
        try {
            if (this.experiment == 'createNewExperiment') {
                this.experimentID = await this.getExperimentID();
                return true;
            }
            else {
                var experimentID = await this.getExperimentID();
                if (experimentID != 'Not a valid experiment id.') {
                    this.experimentID = experimentID;
                    core.setOutput("kf_experiment_id", this.experimentID);
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validatePipelineParams() {
        try {
            if (this.pipelineParams == '' || this.pipelineParams == undefined) {
                return true;
            }
            JSON.parse(`[${this.pipelineParams}]`);
            return true;
        }
        catch (error) {
            core.setFailed(`Pipeline Params is not a valid json object array. ${error.message}`);
        }
    }
    async runValidations() {
        try {
            if (!await this.validateEndpointUrl) {
                throw new Error('Endpoint Url must be a valid Url.');
            }
            if (!await this.validatePipeline()) {
                throw new Error('Pipeline not found. Please make sure you are using an existing pipeline from your Kubeflow workspace.');
            }
            if (!await this.validatePipelineVersion()) {
                throw new Error('Pipeline version not found. Please make sure you are using an existing pipeline version from your Kubeflow workspace.');
            }
            if (!await this.validateExperimentName()) {
                throw new Error('Experiment not found. Please make sure you are using an existing experiment from your Kubeflow workspace.');
            }
            if (!await this.validatePipelineParams()) {
                throw new Error('Pipeline Params must be a valid json object array.');
            }
            return true;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    // The payload that posting a new run takes follows this format as a string: {name: string, description: string,
    // pipeline_spec: {parameters: [{}]}, resource_references: [{key: {id: string, type: EXPERIMENT}, relationship: OWNER},
    // {key: {id: string, type: PIPELINE_VERSION}, relationship: CREATOR}]}
    async createRun() {
        try {
            if (this.pipelineParams == '' || this.pipelineParams == undefined) {
                var form = `{"name": "${this.runName}", "description": "${this.description}",
                "pipeline_spec": {"parameters": []},
                "resource_references": [{"key": {"id": "${this.experimentID}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
                {"key": {"id": "${this.pipelineVersionID}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
            }
            else {
                var form = `{"name": "${this.runName}", "description": "${this.description}", 
                "pipeline_spec": {"parameters": [${this.pipelineParams}]},
                "resource_references": [{"key": {"id": "${this.experimentID}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
                {"key": {"id": "${this.pipelineVersionID}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
            }
            var reqHost = this.endpointUrl.substring(7, this.endpointUrl.length - 1);
            var reqHeaders = {
                'authorization': `Bearer ${this.bearerToken}`,
                'content-type': 'application/json'
            };
            await this.postRequest(reqHost, form, reqHeaders);
            await this.wait(10000);
            var runID = await this.getRunID();
            if (runID != 'Not a valid run id.') {
                this.runID = runID;
                core.setOutput("kf_run_id", this.runID);
                console.log(`The new run can be viewed at: ${this.endpointUrl}_/pipeline/#/runs/details/${this.runID}`);
                console.log(`The new Runs ID is: ${this.runID}`);
            }
            else {
                throw new Error('Failed to retrieve ID of new run. Make sure you are using the correct endpoint, and that you are using the correct bearer token, if necessary.');
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async postRequest(reqHost, form, reqHeaders) {
        try {
            var req = http_1.request({
                host: reqHost,
                path: `/${this.getAllRunsEndpoint}`,
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
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async monitorRun() {
        try {
            var status = '';
            while (true) {
                status = await this.getRunStatus();
                var date = new Date();
                console.log(`Time: ${date.toTimeString().split(' ')[0]}   Status: ${status}`);
                if (status == 'Succeeded') {
                    console.log('Succeeded');
                    core.setOutput('kf_run_status', status);
                    return;
                }
                else if (status == 'Failed') {
                    core.setOutput('kf_run_status', status);
                    throw new Error('Run has failed.');
                }
                await this.wait(15000);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async wait(ms) {
        await new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    async getRunID() {
        try {
            var url = `${this.endpointUrl}${this.getAllRunsEndpoint}?resource_key.type=PIPELINE_VERSION&resource_key.id=${this.pipelineVersionID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.runName}"}]}&sort_by=created_at desc`;
            url = encodeURI(url);
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                if (webRequest.result.runs[0].id != undefined) {
                    return webRequest.result.runs[0].id;
                }
                console.log('Run not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid run id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid run id.';
        }
        catch (error) {
            core.setFailed(error.message);
            return 'Not a valid run id.';
        }
    }
    async getRunStatus() {
        try {
            var url = `${this.endpointUrl}${this.getAllRunsEndpoint}/${this.runID}`;
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                if (webRequest.result.run.status != undefined) {
                    return webRequest.result.run.status;
                }
                return 'Not a valid status.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid status.';
        }
        catch (error) {
            core.setFailed(error.message);
            return 'Not a valid status.';
        }
    }
    async getPipelineID() {
        try {
            var url = `${this.endpointUrl}${this.getAllPipelinesEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipeline}"}]}`;
            url = encodeURI(url);
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                if (webRequest.result.pipelines[0].id != undefined) {
                    return webRequest.result.pipelines[0].id;
                }
                console.log('Pipeline not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid pipeline id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid pipeline id.';
        }
        catch (error) {
            core.setFailed(error.message);
            return 'Not a valid pipeline id.';
        }
    }
    async getPipelineVersionID() {
        try {
            var url = `${this.endpointUrl}${this.getAllVersionsEndpoint}?resource_key.type=PIPELINE&resource_key.id=${this.pipelineID}&filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.pipelineVersion}"}]}`;
            url = encodeURI(url);
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                var versions = webRequest.result.versions;
                if (versions != undefined) {
                    for (var i = 0; i < versions.length; i++) {
                        if (versions[i].name == this.pipelineVersion) {
                            return versions[i].id;
                        }
                    }
                    console.log('Version not found. Make sure your endpoint and/or bearer token are correct.');
                    return 'Not a valid version id.';
                }
                console.log('Version not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid version id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid version id.';
        }
        catch (error) {
            core.setFailed(error.message);
            return 'Not a valid version id.';
        }
    }
    async getExperimentID() {
        try {
            var url = `${this.endpointUrl}${this.getAllExperimentsEndpoint}?filter={"predicates":[{"key":"name","op":"EQUALS","string_value":"${this.experimentName}"}]}`;
            url = encodeURI(url);
            var options = { additionalHeaders: { 'authorization': `Bearer ${this.bearerToken}` } };
            var webRequest = await this.restAPIClient.get(url, options);
            if (webRequest.result != null) {
                var experiments = webRequest.result.experiments;
                if (experiments[0].id != undefined) {
                    return experiments[0].id;
                }
                console.log('Experiment not found. Make sure your endpoint and/or bearer token are correct.');
                return 'Not a valid experiment id.';
            }
            console.log('Request did not go through. Make sure your endpoint and/or bearer token are correct.');
            return 'Not a valid experiment id.';
        }
        catch (error) {
            core.setFailed(error.message);
            return 'Not a valid experiment id.';
        }
    }
}
exports.Run = Run;
