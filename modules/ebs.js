var Q = require( 'q' );

var EBS = function( aws ) {
    this.ec2 = new aws.EC2();
};

EBS.prototype = {
    list: function() {
	var deferred = Q.defer();
        this.ec2.describeVolumes( {}, function( err, data ) {
            if ( err ) return deferred.reject( err );

	    var response = {
		message: ''
	    };

	    var volumes = data.Volumes;
            
	    if ( volumes.length === 0 ) {
		response.message =  'No EBS volumes';
		return deferred.resolve( response );
	    }

	    response.table = {
		head: [],
		rows: []
	    };

	    response.data = [];
            
	    var hasTags = false;
	    volumes.some( function( volume ) {
		return hasTags = volume.Tags.length > 1;
	    });

	    response.table.head = ['Volume ID', 'Name', 'Size (GiB)', 'State', 'Attachment'];

	    if ( hasTags ) {
		response.table.head.splice( 2, 0, 'Tags' );
	    }

            // TODO map instance name with instanceid
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
                    
		response.table.rows.push( row );
	    });

	    deferred.resolve( response );
	});

	return deferred.promise;
    }
};

module.exports = EBS;