import EventEmitter from "events";

import OmegaClient from "../classes/OmegaClient.js";

export default class Events {
	client : OmegaClient;
	
	constructor(client : OmegaClient) {
		this.client = client;
	}

    ConnectedEvents = [] as { type: "client" | "process" | "custom", event?: string, emiiter: EventEmitter }[];

	AddEvent = (type: "client" | "process" | "custom", event?: string, callback?: (...any: any[]) => void) => {
        let emiiter: EventEmitter
		switch (type) {
			case "client":
				if (!callback) throw new Error("No callback");
				if (!event) throw new Error("No event");
				emiiter = this.client.on(event, callback) as any;
				break;
			case "process":
				if (!callback) throw new Error("No callback");
				if (!event) throw new Error("No event");
				emiiter = process.on(event, callback)
				break;
			case "custom":
				emiiter = new EventEmitter();

				if (callback && event) {
					emiiter.on(event, callback);
				};
				break;
			default:
				throw new Error("Invalid event type");
		}

        this.client.log(`Added event ${event} to ${type} events`);

		this.ConnectedEvents.push({
			type: type,
			event: event,
			//callback : callback,
			emiiter: emiiter
		})
		return emiiter;
    }

    RemoveEvent = (emitter: EventEmitter, name?: string) => {
		emitter.removeAllListeners(name);

		const index = this.ConnectedEvents.findIndex((event) => event.emiiter === emitter);
		if (index !== -1) {
			this.ConnectedEvents.splice(index, 1);
		} else {
			this.client.warn(`Could not find event ${name} in ${emitter}`);
		}

		if (!name) {
			for (const name of emitter.eventNames()) {
				this.client.log(`Removed event ${String(name)}`);
			}
		} else this.client.log(`Removed event ${name}`);

		return emitter;
	};


    Init = async () => {
		// @ts-ignore
		this.client.setMaxListeners(0); // DEBUG

		this.client.success("Initialized Events");
	};
}