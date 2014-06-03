# cirrus
Cloud Integration Reporting and Replication UtilitieS

## Installation
```javascript
npm install
```

## Usage
```javascript
cirrus [options]
```

## Options
| Option             | Description                                              |
|--------------------|----------------------------------------------------------|
| -h, --help | output usage information |
| -v, --version | output version number |
| -c, --config &lt;path&gt; | path to config file relative to cirrus.js; defaults to config.json |
|   **S3**                              ||
| --s3-list | list all buckets |
| --s3-disk-use &lt;bucket&gt; | disk usage for objects in a specified &lt;bucket&gt; |
| --s3-create &lt;bucket&gt; | create &lt;bucket&gt; |
| --s3-remove &lt;bucket&gt; | remove &lt;bucket&gt;, prompts if not empty |
| --s3-put &lt;bucket&gt; &lt;path&gt; | put into destination &lt;bucket&gt; items in &lt;path&gt; recursively (if dir) |

## Configuration
Cirrus takes a JSON configuration file. By default, the script will look for config.json (but can be overriden with the -c &lt;path&gt; flag, with a relative path from the location of cirrus.js).

```json
{
    "awsConfig": {
	"accessKeyId": "yourPublicKeyHere",
	"secretAccessKey": "yourPrivateKeyHere",
	"region": "yourRegionHere"
    },
    "ec2": [

    ]
}
```

## TODOs
### full cloud
- --cloud-list
- --cloud-compare &lt;path&gt; path to existing compare, will compare with provided config
- --cloud-deploy
- --cloud-snapshot &lt;path&gt; path to store config

### ec2
- --ec2-list
- --ec2-stop
- --ec2-start
- --ec2-set-instance
- --ec2-attach-ebs
- --ec2-attach-elasticip
- --ec2-set-sg

### s3
- --s3-get

### elasticip
-  --elasticip-list
-  --elasticip-release
-  --elasticip-create

### ebs
-  --ebs-list