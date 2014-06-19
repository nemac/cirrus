var helper = require( './helper' );

var EBS = function( aws ) {
    this.ec2 = new aws.EC2();
};

EBS.prototype = {
    list: function( showBorders ) {
        this.ec2.describeVolumes( {}, function( err, data ) {
            if ( err ) return helper.err( err );
            
            var volumes = data.Volumes;
            
            if ( volumes.length === 0 ) return console.log( 'No EBS volumes');
            
	    var hasTags = false;
	    volumes.some( function( volume ) {
		return hasTags = volume.Tags.length > 1;
	    });

	    var head = ['Volume ID', 'Name', 'Size (GiB)', 'State', 'Attachment'];

	    if ( hasTags ) {
		head.splice( 2, 0, 'Tags' );
	    }

	    var table = helper.table( 
		head,
		showBorders );
            
            volumes.forEach( function( volume ) {
                var attachments = [];
                volume.Attachments.forEach( function( attachment ) {
		    attachments.push( attachment.InstanceId + ' -> ' + attachment.Device );
                });

		var name = '';
		var tags = [];

                volume.Tags.forEach( function( tag ) {
		    if ( tag.Key === 'Name' ) {
			name = tag.Value;
		    } else {
			tags.push( tag.Key + ': ' + tag.Value );
		    }              
                });

		var row = [
                    volume.VolumeId,
		    name,
                    volume.Size,
                    volume.State,
                    attachments.length > 0 ? attachments.join( ', ' ) : ''];

		if ( hasTags ) {
		    row.splice( 2, 0, tags.join( ', ' ) );
		}

                table.push( row );
            });

	    console.log( table.toString() );
            
        });
    }
};

module.exports = EBS;