*Inspired by a [standupmaths video](https://youtu.be/-qqPKKOU-yY)*

# Overview

[Click here to try it out!](https://rojetto.github.io/weird_dice/)  
This project is a browser based simulation of cylindrical dice/coins.
The goal is to determine the *ratio of cylinder diameter to thickness* at which the coin has an equal chance of landing
on either of its flat sides or the round side.
For that purpose this simulation supports tweaking the strategy with which the coins are thrown, tweaking the physical
properties of the objects as well as an automated binary search for the ideal ratio.

Built in Typescript with [three.js](https://threejs.org/) and [Cannon.js](http://www.cannonjs.org/).

## Controls

Click *start* in the foldable GUI on the right to start automatically throwing coins.
Their initial rotation is randomized according to a [uniform distribution on a sphere](http://mathworld.wolfram.com/SpherePointPicking.html).
They are colored based on the face that is currently facing up.
- Top side --> red (X)
- Bottom side --> yellow (O)
- Round side --> orange (-)

When a coin's vertical position has been more or less constant for while, it will be destroyed and a new coin will be
thrown. When this happens the appropriate counter in the top left will be incremented.

Click *stop* to disable automatic throwing of coins. Use the *reset* button to remove all coins and clear the tally.

## Binary search

Open the *Auto Search* folder in the GUI to configure the binary search.  
When *enableAutoSearch* is set and the simulation is running, the *dice ratio*, *upper ratio limit* and
*lower ratio limit* will be automatically adjusted every time the total number of throws exceeds *tweakRatioAfter*
according to the current tally.  
Before starting the binary search you should tweak the other simulation settings to make sure everything is how you
intended, then stop the stimulation and reset the tally. After that you can enable the binary search and click *start*.

## Configuration

### Graphics
- **dynamicColors**: Should coins be colored based on their orientation? Might improve performance if disabled.

### World
- **timeScale**: Factor to scale the default simulation time step of 1/60 s. Increasing this will speed up the
simulation but reduce the accuracy and vice versa.
- **gravity**: Gravitational acceleration in m/s/s
- **groundRestitution**: Restitution factor (bouncyness) of the ground between 0 (instant stop) and 1
(maximum bouncyness). Related to
[Coefficient of Restitution](https://en.wikipedia.org/wiki/Coefficient_of_restitution)
- **groundFriction**: Friction of the ground between 0 (extremely slidey) and 1 (instant stop)

### Dice
- **volumeCcm**: Die volume in cm³
- **ratio**: Ratio of diameter/thickness
- **mass**: Mass in kg
- **diceRestitution**: Restitution factor (bouncyness) of each die between 0 (instant stop) and 1
(maximum bouncyness). Related to
[Coefficient of Restitution](https://en.wikipedia.org/wiki/Coefficient_of_restitution)
- **diceFriction**: Friction of each die between 0 (extremely slidey) and 1 (instant stop)

### Rolling
- **rollCount**: How many dice to simulate at the same time
- **dropHeight**: Height to drop dice from in m
- **gridWidth**: Distance between horizontally/vertically adjacent die drop points in m
- **randomSpin**: Should dice get a random initial angular velocity when created?
- **randomSpinMagnitude**: Magnitude of initial angular velocity (probably) in rad/s
- **randomVelocity**: Should dice get a random initial velocity when created?
- **randomVelocityOnlyHorizontal**: If **randomVelocity** is enabled, should the initial velocity always be parallel
to the ground plane? If disabled, initial velocity is uniformly distributed in all spherical directions.
- **randomVelocityMagnitude**: Magnitude of initial velocity in m/s
- **restTimeout**: Time to wait after dice are detected as resting before removing them in s

### Auto Search
- **enableAutoSearch**: Should the ratio be automatically adjusted to optimize for a specific percentage of dice landing
on their round side?
- **searchGoalPercent**: Chance of dice landing on their side in percent
- **tweakRatioAfter**: Amount of total throws after which the tally is evaluated and the ratio is adjusted
- **upperRatio**: Upper bound for the binary search (will be automatically adjusted while searching)
- **lowerRatio**: Lower bound for the binary search (will be automatically adjusted while searching)

# Build instructions

Dependencies are configured for installation with [NPM](https://www.npmjs.com/) and a bundle can be built with
[Webpack](https://webpack.js.org/).

Run `npm install` to download all required modules, then `npm run build` to create *dist/bundle.js*.
The contents of *dist* should now be autonomously usable.

For debugging purposes *webpack-dev-server* is also configured.
Run it with `npm run start:dev` and use the displayed url to view the site or to attach a debugger. 