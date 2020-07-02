"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const core = require("@actions/core");
class KubeflowActionMock {
    constructor(pipelineTask, pipelineFilePath, pipelineParams) {
        this.pipelineTask = pipelineTask;
        this.pipelineFilePath = pipelineFilePath;
        this.maxFileSizeBytes = 32000000;
        this.pipelineParams = pipelineParams;
    }
    async validatePipelineFilePath() {
        try {
            if (fs.statSync(this.pipelineFilePath).isFile()) {
                if (this.pipelineFilePath.substring(this.pipelineFilePath.length - 7, this.pipelineFilePath.length) == '.tar.gz') {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validatePipelineFileSizePass() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            if (fileSizeInBytes > this.maxFileSizeBytes) {
                return false;
            }
            return true;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validatePipelineFileSizeFail() {
        try {
            const stats = fs.statSync(this.pipelineFilePath);
            const fileSizeInBytes = stats.size;
            if (fileSizeInBytes > 32) {
                return false;
            }
            return true;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async runValidations() {
        try {
            if (!await this.validatePipelineFilePath()) {
                return false;
            }
            if (!await this.validatePipelineFileSizePass()) {
                return false;
            }
            if (!await this.validatePipelineParams()) {
                return false;
            }
            return true;
        }
        catch (error) {
            core.setFailed(error.message);
        }
    }
    async validatePipelineParams() {
        try {
            if (this.pipelineParams == '') {
                return true;
            }
            JSON.parse(this.pipelineParams);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.KubeflowActionMock = KubeflowActionMock;
