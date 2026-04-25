export namespace main {
	
	export class AuthConfig {
	    type: string;
	    bearerToken?: string;
	    username?: string;
	    password?: string;
	    apiKeyName?: string;
	    apiKeyValue?: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.bearerToken = source["bearerToken"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.apiKeyName = source["apiKeyName"];
	        this.apiKeyValue = source["apiKeyValue"];
	    }
	}
	export class RequestItem {
	    id: string;
	    method: string;
	    name: string;
	    url: string;
	    timestamp: string;
	    params?: number[];
	    pathVariables?: number[];
	    headers?: number[];
	    auth?: number[];
	    bodyType?: string;
	    body?: string;
	    bodyFormData?: number[];
	    bodyUrlEncoded?: number[];
	
	    static createFrom(source: any = {}) {
	        return new RequestItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.method = source["method"];
	        this.name = source["name"];
	        this.url = source["url"];
	        this.timestamp = source["timestamp"];
	        this.params = source["params"];
	        this.pathVariables = source["pathVariables"];
	        this.headers = source["headers"];
	        this.auth = source["auth"];
	        this.bodyType = source["bodyType"];
	        this.body = source["body"];
	        this.bodyFormData = source["bodyFormData"];
	        this.bodyUrlEncoded = source["bodyUrlEncoded"];
	    }
	}
	export class CollectionNode {
	    id: string;
	    name: string;
	    items: RequestItem[];
	    children?: CollectionNode[];
	
	    static createFrom(source: any = {}) {
	        return new CollectionNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.items = this.convertValues(source["items"], RequestItem);
	        this.children = this.convertValues(source["children"], CollectionNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class KeyValuePair {
	    id: string;
	    key: string;
	    value: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new KeyValuePair(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.enabled = source["enabled"];
	    }
	}
	export class Environment {
	    id: string;
	    name: string;
	    variables: KeyValuePair[];
	
	    static createFrom(source: any = {}) {
	        return new Environment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.variables = this.convertValues(source["variables"], KeyValuePair);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RequestCookie {
	    name: string;
	    value: string;
	    domain: string;
	    path: string;
	    expires?: string;
	    httpOnly: boolean;
	    secure: boolean;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new RequestCookie(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.domain = source["domain"];
	        this.path = source["path"];
	        this.expires = source["expires"];
	        this.httpOnly = source["httpOnly"];
	        this.secure = source["secure"];
	        this.enabled = source["enabled"];
	    }
	}
	export class ProxySettings {
	    enabled: boolean;
	    http: string;
	    https: string;
	    socks: string;
	
	    static createFrom(source: any = {}) {
	        return new ProxySettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.http = source["http"];
	        this.https = source["https"];
	        this.socks = source["socks"];
	    }
	}
	export class KVPair {
	    id: string;
	    key: string;
	    value: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new KVPair(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.enabled = source["enabled"];
	    }
	}
	export class HTTPRequest {
	    method: string;
	    url: string;
	    headers: KVPair[];
	    params: KVPair[];
	    auth: AuthConfig;
	    bodyType: string;
	    body: string;
	    bodyFormData: KVPair[];
	    bodyUrlEncoded: KVPair[];
	    proxy: ProxySettings;
	    cookies: RequestCookie[];
	
	    static createFrom(source: any = {}) {
	        return new HTTPRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.url = source["url"];
	        this.headers = this.convertValues(source["headers"], KVPair);
	        this.params = this.convertValues(source["params"], KVPair);
	        this.auth = this.convertValues(source["auth"], AuthConfig);
	        this.bodyType = source["bodyType"];
	        this.body = source["body"];
	        this.bodyFormData = this.convertValues(source["bodyFormData"], KVPair);
	        this.bodyUrlEncoded = this.convertValues(source["bodyUrlEncoded"], KVPair);
	        this.proxy = this.convertValues(source["proxy"], ProxySettings);
	        this.cookies = this.convertValues(source["cookies"], RequestCookie);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ResponseCookie {
	    id: string;
	    name: string;
	    value: string;
	    domain: string;
	    path: string;
	    expires?: string;
	    httpOnly: boolean;
	    secure: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ResponseCookie(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.value = source["value"];
	        this.domain = source["domain"];
	        this.path = source["path"];
	        this.expires = source["expires"];
	        this.httpOnly = source["httpOnly"];
	        this.secure = source["secure"];
	    }
	}
	export class ResponseHeader {
	    id: string;
	    key: string;
	    value: string;
	
	    static createFrom(source: any = {}) {
	        return new ResponseHeader(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.key = source["key"];
	        this.value = source["value"];
	    }
	}
	export class HTTPResponse {
	    status: number;
	    statusText: string;
	    time: string;
	    size: string;
	    headers: ResponseHeader[];
	    body: string;
	    cookies?: ResponseCookie[];
	    error?: string;
	    cancelled?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HTTPResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.statusText = source["statusText"];
	        this.time = source["time"];
	        this.size = source["size"];
	        this.headers = this.convertValues(source["headers"], ResponseHeader);
	        this.body = source["body"];
	        this.cookies = this.convertValues(source["cookies"], ResponseCookie);
	        this.error = source["error"];
	        this.cancelled = source["cancelled"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HistoryEntry {
	    id: string;
	    method: string;
	    url: string;
	    name: string;
	    status: number;
	    duration: string;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.method = source["method"];
	        this.url = source["url"];
	        this.name = source["name"];
	        this.status = source["status"];
	        this.duration = source["duration"];
	        this.timestamp = source["timestamp"];
	    }
	}
	
	
	
	
	
	

}

