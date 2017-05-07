let plugin = require('./plugin');

/**
 * @param {PluginHost} PluginHost
 */
module.exports = function(PluginHost) {
	const app = PluginHost.owner;
	app.converter.addComponent('external-module-name', plugin.DocsPlugin);
};

