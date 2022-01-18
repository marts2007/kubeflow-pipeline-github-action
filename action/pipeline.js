const fs = require("fs");

class Pipeline {
    constructor(config){
        this.experiment_id=undefined
        if (config.pipelineFilePath == undefined) {
            throw new Error('pipelineFilePath not set');
        }
        if (config.pipelineFilePath.substring(config.pipelineFilePath.length - 7, config.pipelineFilePath.length) != '.tar.gz') {
            throw new Error('pipelineFile should be .tar.gz archive');
        }
        const filesize = (fs.statSync(config.pipelineFilePath)).size
        if (filesize > config.maxFileSizeBytes) {
            throw new Error('pipeline archive size is larger than '+config.maxFileSizeBytes);
        }
        this.pipelineFilePath = config.pipelineFilePath;
        if (config.pipelineName == undefined) {
            throw new Error('pipelineName not set');
        }
        this.pipelineName = config.pipelineName
        this.pipelineParams = config.pipelineParams
        if (this.pipelineParams!=undefined) {
            //lets check params
            try {JSON.parse(`[${this.pipelineParams}]`)}
            catch (error){
                throw new Error(`pipelineParams env should be a JSON string (${this.pipelineParams})`)
            }
        }

    }

}
module.exports = Pipeline