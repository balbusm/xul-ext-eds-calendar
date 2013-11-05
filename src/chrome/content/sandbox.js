var sandbox = {

    init : function() {
        glib.init();
        gio.init();
        libical.init();
        libecal.init();
        libedataserver.init();
        debugger;
        // sourceRegistry.listSources(null);
    },

    uninit : function() {

        glib.shutdown();
        gio.shutdown();
        libical.shutdown();
        libecal.shutdown();
        libedataserver.shutdown();
    }

};

window.addEventListener("load", function() {
    sandbox.init();
}, false);
window.addEventListener("unload", function() {
    sandbox.uninit();
}, false);
