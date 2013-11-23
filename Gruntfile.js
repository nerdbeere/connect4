module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'tap'
            },

            all: { src: ['backend/test/**/*.js'] }
        }
    });

    grunt.loadNpmTasks('grunt-simple-mocha');

    // Default task(s).
    grunt.registerTask('test', ['simplemocha']);
    grunt.registerTask('default', []);

};