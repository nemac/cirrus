#!/usr/bin/env node

var aws = require( 'aws-sdk' );
var ArgumentParser = require( 'argparse' ).ArgumentParser;
var helper = require( './modules/helper' );
var Q = require( 'q' );

// command-line interface
var parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'Utilities for AWS cloud management'  });

// common
parser.addArgument( ['-k', '--keys'], {
    help: 'path to keys file relative to app.js; defaults to ./aws.json',
    nargs: 1,
    metavar: '<path>' });

parser.addArgument( ['-b', '--borders'], {
    help: 'show borders when displaying list output',
    action: 'storeTrue'
});

var subParsers = parser.addSubparsers({
    title: 'subCommands',
    dest: 'subCommandName' });

// s3 args
var s3Parser = subParsers.addParser( 's3', { addHelp: true });

var s3Sub = s3Parser.addSubparsers({
    title: 'S3 (Simple Storage Solution) Subcommands',
    dest: 's3SubCommandName' });

s3Sub.addParser( 'ls', {
    addHelp: true,
    help: 'list all buckets' });

s3Sub.addParser( 'du', {
    addHelp: true,
    help: 'disk usage for objects in a specified bucket' })
.addArgument( ['bucket'], { metavar: '<bucket>' });

s3Sub.addParser( 'mkdir', {
    addHelp: true,
    help: 'create bucket' })
.addArgument( ['bucket'], { metavar: '<bucket>' } );

s3Sub.addParser( 'rm', {
    addHelp: true,
    help: 'remove <bucket>, prompts if not empty' })
.addArgument( ['bucket'], { metavar: '<bucket>' });

var s3scp = s3Sub.addParser( 'scp', {
    addHelp: true,
    help: 'copies contents from source into destination bucket' });
s3scp.addArgument( ['source'], { metavar: '<source>' } );
s3scp.addArgument( ['destination'], { metavar: '<bucket>'} );

// TODO add cp later
/*
var s3cp = s3Sub.addParser( 'cp', {
    addHelp: true,
    help: 'copies source bucket into destination bucket' });
s3cp.addArgument( ['source'], { metavar: '<source>' } );
s3cp.addArgument( ['destination'], { metavar: '<bucket>' } );
*/

// ec2 args
var ec2Parser = subParsers.addParser( 'ec2', { addHelp: true } );

var ec2Sub = ec2Parser.addSubparsers({
    title: 'EC2 (Elastic Cloud Compute) Subcommands',
    dest: 'ec2SubCommandName' });

ec2Sub.addParser( 'ls', {
    addHelp: true,
    help: 'list all instances' })
.addArgument( ['-t, --types'], {
    help: 'list available instance types',
    action: 'storeTrue',
    dest: 'types' });

var ec2Create = ec2Sub.addParser( 'create', {
    addHelp: true,
    help: 'create instance' });
ec2Create.addArgument( ['name'], { metavar: '<name>' });
ec2Create.addArgument( ['ami'], { metavar: '<ami>' });
ec2Create.addArgument( ['type'], { metavar: '<type>' });
ec2Create.addArgument( ['key'], { metavar: '<key>' });
ec2Create.addArgument( ['group'], { metavar: '<group>' }); // TODO support multiple

var ec2Rename = ec2Sub.addParser( 'rename', {
    addHelp: true,
    help: 'rename instance' });
ec2Rename.addArgument( ['oldname'], { metavar: '<oldname>' });
ec2Rename.addArgument( ['newname'], { metavar: '<newname>' });

ec2Sub.addParser( 'stop', {
    addHelp: true,
    help: 'stops a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

ec2Sub.addParser( 'start', {
    addHelp: true,
    help: 'starts a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

ec2Sub.addParser( 'terminate', {
    addHelp: true,
    help: 'terminates a specified instance' })
.addArgument( ['instance'], { metavar: '<instance>' });

var ec2SetInstance = ec2Sub.addParser( 'setinstance', {
    addHelp: true,
    help: 'set the instance type for a specified instance' });
ec2SetInstance.addArgument( ['instance'], { metavar: '<instance>' });
ec2SetInstance.addArgument( ['type'], { metavar: '<type>' });

// elastic ip args
var eipParser = subParsers.addParser( 'eip', { addHelp: true } );

var eipSub = eipParser.addSubparsers({
    title: 'EIP (Elastic IP) Subcommands',
    dest: 'eipSubCommandName' });

eipSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all Elastic IP addresses' });

eipSub.addParser( 'allocate', {
    addHelp: true,
    help: 'creates a new Elastic IP address' });

eipSub.addParser( 'release', {
    addHelp: true,
    help: 'release Elastic IP address' })
.addArgument( ['allocationId'], { metavar: '<allocation id>' });

var eipAssociate = eipSub.addParser( 'associate', {
    addHelp: true,
    help: 'associates Elastic IP with instance' });
eipAssociate.addArgument( ['allocationId'], { metavar: '<allocation id>' } );
eipAssociate.addArgument( ['instance'], { metavar: '<instance>' } );

eipSub.addParser( 'disassociate', {
    addHelp: true,
    help: 'disassocates Elastic IP address from an instance' })
.addArgument( ['associationId'], { metavar: '<association id>' });

// ebs args
var ebsParser = subParsers.addParser( 'ebs', { addHelp: true } );

var ebsSub = ebsParser.addSubparsers({
    title: 'EBS (Elastic Block Store) Subcommands',
    dest: 'ebsSubCommandName' });

ebsSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all instances' });

var ebsCreate = ebsSub.addParser( 'create', {
    addHelp: true,
    help: 'create instance' });
ebsCreate.addArgument( ['name'], { metavar: '<name>' });
ebsCreate.addArgument( ['size'], { metavar: '<size>' });
ebsCreate.addArgument( ['snapshot'], { metavar: '<snapshot>' });

var ebsName = ebsSub.addParser( 'name', {
    addHelp: true,
    help: 'rename volume' });
ebsName.addArgument( ['id'], { metavar: '<id>' });
ebsName.addArgument( ['name'], { metavar: '<name>' });

var ebsRename = ebsSub.addParser( 'rename', {
    addHelp: true,
    help: 'rename volume' });
ebsRename.addArgument( ['oldname'], { metavar: '<oldname>' });
ebsRename.addArgument( ['newname'], { metavar: '<newname>' });

var ebsAttach = ebsSub.addParser( 'attach', {
    addHelp: true,
    help: 'attach volume to an instance as a specified device' });
ebsAttach.addArgument( ['volume'], { metavar: '<volume>' });
ebsAttach.addArgument( ['instance'], { metavar: '<instance>' });
ebsAttach.addArgument( ['device'], { metavar: '<device>' });

ebsSub.addParser( 'detach', {
    addHelp: true,
    help: 'detach volume from any instances it is attached to' })
.addArgument( ['volume'], { metavar: '<volume>' });

ebsSub.addParser( 'rm', {
    addHelp: true,
    help: 'remove (delete) volume' })
.addArgument( ['volume'], { metavar: '<volume>' });

// sg args
var sgParser = subParsers.addParser( 'sg', { addHelp: true } );

var sgSub = sgParser.addSubparsers({
    title: 'SG (Security Groups) Subcommands',
    dest: 'sgSubCommandName' });

sgSub.addParser( 'ls', {
    addHelp: true,
    help: 'list all security groups' });

// cloud args
var cloudParser = subParsers.addParser( 'cloud', { addHelp: true } );

var cloudSub = cloudParser.addSubparsers({
    title: 'Full Cloud Subcommands',
    dest: 'cloudSubCommandName' });

var cloudDescribe = cloudSub.addParser( 'describe', {
    addHelp: true,
    help: 'describe an existing cloud infrastructure' });

cloudDescribe.addArgument( ['-o', '--output-file'], {
    help: 'file to write out cloud description file',
    nargs: 1,
    metavar: '<filename>' });

cloudSub.addParser( 'diff', {
    addHelp: true,
    help: 'compare current cloud infrastructure with specified config file' })
.addArgument( ['config'], { metavar: '<config>' });

var args = parser.parseArgs();

// load keys from command-line arg, failover to aws.json; will look relative to THIS
var keys = require( args.keys ? __dirname + '/' + args.keys[0] : __dirname + '/aws.json' );
aws.config.update( keys );

var showBorders = args.borders;

var promise;

switch( args.subCommandName ) {
case 's3':
    var S3 = require( './modules/s3' );
    var s3 = new S3( aws );

    switch( args.s3SubCommandName ) {
    case 'ls':
	s3.list();
	break;
    case 'du':
	s3.du( args.bucket );
	break;
    case 'mkdir':
	s3.create( args.bucket );
	break;
    case 'rm':
	s3.remove( args.bucket );
	break;
    case 'scp':
  	s3.put( args.source, args.destination);
	break;
    case 'cp':
	console.log( 'cp' );
    	break;
    }

    break;

case 'ec2':
    var EC2 = require( './modules/ec2' );
    var ec2 = new EC2( aws );
    
    switch( args.ec2SubCommandName ) {
    case 'ls':
        if ( args.types ) {

	    helper.printTable({
		head: ['Family', 'Types'],
		rows: [
		    [
			'General purpose', 
			'm1.small, m1.medium, m1.large, m1.xlarge, m3.medium, \nm3.large, m3.xlarge, m3.2xlarge'
		    ], [
			'Compute optimized',
			'c1.medium, c1.xlarge, c3.large, c3.xlarge, c3.2xlarge, \nc3.4xlarge, c3.8xlarge, cc2.8xlarge'
		    ],[
			'Memory optimized', 
			'm2.xlarge, m2.2xlarge, m2.4xlarge, r3.large, r3.xlarge, \nr3.2xlarge, r3.4xlarge, r3.8xlarge, cr1.8xlarge'
		    ],[
			'Storage optimized', 
			'hi1.4xlarge, hs1.8xlarge, i2.xlarge, i2.2xlarge, \ni2.4xlarge, i2.8xlarge'
		    ],[
			'Micro instances',
			't1.micro'
		    ],[
			'GPU instances',
			'cg1.4xlarge, g2.2xlarge'
		    ]]
	    }, showBorders);

	} else {
            promise = ec2.list();
	}
        break;
    case 'create':
        promise = ec2.create({ 
	    name: args.name, 
	    image: args.ami, 
	    type: args.type, 
	    key: args.key,
	    groups: [args.groups] });
        break;
    case 'rename':
        promise = ec2.rename( args.oldname, args.newname );
        break;
    case 'stop':
        promise = ec2.stop( args.instance );
        break;
    case 'start':
        promise = ec2.start( args.instance );
        break;
    case 'terminate':
        promise = ec2.terminate( args.instance);
        break;
    case 'setinstance':
        promise = ec2.setInstance( args.instance, args.type );
        break;
    }
    
    break;

case 'eip':
    var EIP = require( './modules/eip' );
    var eip = new EIP( aws );
    
    switch( args.eipSubCommandName ) {
    case 'ls':
        promise = eip.list();
        break;
    case 'allocate':
        promise = eip.allocate();
        break;
    case 'release':
        promise = eip.release( args.allocationId );
        break;
    case 'associate':
        promise = eip.associate( args.allocationId, args.instance );
        break;
    case 'disassociate':
        promise = eip.disassociate( args.associationId );
        break;
    }
    
    break;

case 'ebs':
    var EBS = require( './modules/ebs' );
    var ebs = new EBS( aws );
    
    switch( args.ebsSubCommandName ) {
    case 'ls':
        promise = ebs.list();
        break;
    case 'create':
	promise = ebs.create({
	    name: args.name,
	    size: args.size,
	    image: args.snapshot
	});
	break;
    case 'rename':
        promise = ebs.rename( args.oldname, args.newname );
        break;
    case 'name':
	promise = ebs.name( args.id, args.name );
	break;
    case 'rm':
	promise = ebs.remove( args.volume );
	break;
    case 'attach':
	promise = ebs.attach( args.volume, args.instance, args.device );
	break
    case 'detach':
	promise = ebs.detach( args.volume );
	break
    }
    
    break;

case 'sg':
    var SG = require( './modules/sg' );
    var sg = new SG( aws );
    
    switch( args.sgSubCommandName ) {
    case 'ls':
        promise = sg.list();
        break;
    }
    
    break;

case 'cloud':
    var Cloud = require( './modules/cloud' );
    var cloud = new Cloud( aws );

    switch( args.cloudSubCommandName ) {
    case 'describe':
	var cloudArg = args.output_file ? __dirname + '/' + args.output_file[0] : null
	promise = cloud.describe( cloudArg );
	break;
    case 'diff':
	try {
	    var config = require( __dirname + '/' + args.config );
	    promise = cloud.diff( config );
	} catch ( e ) {
	    console.log( e );
	    process.exit( 1 );
	}	
	break;
    }

    break;

default:
    console.log( parser.printHelp() );
    process.exit();
}

// resolve deferreds, exit program
if ( promise ) {
    promise.then( function( data ) {
	if ( typeof data !== 'undefined' && data !== null ) {
	    if ( data.hasOwnProperty( 'table' ) && data.table !== null ) {
		helper.printTable( data.table, showBorders );
	    } else if ( data.hasOwnProperty( 'message' ) && data.message !== null ) {
		console.log( data.message );
	    }
	}

	process.exit();
    }).fail( function( err ) {
	helper.err ( err );
	process.exit( 1 );
    });
}
