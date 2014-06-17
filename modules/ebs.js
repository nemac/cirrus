var helper = require( './helper' );
var Table = require( 'cli-table' );

var EBS = function( aws ) {
    this.ec2 = new aws.EC2();
};

EBS.prototype = {
    list: function() {
        this.ec2.describeVolumes( {}, function( err, data ) {
            if ( err ) return helper.err( err );
            
            var volumes = data.Volumes;
            
            if ( volumes.length === 0 ) return console.log( 'No EBS volumes');
            
            var table = new Table({
                head: [
                    'Volume ID'.cyan,
                    'Size (GiB)'.cyan,
                    'State'.cyan,
                    'Attachments'.cyan,
                    'Encrypted'.cyan
                ]
            });
            
            volumes.forEach( function( volume ) {
                
                var attachments = [];
                volume.Attachments.forEach( function( attachment ) {
                    attachments.push( attachment.InstanceId + ' -> ' + attachment.Device );
                });
                
                table.push([
                    volume.VolumeId,
                    volume.Size,
                    volume.State,
                    attachments.join( ', ' ),
                    volume.Encrypted
                ]);
            });
            
            console.log( table.toString() );
        });
    }
};

module.exports = EBS;