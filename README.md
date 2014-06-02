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
| -c, --config <path> | path to config file relative to cirrus.js; defaults to config.json |
| **S3** ||
| --s3-list | list all buckets |
| --s3-disk-use <bucket> | disk usage for objects in a specified bucket <bucket> |
| --s3-create <bucket> | create bucket with name <bucket> |
| --s3-remove <bucket> | remove bucket with name <bucket>, prompts if not empty |

## Configuration
Cirrus takes a JSON configuration file. By default, the script will look for config.json (but can be overriden with the -c <path> flag, with a relative path from the location of cirrus.js).

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
- --cloud-compare <path> path to existing compare, will compare with provided config
- --cloud-deploy
- --cloud-snapshot <path> path to store config

### ec2
- --ec2-list
- --ec2-stop
- --ec2-start
- --ec2-set-instance
- --ec2-attach-ebs
- --ec2-attach-elasticip
- --ec2-set-sg

### s3
- --s3-put
- --s3-get

### elasticip
-  --elasticip-list
-  --elasticip-release
-  --elasticip-create

### ebs
-  --ebs-list