
// Declare global variables and imported classes.
var Resolver = Resolver || null;
var Genome   = Genome   || null;
var g_canvas = g_canvas || null;
var g_maze = null;

$(function(){
    // The maze is just an array of integers.
    //  1 - A wall.
    //  0 - An open area.
    //  S - The start.
    //  E - The end
    var S = 2;
    var E = 3;
    var maze = [
        //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ], // 0
        [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1 ], // 1
        [ E, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1 ], // 2
        [ 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1 ], // 3
        [ 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1 ], // 4
        [ 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1 ], // 5
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1 ], // 6
        [ 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, S ], // 7
        [ 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1 ], // 8
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]  // 9
    ];
    
    // Calculate a few constant values used for rendering.
    var self    = {
        width  : maze[0].length,
        height : maze.length,
        tile   : [ 'B', 'W', 'S', 'E' ]
    };
    var pixelPadding = 1;
    var pixelWidth   = Math.floor( g_canvas.width  / self.width  ) - pixelPadding;
    var pixelHeight  = Math.floor( g_canvas.height / self.height ) - pixelPadding;

    // Find the start and end locations
    var start = null;
    var end   = null;
    for( var y in maze ){
        var row = maze[y];
        for( var x in row ){
            var cell = row[x];
            if( cell == S ){
                start = [ x, y ];
            }
            if( cell == E ){
                end = [ x, y ];
            }
            if( start && end ){
                break;
            }
        }
        if( start && end ){
            break;
        }
    }
    self.start = start;
    self.end   = end;

    /// Draws the maze onto the global canvas surface.
    self.render = function(){
        // All tiles are drawn filled in, just the color is different.
        var style = {
            type : 'fill'
        };
        
        // Loop through the whole maze construct.
        for( var y in maze ){
            var row = maze[y];
            for( var x in row ){
                var cell = self.tile[ row[x] ];

                // A wall
                if( cell == 'W' ){
                    style.style = 'black';
                }
                
                // A blank square
                else if( cell == 'B' ){
                    style.style = 'white';
                }
                
                // Either the exit or enterance.
                else {
                    style.style = 'red';
                }
                
                // Now draw the tile.
                this.drawTile( [ x, y ], style );
            }
        }
    };
    
    self.drawTile = function( tile, style ){
        var vertOffset = tile[1] * (pixelHeight + pixelPadding);
        var horzOffset = tile[0] * (pixelWidth  + pixelPadding);
        g_canvas.drawRect( pixelWidth, pixelHeight, [ horzOffset, vertOffset ], style );
    };
    
    /// Fetches the tile type for the specified coordinates.
    self.getTile = function( x, y ){
        return self.tile[ maze[y][x] ];
    };

    g_maze = self;
});

/// A genome.
///
/// Each chromosome in this genome is either a 1 or a 0. Each gene is made of
/// two chromosomes which give 4 possible combinations. They are read as follows:
///  - 00 : North
///  - 01 : East
///  - 10 : South
///  - 11 : West
var PathFinderGenome = (function(){
    var directions = [ 'n', 'e', 's', 'w' ];

    /// Constructor.
    ///
    /// This has one parameter which can be either a Genome to copy or an
    /// integer indicating the length of a random Genome to construct. If no
    /// parameter is proved an empty Genome is constructed.
    ///
    /// @param {Genome} arg A Genome to clone.
    /// @param {Number} arg The length of a Genome to randomly generate.
    function PathFinderGenome( arg ){
        this._super( arg );
    }
    PathFinderGenome.prototype = new Genome();
    var PathFinderGenomeProto = PathFinderGenome.prototype;
    PathFinderGenomeProto.constructor = PathFinderGenome;
    PathFinderGenomeProto._super      = Genome;

    PathFinderGenomeProto._generateGene = function(){
        return Math.floor( Math.random() * 2 );
    };

    PathFinderGenomeProto._mutate = function( gene ){
        return gene ^ 1;
    };

    PathFinderGenomeProto._crossOver = function( dad, litter ){
        var crossPoint = Math.floor( Math.random() * this._genes.length );
        crossPoint -= (crossPoint % this._geneSize);
        
        // Copy the genes over, crossing over at the point decided above.
        var push = Array.prototype.push;
        push.apply( litter[0]._genes, this._genes.slice( 0, crossPoint ) );
        push.apply( litter[1]._genes,  dad._genes.slice( 0, crossPoint ) );
        push.apply( litter[0]._genes,  dad._genes.slice( crossPoint    ) );
        push.apply( litter[1]._genes, this._genes.slice( crossPoint    ) );
    };
    
    PathFinderGenomeProto._calculateFitness = function(){
        // Run this path through the maze.
        var route    = this.getRoute();
        var cellType = null;
        while( (cellType = route.step()) !== null && cellType != 'E' ){}
        
        // Calculate the route's fitness.
        var position = route.getPosition();
        var end      = g_maze.end;
        var distance = [ Math.abs( position[0] - end[0] ), Math.abs( position[1] - end[1] ) ];
        return 1.0 / ( distance[0] + distance[1] + 1 );
    };

    /// Translates this Genome's genes into a route to follow through the maze.
    ///
    /// @this {Genome}
    ///
    /// @return {Array<String>} An array of cardinal directions to take.
    PathFinderGenomeProto.getRoute = function(){
        var route = [];
        for( var i = 0; i < this._genes.length; i += this._geneSize ){
            var geneHigh = this._genes[i];
            var geneLow  = this._genes[i + 1];
            var move = (geneHigh << 1) ^ geneLow;
            route.push( directions[ move ] );
        }
        return new Route( route );
    };
    
    function Route( route ){
        this._route    = route;
        this._step     = 0;
        this._position = g_maze.start.concat([]);
    }
    var RouteProto = Route.prototype;
    
    RouteProto.step = function(){
        if( this._step >= this._route.length ){
            return null;
        }
        var nextPosition = null;
        var nextCell     = null;
        do {
            // Adjust our position according to the move we are going to make.
            var move = this._route[ this._step++ ];
            nextPosition = this._position.concat([]);
            if( move == 'n' ){
                ++nextPosition[1];
            }
            else if( move == 'e' ){
                ++nextPosition[0];
            }
            else if( move == 's' ){
                --nextPosition[1];
            }
            else {
                --nextPosition[0];
            }
            
            // Only take the next step if it is blank or the end of the maze.
            nextCell = g_maze.getTile.apply( g_maze, nextPosition );
        } while( !(nextCell == 'B' || nextCell == 'E') && this._step < this._route.length );
        this._position = nextPosition;
        return nextCell;
    };
    
    RouteProto.getPosition = function(){
        return this._position;
    };

    /// Draws this genome's path on through the maze.
    PathFinderGenomeProto.render = function(){
        // Redraw the map to clear any previous runs.
        g_maze.render();

        // Step through the route and draw each of the tiles as grey.
        var route    = this.getRoute();
        var tileType = null;
        var style    = { type : 'fill', style : 'grey' };
        while( (tileType = route.step()) !== null && tileType !== 'E' ){
            var cell = route.getPosition();
            g_maze.drawTile( cell, style );
        }
        
        // Redraw the final tile as purple so we can see where we ended up.
        style.style = 'purple';
        g_maze.drawTile( route.getPosition(), style );
    };

    return PathFinderGenome;
})();

var resolver = new Resolver( { genomeClass : PathFinderGenome } );

$(function(){
    resolver.run();
});

