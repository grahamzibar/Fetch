function Writer(_el) {
	this.write = function(str) {
		str += '<br />';
		_el.innerHTML += str;
	};
};