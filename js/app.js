['js/writer.js', 'js/useless.js'];
function App(_el) {
	this.inheritFrom = Writer;
	this.inheritFrom(_el);
	delete this.inheritFrom;
	
	var _useless = new Useless('Blah blah blah!');
	
	function sayHello() {
		this.write('Hello, world.');
	};
	
	function whatever() {
		_useless.go();
	};
	
	this.sayHello = sayHello.bind(this);
	this.whatever = whatever;
};