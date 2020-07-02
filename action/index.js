"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const upload_1 = require("./code/upload");
const experiment_1 = require("./code/experiment");
const run_1 = require("./code/run");
async function run() {
    try {
        var UP = new upload_1.UploadPipeline();
        if (await UP.runValidations() == true) {
            if (UP.pipelineTask == 'uploadNew') {
                await UP.uploadNewPipeline();
            }
            else {
                await UP.uploadNewPipelineVersion();
            }
        }
        else {
            throw new Error('Validations failed.');
        }
        var RUN = new run_1.Run();
        if (RUN.experiment == 'createNewExperiment') {
            var EXP = new experiment_1.Experiment();
            if (await EXP.runValidations()) {
                await EXP.createExperiment();
            }
        }
        if (await RUN.runValidations()) {
            await RUN.createRun();
            if (RUN.waitForRunToFinish == true) {
                await RUN.monitorRun();
            }
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
