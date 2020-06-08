// this exists for testing purposes

function errorHeader(...args: Array<string>): string {
	return `SupPort Error: ` + args.join(` -> `);
}

function noPortError(portsObj: object, portName: string, portType: `in` | `out`): string {
	return `${errorHeader(`There is no "${portName}" port`)}

To use SupPort, ports have to use the naming convention "portName(In|Out)".
Out-ports are for sending values out of Elm.
In-ports are for sending values into Elm.

${noPortErrorHelper(portsObj, portType)}`
}

function noPortErrorHelper(portsObj: object, portType: `in` | `out`): string {
	if (portType === `in`)
		return `${noPortErrorHelperHelper(`out`, `'true'`, `4th`)}

Your in-ports are:
${createInPortsString(portsObj)}`;
	else
		return `${noPortErrorHelperHelper(`in`, `an empty object`, `2nd`)}

Your out-ports are:
${createOutPortsString(portsObj)}`;
}

function noPortErrorHelperHelper(a: string, b: string, c: string): string {
	return `To use an ${a}-port by itself, pass ${b} as the ${c} argument to your port handling function.`
}

function createInPortsString(portsObj: object): string {
	return createPortsStringHelper(
		Object.entries(portsObj)
			.filter((entry: [string, {send?: (value: any) => void}]): boolean => {
				return entry[1].hasOwnProperty(`send`);
			})
	);
}

function createOutPortsString(portsObj: object): string {
	return createPortsStringHelper(
		Object.entries(portsObj)
			.filter((entry: [string, {subscribe?: (value: (value2: any) => any) => void}]): boolean => {
				return entry[1].hasOwnProperty(`subscribe`);
			})
	);
}

function createPortsStringHelper(list: Array<[string, any]>): string {
	return list
		.map(([k, _]) => `\t` + k)
		.sort()
		.join(`\n`);
}

function msgError(portBaseName: string, from: string): string {
	return `${errorHeader(portBaseName, from)}

Looks like you forgot to specify which message that data was going to!`
}

export {errorHeader, noPortError, msgError};
