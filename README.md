# Kubeflow-Pipeline-Github-Action

Github action to upload and run a Kubeflow pipeline to KubeFlow workspace.

add 3 secrets to your repo
```
KUBEFLOWENDPOINT - your kubeflow https:// url
USERID - pipelines user email
PASSWORD - user`s password
```

The following is an example of uploading a new pipeline, and running/monitoring the new pipeline on that experiment with this action:

```yaml
on: [push]

jobs:
  kubeflow_upload_job:
    runs-on: ubuntu-latest
    name: Kubeflow Upload and Run Pipeline
    steps:
    - name: Checkout task
      uses: actions/checkout@master
    #- run: npm install
    - name: Kubeflow Upload and Run Step
      id: upload-run
      uses: marts2007/kubeflow-pipeline-github-action@master
      with:
        kubeflowEndpoint: '${{ secrets.KUBEFLOWENDPOINT }}'
        pipelineName: 'testPL-${{ github.run_number }}'
        userid: '${{ secrets.USERID }}'
        password: '${{ secrets.PASSWORD }}'

    # Use the outputs from the `Kubeflow Upload and Run Step`
    - name: Get all outputs
      run: |
        echo "Pipeline version id ${{ steps.upload-run.outputs.kf_pipeline_version_id }}"
        echo "Pipeline id ${{ steps.upload-run.outputs.kf_pipeline_id }}"
        echo "Experiment id ${{ steps.upload-run.outputs.kf_experiment_id }}"
        echo "Run id ${{ steps.upload-run.outputs.kf_run_id }}"

```
