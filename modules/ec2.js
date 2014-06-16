var helper = require( './helper' );
var Table = require( 'cli-table' );

var ec2Utils = function( aws ) {
    this.ec2 = new aws.EC2();
};

ec2Utils.prototype = {
    list: function() {
        this.ec2.describeInstances( {}, function( err, data ) {
            if ( err ) return helper.err( err );
            
            var reservations = data.Reservations;
            
            if ( reservations.length === 0 ) return console.log( 'No EC2 instances.' );
            
            var table = new Table({
                head: ['ID', 'Tags', 'Type', 'State', 'Public IP', 'Key Name', 'Security Groups']
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
                table.push( [ins.InstanceId, tags.join( ',' ), ins.InstanceType, ins.State.Name, ins.PublicIpAddress, ins.KeyName, groups.join( ',' )] );
            });

            console.log( table.toString() );
        });
    }
};

module.exports = ec2Utils;