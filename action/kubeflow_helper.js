const { exitCode } = require("process");
const rest = require("typed-rest-client")
restAPIClient = new rest.RestClient('agent');
const pipelines = 'pipeline/apis/v1beta1/pipelines'
const experiments = 'pipeline/apis/v1beta1/experiments'
const runs = 'pipeline/apis/v1beta1/runs'
const formData = require("form-data")
const fs = require("fs");
//onst https = require("https");
const https = require('follow-redirects').https;
const Config = require("./config")
const config = new Config()
const request = require('request');


class KubeflowHelper {
    constructor() {
        if (config.endpointUrl == undefined) {
            throw new Error('endpointUrl not set');
        }
        this.endpointUrl = config.endpointUrl;
        this.token = undefined;      
         
    }
    async init(){
        if (!await this.authenticate()) throw Error("Can`t login, check kubeflowEndpoint, userid, password envs")
        if (! await this.checkApiServer()) {
            throw Error("Can not connect to the API Endpoint")
        }
    }

    async checkApiServer(){
        try {
            var options = { additionalHeaders: { 'Cookie': `authservice_session=${this.token};` }, allowRedirectDowngrade:true };
            var req = await restAPIClient.get(this.endpointUrl+pipelines, options);
            if (req.statusCode == 200) {
                return true;
            }
            return false;
        }
        catch (error){
            throw new Error(error)
        }
        
    }
    async authenticate(){
        var loc = new URL(this.endpointUrl)
        var url = this.endpointUrl
        var str =''
        var self = this
        var data = {
            "login":config.userid,
            "password":config.password
        }
        return new Promise(function(resolve,reject){
            var cookieJar = request.jar()
            request.get({
                url:url,
                jar:cookieJar,
            }, function(error,response,body){
                var url = response.request.href
                request.post({
                    url:url,
                    jar:cookieJar,
                    form:data,
                    followAllRedirects: true
                }, function(error,response,body){
                    //var s = response
                    var cookie = (cookieJar.getCookieString(self.endpointUrl))
                    if (cookie.includes("authservice_session=")){
                        var tmp = cookie.split("=")
                        self.token = tmp[1]
                        resolve(true)
                    } else {
                        throw new Error("Can`t log in")
                        reject(false)
                    }

                })
            })
        })

    }
   

    async makeRequest(url, user_options={},post=false,form=[],type=undefined){
        try {
            url = encodeURI(url);
            var options = { additionalHeaders: { 'Cookie': `authservice_session=${this.token};` },allowRedirectDowngrade:true}
            var options = Object.assign(user_options,options)
            if (!post)
                var webRequest = await restAPIClient.get(url, options);
            else {
                var self = this
                return new Promise(function(resolve,reject) {
                    var str = ''
                    var loc = new URL(url)
                    var URLsplit = url.split('/');
                    var host = URLsplit[0] + "//" + URLsplit[2];
                    var options = { additionalHeaders: { 'Cookie': `authservice_session=${self.token};` },allowRedirectDowngrade:true}
                    options.additionalHeaders = Object.assign(user_options,options.additionalHeaders)
                    options = Object.assign(user_options,options)
                    options = Object.assign(options, { 'cookie': `authservice_session=${self.token};` })

                    var req = https.request({
                        host: loc.host,
                        path: encodeURI(`${url.replace(host,'')}`),
                        method: 'POST',
                        headers: options,
                    }, function(response){
                        if (response.statusCode==200){
                            response.on('data', chunk => {
                                str += chunk;
                            })
                            response.on('end',res=>{
                                resolve(str)
                            })

                        } else {
                            reject(response.statusCode);
                        }
                    })
                    req.on('error',error => {
                        reject(error)
                    })
                    if (form  instanceof formData) {
                        form.pipe(req);
                    } else {
                        req.write(form);
                        req.end();
                    }
                    
                }).catch(error => {throw new Error(error)});
            }
            if (webRequest.result != null) {
                return webRequest.result;
            }
        }
        catch(error){
            throw new Error(error)
        }
    }

    async getPipelines(filter=None){
        try {
            var url = `${this.endpointUrl}${pipelines}`;
            if (filter){
                url+="?filter="+filter;
            }
            var result = await this.makeRequest(url)
            if ('pipelines' in result){
                return result.pipelines
            }
            return false
        } 
        catch(error){
            throw new Error(error)
        }

    }
    
    async postPipeline(pipeline){
        try {
            var uploadFile = fs.createReadStream(pipeline.pipelineFilePath);
            var form = new formData()
            form.append('uploadfile', uploadFile);
            var headers = form.getHeaders()
            var url = `${this.endpointUrl}${pipelines}/upload?name=${pipeline.pipelineName}`;
            var result = await this.makeRequest(url,headers,true, form)
            result = JSON.parse(result)
            return result
        }
        catch(error) {
            throw new Error(error)
        }

    }

    async getExperiments(filter=None){
        try {
            var url = `${this.endpointUrl}${experiments}`;
            if (filter){
                url+="?filter="+filter;
            }
            var result = await this.makeRequest(url)
            if ('experiments' in result){
                return result.experiments
            }
            return false
        } 
        catch(error){
            throw new Error(error)
        }
    }

    async createRun(pipeline=None){
        if (pipeline.pipelineParams == '' || pipeline.pipelineParams == undefined) {
            var form = `{"name": "${config.runName}", "description": "${config.runDescription}",
            "pipeline_spec": {"parameters": []},
            "resource_references": [{"key": {"id": "${pipeline.experiment_id}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
            {"key": {"id": "${pipeline.version}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
        }
        else {
            var form = `{"name": "${config.runName}", "description": "${config.runDescription}", 
            "pipeline_spec": {"parameters": [${pipeline.pipelineParams}]},
            "resource_references": [{"key": {"id": "${pipeline.experiment_id}", "type": "EXPERIMENT"}, "relationship": "OWNER"},
            {"key": {"id": "${pipeline.version}", "type": "PIPELINE_VERSION"}, "relationship": "CREATOR"}]}`;
        }
        try {

            var headers = {
                'kubeflow-userid':`${config.userid}`,
                'content-type': 'application/json',
                'authorization': `Bearer ${this.token}`,
                'Cookie': `authservice_session=${this.token};`,
            }
            var url = `${this.endpointUrl}${runs}?resource_reference_key.type=NAMESPACE&resource_reference_key.id=${config.namespace}`
            var result = await this.makeRequest(url,headers,true, form)
            result = JSON.parse(result)
            return result
        }
        catch(error) {
            throw new Error(error)
        }

    }
}




module.exports = KubeflowHelper