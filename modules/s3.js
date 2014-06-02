var colors = require( 'colors' );

var s3Utils = function ( aws ) {
    this.s3 = new aws.S3();
};

s3Utils.prototype = {
    list: function() {
        this.s3.listBuckets( function( err, data ){
            if ( err ) {
                console.log( err );
                return;
            }
                
            data.Buckets.forEach( function( bucket ) {
                console.log( bucket.Name );
            });
        });
    },
    du : function( bucket, dir ) {
        
        var params = {
            Bucket: bucket,
            MaxKeys: 1000000000 // todo test if this truly overrides, or if the services maxes at 1k
        };
        
        this.s3.listObjects( params, function( err, data ) {
            if ( err ) {
                console.log( err );
                return;
            }
            
            if ( data.IsTruncated ) {
                console.log( 'WARNING!'.yellow + ' Only the first ' + data.MaxKeys + ' objects were scanned' );
            } else {
                console.log( 'Total objects in ' + bucket + ': ' + data.Contents.length );
            }
            
            var size = 0;
            
            data.Contents.forEach( function( content ) {
                size += content.Size;
            });
            
            console.log( 'Total size: ' + size + ' bytes' );
        });
    }
};

module.exports = s3Utils;