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
| -c, --cloud &lt;path&gt; | path to full cloud config file relative to cirrus.js; defaults to cloud.json |
| -k, --keys &lt;path&gt; | path to keys file relative to cirrus.js; defaults to aws.json |
|   **s3 (Simple Storage Solution)**                              ||
| -h | help for S3 commands |
| ls | list all buckets |
| du &lt;bucket&gt; | disk usage for objects in a specified &lt;bucket&gt; |
| mkdir &lt;bucket&gt; | create &lt;bucket&gt; |
| rm &lt;bucket&gt; | remove &lt;bucket&gt;, prompts if not empty |
| scp &lt;path&gt; &lt;bucket&gt; | put items in &lt;path&gt; recursively (if dir) into destination &lt;bucket&gt; |
|   **ec2 (Elastic Cloud Compute)**                              ||
| -h | help for EC2 commands |
| ls &#91;-t, --types&#93; | list all instances &#91;lists instance types&#93; |
| create &lt;name&gt; &lt;ami&gt; &lt;type&gt; &lt;key&gt; | example: create foo ami-1624987f t1.micro MY_KEY |
| rename &lt;oldname&gt; &lt;newname&gt; | renames instance from &lt;oldname&gt; to &lt;newname&gt;, enforces uniqueness |
| stop &lt;instance&gt; | stop &lt;instance&gt; |
| start &lt;instance&gt; | start &lt;instance&gt; |
| terminate &lt;instance&gt; | terminate &lt;instance&gt; |
| setinstance &lt;instance&gt; &lt;type&gt; | sets &lt;instance&gt; to be specified &lt;type&gt; |
|   **eip (Elastic IP)**                              ||
| -h | help for EIP commands |
| ls | list all Elastic IPs |
| allocate | request a new Elastic IP address |
| release &lt;ip&gt; | releases an Elastic IP allocation &lt;allocation id&gt; |
| associate &lt;ip&gt; &lt;instance&gt; | associates an Elastic IP &lt;ip&gt; with an &lt;instance&gt; |
| disassociate &lt;ip&gt; | disassociates an Elastic IP &lt;ip&gt; between an EIP allocation and and instance |
|   **ebs (Elastic Block Store)**                              ||
| -h | help for EBS commands |
| ls &#91;--filter&#93; | list all ebs volumes &#91;filter by Key=Value&#93;, example: ls --filter Foo=bar |
| create &lt;name&gt; &lt;size&gt; &lt;snapshot&gt; | example: create foo 8 snap-b047276d |
| rename &lt;oldname&gt; &lt;newname&gt; | renames volume from &lt;oldname&gt; to &lt;newname&gt;, enforces uniqueness |
| name &lt;id&gt; &lt;newname&gt; | names a volume &lt;id&gt; to &lt;newname&gt;, enforces uniqueness, used for existing or generated volumes that are nameless |
| attach &lt;volume&gt; &lt;instance&gt; &lt;device&gt; | attach a &lt;volume&gt; to &lt;instance&gt; as &lt;device&gt; |
| detach &lt;volume&gt; | detatches &lt;volume&gt; from any instances it is attached to |
| rm &lt;volume&gt; | removes (deletes) &lt;volume&gt; |
| listss &#91;--filter&#93; | list all snapshots &#91;filter by Key=Value&#93;, example: listss --filter Foo=bar |
| ss &lt;volume&gt; | creates a snapshot of &lt;volume&gt; |
| deletess &lt;snapshot-id&gt; | deletes snapshot with &lt;snapshot-id&gt; |
|   **sg (Security Groups)**                              ||
| -h | help for SG commands |
| ls | list all Security Groups |
|   **cloud (Full cloud infrastructure)**                              ||
| -h | help for Cloud commands |
| describe &#91;-o &lt;file&gt;, --output-file &lt;file&gt;&#93; | describes an entire cloud [writes out to specified &lt;file&gt;]  |
| diff &lt;file&gt; | compares your cloud to a configuration &lt;file&gt;; the comparison is one directional as in it will not report on what is in your cloud that is not in the configuration |

## Configuration
Cirrus requires a JSON file containing the keys for AWS API access.  Cirrus first checks to see if the
`-k / --keys` option is given, and if so uses the value specified with that option as the name
(including the path) of the JSON file.  It then checks the value of the
`CIRRUS_AWS_KEYS` environment variable.  If neither the command line option nor the environment
variable are set, it looks for a file named `aws.json` in the current directory.  Regardless of
the name of the file, its contents should be formatted like so:
```json
{
    "accessKeyId": "yourPublicKeyHere",
    "secretAccessKey": "yourPrivateKeyHere",
    "region": "yourRegionHere"
}
```
## Environment Variables

Cirrus optionally makes use of several environment variables:

* `CIRRUS_AWS_KEYS` is the path of a json file containing AWS API keys, in the format described above
* `CIRRUS_PEM` is the path of a .pem file containing the private part of an ssh key pair used for
  root access to the servers
* `CIRRUS_KEYS` is the path to a directory containing possibly several .pem files; if
  `CIRRUS_PEM` is not set, cirrus will look in the `CIRRUS_KEYS` directory for a .pem file
  named according to the key name associated with the EC2 metadata for each server.

Note that having the `CIRRUS_PEM` environment variable set will cause cirrus to use the
given .pem file for access to ALL servers, ignoring any key name settings returned by EC2
with the server metadata.  This will also be reflected in the listing reports generated by
cirrus -- the value that cirrus displays in the "Key Name" column will be the value
of the `CIRRUS_PEM` environment variable.


## TODOs
### full cloud
- cloud deploy

### ebs
- list snapshots
- delete snapshot
- create snapshot


## Version 2
### cloud
- diff to do negative comparison (what's in cloud but not in config?)
- expose config validation
- intelligent eip handling

### sg
- setsg
- create sg?
- grant/revoke sg ingress/egress?
- delete sg?

### s3
- use promises
- get contents
- rename
- copy bucket to another bucket

### ec2
- specify multiple sgs on create

### ebs
- bundle steps to resize volume?
- attachment resolve ec2 name

### all
- support multiple args for identifying entities (name, id, etc)


## Backup operations

- Delete snapshot
- Build in monitoring capability (send email if error)
