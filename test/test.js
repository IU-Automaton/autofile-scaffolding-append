/*global describe, it, beforeEach, after*/

'use strict';

var fs        = require('fs');
var expect    = require('expect.js');
var rimraf    = require('rimraf');
var append    = require('../autofile');
var automaton = require('automaton').create();

describe('scaffolding-append', function () {
    function clean(done) {
        rimraf(__dirname + '/tmp', done);
    }

    beforeEach(function (done) {
        clean(function (err) {
            if (err) {
                throw err;
            }

            fs.mkdirSync(__dirname + '/tmp');

            // Copy assets to the tmp
            var file1 = fs.readFileSync(__dirname + '/assets/file1.json');
            fs.writeFileSync(__dirname + '/tmp/file1.json', file1);
            fs.writeFileSync(__dirname + '/tmp/file1_copy.json', file1);

            done();
        });
    });
    after(clean);

    it('should append string to placeholder', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: append,
                    options: {
                        files: ['{{__dirname}}/tmp/file1.json', '{{__dirname}}/tmp/file1_copy.json'],
                        data: {
                            placeholder: 'awesome ',
                            name: 'André',
                            email: 'andre@indigounited.com'
                        }
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1.json'));
            expect(contents.name).to.equal('André{{name}}');
            expect(contents.email).to.equal('andre@indigounited.com{{email}}');
            expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

            contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1_copy.json'));
            expect(contents.name).to.equal('André{{name}}');
            expect(contents.email).to.equal('andre@indigounited.com{{email}}');
            expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

            done();
        });
    });

    it('should append file to placeholder', function (done) {
        // Create dummy files
        fs.writeFileSync(__dirname + '/tmp/dummy', 'foo');
        fs.writeFileSync(__dirname + '/tmp/dummy2', 'bar');

        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: append,
                    options: {
                        files: ['{{__dirname}}/tmp/file1.json', '{{__dirname}}/tmp/file1_copy.json'],
                        data: {
                            placeholder: '{{__dirname}}/tmp/dummy',
                            name: '{{__dirname}}/tmp/dummy2',
                            email: '{{__dirname}}/tmp/dummy'
                        },
                        type: 'file'
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1.json'));
            expect(contents.name).to.equal('bar{{name}}');
            expect(contents.email).to.equal('foo{{email}}');
            expect(contents.some_field).to.equal('This has an foo{{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the foo{{placeholder}} again just in case..');

            expect(contents.name).to.equal('bar{{name}}');
            expect(contents.email).to.equal('foo{{email}}');
            expect(contents.some_field).to.equal('This has an foo{{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the foo{{placeholder}} again just in case..');

            done();
        });
    });

    it('should accept minimatch patterns', function (done) {
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: append,
                    options: {
                        files: '{{__dirname}}/tmp/file1*.json',
                        data: {
                            placeholder: 'awesome ',
                            name: 'André',
                            email: 'andre@indigounited.com'
                        }
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1.json'));
            expect(contents.name).to.equal('André{{name}}');
            expect(contents.email).to.equal('andre@indigounited.com{{email}}');
            expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

            contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/file1_copy.json'));
            expect(contents.name).to.equal('André{{name}}');
            expect(contents.email).to.equal('andre@indigounited.com{{email}}');
            expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

            done();
        });
    });

    it('should pass over the glob options', function (done) {
        // Rename to .file1 and tell glob to match files starting with dot
        fs.renameSync(__dirname + '/tmp/file1.json', __dirname + '/tmp/.file1.json');

        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: append,
                    options: {
                        files: ['{{__dirname}}/tmp/*file1.json'],
                        data: {
                            placeholder: 'awesome ',
                            name: 'André',
                            email: 'andre@indigounited.com'
                        },
                        glob: {
                            dot: true
                        }
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            var contents = JSON.parse(fs.readFileSync(__dirname + '/tmp/.file1.json'));
            expect(contents.name).to.equal('André{{name}}');
            expect(contents.email).to.equal('andre@indigounited.com{{email}}');
            expect(contents.some_field).to.equal('This has an awesome {{placeholder}}, you see?');
            expect(contents.other_field).to.equal('Here\'s the awesome {{placeholder}} again just in case..');

            done();
        });
    });

    it('should skip folders', function (next) {
        // Create dir inside tmp
        fs.mkdirSync(__dirname + '/tmp/some_dir');

        // Scaffolding, matching the newly created it
        automaton.run({
            setup: function (opts, ctx, next) {
                opts.__dirname = __dirname;
                next();
            },
            tasks: [
                {
                    task: append,
                    options: {
                        files: ['{{__dirname}}/tmp/**/*'],
                        data: {
                            placeholder: 'awesome'
                        }
                    }
                }
            ]
        }, null, function (err) {
            if (err) {
                throw err;
            }

            next();
        });
    });
});
