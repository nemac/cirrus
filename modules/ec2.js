var helper = require( './helper' );
var Table = require( 'cli-table' );

var EC2 = function( aws ) {
    this.ec2 = new aws.EC2();
};

EC2.prototype = {
    list: function() {
        this.ec2.describeInstances( {}, function( err, data ) {
            if ( err ) return helper.err( err );
                        
            var reservations = data.Reservations;
            
            if ( reservations.length === 0 ) return console.log( 'No EC2 instances.' );
            
            var table = new Table({
                head: [
                    'ID'.cyan,
                    'Tags'.cyan,
                    'Type'.cyan,
                    'State'.cyan,
                    'Public IP'.cyan,
                    'Key Name'.cyan,
                    'Security Groups'.cyan
                ]
            });
            
            reservations.forEach( function( reservation ) {
                // TODO are there times when reservations have more than one instance?
                var ins = reservation.Instances[0];
                var groups = [];
                ins.SecurityGroups.forEach( function( sg ) {
                    groups.push( sg.GroupName );
                });
                
                var tags = [];
                ins.Tags.forEach( function( tag ) {
                    tags.push( tag.Key + ': ' + tag.Value );
                });
                                
                // TODO add EBS info?
                table.push([
                    ins.InstanceId, 
                    tags.join( ',' ), 
                    ins.InstanceType, 
                    ins.State.Name, 
                    ins.PublicIpAddress ? ins.PublicIpAddress : '', 
                    ins.KeyName, 
                    groups.join( ',' ) 
                ]);
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