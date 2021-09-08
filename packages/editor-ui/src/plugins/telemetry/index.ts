import _Vue from "vue";
import {
	ITelemetrySettings,
	IDataObject,
} from 'n8n-workflow';

declare module 'vue/types/vue' {
	interface Vue {
		$telemetry: Telemetry;
	}
}

export function TelemetryPlugin(vue: typeof _Vue): void {
	const telemetry = new Telemetry();

	Object.defineProperty(vue, '$telemetry', {
		get() { return telemetry; },
	});
	Object.defineProperty(vue.prototype, '$telemetry', {
		get() { return telemetry; },
	});
}

class Telemetry {

	private telemetry?: any; // tslint:disable-line:no-any

	init(options: ITelemetrySettings, instanceId: string) {
		if (options.enabled && !this.telemetry) {
			if(!options.config) {
				return;
			}

			this.loadTelemetryLibrary(options.config.key, options.config.url, { logLevel: 'DEBUG', integrations: { All: false }, loadIntegration: false });
			this.telemetry.identify(instanceId);
		}
	}

	track(event: string, properties?: IDataObject) {
		if (this.telemetry) {
			this.telemetry.track(event, properties);
		}
	}

	private loadTelemetryLibrary(key: string, url: string, options: IDataObject) {
		// @ts-ignore
		this.telemetry = (window.rudderanalytics = window.rudderanalytics || []);

		this.telemetry.methods = ["load", "page", "track", "identify", "alias", "group", "ready", "reset", "getAnonymousId", "setAnonymousId"];
		this.telemetry.factory = (t: any) => { // tslint:disable-line:no-any
			return (...args: any[]) => { // tslint:disable-line:no-any
				const r = Array.prototype.slice.call(args);
				r.unshift(t);
				this.telemetry.push(r);
				return this.telemetry;
			};
		};

		for (let t = 0; t < this.telemetry.methods.length; t++) {
			const r = this.telemetry.methods[t];
			this.telemetry[r] = this.telemetry.factory(r);
		}

		this.telemetry.loadJS = () => {
			const r = document.createElement("script");
			r.type = "text/javascript";
			r.async = !0;
			r.src = "https://cdn.rudderlabs.com/v2/rudder-analytics.min.js?transport=beacon";
			const a = document.getElementsByTagName("script")[0];
			if(a && a.parentNode) {
				a.parentNode.insertBefore(r, a);
			}
		};
		this.telemetry.loadJS();
		this.telemetry.load(key, url, options);
	}
}
