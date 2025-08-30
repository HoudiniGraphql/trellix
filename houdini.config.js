/// <references types="houdini-react">
/** @type {import('houdini').ConfigFile} */
const config = {
	plugins: {
		'houdini-react': {},
	},
  runtimeDir: ".houdini",
  scalars: {
    DateTime: { 
      type: 'Date',
      unmarshal(val) {
        return new Date(val)
      },
      marshal(val) {
        return val.toISOString()
      }
    }
  }
}

export default config
