var projeto = require('./projeto.json');
var pkg = require('./package.json');
var gulp = require('gulp');
var fs = require('fs');
var cp = require('child_process');
var bs = require('browser-sync');
var jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
const browserSync = require('browser-sync').create();

var messages;

messages = {
    jekyllBuild: 'Copilando jekyll',
    MacOS: 'Sistema MacOS!',
    Wind32: 'Sistema Windows',
    Linux: 'Sistema Linux',
    npm: 'Iniciando instalação dos package node_modules! Isso pode demorar um pouco. -_-',
    npm_modules: 'Node_modules detectada',
    npm_package: 'pacotes npm detectados',
    bower_components: 'componentes bower já foram instalado',
    compass: 'copilando arquivos scss',
    minify: 'Minificando arquivos js',
}

//Verifica o Sistema operacional
var os = process.platform
usuario = '', caminhoRede = '';

if (os == 'win32') {
    usuario = process.env.USER;
    comandoTerminal = 'npm';
} else {
    usuario = process.env.USER;
    comandoTerminal = 'sudo npm';
}

/*swallowError */
function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('imagemin', function () {
    const imagemin = require('gulp-imagemin');
    browserSync.notify(messages.imageMin);
    gulp.src([projeto.assets_dir + '/_img/**/*.*', '!' + projeto.assets_dir + '/_img/sprite/**/*.png'])
        .pipe(imagemin())
        .pipe(gulp.dest(projeto.images_dir))
});

gulp.task('minify', function () {
    var ulglify = require('gulp-uglifyjs');
    browserSync.notify(messages.minify);
    gulp.src([projeto.assets_dir + '/_js/geral.js'])
        .pipe(ulglify('main.min.js', {
            outSourceMap: true
        }))
        .on('error', swallowError)
        .pipe(gulp.dest(projeto.dist_dir + '/js'));
});

gulp.task('bower', function () {
    var uglify = require('gulp-uglifyjs');
    var bowerMain = require('bower-main');
    var bowerMainJavaScriptFiles = bowerMain('js', 'min.js');

    gulp.src(bowerMainJavaScriptFiles.normal)
        .pipe(uglify('external.min.js', {
            outSourceMap: true
        })).on('error', function (err) {
            this.logError
        }).pipe(gulp.dest(projeto.dist_dir + '/js'));
});

gulp.task('compass', function () {
   var compass = require('gulp-compass');
    browserSync.notify(messages.compass);
    console.log(messages.compass);
    gulp.src(projeto.sass + '/*.scss')
        .pipe(compass({
            css: projeto.css_dir,
            generated_images_path: projeto.images_dir,
            http_path: projeto.http_path,
            image: projeto.sprite_load_path,
            sass: projeto.sass,
            style: 'compressed',
            sourcemap: true,
            relative: true
        })).on('error', swallowError);
});

gulp.task('jekyllBuild', (done) => {
    bs.notify(messages.jekyllBuild);
    return cp.spawn(jekyll, ['build'], {
        stdio: 'inherit',
    }).on('close', done);
});

gulp.task('jekyll-rebuild', ['jekyllBuild'], function () {
    browserSync.reload();
});

gulp.task('browser-sync', function () {
    browserSync.init({
        port: '3000',
        server: {
            baseDir: '_site/'
        },
        reloadDebounce: 5000
    });
});

gulp.task('bowerInstall', function () {
    var bower = require('gulp-install');
    console.log('Instalando componentes bower');
    if (!fs.existsSync('bower_components')) {
        gulp.src(['./bower.json'])
            .pipe(bower());
    } else {
        console.log(messages.bower_components);
    }
});

gulp.task('npmInstall', function () {
    var exec = require('child_process').execSync;
    var installCmd;

    if (!fs.existsSync('node_modules')) {
        console.log(messages.npm);
        var listDependencies = Object.getOwnPropertyNames(pkg.devDependencies);

        for (var j = 0; j <= listDependencies.length - 1; j++) {
            installCmd = comandoTerminal + ' install --save-dev ' + listDependencies[j];
            console.log(installCmd)
            exec(installCmd);
        }
    } else {
        console.log(messages.npm_modules);
    }
});

gulp.task('start', function () {
    var reload = browserSync.reload;
    watch = require('gulp-watch');

    gulp.start(['compass', 'bower', 'minify', 'imagemin', 'browser-sync']);

    gulp.watch(projeto.javascript_dir + '/**/*.js', ['minify']);
    gulp.watch('bower.json', ['bower']);
    gulp.watch(projeto.sass + '/**/*.scss', ['compass']);
    gulp.watch(projeto.assets_dir + '/_img/**/*.jpg', ['imagemin']);
    gulp.watch(projeto.assets_dir + '/_img/**/*.png', ['imagemin']);
    gulp.watch(projeto.assets_dir + '/_img/**/*.gif', ['imagemin']);
    gulp.watch(projeto.sprite_load_path + '/sprite/**/*.png', ['compass']);

    gulp.watch([
        '*.html',
        '**/*.html',
        '_layouts/*.html',
        '_includes/*.html',
        '_components/*.md',
        '_elements/*.md',
        '_layout-system/*.md',
        '_visual/*.md',
        'Repositorio/dist/js/main.min.js',
        'Repositorio/dist/img/**/*.*',
        'Repositorio/dist/js/external.min.js',
        'Repositorio/dist/css/*.css'
    ], ['jekyll-rebuild']);
});

gulp.task('default', ['npmInstall', 'bowerInstall', 'jekyllBuild', 'start']);