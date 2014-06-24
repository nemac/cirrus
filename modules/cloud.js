var Q = require( 'q' );
var EC2 = require( './ec2' );
var EIP = require( './eip' );

var Cloud = function( aws, config ) {
    this.aws = aws;
    this.config = config;
    this.ec2Util = new EC2( aws );
    this.eipUtil = new EIP( aws );
};

Cloud.prototype = {
    describe: function() {
	var infrastructure = {
	    ec2: [],
	    eip: [],
	    ebs: []
	};

	Q.allSettled([
	    this.ec2Util.list(),
	    this.eipUtil.list()
	]).then( function( responses ) {
	    infrastructure.ec2 = responses[0].value.data;
	    infrastructure.eip = responses[1].value.data;
	    console.log( JSON.stringify( infrastructure, null, 4 ) );
	    process.exit();
	});
    }
};

module.exports = Cloud;