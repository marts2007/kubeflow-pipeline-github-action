try {
   const core =  require('@actions/core')
} catch (ex) {
    class core{
        getInput(v){
            return process.env[v]
        }
        setFailed(msg){
            console.log(msg)
        }
        setOutput(name,val){
            console.log(name,val)
        }
    }
}

ncore = new core()
module.exports = ncore