
var g_canvas = null;
$(function(){
    var _canvas  = $('#canvasContainer canvas');
    var _context = _canvas[0].getContext( '2d' );
    var _CRC2D   = _context.constructor.prototype;
    var _width   = _canvas.width();
    var _height  = _canvas.height();
    var _self = {
        canvas  : _canvas,
        context : _context,
        width   : _width,
        height  : _height
    };
    
    _self.clear = function(){
        _context.clearRect( 0, 0, _width, _height );
    };
    
    _self.drawRect = function( width, height, center, style ){
        _self.drawShape( [
            [ width, 0      ], // Top    right
            [ width, height ], // Bottom right
            [ 0    , height ], // Bottom left
            [ 0    , 0      ]  // Top    left
        ], center, style );
    };
    
    _self.drawShape = function( shape, center, style ){
        // Set a default center and style.
        if( !$.isArray( center ) ){
            center = [ 0, 0 ];
        }
        style = $.extend({
            type  : 'stroke',
            style : 'black'
        }, style );
        
        // Save our current position, move to our new one, and start the path.
        _context.save();
        _context.beginPath();
        _CRC2D.translate.apply( _context, center );
        
        // Loop through the shape and draw lines around it.
        for( var i in shape ){
            _CRC2D.lineTo.apply( _context, shape[i] );
        }
        
        // The shape is done, close the path, apply the style, and restore the
        // old canvas condition.
        _context.closePath();
        _context[ style.type + 'Style' ] = style.style;
        _context[ style.type ]();
        _context.restore();
    };
    
    g_canvas = _self;
});

