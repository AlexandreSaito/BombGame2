
export default class Observer {
	constructor() {
		this.actions = [];
	}

	add(action) {
		this.actions.push(action);
	}

	remove(action) {
		this.actions = this.actions.filter(x => x != action);
	}

	exec(data) {
		this.actions.forEach(x => { x(data); if(data.stopPropagation) return false; });
	}
	
}
