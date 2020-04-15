// this exists for testing purposes

function errorHeader(...args) {
	return `SupPort Error: ` + args.join(` -> `);
}

function noPortError(portsObj, portName, portType) {
	return `${errorHeader(`There is no "${portName}" port`)}

To use SupPort, ports have to use the naming convention "portName(In|Out)".
Out-ports are for sending values out of Elm.
In-ports are for sending values into Elm.

${noPortErrorHelper(portsObj, portType)}`
}

function noPortErrorHelper(portsObj, portType) {
	if (portType === `in`)
		return `${noPortErrorHelperHelper(`out`, `'true'`, `4th`)}

Your in-ports are:
${createInPortsString(portsObj)}`;
	else
		return `${noPortErrorHelperHelper(`in`, `an empty object`, `2nd`)}

Your out-ports are:
${createOutPortsString(portsObj)}`;
}

function noPortErrorHelperHelper(a, b, c) {
	return `To use an ${a}-port by itself, pass ${b} as the ${c} argument to your port handling function.`
}

function createInPortsString(portsObj) {
	return createPortsStringHelper(
		Object.entries(portsObj)
			.filter(([_, value]) => value.hasOwnProperty(`send`))
	);
}

function createOutPortsString(portsObj) {
	return createPortsStringHelper(
		Object.entries(portsObj)
			.filter(([_, value]) => value.hasOwnProperty(`subscribe`))
	);
}

function createPortsStringHelper(list) {
	return list
		.map(([k, _]) => `\t` + k)
		.sort()
		.join(`\n`);
}

function msgError(portBaseName, from) {
	return `${errorHeader(portBaseName, from)}

Looks like you forgot to specify which message that data was going to!`
}

export {errorHeader, noPortError, msgError};
