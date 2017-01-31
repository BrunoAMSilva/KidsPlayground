(function () {
    $(window).ready(function () {
        var canvas = $('canvas');
        var domCanvas = canvas[0];

        domCanvas.width = window.innerWidth;
        domCanvas.height = window.innerHeight;

        window.onresize = function() {
            domCanvas.width = window.innerWidth;
            domCanvas.height = window.innerHeight;
        };

        var context = domCanvas.getContext('2d');

        var requestAnimFrame = window.requestAnimationFrame | window.webkitRequestAnimationFrame;
        
        var settings = JSON.parse(localStorage.getItem('app_settings')) || {
            debug: false,
            continuousLine: true,
            setTouchesInterval: 100,
            animateSize: true,
            sizeAnimationStyle: 'grow',
            background: 'dark'
        };
        var opacityMultiplier = 0.2;

        function setupSettings() {
            if (settings.continuousLine) {
                $('#rdLine')[0].checked = true;
            } else {
                $('#rdScatter')[0].checked = true;
            }
            if (settings.sizeAnimationStyle === 'shrink') {
                $('#rdShrink')[0].checked = true;
            } else {
                $('#rdGrow')[0].checked = true;
            }
            if (settings.background === 'dark') {
                $('#rdDark')[0].checked = true;
            } else {
                $('#rdLight')[0].checked = true;
            }
            setOpacityMultiplier();

            $('body').addClass(settings.background);
        }

        function setOpacityMultiplier() {
            opacityMultiplier = settings.continuousLine ? 0.2 : 0.6;
        }

        function saveSettings() {
            localStorage.setItem("app_settings", JSON.stringify(settings));
        }

        var particles = [];
        var touches = [];
        var colors = [
            { color: '193, 7, 113', identifier: NaN },
            { color: '119, 193, 7', identifier: NaN },
            { color: '193, 60, 7', identifier: NaN },
            { color: '7, 106, 193', identifier: NaN },
            { color: '193, 7, 7', identifier: NaN },
            { color: '255, 230, 0', identifier: NaN },
            { color: '77, 194, 7', identifier: NaN },
            { color: '50, 80, 109', identifier: NaN },
            { color: '59, 89, 152', identifier: NaN },
            { color: '102, 51, 153', identifier: NaN },
        ];

        var particle = function () {
            return {
                pointX: 0,
                pointY: 0,
                color: '0, 0, 200',
                width: 100,
                height: 100,
                velocityX: 0,
                velocityY: 0,
                opacity: 1
            }
        };

        function setTouches(ts) {
            touches = Object.keys(ts).map(function (key) {
                if (key === 'length') {
                    return null;
                }
                return ts[key];
            });

            if (touches[touches.length - 1] === null) {
                touches.splice(touches.length - 1, 1);
            }

            if (settings.continuousLine) {
                trackTouches();
            }
        };

        function clearColors() {
            colors.forEach(function(clr) {
                if (!isNaN(clr.identifier)) {
                    var isInUse = false;
                    touches.forEach(function(tp) {
                        if (tp.identifier === clr.identifier) {
                            isInUse = true;
                        }
                    });
                    if (!isInUse) {
                        clr.identifier = NaN;
                    }
                }
            });
        }

        function getColor(identifier) {
            var result = undefined;
            for (var j = 0; j < colors.length; j++) {
                if (colors[j].identifier === identifier) {
                    return colors[j].color;
                }
            }

            for (var i = 0; i < colors.length; i++) {
                if (isNaN(colors[i].identifier)) {
                    colors[i].identifier = identifier;
                    return colors[i].color;
                }
            };

            return '0,0,200';
        }

        function getPoint(position) {
            if (settings.continuousLine) {
                return position;
            }

            var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
            return position + (Math.random() * 60 * plusOrMinus);
        }

        function trackTouches() {
            if (touches && touches.length > 0) {
                clearColors();
                touches.forEach(function(tp) {
                    var p = new particle();
                    p.pointX = getPoint(tp.pageX);
                    p.pointY = getPoint(tp.pageY);
                    p.width = tp.radiusX | 40;
                    p.height = tp.radiusY | 40;
                    p.color = getColor(tp.identifier);
                    particles.push(p);
                }, this);
            }
        };
        
        function render(eventArgs) {
            if (settings.debug) {
                $('#debug').html(JSON.stringify(particles));
            }
            var particlesToRemove = [];
            context.clearRect(0, 0, canvas.width(), canvas.height());

            particles.forEach(function (par, idx) {

                if (settings.animateSize) {
                    if (settings.sizeAnimationStyle === 'grow') {
                        par.width = par.width + 0.4;
                    } else if (settings.sizeAnimationStyle === 'shrink') {
                        par.width = par.width - 0.4;
                    }
                }

                /*context.globalAlpha = opacityMultiplier * par.opacity;
                context.drawImage(imageShape, par.pointX, par.pointY, par.width, par.width);*/
                context.beginPath();
                context.arc(par.pointX, par.pointY, par.width, 0, 2*Math.PI, false);
                context.fillStyle = "rgba(" + par.color + ", " + opacityMultiplier * par.opacity + ")";
                context.closePath();
                context.fill();

                par.opacity = par.opacity - 0.01;
                if (par.opacity <= 0 || par.width < 0) {
                    particlesToRemove.push(idx);
                }
            });
            window.requestAnimationFrame(render);
            for (var i = particlesToRemove.length - 1; i >= 0; i--) {
                particles.splice(particlesToRemove[i], 1);
            }
        };

        canvas.bind('touchstart', function (eventArgs) {
            setTouches(eventArgs.touches);
        });

        canvas.bind('touchend', function (eventArgs) {
            setTouches(eventArgs.touches);
        });

        canvas.bind('touchmove', function(eventArgs) {
            setTouches(eventArgs.touches);
            eventArgs.preventDefault();
        });

        canvas.bind('touchcancel', function(eventArgs) {
            setTouches(eventArgs.touches);
        });

        $('.settings-icon').on('click', function() {
            $('#settings').css('display', 'block');
        });

        canvas.on('mouseup', function() {
            $('.settings-icon').addClass('active');

            setTimeout(function() {
                $('.settings-icon').removeClass('active');
            }, 2000);
        });

        $('input').on('change', function() {
            settings.continuousLine = $('#rdLine')[0].checked;
            settings.sizeAnimationStyle = $('#rdShrink')[0].checked ? 'shrink' : 'grow';
            $('#settings').css('display', 'none');
            setOpacityMultiplier();
            $('body').removeClass(settings.background);
            settings.background = $('#rdDark')[0].checked ? 'dark' : 'light';
            $('body').addClass(settings.background);
            saveSettings();
        });

        setupSettings();

        setInterval(trackTouches, settings.setTouchesInterval);

        window.requestAnimationFrame(render);
    })
})();