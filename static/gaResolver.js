var Genome = Genome || {};

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
