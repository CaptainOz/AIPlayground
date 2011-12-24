var g_canvas = g_canvas || {};
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
var Genome = (function(){
    var directions = [ 'n', 'e', 's', 'w' ];

    /// Constructor.
    ///
    /// This has one parameter which can be either a Genome to copy or an
    /// integer indicating the length of a random Genome to construct. If no
    /// parameter is proved an empty Genome is constructed.
    ///
    /// @param {Genome} arg A Genome to clone.
    /// @param {Number} arg The length of a Genome to randomly generate.
    function Genome( arg ){
        this._genes    = [];
        this._geneSize = 2;
        this._fitness  = 0;
        this._position = 0;
        
        // If we have an argument, why kind is it?
        if( arg ){
            if( arg instanceof Genome ){
                this._genes    = arg._genes.concat([]);
                this._geneSize = arg._geneSize;
            }
            else if( $.isNumeric( arg ) ){
                _populateRandom.call( this, arg );
            }
        }
    }
    
    /// Generates a random chromosome string.
    ///
    /// @this {Genome}
    ///
    /// @param {Number} length The number of genes to generate.
    function _populateRandom( length ){
        for( var i = 0; i < length * this._geneSize; ++i ){
            this._genes.push( Math.floor( Math.random() * 2 ) );
        }
    }
    
    /// Randomly mutates this genome.
    ///
    /// The mutation rate should be between 0 and 1. A mutation rate of 1 would
    /// indicate that every gene be mutated.
    ///
    /// Mutation in this case simply means to toggle a single chromosome.
    ///
    /// @this {Genome}
    ///
    /// @param {Number} mutationRate The rate at which to mutate the genome.
    function _mutate( mutationRate ){
        for( var i in this._genes ){
            if( Math.random() > mutationRate ){
                continue;
            }
            this._genes[i] ^= 1;
        }
    }
    
    /// Combines this Genome with the provided dad Genome.
    ///
    /// The cross over rate should be between 0 and 1. A 1 would guarantee that
    /// the genes get crossed. When crosover doesn't happen this Genome and the
    /// dad are cloned.
    ///
    /// This crossover method is a single point swap.
    ///
    /// @this {Genome}
    ///
    /// @param {Genome} dad           The genome to mix with.
    /// @param {Number} crossOverRate The chance of mixing instead of cloning.
    ///
    /// @return {Array<Genome>} The babies generated from the crossover.
    function _crossOver( dad, crossOverRate ){
        // Are we going to cross over at all, or just clone?
        if( Math.random() > crossOverRate || this === dad ){
            return [
                new Genome( this ),
                new Genome( dad )
            ];
        }
        
        // We're crossing over. Mix those genes, but make sure we only mix whole
        // genes.
        var litter = [ new Genome(), new Genome() ];
        var crossPoint = Math.floor( Math.random() * this._genes.length );
        crossPoint -= (crossPoint % this._geneSize);
        
        // Copy the genes over, crossing over at the point decided above.
        var push = Array.prototype.push;
        push.apply( litter[0]._genes, this._genes.slice( 0, crossPoint ) );
        push.apply( litter[1]._genes,  dad._genes.slice( 0, crossPoint ) );
        push.apply( litter[0]._genes,  dad._genes.slice( crossPoint    ) );
        push.apply( litter[1]._genes, this._genes.slice( crossPoint    ) );
        
        // And we're done with the dirty work.
        return litter;
    }
    
    /// Breed this Genome with another to generate offspring.
    ///
    /// @param {Genome} dad
    /// @param {Number} mutationRate
    /// @param {Number} crossOverRate
    ///
    /// @return {Array<Genome>}
    Genome.prototype.mate = function( dad, mutationRate, crossOverRate ){
        var litter = _crossOver.call( this, dad, crossOverRate );
        for( var i in litter ){
            _mutate.call( litter[i], mutationRate );
        }
        return litter;
    };

    /// Runs this Genome through the maze and caclulates its fitness score.
    ///
    /// @return {Number} The fitness score of this genome.
    Genome.prototype.test = function(){
        // Run this path through the maze.
        var route    = this.getRoute();
        var cellType = null;
        while( (cellType = route.step()) !== null && cellType != 'E' ){}
        
        // Calculate the route's fitness.
        var position = route.getPosition();
        var end      = g_maze.end;
        var distance = [ Math.abs( position[0] - end[0] ), Math.abs( position[1] - end[1] ) ];
        this._fitness = 1.0 / ( distance[0] + distance[1] + 1 );
        return this._fitness;
    };

    /// Translates this Genome's genes into a route to follow through the maze.
    ///
    /// @this {Genome}
    ///
    /// @return {Array<String>} An array of cardinal directions to take.
    Genome.prototype.getRoute = function(){
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
    
    Route.prototype.step = function(){
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
    
    Route.prototype.getPosition = function(){
        return this._position;
    };

    /// Returns the Genome's fitness score.
    ///
    /// @return {Number} The fitness score.
    Genome.prototype.getFitness = function(){
        return this._fitness;
    };

    return Genome;
})();

/// The Resolver runs the genetic algorithm until a solution is found.
var Resolver = (function(){
    /// Constructor takes a map of optional arguments.
    ///
    /// The Resolver can be configured with:
    /// - {Number} crossOverRate
    /// - {Number} mutationRate
    /// - {Number} populationSize
    /// - {Number} genomeLength
    /// - {Number} errorTolerance
    /// - {Number} maxGenerations
    ///
    /// @param {Object} args Configuration mapping.
    function Resolver( args ){
        this._population = [];
        this._args = $.extend({
            crossOverRate  : 0.7,
            mutationRate   : 0.001,
            populationSize : 150,
            genomeLength   : 70,
            errorTolerance : 0.01,
            maxGenerations : 1000
        }, args );
        this._fittest      = null;
        this._bestFitness  = 0;
        this._totalFitness = 0;
        this._generationCounter = 0;

        _generateRandomPopulation.call( this );
    }

    /// Performs the chosen selection method to fetch a single individual.
    ///
    /// @type {Resolver}
    ///
    /// @return {Genome} The selected individual.
    function _selector(){
        // Only one method of selection currently.
        return _rouletteWheelSelection.call( this );
    }

    /// Select a random individual, weighted by their fitness.
    ///
    /// @this {Resolver}
    ///
    /// @return {Genome} The selected individual.
    function _rouletteWheelSelection(){
        // Pick a winner and then total up the genome fitness scores until it is
        // greater than the winningSlice value.
        var winningSlice = Math.random() * this._totalFitness;
        var runningTotal = 0;
        for( var i in this._population ){
            var genome = this._population[i];
            runningTotal += genome.getFitness();
            if( runningTotal > winningSlice ){
                return genome;
            }
        }
        
        // We should never ever get here.
        throw new Error( 'Roulette wheel selection failed... somehow.' );
    }
    
    /// Updates the fitness score of every individual in the current population.
    ///
    /// @this {Resolver}
    function _updateFitnessScores(){
        this._totalFitness = 0;
        this._bestFitness  = 0;
        for( var i in this._population ){
            // Update the genome
            var genome  = this._population[i];
            var fitness = genome.test();
            
            // Is this our new best?
            if( fitness > this._bestFitness ){
                this._bestFitness  = fitness;
                this._fittest = genome;
            }
            this._totalFitness += fitness;
        }
    }
    
    /// Creates a fresh population with no parameters.
    ///
    /// @this {Resolver}
    function _generateRandomPopulation(){
        var maxPopSize   = this._args.populationSize;
        var genomeLength = this._args.genomeLength;
        while( this._population.length < maxPopSize ){
            this._population.push( new Genome( genomeLength ) );
        }
    }

    /// Runs the resolver until the generation limit is hit or a solution is
    /// found.
    Resolver.prototype.run = function(){
        // Test this generation then get and render the most fit genome.
        this.step();
        var fittest = this.getFittestGenome();

        // Now lets see if this is a good solution. If it is not a usable
        // solution and we have not reached our generation limit then run
        // another round.
        var tolerableFitness = 1 - this._args.errorTolerance;
        var fitness = fittest.getFitness();
        var counter = this._generationCounter;
        console.log( counter + ': ' + fitness );
        this.render( fittest );
        if( fitness < tolerableFitness && counter < this._args.maxGenerations ){
            setTimeout( _run.bind( this ), 66 );
        }
    };
    var _run = Resolver.prototype.run;

    /// Tests the current generation and then generates the next one.
    Resolver.prototype.step = function(){
        _updateFitnessScores.call( this );
        var babies = [];
        var crossOverRate = this._args.crossOverRate;
        var mutationRate  = this._args.mutationRate;
        while( babies.length < this._population.length ){
            var mom = _selector.call( this );
            var dad = _selector.call( this );
            Array.prototype.push.apply( babies, mom.mate( dad, mutationRate, crossOverRate ) );
        }
        this._population = babies;
        ++this._generationCounter;
    };
    
    /// Displays the path of the provided genome.
    ///
    /// If no genome is provided then the fittest one is used.
    ///
    /// @param {Genome} genome The genome to render.
    Resolver.prototype.render = function( genome ){
        // Redraw the map to clear previous runs.
        g_maze.render();

        var route    = (genome || this.getFittestGenome()).getRoute();
        var tileType = null;
        var style    = { type : 'fill', style : 'grey' };
        while( (tileType = route.step()) !== null && tileType !== 'E' ){
            var cell = route.getPosition();
            g_maze.drawTile( cell, style );
        }
        g_maze.drawTile( route.getPosition(), { type : 'fill', style : 'purple' } );
    };

    /// Gets the number of the current generation.
    ///
    /// @return {Number} The current generation's number.
    Resolver.prototype.getGeneration = function(){
        return this._generationCounter;
    };
    
    /// Gets the most fit Genome from the current population.
    ///
    /// @return {Genome} The most fit Genome.
    Resolver.prototype.getFittestGenome = function(){
        return this._fittest;
    };

    return Resolver;
})();

var resolver = new Resolver();

$(function(){
    resolver.run();
});

