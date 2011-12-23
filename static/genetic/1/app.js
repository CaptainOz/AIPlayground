var maze = (function(){
    // The maze is just an array of integers.
    //  1 - A wall.
    //  0 - An open area.
    //  S - The start.
    //  E - The end
    var S = 2;
    var E = 3;
    var maze = [
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1 ],
        [ E, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1 ],
        [ 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1 ],
        [ 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1 ],
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1 ],
        [ 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, S ],
        [ 1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
    ];
    
    // Calculate a few constant values used for rendering.
    var self    = {
        width  : maze[0].length,
        height : maze.length,
        tile   : [ 'B', 'W', 'S', 'E' ]
    };
    var pixelWidth   = Math.floor( g_canvas.width  / self.width  );
    var pixelHeight  = Math.floor( g_canvas.height / self.height );
    var pixelPadding = 0;

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
    self.drawMaze = function(){
        // All tiles are drawn filled in, just the color is different.
        var style = {
            type : 'fill'
        };
        
        // Loop through the whole maze construct.
        for( var y in maze ){
            var row = maze[y];
            var vertOffset  = y * pixelHeight + (y+1) * pixelPadding;
            for( var x in row ){
                var cell = row[x];
                var horzOffset = x * pixelWidth + (x+1) * pixelPadding;

                // A wall
                if( cell == 1 ){
                    style.style = 'black';
                }
                
                // A blank square
                else if( cell == 0 ){
                    style.style = 'white';
                }
                
                // Either the exit or enterance.
                else {
                    style.style = 'red';
                }
                g_canvas.drawRect( pixelWidth, pixelHeight, [ horzOffset, vertOffset ], style );
            }
        }
    };
    
    /// Fetches the tile type for the specified coordinates.
    self.getTile = function( x, y ){
        return self.tile[ maze[y][x] ];
    };

    return self;
})();

/// A genome.
///
/// Each chromosome in this genome is either a 1 or a 0. Each gene is made of
/// two chromosomes which give 4 possible combinations. They are read as follows:
///  - 00 : North
///  - 01 : East
///  - 10 : South
///  - 11 : West
var Genome = (function(){
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
            this._genes.push( Math.floor( Math.random * 2 ) );
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

    Genome.prototype.test = function(){
        // Run this path through the maze.
        var route    = _decode.call( this );
        var start    = maze.start;
        var end      = maze.end;
        var position = start.concat([]);
        for( var i in route ){
            var move = route[i];
            var nextPosition = position.concat([]);
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
            var nextCell = maze[ nextPosition[1] ][ nextPosition[0] ];
            if( nextCell === 0 ){
                position = nextPosition;
            }
            else if( nextCell == 8 ){
                // We're done!
                position = nextPosition;
                break;
            }
        }
        
        // Calculate the route's fitness.
        var distance = [ Math.abs( position[0] - end[0] ), Math.abs( position[1] - end[1] ) ];
        this._fitness = 1.0 / ( distance[0] + distance[1] + 1 );
        return this._fitness;
    }

    function _decode(){
        var directions = [ 'n', 'e', 's', 'w' ];
        var route = [];
        for( var i = 0; i < this._genes.length; i += this._geneSize ){
            var geneHigh = this._genes[i];
            var geneLow  = this._genes[i + 1];
            var move = (geneHigh << 1) & geneLow;
            route.push( directions[ move ] );
        }
        return route;
    }

    Genome.prototype.getFitness = function(){
        return this._fitness;
    };

    return Genome;
})();


var Resolver = (function(){
    function Resolver( args ){
        this._population = [];
        this._args = $.extend({
            crossOverRate  : 0.7,
            mutationRate   : 0.001,
            populationSize : 150,
            genomeLength   : 70
        }, args );
        this._fittestIndex = null;
        this._bestFitness  = 0;
        this._totalFitness = 0;
        this._generationCounter = 0;

        _generateRandomPopulation.call( this );
    }

    function _selector(){
        return _rouletteWheelSelection.call( this );
    }

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
    
    function _updateFitnessScores(){
        this._totalFitness = 0;
        for( var i in this._population ){
            var genome  = this._population[i];
            var fitness = genome.test();
            if( fitness > this._bestFitness ){
                this._bestFitness  = fitness;
                this._fittestIndex = i;
            }
            this._totalFitness += fitness;
        }
    }
    
    function _generateRandomPopulation(){
        var maxPopSize   = this._args.populationSize;
        var genomeLength = this._args.genomeLength;
        while( this._population.length < maxPopSize ){
            this._population.push( new Genome( genomeLength ) );
        }
    }

    Resolver.prototype.run = function(){
    };
    
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
    
    Resolver.prototype.render = function( genome ){
    };

    Resolver.prototype.getGeneration = function(){
        return this._generationCounter;
    };
    
    Resolver.prototype.getFittestGenome = function(){
        return this._population[ this._fittestIndex ];
    };

    return Resolver;
})();


