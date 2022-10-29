const { src, dest, watch, parallel, series } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const cheerio = require('gulp-cheerio');
const replace = require('gulp-replace');
const browserSync = require('browser-sync');

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'app/'
        },
        notify: false
    })
}


//convert scss -> css
function buildStyles() {
  return src('app/sass/style.scss')
      .pipe(autoprefixer( {
        overrideBrowserslist: ['last 10 version'],
        grid: true
      }))
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(concat('style.min.css'))
      .pipe(dest('app/css'))
      .pipe(browserSync.stream())
}

function scripts() {
    return src([
        'node_modules/jquery/dist/jquery.js',
        'app/js/main.js'
    ])
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function images() {
    return src('app/images/**/*.*')
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest('dist/images'))
}

function svgSprites () {
    return src('app/images/icons/*.svg') // выбираем в папке с иконками все файлы с расширением svg
        .pipe(cheerio({
                run: ($) => {
                    $("[fill]").removeAttr("fill"); // очищаем цвет у иконок по умолчанию, чтобы можно было задать свой
                    $("[stroke]").removeAttr("stroke"); // очищаем, если есть лишние атрибуты строк
                    $("[style]").removeAttr("style"); // убираем внутренние стили для иконок
                },
                parserOptions: { xmlMode: true },
            })
        )
        .pipe(replace('&gt;','>')) // боремся с заменой символа
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: '../sprite.svg', // указываем имя файла спрайта и путь
                    },
                },
            })
        )
        .pipe(dest('app/images')); // указываем, в какую папку поместить готовый файл спрайта
}

function build() {
    return src([
        'app/**/*.html',
        'app/css/style.min.css',
        'app/js/main.min.js'
    ], {base: 'app'})
        .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}



function watching() {
    watch(['app/sass/**/*.scss'], buildStyles);
    watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts);
    watch(['app/**/*.html']).on('change', browserSync.reload);
    watch(['app/images/icons/*.svg'], svgSprites);
}

exports.buildStyles = buildStyles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.svgSprites = svgSprites;
exports.cleanDist = cleanDist;
exports.build = series(cleanDist, images, build);

// exports.default = parallel(buildStyles, scripts, browsersync, watching);
exports.default = parallel(buildStyles, scripts, browsersync, svgSprites, build, images, watching);
