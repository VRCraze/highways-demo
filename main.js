/*jslint browser: true*/
/*global Tangram, gui */

(function () {
    'use strict';

    var locations = {
        'Oakland': [37.8044, -122.2708, 15],
        'New York': [40.70531887544228, -74.00976419448853, 15],
        'Seattle': [47.5937, -122.3215, 15]
    };

    var map_start_location = locations['Oakland'];
    var rS;


    /*** URL parsing ***/

    // leaflet-style URL hash pattern:
    // #[zoom],[lat],[lng]
    var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

    if (url_hash.length == 3) {
        map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
        // convert from strings
        map_start_location = map_start_location.map(Number);
    }

    /*** Map ***/

    var map = L.map('map',
        {"keyboardZoomOffset" : .05}
    );

    var layer = Tangram.leafletLayer({
        scene: 'styles.yaml',
        preUpdate: preUpdate,
        postUpdate: postUpdate,
        numWorkers: 2,
        attribution: 'Map data &copy; OpenStreetMap contributors | <a href="https://github.com/tangrams/tangram" target="_blank">Source Code</a>',
        unloadInvisibleTiles: false,
        updateWhenIdle: false
    });

    window.layer = layer;
    var scene = layer.scene;
    window.scene = scene;

    // setView expects format ([lat, long], zoom)
    map.setView(map_start_location.slice(0, 3), map_start_location[2]);

    var hash = new L.Hash(map);

    // Resize map to window
    function resizeMap() {
        document.getElementById('map').style.width = window.innerWidth + 'px';
        document.getElementById('map').style.height = window.innerHeight + 'px';
        map.invalidateSize(false);
    }
    window.addEventListener('resize', resizeMap);

    // Render/GL stats: http://spite.github.io/rstats/
    var glS = new glStats();
    glS.fractions = []; // turn this off till we need it

    rS = new rStats({
        values: {
            frame: { caption: 'Total frame time (ms)', over: 5 },
            raf: { caption: 'Time since last rAF (ms)' },
            fps: { caption: 'Framerate (FPS)', below: 30 },
            rendertiles: { caption: 'Rendered tiles' },
            features: { caption: '# of geo features' },
            glbuffers: { caption: 'GL buffers (MB)' }
        },
        CSSPath : 'lib/',
        plugins: [glS]
    });

    // Move it to the bottom-left so it doesn't obscure zoom controls
    var rSDOM = document.querySelector('.rs-base');
    rSDOM.style.bottom = '0px';
    rSDOM.style.top = 'inherit';

    // Pre-render hook
    function preUpdate (will_render) {
        // Profiling
        if (will_render && rS) {
            rS('frame').start();
            // rS('raf').tick();
            rS('fps').frame();

            if (scene.dirty) {
                glS.start();
            }
        }
    }

    // Post-render hook
    function postUpdate () {
        if (rS != null) { // rstats
            rS('frame').end();
            rS('rendertiles').set(scene.renderable_tiles_count);
            rS('glbuffers').set((scene.getDebugSum('buffer_size') / (1024*1024)).toFixed(2));
            rS('features').set(scene.getDebugSum('features'));
            rS().update();
        }
    }

    /***** Render loop *****/

    window.addEventListener('load', function () {
        // Scene initialized
        layer.on('init', function() {
            resizeMap();
        });
        layer.addTo(map);
    });

}());
