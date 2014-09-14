EDGE Research Lab: Live Telemetry Tracking 
====

This repository is the live website used for tracking flights and reporting on data.

## Deploy

### Prereqs

* [Node.JS](http://nodejs.org/) Both `node` and `npm` should be in your `$PATH`.

* [g++](http://gcc.gnu.org/onlinedocs/gcc-3.4.6/gcc/G_002b_002b-and-GCC.html) Required for compiling some of the libraries we are using.

* `config.json`:  This is a config file containing DB connection info (mongodb) (params can be seen in `lib/db.js`)

### Run

If you're unfamiliar with node.js, this is a standard deployment:

* `npm install`: This will install the dependencies for the project (listed in `package.json`)
* `npm start`: This kicks off the server.  If you're running locally, you can see the site on [http://localhost:3000](http://localhost:3000)
