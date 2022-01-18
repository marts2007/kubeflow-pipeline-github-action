"use strict";
const core = require("./code/actions/core");
Object.defineProperty(exports, "__esModule", { value: true });

async function go() {
    try {
        const Config = require("./config")
        const Kubeflow = require("./kubeflow_helper")
        const Pipeline = require("./pipeline")

        const config = new Config()
        console.log(config.endpointUrl)
        const kubeflow = new Kubeflow(config)
        await kubeflow.init()
        const pipeline = new Pipeline(config)
        console.log(config.pipelineName)

        //checking if pipeline with such name already exists
       let pipelines = await kubeflow.getPipelines(`{"predicates":[{"key":"name","op":"EQUALS","string_value":"${config.pipelineName}"}]}`)
        if (pipelines){
            throw Error(`Pipeline "${config.pipelineName}" already exist`)
        }

        //uploading new pipeline
        var result = await kubeflow.postPipeline(pipeline)
        var pipeline_id = result.id
        pipeline.id = pipeline_id
        pipeline.version = result.default_version.id
        console.log(`\nThe new pipeline's ID is: ${pipeline_id}`);
        
        //checking if experiment exist
        var experiment = await kubeflow.getExperiments(`{"predicates":[{"key":"name","op":"EQUALS","string_value":"${config.experimentName}"}]}&resource_reference_key.type=NAMESPACE&resource_reference_key.id=${config.namespace}`)
        if (!experiment) throw Error(`No such experiment ${config.experimentName}`)
        pipeline.experiment_id = experiment[0].id

        //creating new run
        var run = await kubeflow.createRun(pipeline)
        if (run) {
            core.setOutput("kf_run_id", run.run.id);
        } else {
            throw new Error("something went wrong, can`t start new run")
        }
        
    }
    catch (error){
        core.setFailed(error.message);
    }

}
go()