About
=====
This is just a small library of JavaScript AI classes to teach myself genetic
algorithms and neuro networks. All data is in the static directory.

Resolver
========
A genetic algorithm manager. It simply runs until a valid solution is found. It
can be configured to use almost any kind of selection method (currently only
roulette wheel selection is available), and it works with any kind of genome.

Genome
======
A base Genome class. Any genome can be created on top of this base class, and
must if it is to be used with the `Resolver` class. The Genome class has a
static `inheritFrom` method which will properly update the passed in class to
inherit from the Genome class, including adding a `_super` method which is the
Genome constructor.

Classes inheriting from Genome must implement the following methods:

 - _generateGene
   - Randomly generates a single gene.
 - _mutate
   - Mutate the gene passed in.
 - _crossOver
   - Cross this Genome with the provided one into the provided litter. 
 - _calculateFitness
   - Calculate the fitness of this genome and return it.
 - render
   - Draw the genome to screen.

Examples and Tom-foolery
========================
The root index file (static/index.html) provides links to all the examples and
play things I have built using these classes.
