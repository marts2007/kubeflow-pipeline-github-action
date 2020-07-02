import path = require("path");
import fs = require("fs");
import core = require("@actions/core");
import { UploadPipeline } from "../src/upload"
import { Experiment } from "../src/experiment";
import { Run } from "../src/run";

async function run() {
    try {
        var UP = new UploadPipeline();
        if(await UP.runValidations() == true) {
            if(UP.pipelineTask == 'uploadNew') {
                await UP.uploadNewPipeline();
            }
            else {
                await UP.uploadNewPipelineVersion();
            }
        }
        else {
            throw new Error('Validations failed.');
        }
        var RUN = new Run();
        if (RUN.experiment == 'createNewExperiment') {
            var EXP = new Experiment();
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