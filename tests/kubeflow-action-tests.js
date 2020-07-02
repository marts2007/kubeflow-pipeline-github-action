"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kubeflow_action_mock_1 = require("./kubeflow-action-mock");
require("mocha");
var assert = require('assert');
var fs = require('fs');
var KubeFA = new kubeflow_action_mock_1.KubeflowActionMock('uploadNew', 'tests/pipeline.py.tar.gz', '[{"name":"resource_group", "value":"kubeflow-integration-rg"}, {"name":"workspace", "value":"kubeflow-integration-aml"}]');
describe('All validations pass', async function () {
    it('should return true saying that validations have passed', async function () {
        assert.equal(await KubeFA.runValidations(), true);
        Promise.resolve();
    });
});
describe('Validate pipeline parameters', async function () {
    it('should pass saying that the pipeline parameters are valid', async function () {
        assert.equal(await KubeFA.validatePipelineParams(), true);
        Promise.resolve();
    });
    it('should pass saying that the empty pipeline parameters are valid', async function () {
        KubeFA.pipelineParams = '';
        assert.equal(await KubeFA.validatePipelineParams(), true);
        Promise.resolve();
    });
    it('should fail saying that the pipeline parameters are not valid', async function () {
        KubeFA.pipelineParams = 'these are not valid pipeline parameters at all';
        assert.equal(await KubeFA.validatePipelineParams(), false);
        Promise.resolve();
    });
});
describe('File Path Validations', async function () {
    it('should return true saying that the file path is valid', async function () {
        assert.equal(await KubeFA.validatePipelineFilePath(), true);
        Promise.resolve();
    });
    it('should return false saying that the file path is not valid', async function () {
        KubeFA.pipelineFilePath = '.gitignore';
        assert.equal(await KubeFA.validatePipelineFilePath(), false);
        Promise.resolve();
    });
});
describe('File Size Validations', async function () {
    it('should return true saying that the file size is valid', async function () {
        KubeFA.pipelineFilePath = 'tests/pipeline.py.tar.gz';
        assert.equal(await KubeFA.validatePipelineFileSizePass(), true);
        Promise.resolve();
    });
    it('should return false saying that the file size is too large', async function () {
        assert.equal(await KubeFA.validatePipelineFileSizeFail(), false);
        Promise.resolve();
    });
});
describe('Run All Validations Fail', async function () {
    it('should return false saying that the validations have failed', async function () {
        KubeFA.pipelineFilePath = '.gitignore';
        assert.equal(await KubeFA.runValidations(), false);
        Promise.resolve();
    });
});
