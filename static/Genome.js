
/// The genome super class.
///
/// Any subclassed genomes need to implement the following methods:
///  - _generateGene
///  - _mutate
///  - _crossOver
///  - _calculateFitness
///  - render
///
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
    var GenomeProto = Genome.prototype;
    
    /// Generates a random chromosome string.
    ///
    /// @this {Genome}
    ///
    /// @param {Number} length The number of genes to generate.
    function _populateRandom( length ){
        for( var i = 0; i < length * this._geneSize; ++i ){
            this._genes.push( this._generateGene() );
        }
    }
    
    GenomeProto._generateGene = function(){
        throw new Error( 'Missing Genome::_generateGene method' );
    };
    
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
            this._genes[i] = this._mutate( this._genes[i] );
        }
    }
    
    GenomeProto._mutate = function( gene ){
        throw new Error( 'Missing Genome::_mutate method.' );
    };
    
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
        var thisClass = this.constructor;
        if( Math.random() > crossOverRate || this === dad ){
            return [
                new thisClass( this ),
                new thisClass( dad )
            ];
        }
        
        // We're crossing over. Let the sub-class handle the dirty work.
        var litter = [ new thisClass(), new thisClass() ];
        this._crossOver( dad, litter );
        return litter;
    }
    
    GenomeProto._crossOver = function( dad, litter ){
        throw new Error( 'Missing Genome::_crossOverGenomes method' );
    };
    
    /// Breed this Genome with another to generate offspring.
    ///
    /// @param {Genome} dad
    /// @param {Number} mutationRate
    /// @param {Number} crossOverRate
    ///
    /// @return {Array<Genome>}
    GenomeProto.mate = function( dad, mutationRate, crossOverRate ){
        var litter = _crossOver.call( this, dad, crossOverRate );
        for( var i in litter ){
            _mutate.call( litter[i], mutationRate );
        }
        return litter;
    };

    /// Runs this Genome through the maze and caclulates its fitness score.
    ///
    /// @return {Number} The fitness score of this genome.
    GenomeProto.test = function(){
        this._fitness = this._calculateFitness();
        return this._fitness;
    };
    
    GenomeProto._calculateFitness = function(){
        throw new Error( 'Missing Genome::_calculateFitness method' );
    };

    /// Returns the Genome's fitness score.
    ///
    /// @return {Number} The fitness score.
    GenomeProto.getFitness = function(){
        return this._fitness;
    };

    
    /// Draws this genome's path on through the maze.
    ///
    /// @virtual
    GenomeProto.render = function(){
        throw new Error( 'Missing Genome::render method.' );
    };

    return Genome;
})();
