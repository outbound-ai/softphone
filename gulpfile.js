var gulp = require('gulp');
var serve = require('gulp-serve');

gulp.task('serve', serve({
  root: ['./public/**/*'],
  port: 9000,
  hostname: 'localhost',
}));