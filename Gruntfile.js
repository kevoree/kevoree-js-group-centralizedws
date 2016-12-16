'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
		eslint: {
			options: {
				configFile: 'package.json'
			},
			target: ['lib', 'test']
		},

    kevoree: {
      main: {
        options: {
          localModel: 'kevlib.json'
        }
      }
    },

    kevoree_genmodel: {
      main: {
        options: {}
      }
    },

    kevoree_registry: {
      main: {
        src: 'kevlib.json',
        options: {}
      }
    }
  });

  grunt.registerTask('default', ['eslint', 'model']);
  grunt.registerTask('model', 'kevoree_genmodel');
  grunt.registerTask('publish', ['kevoree_genmodel', 'kevoree_registry']);
  grunt.registerTask('kev:run', ['eslint', 'model', 'kevoree']);
  grunt.registerTask('kev', 'kev:run');
};
