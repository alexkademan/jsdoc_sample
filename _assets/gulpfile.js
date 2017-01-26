/**
 * For more information see this tutorial: http://blog.webbb.be/use-jekyll-with-gulp/
 *
 * Libs import
 * --> How to install? npm install --save-dev gulp-minify-html
 * @type {[type]}
 */

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var path = require('path');
var pkg = require('./package.json');

// sass stuff:
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');

var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var notify = require('gulp-notify');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var gulp_uglify = require('gulp-uglify');
var assign = require('lodash.assign');
var htmlmin = require('gulp-htmlmin');

var jsdoc = require('gulp-jsdoc3');

gulp.task('jekyll', function (gulpCallBack){
    var spawn = require('child_process').spawn;
    // After build: cleanup HTML
    var jekyll = spawn('jekyll', ['build'], {stdio: 'inherit', cwd: '..'});

    jekyll.on('exit', function(code) {
        gulpCallBack(code === 0 ? null : 'ERROR: Jekyll process exited with code: '+code);
    });

});

gulp.task('jsdoc', function (cb) {
    gulp.src(['README.md', './js/**/*.js'], {read: false})
        .pipe(jsdoc(cb));
});

gulp.task('jekyllmini', ['jekyll'], function() {
  // return gulp.src(['./../_site/**/*.html', './../_site/index.php'])
  return gulp.src(['./../../alexkademan.github.io/**/*.html', './../_site/index.php'])
    .pipe(htmlmin({
      collapseWhitespace : true,
      removeComments : true,
      minifyJS : true,
      removeTagWhitespace : true
    }))
    // .pipe(gulp.dest('./../_site'))
    .pipe(gulp.dest('./../../alexkademan.github.io'))
});

gulp.task('sass', function () {
  return gulp.src('./sass/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['> 1%', 'IE 7'], cascade: false }))
    .pipe(nano())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./../css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// add custom browserify options here
var customOpts = {
  entries: ['./js/app.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal


function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    // .on('error', notify({message: 'JS error'}))
    // .pipe(notify({ message: 'JS error' }))
    .pipe(source('js/bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
    // Add transformation tasks to the pipeline here.
    .pipe(gulp_uglify()) // use for production!@?!
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('..'));
}

gulp.task('watch', function() {
  // jekyll stuff:
  gulp.watch('./../*', ['jekyllmini']);
  gulp.watch('./../_includes/*', ['jekyllmini']);
  gulp.watch('./../_layouts/*', ['jekyllmini']);
  gulp.watch('./../_posts/**/*.markdown', ['jekyllmini']);

  // Watch .scss files
  gulp.watch('./sass/**/*.scss', ['sass']);

  // Watch .js files
  gulp.watch('./js/**/*.js', ['js']);

  // whenever we make a new processed js, or css
  // we have to run jekyll build again:
  gulp.watch('./../css/**/*.css', ['jekyllmini']);
  gulp.watch('./../js/**/*.js', ['jekyllmini']);

  // finally, the templates for the FB feed I'm builidng:
  gulp.watch('./../_includes/**/*.html', ['jekyllmini']);
  gulp.watch('./../_includes/**/*.php', ['jekyllmini']);

});
