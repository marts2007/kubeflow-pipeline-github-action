require('dotenv').config()
const core = require("./code/actions/core");
class Config{
    constructor(){
        this.endpointUrl = core.getInput('KUBEFLOWENDPOINT');
        this.pipelineFilePath = core.getInput('pipelineFilePath');
        this.maxFileSizeBytes = (core.getInput('maxFileSizeBytes')!=undefined) ? core.getInput('maxFileSizeBytes') : 32000000
        this.pipelineName =  (core.getInput('pipelineName')!=undefined) ? core.getInput("pipelineName")  : 'newPipeline'
        this.pipelineParams = core.getInput('pipelineParams')
        this.experimentName = core.getInput('experimentName')
        this.namespace = core.getInput('namespace')
        this.runDescription = core.getInput('runDescription');
        this.runName = core.getInput('runName')
        this.userid = core.getInput('USERID')
        this.password = core.getInput('PASSWORD')
        if (this.userid==undefined) throw new Error("Please set userid env (api login)")
        if (this.userid==undefined) throw new Error("Please set password env (api password)")
        if (this.namespace==undefined) throw new Error('Please set the namespace env')
        if (this.experimentName==undefined) throw new Error('Please set the experimentName env')
    }
}
module.exports = Config