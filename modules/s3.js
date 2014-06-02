var colors = require( 'colors' );
var helper = require( './helper' );
var questions = require( 'questions' );
var progress = require( 'progress' );

var maxKeys = 1000000000;

var s3Utils = function ( aws ) {
    this.s3 = new aws.S3();
};

s3Utils.prototype = {
    list: function() {
        this.s3.listBuckets( function( err, data ){
            if ( helper.err( err ) ) return;
            
            data.Buckets.forEach( function( bucket ) {
                console.log( bucket.Name );
            });
        });
    },
    du : function( bucket, dir ) {
        var params = {
            Bucket: bucket,
            MaxKeys: maxKeys // todo test if this truly overrides, or if the services maxes at 1k
        };
        
        this.s3.listObjects( params, function( err, data ) {
            if ( helper.err( err ) ) return;

            if ( data.IsTruncated ) {
                console.log( 'WARNING\n'.yellow + 'Only the first %s objects were scanned', data.MaxKeys );
            } else {
                console.log( 'Total objects in %s: %s', bucket, data.Contents.length );
            }
            
            var size = 0;
            
            data.Contents.forEach( function( content ) {
                size += content.Size;
            });
            
            console.log( 'Total size: ' + size + ' bytes' );
        });
    },
    create: function( bucket ) {
        var params = {
            Bucket: bucket
        };
        
        this.s3.createBucket(params, function( err, data ) {
            if ( helper.err( err ) ) return;
        });
    },
    remove: function( bucket ) {
        var params = {
            Bucket: bucket
        };
        
        var t = this;
        
        this.s3.deleteBucket(params, function( err, data ) {
            if ( err ) {
                if ( err.code === 'BucketNotEmpty' ) {
                    t.empty( bucket );
                } else {
                    helper.err( err );
                }
            }
        });
    },
    empty: function( bucket ) {
        var question = {
            info: 'WARNING\n'.yellow + 'This will delete the bucket and all contents, are you sure? \nType "yes" to continue the operation'
        };
        
        var t = this;
        
        questions.askOne(question, function( resp ) {
            if ( resp !== 'yes' ) {
                console.log( 'Remove canceled'.green );
                return;
            }
            
            emptyBucket( t, bucket, 0 );
        });
    }
 };

function emptyBucket( t, bucket, count ) {
    var params = {
        Bucket: bucket,
        MaxKeys: maxKeys
    };
        
    t.s3.listObjects( params, function( err, data ) {
        if ( helper.err( err ) ) return;
                
        var objParams = {
            Bucket: bucket,
            Key: ''
        };
                
        console.log();
        var bar = new progress( '  deleting [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: data.Contents.length
        });
                
        for ( var i = 0; i < data.Contents.length; i++ ) {
            objParams.Key = data.Contents[i].Key;
                    
            try {
                t.s3.deleteObject( objParams, function( err ) {
                    if ( err ) throw err;
                });
            } catch ( e ) {
                helper.err( e );
                break;
            }
            
            bar.tick( 1 );
            count++;
        }
        
        // recurse if there's more data
        if ( data.IsTruncated ) {
            emptyBucket( t, bucket, count );
        } else {
            t.remove( bucket );
            console.log();
            console.log( '%s items deleted, %s removed'.green, count, bucket );
        }
    });
}

module.exports = s3Utils;