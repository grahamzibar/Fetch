/*-----------------------------------------------------------------------------+

	Oh my god... that is so...	
	
		 _               _     
		| |             | |    
		| |  _ _|_  __  | |    
		|/  |/  |  /    |/ \   
		|__/|__/|_/\___/|   |_/
		|\                     
		|/
	
	* Created by: Graham Robertson
	* https://github.com/grahamzibar/fetch
	
+-----------------------------------------------------------------------------*/
(function Fetch(_w, _http) {
	var REQUESTED = 0;
	var LOADED = 1;
	var READY = 2;
	
	var _fetched = {};
	var _inclExp = /^\[(?:\s)*(?:(?:\s)*(?:'|")[^,\s]+(?:'|")(?:\s)*(?:,(?:\s)*)?)+(?:\s)*];/;
	var _absExp = /^(?:[A-Za-z0-9]+:\/)?\//;
	
	function Module(_src) {
		var _dependencies = 0;
		var _script = null;
		this.state = REQUESTED;
		this.callbacks = [];
		
		function onmodule() {
			if (--_dependencies <= 0)
				onready.call(this);
		};
		function oninject() {
			for (var i = 0, len = this.callbacks.length; i < len; i++)
				this.callbacks[i]();
		};
		function onready() {
			this.state = READY;
			if (_script)
				scriptInject(_src, _script, oninject.bind(this));
			else
				oninject.call(this);
		};
		function onload(req) {
			this.state = LOADED;
			var data = _script = req.responseText;
			var includes = _inclExp.exec(data);
			if (includes && includes.length === 1)
				loadDependencies.call(this, eval(includes[0]));
			else
				onready.call(this);
		};
		function loadDependencies(includes) {
			var len = _dependencies = includes.length;
			for (var i = 0; i < len; i++) {
				var url = includes[i];
				if (!_absExp.test(url)) {
					var src = new String(_src);
					var start = url[0] + url[1];
					if (start === '..') {
						src = src.split('/');
						src.pop();
						
						url = url.split('../');
						var p = url[0];
						var j = 0;
						while(!p) {
							j++;
							src.pop();
							p = url[j];
						}
						url = src.join('/');
						url += '/';
						url += p;
					} else if (start === './')
						url = src.substring(0, src.lastIndexOf('/') + 1) + url.substr(2);
					else
						url = src.substring(0, src.lastIndexOf('/') + 1) + url;
					
				}
				fetch(url, onmodule.bind(this));
			}
		};
		function load() {
			if (typeof _src === 'object')
				loadDependencies.call(this, _src);
			else
				file(_src, onload.bind(this));
		};
		
		this.load = load.bind(this);
	};
	function scriptInject(src, code, callback) {
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.async = true;
		newScript.onload = callback;
		
		newScript.src = Fetch.keepSrc ? src : _w.URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
		
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
			if (mod.state === READY)
				callback();
			else
				mod.callbacks.push(callback);
		} else {
			mod = _fetched[script] = new Module(script);
			mod.callbacks = [callback];
			mod.load();
		}
	};
	function batchFetch() {
		var last = arguments.length - 1;
		var callback;
		if (typeof arguments[last] !== 'string') {
			callback = arguments[last];
			delete arguments[last];
			arguments.length = last;
		}
		var mod = new Module(arguments);
		if (callback)
			mod.callbacks = [callback];
		mod.load();
	};
	
	// EXPORT
	var Fetch = _w.fetch = batchFetch;
	Fetch.file = file;
	Fetch.keepSrc = false;
})(window, XMLHttpRequest);