# cirrus
Cloud Integration Reporting and Replication UtilitieS

## Installation
```javascript
npm install
```

## Usage
Cirrus supports a series of sub-commands related to key elements of the AWS cloud infrastructure.
For example, to get disk use by a bucket called "myBucket"

```javascript
cirrus s3 du myBucket
```

At each level, help can be provided with the -h flag. For example, to get help for cirrus, the command is:

```javascript
cirrus -h
```

To get help with the S3 commands:

```javascript
cirrus s3 -h
```

To get help with the S3 du command:

```javascript
cirrus s3 du -h
```


## Options
| Option             | Description                                              |
|--------------------|----------------------------------------------------------|
| -h, --help | output usage information |
| -v, --version | output version number |
| -c, --config &lt;path&gt; | path to config file relative to cirrus.js; defaults to config.json |
|   **S3**                              ||
| -h | help for S3 commands |
| ls | list all buckets |
| du &lt;bucket&gt; | disk usage for objects in a specified &lt;bucket&gt; |
| mkdir &lt;bucket&gt; | create &lt;bucket&gt; |
| rm &lt;bucket&gt; | remove &lt;bucket&gt;, prompts if not empty |
| scp &lt;path&gt; &lt;bucket&gt; | put items in &lt;path&gt; recursively (if dir) into destination &lt;bucket&gt; |
|   **EC2**                              ||
| -h | help for EC2 commands |
| ls | list all instances |


## Configuration
Cirrus takes a JSON configuration file. By default, the script will look for config.json (but can be overriden with the -c &lt;path&gt; flag, with a relative path from the location of cirrus.js).

```json
{
    "accessKeyId": "yourPublicKeyHere",
    "secretAccessKey": "yourPrivateKeyHere",
    "region": "yourRegionHere"
}
```

aws.json

aws.json.sample

## TODOs
### full cloud
- --cloud-list
- --cloud-compare &lt;path&gt; path to existing compare, will compare with provided config
- --cloud-deploy
- --cloud-snapshot &lt;path&gt; path to store config

### ec2
- --ec2-stop
- --ec2-start
- --ec2-set-instance
- --ec2-attach-ebs
- --ec2-attach-elasticip
- --ec2-set-sg

### s3
- --s3-get
- --s3-rename
- --s3-copy

### elasticip
-  --elasticip-list
-  --elasticip-release
-  --elasticip-create

### ebs
-  --ebs-list