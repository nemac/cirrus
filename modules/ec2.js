var helper = require( './helper' );

var EC2 = function( aws ) {
    this.ec2 = new aws.EC2();
};

EC2.prototype = {
    list: function( showBorders ) {
        this.ec2.describeInstances( {}, function( err, data ) {
            if ( err ) return helper.err( err );

            var reservations = data.Reservations;
            
            if ( reservations.length === 0 ) return console.log( 'No EC2 instances.' );

	    // check if tags other than name
	    var hasTags = false;
	    reservations.some( function( reservation ) {
		return hasTags = reservation.Instances[0].Tags.length > 1;
	    });

	    var head = ['ID', 'Name', 'Type', 'State', 'Public IP', 'Key Name', 'Security Groups'];

	    if ( hasTags ) {
		head.splice( 2, 0, 'Tags' );
	    }

	    var table = helper.table(
		head,
		showBorders
	    );
            
            reservations.forEach( function( reservation ) {
                // TODO are there times when reservations have more than one instance?
                var ins = reservation.Instances[0];
                var groups = [];
                ins.SecurityGroups.forEach( function( sg ) {
                    groups.push( sg.GroupName );
                });
                
		var name = '';
                var tags = [];
                ins.Tags.forEach( function( tag ) {
		    if ( tag.Key === 'Name' ) {
			name = tag.Value;
		    } else {
			tags.push( tag.Key + ': ' + tag.Value );
		    }              
                });

		var row = [
                    ins.InstanceId,
		    name,
                    ins.InstanceType,
                    ins.State.Name,
                    ins.PublicIpAddress ? ins.PublicIpAddress : '',
                    ins.KeyName,
                    groups.join( ', ' ) ];
                                
                // TODO add EBS info?

		if ( hasTags ) {
		    row.splice( 2, 0, tags.join( ', ' ) );
		}
		
                table.push( row );
            });

            console.log( table.toString() );
        });
    },
    stop: function( instance, dryRun ) {
        var params = {
            InstanceIds: [ instance ],
            DryRun: dryRun
        };
        
        this.ec2.stopInstances( params, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    },
    start: function( instance, dryRun ) {
        var params = {
            InstanceIds: [instance],
            DryRun: dryRun
        };
        
        this.ec2.startInstances( params, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    },
    terminate: function( instance, dryRun ) {
        var params = {
            InstanceIds: [instance],
            DryRun: dryRun
        };
        
        this.ec2.terminateInstances( params, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    },
    setInstance: function( instance, type, dryRun ) {
        var params = {
            InstanceId: instance,
            DryRun: dryRun,
            InstanceType: {
                Value: type
            }
        };
        
        this.ec2.modifyInstanceAttribute( params, function( err, data ) {
            if ( err ) return helper.err( err );
        });
    }
};

module.exports = EC2;