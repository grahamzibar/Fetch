(function Fetch(_w, _http) {
	var _fetched = {};
	var _exp = /^\[(?:\s)*(?:(?:\s)*(?:'|")[^,\s]+(?:'|")(?:\s)*(?:,(?:\s)*)?)+(?:\s)*];/;
	
	function Module(_src) {
		var _dependencies = 0;
		var _script = '';
		this.state = Module.REQUESTED;
		this.callbacks = [];
		
		function onmodule() {
			if (--_dependencies <= 0)
				onready.call(this);
		};
		
		function onready() {
			this.state = Module.READY;
			scriptInject(_script);
			if (Fetch.debug)
				console.log('Module Ready:', _src);
			for (var i = 0, len = this.callbacks.length; i < len; i++)
				this.callbacks[i]();
		};
		
		function onload(req) {
			this.state = Module.LOADED;
			var data = _script = req.responseText.trim();
			
			var includes = _exp.exec(data);
			if (includes && includes.length === 1) {
				includes = eval(includes[0]);
				var len = _dependencies = includes.length;
				if (Fetch.debug)
					console.log('Module Loaded:', _src, '-- with', len, 'dependencies');
				// TODO interpret include url for relative loading.
				for (var i = 0; i < len; i++)
					fetch(includes[i], onmodule.bind(this));
			} else {
				if (Fetch.debug)
					console.log('Module Loaded:', _src, '-- with 0 dependencies');
				onready.call(this);
			}
		};
		
		function load() {
			if (Fetch.debug)
				console.log('Module Request:', _src);
			file(_src, onload.bind(this));
		};
		
		load.call(this);
	};
	Module.REQUESTED = 0;
	Module.LOADED = 1;
	Module.READY = 2;
	
	function scriptInject(code) {
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.async = true;
		newScript.innerHTML = code;
		
		var topScript = document.getElementsByTagName('script')[0];
		topScript.parentNode.insertBefore(newScript, topScript);
	};
	
	function requestHandler(src, callback) {
		if (this.readyState === 4) {
			if (this.status === 200 && callback)
				callback(this);
			else
				console.error('Could not load resource:', src);
		}
	};
	function file(src, callback) {
		var req = new _http();
		req.open('GET', src, true);
		req.onreadystatechange = requestHandler.bind(req, src, callback);
		req.send(null);
	};
	function fetch(script, callback) {
		var mod;
		if (_fetched[script]) {
			mod = _fetched[script];
			if (mod.state === Module.READY)
				callback();
			else
				mod.callbacks.push(callback);
		} else {
			mod = _fetched[script] = new Module(script);
			mod.callbacks = [callback];
		}
	};
	function batchFetch(scripts, callback) {
		if (typeof scripts === 'string')
			fetch(scripts, callback);
		else	
			for (var i = 0, len = scripts.length; i < len; i++)
				fetch(scripts[i], callback);
	};
	function toss() {
		// How do we remove a script??!
	};
	
	var Fetch = _w.fetch = batchFetch;
	Fetch.file = file;
	Fetch.debug = false;
	// what other properties might I need?
	
})(window, XMLHttpRequest);