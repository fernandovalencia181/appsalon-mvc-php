import { src, dest, watch, series } from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import terser from 'gulp-terser'
import plumber from 'gulp-plumber'
import notifier from 'node-notifier';

const sass = gulpSass(dartSass)

const paths = {
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js'
}

export function css(done) {
    src(paths.scss, { sourcemaps: true })
        .pipe(plumber({
            errorHandler(err) {
                console.error(err.message);
                notifier.notify({
                    title: 'Error en Sass',
                    message: err.message,
                    sound: true // Opcional: activa sonido
                });
                this.emit('end'); // Mantiene vivo el watcher
            }
        }))
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(dest('./public/build/css', { sourcemaps: '.' }))
    done()
}

export function js(done) {
    src(paths.js)
        .pipe(plumber({
            errorHandler(err) {
                console.error(err.message);
                notifier.notify({
                    title: 'Error en JS',
                    message: err.message,
                    sound: true
                });
                this.emit('end');
            }
        }))
        .pipe(terser())
        .pipe(dest('./public/build/js'));
    done();
}

export function dev() {
    watch(paths.scss, css);
    watch(paths.js, js);
}

export const build = series(js, css);
export default series(js, css, dev);
