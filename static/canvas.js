
var g_canvas = null;
$(function(){
    var _canvas  = $('#canvasContainer canvas');
    var _context = _canvas[0].getContext( '2d' );
    var _width   = _canvas.width();
    var _height  = _canvas.height();
    var _self = {
        canvas  : _canvas,
        context : _context
    };
    
    _self.clear = function(){
        _context.clearRect( 0, 0, _width, _height );
    };
    
    g_canvas = _self;
});

