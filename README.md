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
| -b, --borders | show friendly bordered output for list table output |
| -c, --config &lt;path&gt; | path to config file relative to cirrus.js; defaults to config.json |
|   **S3 (Simple Storage Solution)**                              ||
| -h | help for S3 commands |
| ls | list all buckets |
| du &lt;bucket&gt; | disk usage for objects in a specified &lt;bucket&gt; |
| mkdir &lt;bucket&gt; | create &lt;bucket&gt; |
| rm &lt;bucket&gt; | remove &lt;bucket&gt;, prompts if not empty |
| scp &lt;path&gt; &lt;bucket&gt; | put items in &lt;path&gt; recursively (if dir) into destination &lt;bucket&gt; |
|   **EC2 (Elastic Cloud Compute)**                              ||
| -h | help for EC2 commands |
| ls &#91;-t, --types&#93; | list all instances &#91;lists instance types&#93; |
| create &lt;name&gt; &lt;ami&gt; &lt;type&gt; &lt;key&gt; | example: create foo ami-1624987f t1.micro MY_KEY |
| rename &lt;oldname&gt; &lt;newname&gt; | renames instance from &lt;oldname&gt; to &lt;newname&gt;, enforces uniqueness |
| stop &lt;instance&gt; | stop &lt;instance&gt; |
| start &lt;instance&gt; | start &lt;instance&gt; |
| terminate &lt;instance&gt; | terminate &lt;instance&gt; |
| setinstance &lt;instance&gt; &lt;type&gt; | sets &lt;instance&gt; to be specified &lt;type&gt; |
|   **EIP (Elastic IP)**                              ||
| -h | help for EIP commands |
| ls | list all Elastic IPs |
| allocate | request a new Elastic IP address |
| release &lt;ip&gt; | releases an Elastic IP allocation &lt;allocation id&gt; |
| associate &lt;ip&gt; &lt;instance&gt; | associates an Elastic IP &lt;ip&gt; with an &lt;instance&gt; |
| disassociate &lt;ip&gt; | disassociates an Elastic IP &lt;ip&gt; between an EIP allocation and and instance |
|   **EBS (Elastic Block Store)**                              ||
| -h | help for EBS commands |
| ls | list all EBS volumes |
|   **SG (Security Groups)**                              ||
| -h | help for SG commands |
| ls | list all Security Groups |

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
- specify sg on create

### ebs
- attach
- detach
- create snapshot
- create volume
- create volume from snapshot
- delete volume
- bundle steps to resize volume?
- rename (enforce uniqueness)


## Version 2
### sg
- setsg
- create sg?
- grant/revoke sg ingress/egress?
- delete sg?

### s3
- get contents
- rename
- copy bucket to another bucket

## all
- support multiple args for identifying entities (name, id, etc)