var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglifyjs');
var rename = require('gulp-rename');
var minifyHtml = require('gulp-minify-html');
var htmlbuild = require('gulp-htmlbuild');
var csso = require('gulp-csso');
var lazypipe = require('lazypipe');

var JSfilesToConcat = [
    'client/app.js',
    'client/services/**/*.js',
    'client/directives/**/*.js',
    'client/filters/**/*.js',
    'client/controllers/**/*.js'
];

var CSSfilesToConcat = [
    'client/assets/css/**/*.css'
];

var date = new Date();
var version = date.valueOf();

gulp.task('deleteScriptsFolder', require('del').bind(null, ['client/dist/scripts']));
gulp.task('deleteHTMLFolder', require('del').bind(null, ['client/dist/views']));
gulp.task('deleteCSSFolder', require('del').bind(null, ['client/dist/css']));



gulp.task('scripts', ['deleteScriptsFolder'], function() {
    return gulp.src(JSfilesToConcat)
        .pipe(concat('app-' + version + '.js'))
        .pipe(gulp.dest('client/dist/scripts'));
});


/*gulp.task('styles', ['deleteCSSFolder'],function() {
    var lazypipe = require('lazypipe');
    var cssChannel = lazypipe()
        .pipe(csso);
    return gulp.src(CSSfilesToConcat)
        .pipe(concat('style.css'))
        .pipe(cssChannel())
        .pipe(gulp.dest('dist/css'));
});*/

gulp.task('html', ['deleteHTMLFolder'], function() {
    return gulp.src('client/views/**/*.html')
        .pipe(minifyHtml({
            conditionals: true,
            loose: true,
            empty: true
        }))
        .pipe(gulp.dest('client/dist/views'));
});

gulp.task('vendors', ['deleteScriptsFolder'], function() {
    return gulp.src(JSfilesToConcat)
        .pipe(concat('vendor.min.js'))
        .pipe(gulp.dest('dist/scripts'));
});

gulp.task('build', ['deleteHTMLFolder', 'deleteScriptsFolder'], function() {
    gulp.src('client/views/**/*.html')
        .pipe(htmlbuild({
            js: htmlbuild.preprocess.js(function(block) {
                block.write('dist/scripts/app-' + version + '.js');
                block.end();
            }),
            css: htmlbuild.preprocess.css(function(block) {
                block.write('dist/css/style-' + version + '.css');
                block.end();
            })
        }))
        .pipe(minifyHtml({
            conditionals: true,
            loose: true,
            empty: true
        }))
        .pipe(gulp.dest('client/dist/views'));
    gulp.src(JSfilesToConcat)
        .pipe(concat('app-' + version + '.js'))
        .pipe(gulp.dest('client/dist/scripts'))
        .pipe(gulp.dest('client/dist/scripts'))
        .pipe(rename('app.min-' + version + '.js'))
        .pipe(uglify('app.min-' + version + '.js'))
        .pipe(gulp.dest('client/dist/scripts'));
    var cssChannel = lazypipe()
        .pipe(csso);
    return gulp.src(CSSfilesToConcat)
        .pipe(concat('style-' + version + '.css'))
        .pipe(cssChannel())
        .pipe(gulp.dest('client/dist/css'));
});

gulp.task('default', ['build']);